export const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:14301";

function normalizeToken(raw: string | null) {
    if (!raw) return null;
    const t = String(raw).trim();
    return t.replace(/^"|"$/g, "") || null;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== "undefined"
        ? (normalizeToken(localStorage.getItem("token")) || normalizeToken(sessionStorage.getItem("token")))
        : null;

    const headers = { "Content-Type": "application/json", ...(options.headers || {}) } as Record<string,string>;

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    let body = (options as any).body;
    const isForm = typeof FormData !== "undefined" && body instanceof FormData;
    const isUrlSearch = typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams;
    const isBlob = typeof Blob !== "undefined" && body instanceof Blob;
    if (body && typeof body !== "string" && !isForm && !isUrlSearch && !isBlob) {
        body = JSON.stringify(body);
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        body,
    });

    const ct = res.headers.get("content-type") || "";

    if (!res.ok) {
        // prefer JSON error message; otherwise avoid dumping HTML into UI
        let msg = res.statusText;
        try {
            if (ct.includes("application/json")) {
                const j = await res.json();
                msg = j?.message || msg;
            } else {
                const txt = await res.text();
                msg = txt && !txt.trim().startsWith("<") ? txt : `${res.status} ${res.statusText}`;
            }
        } catch {}
        throw new Error(msg);
    }

    if (!ct.includes("application/json")) return (null as unknown) as T;
    return res.json();
}
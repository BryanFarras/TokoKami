export const API_BASE = (import.meta.env.VITE_API_URL as string) || "http://localhost:14301";

function normalizeToken(raw: string | null) {
    if (!raw) return null;
    const t = String(raw).trim();
    return t.replace(/^"|"$/g, "") || null;
}

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== "undefined" ? normalizeToken(localStorage.getItem("token")) : null;

    const headers = { "Content-Type": "application/json", ...(options.headers || {}) } as Record<string,string>;

    if (token && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }

    // stringify JS objects (but allow FormData/URLSearchParams/Blob)
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

    if (!res.ok) {
        const text = await res.text().catch(()=>res.statusText);
        throw new Error(text || res.statusText);
    }

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return (null as unknown) as T;
    return res.json();
}
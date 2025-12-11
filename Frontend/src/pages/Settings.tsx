import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { 
  User, Moon, Sun, LogOut, Mail, ShieldCheck, 
  CheckCircle2, Sparkles, Monitor
} from 'lucide-react';
import { Pencil, Save, X } from 'lucide-react';

const Settings = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Helper untuk inisial nama
  const getInitials = (name: string) => {
    return name 
      ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() 
      : 'U';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Settings
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Manage your account preferences and workspace appearance.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: PROFILE CARD --- */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-full flex flex-col transition-all hover:shadow-md">
            
            {/* Artistic Header Pattern (CSS only, no external image) */}
            <div className="h-40 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:20px_20px]"></div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            </div>

            <div className="px-8 pb-8 flex-1 relative">
              {/* Avatar yang menumpuk di atas banner */}
              <div className="-mt-14 mb-6 flex justify-between items-end">
                <div className="p-1.5 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                  <div className="h-28 w-28 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-4xl font-bold text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-600">
                    {user?.name ? getInitials(user.name) : <User className="h-12 w-12" />}
                  </div>
                </div>
                
                {/* Role Badge (Real Data) */}
                <div className="mb-2 hidden sm:block">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                    <ShieldCheck className="w-3 h-3 mr-1.5" />
                    {user?.role ? user.role.toUpperCase() : 'USER'}
                  </span>
                </div>
              </div>

              {/* User Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user?.name || 'Guest User'}
                  </h2>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    <span>{user?.email || 'No email provided'}</span>
                  </div>
                </div>

                {/* Info Grid (Visual only, using real context data implied) */}
                <div className="grid grid-cols-2 gap-4 pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                   <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Account Type</p>
                      <p className="font-medium text-gray-900 dark:text-white mt-1 capitalize">{user?.role || 'Standard'}</p>
                   </div>
                   <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Status</p>
                      <div className="flex items-center mt-1">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                        <p className="font-medium text-gray-900 dark:text-white">Active</p>
                      </div>
                   </div>
                </div>

                {/* Admin-only: Manage Users (below Account Type and Status) */}
                {isAdmin && (
                  <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-700">
                    <AdminManageUsers />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: ACTIONS --- */}
        <div className="space-y-8 flex flex-col">
          
          {/* 1. Appearance / Theme */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Appearance</h3>
                <p className="text-xs text-gray-500">Customize UI theme</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Light Option */}
              <button
                onClick={() => theme === 'dark' && toggleTheme()}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group ${
                  theme !== 'dark' 
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/10' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${theme !== 'dark' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                    <Sun className="h-5 w-5" />
                  </div>
                  <span className={`font-semibold ${theme !== 'dark' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}>
                    Light Mode
                  </span>
                </div>
                {theme !== 'dark' && <CheckCircle2 className="h-5 w-5 text-blue-600" />}
              </button>

              {/* Dark Option */}
              <button
                onClick={() => theme !== 'dark' && toggleTheme()}
                className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 group ${
                  theme === 'dark' 
                    ? 'border-blue-500 bg-gray-700' 
                    : 'border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700'}`}>
                    <Moon className="h-5 w-5" />
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                    Dark Mode
                  </span>
                </div>
                {theme === 'dark' && <CheckCircle2 className="h-5 w-5 text-blue-400" />}
              </button>
            </div>
          </div>

          {/* Admin-only: Create User */}
          {isAdmin && (
            <AdminCreateUserCard />
          )}

          {/* 2. Logout / Danger Zone */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
             <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300 rounded-lg">
                <LogOut className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Session</h3>
                <p className="text-xs text-gray-500">Securely sign out</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold rounded-xl transition-colors border border-red-100 dark:border-red-900/50 flex items-center justify-center gap-2"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Settings;

// Admin create user component
function AdminCreateUserCard() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'admin' | 'cashier'>('cashier');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const { user } = useAuth();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const { api } = await import('../api');
      await api('/auth/register', {
        method: 'POST',
        body: { name, email, password, role },
      });
      setMessage('User created successfully.');
      setName('');
      setEmail('');
      setPassword('');
      setRole('cashier');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-lg">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Management</h3>
          <p className="text-xs text-gray-500">Create new accounts</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            placeholder="New user name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            placeholder="Initial password"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'cashier')}
            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
          >
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {message && (
          <div className="text-sm text-gray-700 dark:text-gray-300">{message}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? 'Creating…' : 'Create User'}
        </button>
      </form>
    </div>
  );
}

// Admin manage users component
function AdminManageUsers() {
  const [users, setUsers] = React.useState<Array<{id:number;name:string;email:string;role:'admin'|'cashier'}>>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [form, setForm] = React.useState<{name:string;email:string;password:string;role:'admin'|'cashier'}>({
    name: '',
    email: '',
    password: '',
    role: 'cashier'
  });
  const { user } = useAuth(); // to prevent deleting self
  const [confirmId, setConfirmId] = React.useState<number | null>(null);
  const [confirmName, setConfirmName] = React.useState<string>("");

  const requestDelete = (u: {id:number;name:string}) => {
    setConfirmId(u.id);
    setConfirmName(u.name || "");
  };

  const cancelDelete = () => {
    setConfirmId(null);
    setConfirmName("");
  };

  const confirmDelete = async () => {
    if (!confirmId) return;
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('../api');
      await api(`/auth/users/${confirmId}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== confirmId));
      cancelDelete();
    } catch (e:any) {
      setError(e?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('../api');
      const data = await api<Array<{id:number;name:string;email:string;role:'admin'|'cashier'}>>('/auth/users');
      setUsers(data);
    } catch (e:any) {
      setError(e?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const startEdit = (u: {id:number;name:string;email:string;role:'admin'|'cashier'}) => {
    setEditingId(u.id);
    setForm({ name: u.name || '', email: u.email || '', password: '', role: u.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', email: '', password: '', role: 'cashier' });
  };

  const save = async () => {
    if (!editingId) return;
    setLoading(true);
    setError(null);
    try {
      const { api } = await import('../api');
      const body: any = { name: form.name, email: form.email, role: form.role };
      if (form.password && form.password.trim().length > 0) {
        body.password = form.password;
      }
      const updated = await api<{id:number;name:string;email:string;role:'admin'|'cashier'}>(`/auth/users/${editingId}`, {
        method: 'PATCH',
        body
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      cancelEdit();
    } catch (e:any) {
      setError(e?.message || 'Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Users</h3>
          <p className="text-xs text-gray-500">Edit cashier/admin accounts</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      {loading && users.length === 0 ? (
        <div className="text-sm text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              {editingId === u.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                      placeholder="Name"
                      required
                    />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                      placeholder="Email"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                      placeholder="New password (leave blank to keep)"
                    />
                    <select
                      value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'cashier' }))}
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                    >
                      <option value="cashier">Cashier</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={save}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">{u.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{u.email}</div>
                    <div className="text-xs mt-1 inline-flex px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                      {u.role}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(u)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => requestDelete(u)}
                      disabled={user?.id === u.id} // prevent self-delete
                      className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg disabled:opacity-60"
                      title={user?.id === u.id ? "You cannot delete yourself" : "Delete user"}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <div className="text-sm text-gray-500">No users found.</div>
          )}
        </div>
      )}

      {/* Confirmation dialog (inline) */}
      {confirmId && (
        <div className="mb-3 p-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">
            Delete "{confirmName}"? This action cannot be undone.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={confirmDelete}
              className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg"
            >
              Confirm Delete
            </button>
            <button
              onClick={cancelDelete}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-sm rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
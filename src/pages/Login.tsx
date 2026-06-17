import { FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useDashboardStore } from '../store/dashboard';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setUser = useDashboardStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/api/login', { email, password });
      const u = res.data;
      if (!u?.email) throw new Error('Email/password tidak valid.');
      setUser({
        email: u.email,
        role: u.role ?? 'user',
        allowed_kanal: u.allowed_kanal ?? '',
      });
      const redirect = params.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/dashboard', { replace: true });
    } catch (err) {
      const e2 = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e2?.response?.data?.error ?? e2?.message ?? 'Gagal login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-zinc-200 p-7"
      >
        <div className="flex items-center gap-3 mb-5">
          <img src="/ethos_logo.png" alt="logo" className="w-10 h-10 rounded" />
          <div>
            <h1 className="text-lg font-bold text-zinc-800">Ethos Analytics</h1>
            <p className="text-xs text-zinc-500">Marketplace dashboard sign in</p>
          </div>
        </div>

        <label className="block text-xs font-bold tracking-wider text-zinc-500 uppercase mb-1">
          Email
        </label>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-3 h-11 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          placeholder="nama@perusahaan.id"
        />

        <label className="block text-xs font-bold tracking-wider text-zinc-500 uppercase mb-1">
          Password
        </label>
        <div className="relative mb-2">
          <input
            type={showPwd ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 pr-12 h-11 rounded-lg border border-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute inset-y-0 right-2 my-auto px-2 text-xs text-zinc-500 hover:text-zinc-800"
          >
            {showPwd ? 'Hide' : 'Show'}
          </button>
        </div>

        {error && <div className="mb-3 text-xs text-rose-600">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-lg bg-zinc-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-60"
        >
          {loading ? 'Memproses…' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}

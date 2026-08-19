'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, Loader2, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Giriş başarısız');
      } else {
        if (data.user?.username === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/';
        }
      }
    } catch {
      setError('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h1 className="text-xl font-bold mb-6 text-center">🔑 Giriş Yap</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 block mb-1">Kullanıcı Adı</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-slate-700 rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 outline-none text-sm"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-400 block mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-slate-700 rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 outline-none text-sm"
              required
            />
          </div>
          {error && (
            <div className="bg-red-500/20 text-red-400 p-2 rounded-lg text-sm flex items-center gap-1.5">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
        <p className="text-center text-sm text-slate-400 mt-4">
          Hesabın yok mu? <Link href="/auth/register" className="text-blue-400 hover:underline">Kayıt Ol</Link>
        </p>
      </div>
    </div>
  );
}

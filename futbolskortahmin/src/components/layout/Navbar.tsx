'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trophy, Calendar, LogIn, LogOut, User, Menu, X } from 'lucide-react';

export function Navbar() {
  const [user, setUser] = useState<{ id: string; username: string; firstName: string; lastName: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <span className="text-2xl">⚽</span>
            <span className="bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
              Süper Tahmin
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition">
              <Calendar size={18} />
              Maçlar
            </Link>
            <Link href="/leaderboard" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition">
              <Trophy size={18} />
              Sıralama
            </Link>
            {user ? (
              <div className="flex items-center gap-4">
                {user.username === 'admin' && (
                  <Link href="/admin" className="text-sm font-bold text-yellow-500 hover:text-yellow-400">
                    ⚙️ Admin
                  </Link>
                )}
                <span className="text-sm text-slate-400">
                  <User size={16} className="inline mr-1" />
                  {user.firstName}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-1 text-sm text-red-400 hover:text-red-300">
                  <LogOut size={16} />
                  Çıkış
                </button>
              </div>
            ) : (
              <Link href="/auth/login" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition">
                <LogIn size={16} />
                Giriş Yap
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-slate-300" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>
              📅 Maçlar
            </Link>
            <Link href="/leaderboard" className="block py-2 text-slate-300 hover:text-white" onClick={() => setMenuOpen(false)}>
              🏆 Sıralama
            </Link>
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block py-2 text-red-400">
                🚪 Çıkış ({user.firstName})
              </button>
            ) : (
              <Link href="/auth/login" className="block py-2 text-blue-400" onClick={() => setMenuOpen(false)}>
                🔑 Giriş Yap
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

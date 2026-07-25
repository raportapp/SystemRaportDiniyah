import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, RefreshCw } from 'lucide-react';
import { UserAccount, SystemSettings } from '../types';
import LogoUploadModal from './LogoUploadModal';
import { useAuth } from '../hooks/useAuth';

const defaultLogo = "/logo.svg";

interface LoginProps {
  users: UserAccount[];
  settings: SystemSettings;
  useCloudSync?: boolean;
  onLoginSuccess?: (user: UserAccount) => void;
  onSaveLogo: (newLogoBase64: string) => void;
  onRefreshUsers?: () => Promise<UserAccount[]>;
}

export default function Login({ 
  users, 
  settings, 
  useCloudSync = false, 
  onSaveLogo,
  onRefreshUsers
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const { login } = useAuth();

  const handleManualRefresh = async () => {
    if (!onRefreshUsers) return;
    setIsRefreshing(true);
    setError('');
    try {
      await onRefreshUsers();
      alert("Berhasil memperbarui daftar akun dari cloud database!");
    } catch (err: any) {
      console.error("Gagal memuat ulang pengguna:", err);
      setError("Gagal memuat ulang daftar pengguna dari cloud.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!username.trim()) {
        setError('Username atau email tidak boleh kosong!');
        return;
      }
      if (!password) {
        setError('Password tidak boleh kosong!');
        return;
      }

      setIsRefreshing(true);
      await login(username, password, users);
    } catch (err: any) {
      console.error("Login error:", err);
      const msg = err.message || String(err);
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        setError('Username / Email atau Password salah. Silakan periksa kembali.');
      } else {
        setError(`Gagal masuk: ${msg}`);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Traditional Islamic Arch Background Effect */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center">
        <div className="w-[800px] h-[800px] rounded-full border-[32px] border-emerald-900" />
        <div className="absolute w-[600px] h-[600px] rounded-full border-[16px] border-emerald-800 rotate-45" />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden relative z-10 transition duration-300 hover:shadow-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-850 to-teal-950 text-white px-6 py-8 text-center relative">
          <div className="absolute top-2 right-2 bg-emerald-800/40 text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-full text-emerald-300 uppercase">
            v2.2 Secure
          </div>
          
          <div 
            onClick={() => setShowLogoModal(true)}
            className="mx-auto h-16 w-16 rounded-full bg-white flex items-center justify-center p-2 shadow-lg mb-4 cursor-pointer relative group border border-emerald-800/10 hover:border-emerald-500 hover:shadow-xl transition"
            title="Ubah Logo Utama (Otorisasi Admin)"
          >
            <img src={settings.logoSekolah || defaultLogo} alt="Logo" className="h-full w-full object-contain group-hover:scale-90 transition duration-200" />
            <div className="absolute inset-0 bg-emerald-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
              <span className="text-[9px] text-white font-extrabold uppercase text-center leading-tight">Ubah<br/>Logo</span>
            </div>
          </div>

          <h2 className="text-lg font-black tracking-tight uppercase">PPTQ AL-HUSNA BUKIT RAJA WALI</h2>
          <p className="text-xs text-emerald-300 font-medium tracking-wide uppercase mt-1">Sistem Raport Madrasah Diniyah</p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
          <div className="text-center">
            <h3 className="text-base font-bold text-slate-800">Silakan Masuk ke Sistem</h3>
            <p className="text-xs text-slate-500 mt-1">Gunakan otentikasi akun Guru / Admin Anda</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Username / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: admin atau ustadz"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isRefreshing}
            className="w-full bg-emerald-800 hover:bg-emerald-700 active:bg-emerald-900 text-white font-bold text-sm py-3 rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
          >
            <ShieldCheck size={18} />
            <span>{isRefreshing ? "Memproses Otentikasi..." : "Masuk Sistem"}</span>
          </button>

          {useCloudSync && onRefreshUsers && (
            <div className="text-center pt-1">
              <button
                type="button"
                disabled={isRefreshing}
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold transition disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
                <span>{isRefreshing ? "Sedang menyegarkan..." : "Segarkan daftar akun dari Cloud"}</span>
              </button>
            </div>
          )}
        </form>

        {/* Footer info */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center text-[10px] text-slate-400 font-medium">
          &copy; 2026 PPTQ Al-Husna. All Rights Reserved. Terproteksi Firebase Authentication.
        </div>
      </div>

      <LogoUploadModal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        settings={settings}
        users={users}
        isAdminLoggedIn={false}
        onSaveLogo={onSaveLogo}
      />
    </div>
  );
}


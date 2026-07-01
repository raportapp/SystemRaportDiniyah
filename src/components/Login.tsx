import React, { useState } from 'react';
import { ShieldCheck, Lock, User, AlertCircle, RefreshCw } from 'lucide-react';
import { UserAccount, SystemSettings } from '../types';
import defaultLogo from '../assets/images/regenerated_image_1782476438450.png';
import LogoUploadModal from './LogoUploadModal';
import { hashPassword } from '../utils/hash';

interface LoginProps {
  users: UserAccount[];
  settings: SystemSettings;
  useCloudSync?: boolean;
  onLoginSuccess: (user: UserAccount) => void;
  onSaveLogo: (newLogoBase64: string) => void;
  onRefreshUsers?: () => Promise<UserAccount[]>;
}

export default function Login({ 
  users, 
  settings, 
  useCloudSync = false, 
  onLoginSuccess, 
  onSaveLogo,
  onRefreshUsers
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefreshUsers) return;
    setIsRefreshing(true);
    setError('');
    try {
      await onRefreshUsers();
      alert("Berhasil memperbarui daftar akun guru dari cloud database!");
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
        setError('Username tidak boleh kosong!');
        return;
      }

      // Find user by username locally first
      let user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

      // If username is not found and cloud sync is enabled, try refreshing the list in real-time
      if (!user && useCloudSync && onRefreshUsers) {
        setIsRefreshing(true);
        try {
          const freshUsers = await onRefreshUsers();
          user = freshUsers.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
        } catch (err) {
          console.error("Error refreshing users list on demand:", err);
        } finally {
          setIsRefreshing(false);
        }
      }

      if (!user) {
        setError('Username tidak ditemukan! Silakan pastikan ejaan username benar, atau hubungi Admin jika akun baru saja dibuat.');
        return;
      }

      // Modern SHA-256 Hashed Password Verification
      const hashedInput = await hashPassword(password);
      
      const hasCustomPassword = !!user.password;
      
      // Check if it matches the stored hashed password, or matches plain text (legacy)
      const isCustomMatch = hasCustomPassword && (password === user.password || hashedInput === user.password);
      
      // Default fallback: only allow the account's own username as the default password if no custom password is set
      const isFallbackMatch = !hasCustomPassword && password === user.username.toLowerCase();

      if (isCustomMatch || isFallbackMatch) {
        // If logging in via legacy or fallback, we will pass along a flag so App.tsx can automatically migrate it
        const updatedUser = { ...user };
        if (!hasCustomPassword || password === user.password) {
          updatedUser.password = hashedInput; // Automatically hash and upgrade the password
        }
        onLoginSuccess(updatedUser);
      } else {
        setError('Password salah! Silakan masukkan password yang tepat atau hubungi Administrator.');
      }
    } catch (err: any) {
      console.error("Critical login error:", err);
      setError(`Gagal memproses login karena masalah sistem: ${err.message || String(err)}. Hubungi developer.`);
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
            v2.1 Stable
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
            <p className="text-xs text-slate-500 mt-1">Gunakan akun Guru / Admin Anda untuk mengelola nilai santri</p>
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
              <label className="text-xs font-bold text-slate-700 block">Username</label>
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
            <span>{isRefreshing ? "Memproses..." : "Masuk Sistem"}</span>
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
          &copy; 2026 PPTQ Al-Husna. All Rights Reserved. dibuat oleh Achmad Husain
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

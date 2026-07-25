import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  School, 
  UserCheck, 
  Settings, 
  UserCog, 
  History, 
  LogOut, 
  Menu, 
  X, 
  KeyRound, 
  CloudOff, 
  Database,
  CheckCircle2,
  AlertTriangle,
  User as UserIcon
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import ChangePasswordModal from './ChangePasswordModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { currentUser, logout, updateUserPassword } = useAuth();
  const { 
    activeTab, 
    setActiveTab, 
    settings, 
    useCloudSync, 
    setUseCloudSync, 
    isQuotaExceeded,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    addLog
  } = useApp();

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'santri', label: 'Data Santri & Nilai', icon: Users, adminOnly: false },
    { id: 'kelas', label: 'Daftar Kelas', icon: School, adminOnly: false },
    { id: 'mapel', label: 'Mata Pelajaran', icon: BookOpen, adminOnly: true },
    { id: 'guru', label: 'Wali Kelas', icon: UserCheck, adminOnly: true },
    { id: 'pengaturan', label: 'Pengaturan Raport', icon: Settings, adminOnly: true },
    { id: 'pengguna', label: 'Kelola Pengguna', icon: UserCog, adminOnly: true },
    { id: 'log', label: 'Log Aktivitas', icon: History, adminOnly: true },
  ];

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar dari sistem?')) {
      if (currentUser) {
        await addLog('LOGOUT', `Pengguna ${currentUser.fullname} keluar dari sistem`, currentUser.fullname);
      }
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Header Navigation */}
      <header className="bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-950 text-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-emerald-800/60 text-emerald-100 hover:bg-emerald-700 focus:outline-none"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-full bg-white p-1 flex items-center justify-center shadow-md">
                <img 
                  src={settings.logoSekolah || "/logo.svg"} 
                  alt="Logo" 
                  className="h-full w-full object-contain" 
                />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-wider uppercase text-white leading-none">
                  PPTQ AL-HUSNA
                </h1>
                <p className="text-[10px] text-emerald-300 font-medium tracking-tight mt-0.5">
                  Sistem Raport Diniyah v2.2
                </p>
              </div>
            </div>
          </div>

          {/* Sync Status Badge & User Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Database Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 border border-emerald-700/50">
              {isQuotaExceeded ? (
                <span className="text-amber-400 flex items-center gap-1" title="Firestore Quota Limit, menggunakan mode cadangan lokal">
                  <AlertTriangle size={14} /> Mode Lokal
                </span>
              ) : useCloudSync ? (
                <span className="text-emerald-300 flex items-center gap-1" title="Cloud Sync Terhubung">
                  <CheckCircle2 size={14} /> Database Cloud
                </span>
              ) : (
                <span className="text-slate-300 flex items-center gap-1" title="Penyimpanan Lokal Aktif">
                  <CloudOff size={14} /> Lokal
                </span>
              )}
            </div>

            {/* Profile badge & Password button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="p-2 rounded-xl bg-emerald-800/50 hover:bg-emerald-700/80 text-emerald-200 transition text-xs font-medium flex items-center gap-1.5 border border-emerald-700/40"
                title="Ubah Password Akun"
              >
                <KeyRound size={15} />
                <span className="hidden md:inline">Password</span>
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-emerald-800/60">
                <div className="h-8 w-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow border border-emerald-500 overflow-hidden">
                  {currentUser?.photo ? (
                    <img src={currentUser.photo} alt="User" className="h-full w-full object-cover" />
                  ) : (
                    currentUser?.fullname?.[0]?.toUpperCase() || <UserIcon size={14} />
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-white leading-none">{currentUser?.fullname}</p>
                  <p className="text-[10px] text-emerald-300 font-medium capitalize">{currentUser?.role}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-red-800/40 hover:bg-red-700/80 text-red-200 transition text-xs font-medium flex items-center gap-1 border border-red-700/30"
                title="Keluar"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-64 shrink-0">
          <nav className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm sticky top-22 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Menu Navigasi
            </div>
            {navItems.map((item) => {
              if (item.adminOnly && !isAdmin) return null;
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition duration-150 cursor-pointer ${
                    isActive 
                      ? 'bg-emerald-800 text-white shadow-md shadow-emerald-900/10' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile Navigation Modal/Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-sm flex">
            <div className="bg-white w-4/5 max-w-xs h-full p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <img src={settings.logoSekolah || "/logo.svg"} alt="Logo" className="h-8 w-8 object-contain" />
                    <span className="font-bold text-sm text-slate-800">Menu Navigasi</span>
                  </div>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-slate-100">
                    <X size={20} />
                  </button>
                </div>

                <div className="mt-4 space-y-1">
                  {navItems.map((item) => {
                    if (item.adminOnly && !isAdmin) return null;
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs transition ${
                          isActive 
                            ? 'bg-emerald-800 text-white shadow-md' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={() => {
                    setShowPasswordModal(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <KeyRound size={16} />
                  <span>Ubah Password</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  <span>Keluar Sistem</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content View Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-semibold text-slate-600">
            Sistem Informasi Raport Madrasah Diniyah &copy; 2026 PPTQ Al-Husna
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Bukit Raja Wali &bull; Versi 2.2 Re-architected &amp; Hardened Security
          </p>
        </div>
      </footer>

      {/* Change Password Modal */}
      {currentUser && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          currentUser={currentUser}
          onSavePassword={async (newPassword) => {
            await updateUserPassword(newPassword);
            if (currentUser) {
              await addLog('UBAH_PASSWORD', `Pengguna ${currentUser.fullname} memperbarui password akun`, currentUser.fullname);
            }
          }}
        />
      )}
    </div>
  );
}

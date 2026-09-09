import React, { useEffect, useRef, useState } from 'react';
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
  Cloud,
  CloudOff,
  ChevronRight,
  PenLine,
  CalendarDays,
  CircleHelp,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useApp } from '../context/AppContext';
import ChangePasswordModal from './ChangePasswordModal';

const navigation = [
  {
    group: 'AKADEMIK',
    items: [
      { id: 'dashboard', label: 'Ringkasan', icon: LayoutDashboard },
      { id: 'santri', label: 'Data santri', icon: Users },
      { id: 'kelas', label: 'Daftar kelas', icon: School },
      { id: 'bulk-grades', label: 'Input nilai', icon: PenLine },
    ],
  },
  {
    group: 'PENGELOLAAN',
    items: [
      { id: 'mapel', label: 'Mata pelajaran', icon: BookOpen, admin: true },
      { id: 'guru', label: 'Wali kelas', icon: UserCheck, admin: true },
      { id: 'pengguna', label: 'Pengguna', icon: UserCog, admin: true },
      { id: 'log', label: 'Aktivitas', icon: History, admin: true },
      {
        id: 'pengaturan',
        label: 'Pengaturan rapor',
        icon: Settings,
        admin: true,
      },
    ],
  },
];
const aliases: Record<string, string> = {
  students: 'santri',
  subjects: 'mapel',
  teachers: 'guru',
  settings: 'pengaturan',
  users: 'pengguna',
  logs: 'log',
  'add-student': 'santri',
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, logout, updateUserPassword } = useAuth();
  const {
    activeTab,
    setActiveTab,
    setEditingStudentId,
    settings,
    useCloudSync,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    addLog,
  } = useApp();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const main = useRef<HTMLElement>(null);
  const active = aliases[activeTab] || activeTab;
  const isAdmin = currentUser?.role === 'admin';
  const title =
    navigation.flatMap((g) => g.items).find((i) => i.id === active)?.label ||
    'Profil saya';
  useEffect(() => {
    const dialog = drawer.current;
    if (!dialog) return;
    if (isMobileMenuOpen && !dialog.open) dialog.showModal();
    if (!isMobileMenuOpen && dialog.open) dialog.close();
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);
  const navigate = (tab: string) => {
    setEditingStudentId(null);
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    requestAnimationFrame(() => main.current?.focus());
  };
  const exit = async () => {
    if (!confirm('Keluar dari Sistem Rapor Diniyah?')) return;
    if (currentUser)
      await addLog('LOGOUT', 'Keluar dari sistem', currentUser.fullname);
    await logout();
  };
  const brand = (
    <div className="sidebar-brand">
      <div className="brand-mark">
        <img src={settings.logoSekolah || '/logo.svg'} alt="Logo Al-Husna" />
      </div>
      <div>
        <strong>
          AL-HUSNA<span className="brand-dot">.</span>
        </strong>
        <span>RAPOR DINIYAH</span>
      </div>
    </div>
  );
  const menu = (
    <>
      <nav aria-label="Navigasi utama">
        {navigation.map((group) => {
          const items = group.items.filter(
            (item) => !('admin' in item && item.admin) || isAdmin,
          );
          return (
            items.length > 0 && (
              <div className="nav-group" key={group.group}>
                <p>{group.group}</p>
                {items.map((item) => (
                  <button
                    key={item.id}
                    className={
                      active === item.id ? 'nav-item active' : 'nav-item'
                    }
                    aria-current={active === item.id ? 'page' : undefined}
                    onClick={() => navigate(item.id)}
                  >
                    <item.icon size={19} strokeWidth={1.8} />
                    <span>{item.label}</span>
                    {active === item.id && <span className="nav-active-dot" />}
                  </button>
                ))}
              </div>
            )
          );
        })}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-term">
          <BookOpen size={20} />
          <strong>
            Periode akademik
            <span>
              {settings.tahunAjaran} · {settings.semester}
            </span>
          </strong>
        </div>
        <button className="nav-item" onClick={() => navigate('profile')}>
          <CircleHelp size={18} />
          <span>Profil saya</span>
        </button>
        <button className="nav-item logout-item" onClick={exit}>
          <LogOut size={18} />
          <span>Keluar akun</span>
        </button>
      </div>
    </>
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Lewati ke konten
      </a>
      <aside className="desktop-sidebar">
        {brand}
        {menu}
      </aside>
      <dialog
        className="mobile-drawer"
        ref={drawer}
        onCancel={() => setIsMobileMenuOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsMobileMenuOpen(false);
        }}
      >
        <div className="drawer-inner">
          <div className="drawer-brand">
            {brand}
            <button
              className="icon-button"
              aria-label="Tutup navigasi"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          {menu}
        </div>
      </dialog>
      <div className="app-workspace">
        <header className="app-topbar">
          <div className="topbar-breadcrumb">
            <button
              className="icon-button mobile-menu-toggle"
              aria-label="Buka navigasi"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-home">Ruang akademik</span>
            <ChevronRight size={14} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <span className="cloud-badge">
              {useCloudSync ? <Cloud size={15} /> : <CloudOff size={15} />}
              {useCloudSync ? 'Mode cloud' : 'Mode lokal'}
            </span>
            <button
              className="icon-button password-button"
              title="Ubah password"
              aria-label="Ubah password"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound size={18} />
            </button>
            <button
              className="profile-button"
              onClick={() => navigate('profile')}
              aria-label="Buka profil saya"
            >
              <span className="avatar">
                {currentUser?.photo ? (
                  <img src={currentUser.photo} alt="" />
                ) : (
                  currentUser?.fullname?.slice(0, 1)
                )}
              </span>
              <span className="profile-name">
                <strong>{currentUser?.fullname}</strong>
                <small>{isAdmin ? 'Administrator' : 'Wali kelas'}</small>
              </span>
            </button>
          </div>
        </header>
        <main id="main-content" ref={main} tabIndex={-1} className="app-main">
          {children}
        </main>
        <footer className="app-footer">
          <span>© {new Date().getFullYear()} PPTQ Al-Husna</span>
          <span>Adab. Ilmu. Amal.</span>
        </footer>
      </div>
      {currentUser && (
        <ChangePasswordModal
          isOpen={passwordOpen}
          onClose={() => setPasswordOpen(false)}
          currentUser={currentUser}
          onSavePassword={async (password) => {
            await updateUserPassword(password);
            await addLog(
              'UBAH_PASSWORD',
              'Memperbarui password akun',
              currentUser.fullname,
            );
          }}
        />
      )}
    </div>
  );
}

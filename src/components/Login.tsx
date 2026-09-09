import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  Loader2,
  GraduationCap,
  Check,
} from 'lucide-react';
import { SystemSettings, UserAccount } from '../types';
import { useAuth } from '../hooks/useAuth';

export default function Login({
  settings,
}: {
  settings: SystemSettings;
  users?: UserAccount[];
  useCloudSync?: boolean;
  onSaveLogo?: (logo: string) => void;
  onRefreshUsers?: () => Promise<UserAccount[]>;
}) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);
    try {
      await login(username, password);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Gagal masuk. Silakan coba lagi.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <div className="brand-mark">
            <img
              src={settings.logoSekolah || '/logo.svg'}
              alt="Logo Al-Husna"
            />
          </div>
          <div>
            <strong>AL-HUSNA</strong>
            <span>MADRASAH DINIYAH</span>
          </div>
        </div>
        <div className="login-story-body">
          <span className="eyebrow light">
            <span className="status-dot" /> PORTAL AKADEMIK
          </span>
          <h1>
            Setiap proses belajar,
            <br />
            <em>tercatat dengan baik.</em>
          </h1>
          <p>
            Ruang bersama untuk mendampingi perjalanan belajar santri. Kelola
            nilai, pantau perkembangan, dan siapkan rapor dalam satu tempat.
          </p>
          <div className="login-illustration" aria-hidden="true">
            <div className="illustration-orbit" />
            <div className="report-sheet">
              <div className="report-sheet-head">
                <BookOpen size={24} />
                <span>
                  LAPORAN HASIL BELAJAR<small>Madrasah Diniyah Al-Husna</small>
                </span>
              </div>
              <div className="report-lines">
                <i />
                <i />
                <i />
              </div>
              <div className="report-score">
                <GraduationCap size={28} />
                <div>
                  Ilmu yang bermanfaat<small>Adab. Ilmu. Amal.</small>
                </div>
                <span>
                  <Check size={17} />
                </span>
              </div>
            </div>
            <div className="illustration-badge">
              <ShieldCheck size={17} /> Teratur & terjaga
            </div>
          </div>
        </div>
        <p className="login-story-footer">
          PPTQ Al-Husna <span>•</span> Bukit Raja Wali
        </p>
      </section>
      <main className="login-form-side">
        <div className="login-mobile-brand">
          <img src={settings.logoSekolah || '/logo.svg'} alt="" /> AL-HUSNA
        </div>
        <div className="login-form-wrap">
          <div className="login-icon">
            <LockKeyhole size={23} />
          </div>
          <span className="eyebrow">SELAMAT DATANG KEMBALI</span>
          <h2>Masuk ke ruang akademik.</h2>
          <p className="login-description">
            Gunakan akun admin atau guru yang telah terdaftar.
          </p>
          <form onSubmit={submit} className="login-form">
            {error && (
              <div className="form-error" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            <label htmlFor="username">Username atau email</label>
            <div className="login-input">
              <UserRound size={18} />
              <input
                id="username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username atau email"
                disabled={busy}
              />
            </div>
            <label htmlFor="password">Password</label>
            <div className="login-input">
              <LockKeyhole size={18} />
              <input
                id="password"
                name="password"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password Anda"
                disabled={busy}
              />
              <button
                type="button"
                aria-label={
                  visible ? 'Sembunyikan password' : 'Tampilkan password'
                }
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="login-help">
              Lupa password? Hubungi administrator madrasah.
            </p>
            <button
              type="submit"
              className="button-primary login-submit"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Sedang masuk…
                </>
              ) : (
                <>
                  Masuk ke sistem <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="login-note">
            <ShieldCheck size={18} />
            <p>
              Akses khusus pengelola dan pengajar.
              <br />
              Data akademik santri tersimpan dalam akun lembaga.
            </p>
          </div>
        </div>
        <footer>
          © {new Date().getFullYear()} PPTQ Al-Husna. Sistem Rapor Diniyah.
        </footer>
      </main>
    </div>
  );
}

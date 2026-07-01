import React, { useState, ChangeEvent, FormEvent } from 'react';
import { User, Phone, Mail, FileText, MapPin, AlignLeft, ShieldCheck, KeyRound, Image as ImageIcon, CheckCircle, Award } from 'lucide-react';
import { UserAccount, ClassTeacher, Student } from '../types';
import { compressBase64Image } from '../utils/imageCompressor';

interface MyProfileProps {
  currentUser: UserAccount;
  teachers: ClassTeacher[];
  students: Student[];
  onUpdateProfile: (updatedUser: UserAccount) => Promise<void>;
  onUpdatePassword: (id: string, newPassword: string) => void;
}

export default function MyProfile({
  currentUser,
  teachers,
  students,
  onUpdateProfile,
  onUpdatePassword
}: MyProfileProps) {
  // Local state for profile inputs
  const [fullname, setFullname] = useState(currentUser.fullname || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [nip, setNip] = useState(currentUser.nip || '');
  const [address, setAddress] = useState(currentUser.address || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [gender, setGender] = useState<'L' | 'P' | ''>(currentUser.gender || '');
  const [photo, setPhoto] = useState(currentUser.photo || '');

  // Local state for password change
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  // Status message states
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);

  // Find classes where this user is the Wali Kelas
  const myClasses = teachers.filter(t => t.waliKelas.toLowerCase() === currentUser.fullname.toLowerCase()).map(t => t.kelas);
  
  // Calculate total students under this user's supervision (Wali Kelas)
  const supervisedStudentsCount = students.filter(s => myClasses.includes(s.kelas)).length;

  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64Str = evt.target?.result as string;
      if (base64Str) {
        // Compress photo to maximum 300x300, low size to save Firestore memory
        const compressed = await compressBase64Image(base64Str, 300, 300, 0.7);
        setPhoto(compressed);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!fullname.trim()) {
      alert("Nama Lengkap tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedUser: UserAccount = {
        ...currentUser,
        fullname,
        phone,
        email,
        nip,
        address,
        bio,
        gender,
        photo
      };

      await onUpdateProfile(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui profil di server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (!newPass) {
      setPasswordStatus({ success: false, message: "Password baru tidak boleh kosong!" });
      return;
    }

    if (newPass !== confirmPass) {
      setPasswordStatus({ success: false, message: "Konfirmasi password baru tidak cocok!" });
      return;
    }

    // Check current password if it exists in the system
    if (currentUser.password && currentPass !== currentUser.password) {
      setPasswordStatus({ success: false, message: "Password saat ini salah!" });
      return;
    }

    onUpdatePassword(currentUser.id, newPass);
    setPasswordStatus({ success: true, message: "Password berhasil diperbarui!" });
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">👤</span>
          Profil Pengguna
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Perbarui data diri, foto profil, dan kredensial keamanan akun Anda untuk sistem raport digital.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Profile card & Stats */}
        <div className="space-y-6">
          {/* Card Profil Utama */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col items-center p-6 text-center relative">
            {/* Top banner styling */}
            <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-emerald-900 to-teal-800" />
            
            {/* Photo Section */}
            <div className="relative mt-12 z-10">
              <div className="h-28 w-28 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-md relative group flex items-center justify-center">
                {photo ? (
                  <img src={photo} alt="Profil" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-4xl text-slate-300">🕌</span>
                )}
                
                {/* Photo hover overlay */}
                <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer">
                  <ImageIcon size={18} />
                  <span className="mt-1">Ganti Foto</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
              
              {/* Floating icon if no avatar */}
              {!photo && (
                <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-md cursor-pointer transition">
                  <ImageIcon size={12} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              )}
            </div>

            <div className="mt-4 z-10 space-y-1">
              <h3 className="font-extrabold text-slate-900 text-lg">{fullname || currentUser.fullname}</h3>
              <p className="text-xs font-mono text-slate-500">@{currentUser.username}</p>
              
              <div className="pt-2 flex justify-center gap-1.5">
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase ${
                  currentUser.role === 'admin'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  {currentUser.role === 'admin' ? 'Administrator' : 'Ustadz / Wali'}
                </span>
                {nip && (
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">
                    NIP: {nip}
                  </span>
                )}
              </div>
            </div>

            {bio && (
              <p className="mt-4 text-xs text-slate-500 italic max-w-xs leading-relaxed border-t border-slate-100 pt-3 w-full">
                "{bio}"
              </p>
            )}
          </div>

          {/* Wali Kelas Stats Card */}
          {currentUser.role === 'teacher' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award size={14} className="text-emerald-700" />
                Tugas Wali Kelas
              </h4>

              {myClasses.length > 0 ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <p className="text-[10px] text-emerald-800/80 uppercase font-black tracking-wider">Kelas Binaan</p>
                    <p className="font-extrabold text-emerald-950 text-sm mt-0.5">
                      {myClasses.join(', ')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Supervisi Santri</p>
                      <p className="text-lg font-black text-slate-700 mt-0.5">{supervisedStudentsCount}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Semester Aktif</p>
                      <p className="text-xs font-black text-slate-700 mt-1.5">Ganjil</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Akun Anda belum dikaitkan dengan kelas manapun di sistem Wali Kelas. Hubungi Administrator.
                </p>
              )}
            </div>
          )}

          {/* Admin Stats Info Card */}
          {currentUser.role === 'admin' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <h4 className="font-extrabold text-xs text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} />
                Hak Akses Administrator
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Anda memiliki akses penuh untuk mengelola kurikulum mata pelajaran, kelas, akun guru, dan konfigurasi institusi sekolah.
              </p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs flex flex-col gap-1 text-slate-600">
                <p className="flex justify-between"><span>Sistem Database:</span> <strong className="text-slate-800">Cloud Firestore</strong></p>
                <p className="flex justify-between"><span>Hak Akses:</span> <strong className="text-rose-700">Super Admin</strong></p>
              </div>
            </div>
          )}
        </div>

        {/* Right Columns: Edit Form & Change Password */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section 1: Edit Profile Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-sm text-emerald-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <User size={16} className="text-emerald-800" />
              Detail Informasi Personal
            </h3>

            {saveSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-center gap-2.5 animate-fade-in">
                <CheckCircle size={18} className="text-emerald-800 shrink-0" />
                <div>
                  <p className="font-bold">✓ Profil Berhasil Diperbarui!</p>
                  <p className="text-emerald-800/80">Data diri Anda telah tersinkronisasi ke database cloud dengan aman.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block">Nama Lengkap & Gelar Akademik/Keagamaan</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    placeholder="Contoh: Ustadz H. Ahmad Fauzi, Lc."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Nomor Induk Pegawai / NIP / NIY</label>
                <div className="relative">
                  <FileText size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="Contoh: 19890204 202601 1 001"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Jenis Kelamin</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'L' | 'P' | '')}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition font-medium"
                >
                  <option value="">-- Pilih Jenis Kelamin --</option>
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Nomor Handphone / WhatsApp</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Alamat Email</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Contoh: ahmad@gmail.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block">Alamat Lengkap Rumah</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Jl. Bukit Rajawali No. 45, RT 02/05, Kelurahan Kranji..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 block">Moto Hidup / Catatan Singkat Profil</label>
                <div className="relative">
                  <AlignLeft size={14} className="absolute left-3 top-3 text-slate-400" />
                  <textarea
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tulis sepatah kata inspiratif atau pengingat diri..."
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition active:scale-95 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin" />
                  ) : '✓'}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Informasi Profil'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Change Password Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <h3 className="font-extrabold text-sm text-emerald-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
              <KeyRound size={16} className="text-emerald-800" />
              Keamanan Akun & Ubah Password
            </h3>

            {passwordStatus && (
              <div className={`border rounded-xl p-4 text-xs flex items-center gap-2.5 ${
                passwordStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <span>{passwordStatus.success ? '✓' : '✕'}</span>
                <p className="font-bold">{passwordStatus.message}</p>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-sm">
              {currentUser.password && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Password Saat Ini</label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="******"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Password Baru</label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block">Konfirmasi Password Baru</label>
                  <div className="relative">
                    <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPass}
                      onChange={(e) => setConfirmPass(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition active:scale-95 text-xs cursor-pointer"
                >
                  Ubah Password Kredensial
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

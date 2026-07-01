import React, { useState } from 'react';
import { User, UserPlus, Trash2, KeyRound, Server, HelpCircle, RefreshCw } from 'lucide-react';
import { UserAccount } from '../types';

interface UserManagerProps {
  users: UserAccount[];
  currentUser: UserAccount;
  onAddUser: (fullname: string, username: string, role: 'admin' | 'teacher', password?: string, email?: string) => void;
  onDeleteUser: (id: string) => void;
  onUpdatePassword: (id: string, newPassword: string) => void;
  onUpdateEmail: (id: string, email: string) => void;
  useCloudSync?: boolean;
  onSyncAllUsersToCloud?: () => Promise<void>;
}

export default function UserManager({
  users,
  currentUser,
  onAddUser,
  onDeleteUser,
  onUpdatePassword,
  onUpdateEmail,
  useCloudSync = false,
  onSyncAllUsersToCloud
}: UserManagerProps) {
  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState('');
  const [editingEmailUserId, setEditingEmailUserId] = useState<string | null>(null);
  const [tempEmail, setTempEmail] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullname || !username || !password) {
      alert("Harap lengkapi seluruh field!");
      return;
    }

    onAddUser(fullname, username, role, password, email.trim() || undefined);
    setFullname('');
    setUsername('');
    setPassword('');
    setEmail('');
    setRole('teacher');
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">👥</span>
          Kelola Hak Akses & Akun Guru
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Halaman khusus Administrator untuk membuat, mengedit, atau menghapus akses login para Ustadz / Wali kelas.
        </p>
      </div>

      {/* Cloud Sync Information & Actions */}
      <div className={`p-4.5 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-sm ${
        useCloudSync 
          ? 'bg-emerald-50/70 border-emerald-150 text-emerald-950' 
          : 'bg-amber-50/70 border-amber-150 text-amber-950'
      }`}>
        <div className="space-y-1">
          <div className="font-extrabold flex items-center gap-1.5 text-xs uppercase tracking-wide">
            {useCloudSync ? (
              <span className="flex items-center gap-1 text-emerald-700">
                <Server size={14} /> Mode Online (Sinkronisasi Cloud Aktif)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-800">
                <HelpCircle size={14} /> Mode Offline (Penyimpanan Lokal Aktif)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
            {useCloudSync 
              ? "Akun guru yang dibuat di sini akan langsung dikirim ke Cloud agar Wali Kelas lain bisa langsung masuk dari HP atau laptop mereka masing-masing. Jika ada akun yang belum terdeteksi oleh guru, gunakan tombol sinkronisasi manual di sebelah kanan."
              : "Akun guru yang Anda buat dalam mode ini HANYA tersimpan di dalam browser komputer/perangkat ini. Guru lain tidak akan bisa login dari HP/perangkat mereka sendiri sebelum Anda mengaktifkan 'Sinkronisasi Cloud (Online)' di tab Pengaturan Lembaga."}
          </p>
        </div>

        {useCloudSync && onSyncAllUsersToCloud && (
          <button
            type="button"
            onClick={onSyncAllUsersToCloud}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-lg shadow-sm transition active:scale-95 shrink-0 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Sinkronkan Semua Akun ke Cloud</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Form: Create account */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4 h-fit">
          <h3 className="font-extrabold text-sm text-emerald-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
            <UserPlus size={16} />
            Buat Akun Guru Baru
          </h3>

          <form onSubmit={handleCreate} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Nama Lengkap & Gelar Guru</label>
              <input
                type="text"
                required
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                placeholder="Contoh: Ustadzah Laila, S.Ag."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Username Login</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                placeholder="Contoh: laila12"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 lowercase font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Password Baru</label>
              <div className="relative">
                <KeyRound size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Email Google (Opsional untuk Cloud Sync)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ustadz@gmail.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
              <p className="text-[10px] text-indigo-600 font-medium">Diperlukan agar guru bisa sinkronisasi ke cloud via Google Sign-In.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Hak Akses Sistem</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="teacher">Ustadz / Guru Kelas</option>
                <option value="admin">Administrator Utama</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition"
            >
              Simpan Akun Guru
            </button>
          </form>
        </div>

        {/* Right Table: Active accounts list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 font-bold text-gray-800 text-sm flex items-center gap-2">
            <User size={16} />
            <h3>Daftar Pengguna Aktif ({users.length})</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/20 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="p-4 font-bold">Nama Guru / Admin</th>
                  <th className="p-4 font-bold w-32">Username</th>
                  <th className="p-4 font-bold w-48">Password</th>
                  <th className="p-4 font-bold w-28 text-center">Hak Akses</th>
                  <th className="p-4 font-bold text-center w-28">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {u.photo ? (
                            <img src={u.photo} alt={u.fullname} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-bold text-slate-400">👤</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{u.fullname}</div>
                          {u.nip && (
                            <div className="text-[10px] text-slate-400 font-medium">NIP: {u.nip}</div>
                          )}
                          {u.phone && (
                            <div className="text-[10px] text-slate-400 font-medium">WA: {u.phone}</div>
                          )}
                          {u.email ? (
                            <div className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 mt-0.5">
                              <span>📧 Google: {u.email}</span>
                              <button 
                                onClick={() => {
                                  setEditingEmailUserId(u.id);
                                  setTempEmail(u.email || '');
                                }} 
                                className="text-[9px] font-bold hover:underline text-indigo-800 cursor-pointer"
                              >
                                (Ubah)
                              </button>
                            </div>
                          ) : (
                            <div className="text-[10px] text-amber-650 font-bold flex items-center gap-1 mt-0.5">
                              <span>⚠️ Belum Terhubung Google</span>
                              <button 
                                onClick={() => {
                                  setEditingEmailUserId(u.id);
                                  setTempEmail('');
                                }} 
                                className="text-[9px] font-bold hover:underline text-indigo-800 cursor-pointer"
                              >
                                (Hubungkan)
                              </button>
                            </div>
                          )}
                          {editingEmailUserId === u.id && (
                            <div className="mt-1 flex items-center gap-1.5 bg-indigo-50 p-1.5 rounded border border-indigo-150">
                              <input
                                type="email"
                                value={tempEmail}
                                onChange={(e) => setTempEmail(e.target.value)}
                                className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-[10px] font-sans w-40 outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                                placeholder="nama@gmail.com"
                              />
                              <button
                                onClick={() => {
                                  onUpdateEmail(u.id, tempEmail.trim());
                                  setEditingEmailUserId(null);
                                }}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] px-1.5 py-0.5 rounded transition shrink-0"
                              >
                                Simpan
                              </button>
                              <button
                                onClick={() => setEditingEmailUserId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] px-1.5 py-0.5 rounded transition shrink-0"
                              >
                                Batal
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-600">{u.username}</td>
                    <td className="p-4">
                      {editingUserId === u.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={tempPassword}
                            onChange={(e) => setTempPassword(e.target.value)}
                            className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-mono w-24 outline-none focus:ring-1 focus:ring-emerald-500"
                            placeholder="Password"
                          />
                          <button
                            onClick={() => {
                              if (!tempPassword.trim()) {
                                alert("Password tidak boleh kosong!");
                                return;
                              }
                              onUpdatePassword(u.id, tempPassword.trim());
                              setEditingUserId(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-1.5 py-1 rounded transition shrink-0"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] px-1.5 py-1 rounded transition shrink-0"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1.5 max-w-[170px]">
                          <span className="font-mono text-xs font-semibold text-slate-700 truncate block max-w-[120px]">
                            {u.password ? (
                              u.password.length === 64 ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-sans font-bold" title={u.password}>
                                  🔒 Aktif (Hashed)
                                </span>
                              ) : (
                                u.password
                              )
                            ) : (
                              <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-sans font-bold">
                                {u.username} (Default)
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => {
                              setEditingUserId(u.id);
                              setTempPassword(u.password && u.password.length !== 64 ? u.password : '');
                            }}
                            className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 hover:underline shrink-0"
                          >
                            Ubah
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                        u.role === 'admin' 
                          ? 'bg-rose-50 border border-rose-200 text-rose-700' 
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      }`}>
                        {u.role === 'admin' ? 'Administrator' : 'Ustadz / Wali'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {u.id === currentUser.id ? (
                        <span className="text-xs text-gray-400 italic">Akun Anda</span>
                      ) : u.username === 'admin' ? (
                        <span className="text-xs text-gray-400 italic">Akun Utama</span>
                      ) : (
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="text-red-600 hover:text-red-800 font-bold text-xs hover:underline"
                        >
                          Hapus Akses
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

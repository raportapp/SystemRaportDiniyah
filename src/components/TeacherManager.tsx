import React, { useState } from 'react';
import { Users, UserPlus, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { ClassTeacher } from '../types';

interface TeacherManagerProps {
  teachers: ClassTeacher[];
  allClasses: string[];
  onAddTeacher: (kelas: string, waliKelas: string) => void;
  onUpdateTeacher: (kelas: string, waliKelas: string) => void;
  onDeleteTeacher: (kelas: string) => void;
}

export default function TeacherManager({
  teachers,
  allClasses,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher
}: TeacherManagerProps) {
  const [newKelas, setNewKelas] = useState('');
  const [newWali, setNewWali] = useState('');
  const [editingKelas, setEditingKelas] = useState<string | null>(null);
  const [editingWali, setEditingWali] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKelas || !newWali) {
      alert("Harap lengkapi nama kelas dan nama wali kelas!");
      return;
    }
    onAddTeacher(newKelas, newWali);
    setNewKelas('');
    setNewWali('');
  };

  const startEdit = (item: ClassTeacher) => {
    setEditingKelas(item.kelas);
    setEditingWali(item.waliKelas);
  };

  const handleUpdate = (kelasName: string) => {
    if (!editingWali) {
      alert("Nama wali kelas tidak boleh kosong!");
      return;
    }
    onUpdateTeacher(kelasName, editingWali);
    setEditingKelas(null);
    setEditingWali('');
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
          <span className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">👩‍🏫</span>
          Manajemen Wali Kelas per Jenjang
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Daftarkan guru / ustadzah penanggung jawab masing-masing kelas untuk dicetak otomatis pada tanda tangan raport.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Table of Teachers */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 font-bold text-gray-800 text-sm flex items-center gap-2">
            <Users size={16} />
            <h3>Daftar Tanggung Jawab Kelas</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/20 border-b border-slate-100 text-slate-600">
                <tr>
                  <th className="p-4 font-bold text-center w-12">No</th>
                  <th className="p-4 font-bold w-48">Kelas</th>
                  <th className="p-4 font-bold">Wali Kelas (Ustadz / Ustadzah)</th>
                  <th className="p-4 font-bold text-center w-36">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((item, index) => {
                  const isEditing = editingKelas === item.kelas;

                  return (
                    <tr key={item.kelas} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-center text-slate-400">{index + 1}</td>
                      <td className="p-4 font-bold text-emerald-950">{item.kelas}</td>
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingWali}
                            onChange={(e) => setEditingWali(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        ) : (
                          <span className="font-semibold text-slate-700">{item.waliKelas}</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleUpdate(item.kelas)}
                              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 transition"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingKelas(null)}
                              className="text-slate-500 hover:text-slate-600 font-bold text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => startEdit(item)}
                              className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 hover:underline"
                            >
                              <Edit2 size={12} />
                              <span>Ubah</span>
                            </button>
                            <button
                              onClick={() => onDeleteTeacher(item.kelas)}
                              className="text-red-600 hover:text-red-800 font-bold text-xs flex items-center gap-1 hover:underline"
                            >
                              <Trash2 size={12} />
                              <span>Hapus</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Create Form */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4 h-fit">
          <h3 className="font-extrabold text-sm text-emerald-950 uppercase tracking-wider flex items-center gap-2 pb-2 border-b">
            <UserPlus size={16} />
            Tambah Hubungan Baru
          </h3>

          <form onSubmit={handleAdd} className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Nama Kelas Baru / Custom</label>
              <input
                type="text"
                required
                value={newKelas}
                onChange={(e) => setNewKelas(e.target.value)}
                placeholder="Contoh: Kelas 3 Aliyah, Kelas Al-Jazari"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-400 leading-tight">
                *Mengisi ini juga akan mendaftarkan nama kelas baru ini ke daftar kelas global secara otomatis.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">Nama Lengkap Wali Kelas & Gelar</label>
              <input
                type="text"
                required
                value={newWali}
                onChange={(e) => setNewWali(e.target.value)}
                placeholder="Contoh: Ustadzah Zahra, S.Pd.I"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-sm transition"
            >
              Daftarkan Wali Kelas
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

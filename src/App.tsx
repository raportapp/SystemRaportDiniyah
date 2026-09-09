import React from 'react';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import MainLayout from './components/MainLayout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import SubjectManager from './components/SubjectManager';
import TeacherManager from './components/TeacherManager';
import SettingsManager from './components/SettingsManager';
import LogViewer from './components/LogViewer';
import UserManager from './components/UserManager';
import MyProfile from './components/MyProfile';
import BulkGradeEntry from './components/BulkGradeEntry';
import RaportPrint from './components/RaportPrint';
import { createStaffAccount, resetStaffPassword, deleteStaffAccount } from './lib/authFunctions';
import { INITIAL_CLASSES } from './utils/initialData';
import { UserAccount } from './types';
import { Loader2 } from 'lucide-react';

function MainApp() {
  const { isLoggedIn, isLoadingAuth, currentUser } = useAuthContext();
  const {
    activeTab,
    setActiveTab,
    editingStudentId,
    setEditingStudentId,
    printStudentIds,
    setPrintStudentIds,
    isLoading,
    students,
    saveStudent,
    saveStudentsBatch,
    deleteStudent,
    deleteStudentsBatch,
    subjects,
    saveSubject,
    deleteSubject,
    classSubjects,
    addClassSubject,
    removeClassSubject,
    saveClassSubjects,
    teachers,
    saveTeacher,
    deleteTeacher,
    settings,
    saveSettings,
    logs,
    addLog,
    clearAllLogs,
    users,
    saveUser,
    deleteUser,
    useCloudSync,
    setUseCloudSync,
    refreshUsersFromCloud
  } = useApp();

  if (isLoadingAuth || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-emerald-800 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-700">Memuat Sistem Raport Diniyah...</p>
        <p className="text-xs text-slate-500 mt-1">PPTQ Al-Husna Bukit Raja Wali</p>
      </div>
    );
  }

  if (!isLoggedIn || !currentUser) {
    return (
      <Login
        users={users}
        settings={settings}
        useCloudSync={useCloudSync}
        onSaveLogo={async (logo) => {
          await saveSettings({ ...settings, logoSekolah: logo });
        }}
        onRefreshUsers={refreshUsersFromCloud}
      />
    );
  }

  // Active Print View (Full screen print mode)
  if (activeTab === 'raport-print') {
    return (
      <RaportPrint
        studentIds={printStudentIds}
        students={students}
        subjects={subjects}
        classSubjects={classSubjects}
        teachers={teachers}
        settings={settings}
        onBack={() => {
          setActiveTab('santri');
          setPrintStudentIds([]);
        }}
      />
    );
  }

  const selectedStudentToEdit = editingStudentId ? students.find(s => s.id === editingStudentId) || null : null;
  const isAdmin = currentUser.role === 'admin';

  return (
    <MainLayout>
      {activeTab === 'dashboard' && (
        <Dashboard
          students={students}
          subjects={subjects}
          logs={logs}
          settings={settings}
          userRole={currentUser.role}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setEditingStudentId(null);
          }}
          onSelectStudent={(id) => {
            setEditingStudentId(id);
            setActiveTab('raport-print');
            setPrintStudentIds([id]);
          }}
        />
      )}

      {(activeTab === 'santri' || activeTab === 'students') && (
        <StudentList
          students={students}
          teachers={teachers}
          subjects={subjects}
          classSubjects={classSubjects}
          settings={settings}
          userRole={currentUser.role}
          currentUser={currentUser}
          activeSemester={settings.semester}
          activeTahunAjaran={settings.tahunAjaran}
          onNavigate={(tab) => setActiveTab(tab)}
          onEditStudent={(id) => {
            setEditingStudentId(id);
            setActiveTab('add-student');
          }}
          onDeleteStudent={async (id) => {
            const target = students.find(s => s.id === id);
            await deleteStudent(id);
            if (target) {
              await addLog('HAPUS_SANTRI', `Menghapus santri ${target.nama} (${target.kelas})`, currentUser.fullname);
            }
          }}
          onViewRaport={(id) => {
            setEditingStudentId(id);
            setPrintStudentIds([id]);
            setActiveTab('raport-print');
          }}
          onPrintClass={(kelas) => {
            const classStudentIds = students.filter(s => s.kelas === kelas).map(s => s.id);
            setPrintStudentIds(classStudentIds);
            setActiveTab('raport-print');
          }}
          onBulkSaveStudents={async (list) => {
            await saveStudentsBatch(list);
            await addLog('IMPORT_SANTRI', `Mengimpor / memperbarui ${list.length} santri`, currentUser.fullname);
          }}
          onPrintMultipleStudents={(ids) => {
            setPrintStudentIds(ids);
            setActiveTab('raport-print');
          }}
          onDeleteClassStudents={async (kelas) => {
            const classStudentIds = students.filter(s => s.kelas === kelas).map(s => s.id);
            await deleteStudentsBatch(classStudentIds);
            await addLog('HAPUS_KELAS_SANTRI', `Menghapus ${classStudentIds.length} santri di kelas ${kelas}`, currentUser.fullname);
          }}
        />
      )}

      {activeTab === 'bulk-grades' && (
        <BulkGradeEntry
          students={students}
          subjects={subjects}
          classSubjects={classSubjects}
          teachers={teachers}
          currentUser={currentUser}
          userRole={currentUser.role}
          activeSemester={settings.semester}
          activeTahunAjaran={settings.tahunAjaran}
          onBulkSaveStudents={async (list) => {
            await saveStudentsBatch(list);
            await addLog('INPUT_NILAI_MASSAL', `Input nilai massal untuk ${list.length} santri`, currentUser.fullname);
          }}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'add-student' && (
        <StudentForm
          student={selectedStudentToEdit}
          subjects={subjects}
          classSubjects={classSubjects}
          availableClasses={isAdmin ? INITIAL_CLASSES : teachers.filter(t => t.waliKelas.toLowerCase() === currentUser.fullname.toLowerCase()).map(t => t.kelas)}
          currentTahunAjaran={settings.tahunAjaran}
          currentSemester={settings.semester}
          onSave={async (st) => {
            await saveStudent(st);
            await addLog('SIMPAN_SANTRI', `Menyimpan data santri ${st.nama} (${st.kelas})`, currentUser.fullname);
            setActiveTab('santri');
            setEditingStudentId(null);
          }}
          onCancel={() => {
            setActiveTab('santri');
            setEditingStudentId(null);
          }}
        />
      )}

      {(activeTab === 'mapel' || activeTab === 'subjects') && isAdmin && (
        <SubjectManager
          subjects={subjects}
          classSubjects={classSubjects}
          allClasses={INITIAL_CLASSES}
          userRole={currentUser.role}
          currentUser={currentUser}
          teachers={teachers}
          onAddGlobalSubject={async (nameId, nameAr, kkm, category) => {
            const newSub = {
              id: Date.now(),
              nameId,
              nameAr,
              kkm,
              category
            };
            await saveSubject(newSub);
            await addLog('TAMBAH_MAPEL', `Menambah mata pelajaran ${nameId}`, currentUser.fullname);
          }}
          onDeleteGlobalSubject={async (id) => {
            await deleteSubject(id);
            await addLog('HAPUS_MAPEL', `Menghapus mata pelajaran ID ${id}`, currentUser.fullname);
          }}
          onAddSubjectToClass={async (kelas, subjectId) => {
            await addClassSubject(kelas, subjectId);
          }}
          onRemoveSubjectFromClass={async (kelas, subjectId) => {
            await removeClassSubject(kelas, subjectId);
          }}
          onClearClassSubjects={async (kelas) => {
            const next = classSubjects.filter(cs => cs.kelas !== kelas);
            await saveClassSubjects(next);
          }}
          onClearGlobalSubjects={async () => {
            for (const s of subjects) {
              await deleteSubject(s.id);
            }
          }}
        />
      )}

      {(activeTab === 'guru' || activeTab === 'teachers') && isAdmin && (
        <TeacherManager
          teachers={teachers}
          allClasses={INITIAL_CLASSES}
          onAddTeacher={async (kelas, waliKelas) => {
            await saveTeacher({ kelas, waliKelas });
            await addLog('TAMBAH_WALI_KELAS', `Menetapkan ${waliKelas} sebagai wali kelas ${kelas}`, currentUser.fullname);
          }}
          onUpdateTeacher={async (kelas, waliKelas) => {
            await saveTeacher({ kelas, waliKelas });
            await addLog('UPDATE_WALI_KELAS', `Memperbarui wali kelas ${kelas}`, currentUser.fullname);
          }}
          onDeleteTeacher={async (kelas) => {
            await deleteTeacher(kelas);
            await addLog('HAPUS_WALI_KELAS', `Menghapus wali kelas ${kelas}`, currentUser.fullname);
          }}
        />
      )}

      {(activeTab === 'pengaturan' || activeTab === 'settings') && isAdmin && (
        <SettingsManager
          settings={settings}
          onSaveSettings={async (s) => {
            await saveSettings(s);
            await addLog('UPDATE_PENGATURAN', `Memperbarui pengaturan sistem`, currentUser.fullname);
          }}
          students={students}
          subjects={subjects}
          classSubjects={classSubjects}
          teachers={teachers}
          users={users}
          logs={logs}
          onRestoreData={async (data) => {
            await saveStudentsBatch(data.students);
            await saveSettings(data.settings);
            await addLog('RESTORE_DATA', `Melakukan pemulihan data cadangan`, currentUser.fullname);
          }}
          onToggleLock={async () => {
            const nextVal = !settings.nilaiRaportSelesai;
            await saveSettings({ ...settings, nilaiRaportSelesai: nextVal });
            await addLog('KUNCI_NILAI', `${nextVal ? 'Mengunci' : 'Membuka kunci'} penginputan nilai`, currentUser.fullname);
          }}
          onAdvanceSemester={async () => {
            const nextSemester = settings.semester === 'Ganjil' ? 'Genap' : 'Ganjil';
            await saveSettings({ ...settings, semester: nextSemester });
            await addLog('GANTI_SEMESTER', `Mengubah semester aktif menjadi ${nextSemester}`, currentUser.fullname);
          }}
          useCloudSync={useCloudSync}
          onToggleCloudSync={(val) => setUseCloudSync(val)}
          onClearAllStudents={async () => {
            const ids = students.map(s => s.id);
            await deleteStudentsBatch(ids);
            await addLog('HAPUS_SEMUA_SANTRI', `Menghapus seluruh data santri`, currentUser.fullname);
          }}
        />
      )}

      {(activeTab === 'log' || activeTab === 'logs') && isAdmin && (
        <LogViewer
          logs={logs}
          onClearLogs={async () => {
            await clearAllLogs();
          }}
        />
      )}

      {(activeTab === 'pengguna' || activeTab === 'users') && isAdmin && (
        <UserManager
          users={users}
          currentUser={currentUser}
          onAddUser={async (fullname, username, role, password, email) => {
            try {
              const newUser = await createStaffAccount(fullname, username, role, password, email);
              await saveUser(newUser);
              await addLog('TAMBAH_PENGGUNA', `Menambah akun pengguna ${username}`, currentUser.fullname);
            } catch (err: any) {
              alert(`Gagal membuat akun: ${err.message}`);
            }
          }}
          onDeleteUser={async (id) => {
            try {
              await deleteStaffAccount(id);
              await deleteUser(id);
              await addLog('HAPUS_PENGGUNA', `Menghapus akun pengguna ID ${id}`, currentUser.fullname);
            } catch (err: any) {
              alert(`Gagal menghapus akun: ${err.message}`);
            }
          }}
          onUpdatePassword={async (id, newPass) => {
            try {
              await resetStaffPassword(id, newPass);
              await addLog('RESET_PASSWORD', `Mereset password pengguna ID ${id}`, currentUser.fullname);
              alert("Password pengguna berhasil direset!");
            } catch (err: any) {
              alert(`Gagal reset password: ${err.message}`);
            }
          }}
          onUpdateEmail={async (id, email) => {
            const user = users.find(u => u.id === id);
            if (user) {
              await saveUser({ ...user, email });
            }
          }}
          useCloudSync={useCloudSync}
          onSyncAllUsersToCloud={async () => {
            for (const u of users) {
              await saveUser(u);
            }
          }}
        />
      )}

      {activeTab === 'profile' && (
        <MyProfile
          currentUser={currentUser}
          teachers={teachers}
          students={students}
          onUpdateProfile={async (updated) => {
            await saveUser(updated);
            await addLog('UPDATE_PROFIL', `Memperbarui data profil ${updated.fullname}`, currentUser.fullname);
          }}
          onUpdatePassword={async (id, newPass) => {
            await addLog('UPDATE_PASSWORD_PROFIL', `Memperbarui password akun`, currentUser.fullname);
          }}
        />
      )}
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </AuthProvider>
  );
}

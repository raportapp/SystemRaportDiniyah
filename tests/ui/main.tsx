import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import '../../src/index.css';
import MainLayout from '../../src/components/MainLayout';
import Dashboard from '../../src/components/Dashboard';
import Login from '../../src/components/Login';
import ClassList from '../../src/components/ClassList';
import StudentList from '../../src/components/StudentList';
import StudentForm from '../../src/components/StudentForm';
import BulkGradeEntry from '../../src/components/BulkGradeEntry';
import RaportPrint from '../../src/components/RaportPrint';
import SubjectManager from '../../src/components/SubjectManager';
import SettingsManager from '../../src/components/SettingsManager';
import { PreviewProvider, useApp, useAuth } from './context';
function Preview() {
  const app = useApp();
  const { currentUser } = useAuth();
  const [printIds, setPrintIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [login, setLogin] = useState(false);
  const [failSave, setFailSave] = useState(false);
  const save = async (list: any[]) => {
    if (failSave)
      throw new Error('Simulasi: koneksi terputus, data belum tersimpan.');
    app.setStudents((previous: any[]) =>
      Array.from(
        new Map([...previous, ...list].map((s) => [s.id, s])).values(),
      ),
    );
  };
  const print = (ids: string[]) => {
    setPrintIds(ids);
    app.setActiveTab('raport-print');
  };
  return (
    <>
      <div
        style={{
          padding: '7px 12px',
          background: '#fff3d2',
          fontSize: 11,
          textAlign: 'center',
        }}
      >
        PRATINJAU LOKAL · Data contoh, tanpa koneksi Firebase{' '}
        <button
          style={{ marginLeft: 18, textDecoration: 'underline' }}
          onClick={() => setLogin(!login)}
        >
          {login ? 'Lihat dashboard' : 'Lihat login'}
        </button>
        <label style={{ marginLeft: 18 }}>
          <input
            type="checkbox"
            checked={failSave}
            onChange={(e) => setFailSave(e.target.checked)}
          />{' '}
          Simulasi gagal simpan
        </label>
      </div>
      {login ? (
        <Login settings={app.settings} />
      ) : app.activeTab === 'raport-print' ? (
        <RaportPrint
          {...app}
          studentIds={printIds}
          onBack={() => app.setActiveTab('santri')}
        />
      ) : (
        <MainLayout>
          {app.activeTab === 'dashboard' && (
            <Dashboard
              {...app}
              userRole="admin"
              userName="Guru Contoh"
              onNavigate={app.setActiveTab}
              onSelectStudent={(id) => print([id])}
            />
          )}
          {app.activeTab === 'kelas' && (
            <ClassList
              onPrintClass={(kelas) =>
                print(
                  app.students
                    .filter((s: any) => s.kelas === kelas)
                    .map((s: any) => s.id),
                )
              }
            />
          )}
          {(app.activeTab === 'santri' || app.activeTab === 'students') && (
            <StudentList
              {...app}
              userRole="admin"
              currentUser={currentUser}
              activeSemester={app.settings.semester}
              activeTahunAjaran={app.settings.tahunAjaran}
              onNavigate={(tab) => {
                setEditingId(null);
                app.setActiveTab(tab);
              }}
              onEditStudent={(id) => {
                setEditingId(id);
                app.setActiveTab('add-student');
              }}
              onDeleteStudent={() => {}}
              onViewRaport={(id) => print([id])}
              onPrintClass={(kelas) =>
                print(
                  app.students
                    .filter((s: any) => s.kelas === kelas)
                    .map((s: any) => s.id),
                )
              }
              onBulkSaveStudents={save}
              onPrintMultipleStudents={print}
            />
          )}
          {app.activeTab === 'add-student' && (
            <StudentForm
              student={app.students.find((s: any) => s.id === editingId)}
              subjects={app.subjects}
              classSubjects={app.classSubjects}
              availableClasses={app.teachers.map((t: any) => t.kelas)}
              currentTahunAjaran={app.settings.tahunAjaran}
              currentSemester={app.settings.semester}
              onSave={async (s) => {
                await save([{ ...s, id: s.id || crypto.randomUUID() }]);
                app.setActiveTab('santri');
              }}
              onCancel={() => app.setActiveTab('santri')}
            />
          )}
          {app.activeTab === 'bulk-grades' && (
            <BulkGradeEntry
              {...app}
              currentUser={currentUser}
              userRole="admin"
              activeSemester={app.settings.semester}
              activeTahunAjaran={app.settings.tahunAjaran}
              onBulkSaveStudents={save}
              onNavigate={app.setActiveTab}
            />
          )}
          {![
            'dashboard',
            'kelas',
            'santri',
            'students',
            'add-student',
            'bulk-grades',
          ].includes(app.activeTab) && (
            <div className="panel empty-state">
              Halaman ini tersedia di aplikasi utama.
            </div>
          )}
        </MainLayout>
      )}
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <PreviewProvider>
    <Preview />
  </PreviewProvider>,
);

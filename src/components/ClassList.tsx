import { useState } from 'react';
import { ArrowUpRight, BookOpen, Search, School, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../hooks/useAuth';
import { INITIAL_CLASSES } from '../utils/initialData';
import { gradeSummary, inTerm, subjectsForClass } from '../utils/academic';

export default function ClassList({
  onPrintClass,
}: {
  onPrintClass: (kelas: string) => void;
}) {
  const {
    students,
    subjects,
    classSubjects,
    teachers,
    settings,
    setActiveTab,
  } = useApp();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const activeStudents = students.filter((s) => inTerm(s, settings));
  const classes = [
    ...new Set([
      ...INITIAL_CLASSES,
      ...teachers.map((t) => t.kelas),
      ...activeStudents.map((s) => s.kelas),
    ]),
  ];
  const visible = classes.filter((kelas) =>
    kelas.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <div className="space-y-6">
      <div className="page-heading">
        <div>
          <span className="eyebrow">AKADEMIK</span>
          <h1>Daftar kelas</h1>
          <p>
            Wali kelas, santri, dan kesiapan rapor pada periode{' '}
            {settings.tahunAjaran} · {settings.semester}.
          </p>
        </div>
      </div>
      <div className="class-search">
        <Search size={18} />
        <input
          aria-label="Cari kelas"
          placeholder="Cari nama kelas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="class-card-grid">
        {visible.map((kelas) => {
          const list = activeStudents.filter((s) => s.kelas === kelas);
          const assigned = subjectsForClass(kelas, subjects, classSubjects);
          const completed = list.filter(
            (s) => gradeSummary(s, assigned).complete,
          ).length;
          const teacher = teachers.find((t) => t.kelas === kelas);
          return (
            <section className="panel class-card" key={kelas}>
              <div className="class-card-icon">
                <School size={23} />
              </div>
              <h2>{kelas}</h2>
              <p>{teacher?.waliKelas || 'Wali kelas belum ditentukan'}</p>
              <div className="class-card-stats">
                <span>
                  <Users size={15} />
                  {list.length} santri
                </span>
                <span>
                  <BookOpen size={15} />
                  {assigned.length} mapel
                </span>
              </div>
              <div className="class-card-progress">
                <span>Rapor lengkap</span>
                <strong>
                  {completed}/{list.length}
                </strong>
              </div>
              <div className="progress-track">
                <div
                  style={{
                    width: `${list.length ? (completed / list.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <button
                className="panel-footer-link"
                disabled={!list.length}
                onClick={() => onPrintClass(kelas)}
              >
                Lihat rapor kelas <ArrowUpRight size={15} />
              </button>
              {!assigned.length && currentUser?.role === 'admin' && (
                <button
                  className="text-action mt-3"
                  onClick={() => setActiveTab('mapel')}
                >
                  Atur mata pelajaran
                </button>
              )}
            </section>
          );
        })}
      </div>
      {!visible.length && (
        <div className="panel empty-state">
          <Search size={28} />
          <h2>Kelas tidak ditemukan</h2>
          <p>Coba kata pencarian lain.</p>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  Users,
  BookOpen,
  School,
  CheckCircle2,
  PenLine,
  Plus,
  Clock3,
  LockKeyhole,
  FileText,
  Trophy,
  GraduationCap,
} from 'lucide-react';
import {
  Student,
  Subject,
  SystemLog,
  SystemSettings,
  ClassSubject,
} from '../types';
import { gradeSummary, inTerm, subjectsForClass } from '../utils/academic';

interface Props {
  students: Student[];
  subjects: Subject[];
  classSubjects: ClassSubject[];
  logs: SystemLog[];
  settings: SystemSettings;
  onNavigate: (tab: string) => void;
  onSelectStudent: (id: string) => void;
  userRole?: string;
  userName?: string;
}
export default function Dashboard({
  students,
  subjects,
  classSubjects,
  logs,
  settings,
  onNavigate,
  onSelectStudent,
  userRole,
  userName,
}: Props) {
  const [rankClass, setRankClass] = useState('all');
  const activeStudents = students.filter((s) => inTerm(s, settings));
  const classes = [...new Set(activeStudents.map((s) => s.kelas))].sort();
  const summaries = activeStudents.map((student) => ({
    student,
    ...gradeSummary(
      student,
      subjectsForClass(student.kelas, subjects, classSubjects),
    ),
  }));
  const complete = summaries.filter((s) => s.complete).length;
  const progress = summaries.reduce((sum, s) => sum + s.entered, 0);
  const expected = summaries.reduce((sum, s) => sum + s.expected, 0);
  const percentage = expected ? Math.round((progress / expected) * 100) : 0;
  const rankings = summaries
    .filter(
      (s) =>
        s.complete && (rankClass === 'all' || s.student.kelas === rankClass),
    )
    .sort(
      (a, b) =>
        b.average - a.average || a.student.nama.localeCompare(b.student.nama),
    )
    .slice(0, 5);
  const remedial = summaries.flatMap(({ student }) =>
    subjectsForClass(student.kelas, subjects, classSubjects)
      .filter(
        (sub) =>
          student.grades[sub.id] !== undefined &&
          student.grades[sub.id] < sub.kkm,
      )
      .map((subject) => ({ student, subject })),
  );
  const stats = [
    {
      label: 'Santri aktif',
      value: activeStudents.length,
      caption: 'Terdaftar di periode ini',
      icon: Users,
      tone: 'emerald',
    },
    {
      label: 'Kelas aktif',
      value: classes.length,
      caption: 'Ruang belajar santri',
      icon: School,
      tone: 'blue',
    },
    {
      label: 'Mata pelajaran',
      value: subjects.length,
      caption: 'Dalam kurikulum madrasah',
      icon: BookOpen,
      tone: 'amber',
    },
    {
      label: 'Rapor lengkap',
      value: complete,
      caption: `Dari ${activeStudents.length} santri aktif`,
      icon: CheckCircle2,
      tone: 'purple',
    },
  ];
  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RUANG AKADEMIK</span>
          <h1>Ringkasan akademik</h1>
          <p>Semua perkembangan santri, dalam satu pandangan.</p>
        </div>
        <div className="period-pill">
          <span className="status-dot" />
          {settings.tahunAjaran}
          <span className="period-separator" />
          Semester {settings.semester}
        </div>
      </div>
      <section className="welcome-panel">
        <div className="welcome-copy">
          <span className="welcome-kicker">
            ASSALAMUALAIKUM,{' '}
            {userName?.split(' ').slice(0, 2).join(' ') || 'BAPAK / IBU GURU'}
          </span>
          <h2>
            Langkah kecil hari ini.
            <br />
            <span>Masa depan yang berarti.</span>
          </h2>
          <p>
            Mari dampingi proses belajar santri dan catat setiap perkembangannya
            dengan sepenuh hati.
          </p>
          <div className="welcome-actions">
            <button
              className="button-white"
              onClick={() => onNavigate('bulk-grades')}
            >
              <PenLine size={16} /> Input nilai <ArrowRight size={16} />
            </button>
            <button
              className="welcome-link"
              onClick={() => onNavigate('santri')}
            >
              Lihat data santri <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        <div className="welcome-art" aria-hidden="true">
          <div className="arch arch-back" />
          <div className="arch arch-front">
            <GraduationCap size={66} strokeWidth={1} />
            <span>ADAB · ILMU · AMAL</span>
            <div className="arch-lines">
              <i />
              <i />
              <i />
            </div>
          </div>
          <span className="art-star star-one">✦</span>
          <span className="art-star star-two">✧</span>
        </div>
      </section>
      {settings.nilaiRaportSelesai && (
        <div className="notice-banner">
          <LockKeyhole size={19} />
          <p>
            <strong>Pengisian nilai telah ditutup.</strong> Rapor tetap dapat
            dilihat dan dicetak.
            {userRole === 'admin' && ' Buka kembali melalui pengaturan rapor.'}
          </p>
        </div>
      )}
      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className="stat-card-top">
              <span>{stat.label}</span>
              <div className={`stat-icon ${stat.tone}`}>
                <stat.icon size={19} />
              </div>
            </div>
            <strong className="stat-value">
              {stat.value.toLocaleString('id-ID')}
            </strong>
            <p>{stat.caption}</p>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="panel progress-panel">
          <div className="panel-heading">
            <div>
              <h2>Progres pengisian nilai</h2>
              <p>Pantau kesiapan rapor setiap kelas</p>
            </div>
            <span className="soft-badge">{percentage}% terisi</span>
          </div>
          <div className="progress-overview">
            <div>
              <strong>{progress.toLocaleString('id-ID')}</strong>
              <span> / {expected.toLocaleString('id-ID')} nilai terisi</span>
            </div>
            <div className="progress-track">
              <div style={{ width: `${percentage}%` }} />
            </div>
          </div>
          {classes.length === 0 ? (
            <div className="empty-state">
              <School size={30} />
              <h3>Belum ada santri di periode ini</h3>
              <p>Tambahkan data santri untuk mulai memantau nilai.</p>
              <button
                className="text-action"
                onClick={() => onNavigate('add-student')}
              >
                Tambah santri <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <div className="class-progress-list">
              {classes.map((kelas, index) => {
                const rows = summaries.filter((s) => s.student.kelas === kelas);
                const total = rows.reduce((sum, s) => sum + s.expected, 0);
                const filled = rows.reduce((sum, s) => sum + s.entered, 0);
                const pct = total ? Math.round((filled / total) * 100) : 0;
                return (
                  <div className="class-progress-row" key={kelas}>
                    <span className="class-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="class-progress-info">
                      <strong>{kelas}</strong>
                      <span>
                        {rows.length} santri · {filled}/{total} nilai
                      </span>
                    </div>
                    <div className="class-progress-meter">
                      <div className="progress-track">
                        <div style={{ width: `${pct}%` }} />
                      </div>
                      <span>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <button
            className="panel-footer-link"
            onClick={() => onNavigate('kelas')}
          >
            Lihat semua kelas <ArrowRight size={15} />
          </button>
        </section>
        <div className="dashboard-side">
          <section className="panel quick-panel">
            <div className="panel-heading">
              <div>
                <h2>Akses cepat</h2>
                <p>Mulai dari yang Anda butuhkan</p>
              </div>
            </div>
            {[
              {
                label: 'Tambah santri',
                desc: 'Daftarkan santri baru',
                icon: Plus,
                tab: 'add-student',
              },
              {
                label: 'Input nilai kelas',
                desc: 'Isi nilai secara kolektif',
                icon: PenLine,
                tab: 'bulk-grades',
              },
              {
                label: 'Siapkan rapor',
                desc: 'Lihat, unduh, dan cetak',
                icon: FileText,
                tab: 'santri',
              },
            ].map((action) => (
              <button
                className="quick-action"
                key={action.tab}
                onClick={() => onNavigate(action.tab)}
              >
                <span className="quick-icon">
                  <action.icon size={19} />
                </span>
                <span>
                  <strong>{action.label}</strong>
                  <small>{action.desc}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </section>
          <section className="reminder-panel">
            <span className="reminder-icon">
              <BookOpen size={20} />
            </span>
            <h3>Catatan untuk hari ini</h3>
            <p>
              {remedial.length
                ? `Ada ${remedial.length} nilai di bawah KKM yang membutuhkan pendampingan.`
                : 'Luangkan waktu untuk memeriksa nilai dan catatan sebelum mencetak rapor santri.'}
            </p>
            <button onClick={() => onNavigate('santri')}>
              Periksa data santri <ArrowRight size={14} />
            </button>
          </section>
        </div>
      </div>
      <div className="dashboard-bottom">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Prestasi santri</h2>
              <p>Peringkat dari rapor dengan nilai lengkap</p>
            </div>
            <select
              aria-label="Filter peringkat kelas"
              className="compact-select"
              value={rankClass}
              onChange={(e) => setRankClass(e.target.value)}
            >
              <option value="all">Semua kelas</option>
              {classes.map((kelas) => (
                <option key={kelas}>{kelas}</option>
              ))}
            </select>
          </div>
          {rankings.length ? (
            <div className="ranking-list">
              {rankings.map((entry, index) => (
                <button
                  key={entry.student.id}
                  className="ranking-row"
                  onClick={() => onSelectStudent(entry.student.id)}
                >
                  <span
                    className={
                      index === 0 ? 'rank-number first' : 'rank-number'
                    }
                  >
                    {index === 0 ? <Trophy size={17} /> : index + 1}
                  </span>
                  <span className="ranking-name">
                    <strong>{entry.student.nama}</strong>
                    <small>{entry.student.kelas}</small>
                  </span>
                  <strong className="ranking-score">
                    {entry.average.toFixed(1)}
                  </strong>
                  <ChevronIcon />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <Trophy size={26} />
              <p>Peringkat tampil setelah nilai santri lengkap.</p>
            </div>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Aktivitas terbaru</h2>
              <p>Catatan kegiatan akademik</p>
            </div>
            <Clock3 size={18} className="text-slate-400" />
          </div>
          {logs.length ? (
            <div className="activity-list">
              {logs.slice(0, 4).map((log) => (
                <div className="activity-row" key={log.id}>
                  <span className="activity-dot" />
                  <div>
                    <p>{log.details}</p>
                    <small>
                      {log.user} ·{' '}
                      {new Date(log.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              <Clock3 size={26} />
              <p>Aktivitas akan tampil setelah Anda mulai bekerja.</p>
            </div>
          )}
          {userRole === 'admin' && (
            <button
              className="panel-footer-link"
              onClick={() => onNavigate('log')}
            >
              Semua aktivitas <ArrowRight size={15} />
            </button>
          )}
        </section>
      </div>
      {remedial.length > 0 && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Perlu pendampingan</h2>
              <p>Nilai di bawah KKM pada periode aktif</p>
            </div>
            <span className="soft-badge amber">{remedial.length} nilai</span>
          </div>
          <div className="overflow-x-auto">
            <table className="academic-table">
              <thead>
                <tr>
                  <th>Santri</th>
                  <th>Kelas</th>
                  <th>Pelajaran</th>
                  <th>Nilai / KKM</th>
                  <th>Rapor</th>
                </tr>
              </thead>
              <tbody>
                {remedial.slice(0, 10).map(({ student, subject }) => (
                  <tr key={student.id + '-' + subject.id}>
                    <td>{student.nama}</td>
                    <td>{student.kelas}</td>
                    <td>{subject.nameId}</td>
                    <td>
                      <strong>{student.grades[subject.id]}</strong> /{' '}
                      {subject.kkm}
                    </td>
                    <td>
                      <button
                        className="text-action"
                        onClick={() => onSelectStudent(student.id)}
                      >
                        Lihat <ArrowUpRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
function ChevronIcon() {
  return <ArrowUpRight size={15} className="text-slate-400" />;
}

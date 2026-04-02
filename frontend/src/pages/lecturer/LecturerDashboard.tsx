import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getSessions, getAttendance, getStudents } from '../../services/api';
import { ClassSession } from '../../types';
import { Student, AttendanceRecord } from '../../types';
import { Clock, Users, AlertCircle } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function LecturerDashboard() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [ongoingSession, setOngoingSession] = useState<ClassSession | null>(null);
  const [todayAttendance, setTodayAttendance] = useState(0);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');
  const navigate = useNavigate();
  // loadData moved out so it can be retried from UI so it can be retried from UI
  const loadData = async () => {
    setError(null);
    setLoading(true);
    try {
      const [sessionsData, attendanceData, studentsData] = await Promise.all([
        getSessions(),
        getAttendance(),
        getStudents(),
      ]);

      setSessions(sessionsData);
      setAttendanceRecords(attendanceData || []);
      setStudentsMap(Object.fromEntries((studentsData || []).map((s) => [s.id, s])));

      // Get ongoing session
      const ongoing = (sessionsData || []).find((s) => s.status === 'ongoing');
      setOngoingSession(ongoing || null);

      // Count today's attendance
      const today = new Date().toDateString();
      const todayRecords = (attendanceData || []).filter(
        (a) => new Date(a.timestamp).toDateString() === today
      );
      setTodayAttendance(todayRecords.length);
    } catch (err: any) {
      console.error('Failed to load lecturer dashboard data:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // fetchAttendance is a reusable helper to refresh attendance records
  const fetchAttendance = async () => {
    try {
      const data = await getAttendance();
      setAttendanceRecords(data || []);
    } catch (e) {
      console.error('Failed to fetch attendance:', e);
      setError('Failed to fetch attendance');
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch attendance once when there is an ongoing session (no automatic polling)
  useEffect(() => {
    if (ongoingSession) {
      fetchAttendance();
    }
  }, [ongoingSession]);

  const sidebarLinks = [
    { label: t('common.dashboard'), href: '/lecturer/dashboard' },
    { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
    { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
    { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
  ];

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto px-2">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary rounded-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('pages.lecturerDashboard')}</h1>
                <p className="text-sm text-gray-600 mt-1">{t('pages.overviewOfSessions')}</p>
              </div>
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <div className="flex items-center justify-between">
              <div>{error}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setLoading(true); setError(null); (async () => { try { const a = await getAttendance(); setAttendanceRecords(a); } catch (e) { console.error(e); } finally { setLoading(false); } })(); }}
                  className="px-3 py-1 bg-primary text-white rounded-lg text-sm"
                >
                  {t('buttons.reloadAttendance')}
                </button>
                <button onClick={() => { setLoading(true); setError(null); loadData(); }} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                  {t('buttons.retry')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title={t('pages.todayAttendance')} value={todayAttendance} icon={Users} tone="blue" />
          <StatCard title={t('pages.totalSessions')} value={sessions.length} icon={Clock} tone="purple" />
          <StatCard title={t('pages.ongoingSessions')} value={ongoingSession ? 1 : 0} icon={AlertCircle} tone="green" />
        </div>

        {/* Current Session */}
        {ongoingSession && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-700" />
              {t('pages.currentSession')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">{t('sessions.sessionName')}</p>
                <p className="text-lg font-semibold text-gray-900">{ongoingSession.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('sessions.location')}</p>
                <p className="text-lg font-semibold text-gray-900">{ongoingSession.location}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('attendance.attendance')}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {ongoingSession.attendance_count}/{ongoingSession.total_students}
                </p>
              </div>
              <div className="flex items-center md:justify-end">
                <div className="flex gap-2">
                  <button onClick={() => fetchAttendance()} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                    {t('buttons.reloadAttendance')}
                  </button>
                  <button
                    onClick={() => navigate('/lecturer/attendance', { state: { sessionId: ongoingSession.id } })}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    {t('buttons.viewDetails')}
                  </button>
                </div>
              </div>
            </div>
            {/* Attendees panel with real-time table and filters */}
            <div className="mt-6 border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Attendees</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Filter:</span>
                  {(['all', 'present', 'late', 'absent'] as const).map((f) => {
                    const count = attendanceRecords.filter((r) => r.session_id === ongoingSession.id && (f === 'all' ? true : r.status === f)).length;
                    return (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 rounded-lg text-sm ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500">
                      <th className="px-3 py-2">Student ID</th>
                      <th className="px-3 py-2">Time In</th>
                      <th className="px-3 py-2">Time Out</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords
                      .filter((r) => r.session_id === ongoingSession.id)
                      .filter((r) => (filter === 'all' ? true : r.status === filter))
                      .map((rec) => {
                        const student = studentsMap[rec.student_id];
                        const timeIn = rec.time_in || rec.timestamp || '-';
                        const timeOut = rec.time_out || '-';
                        const accuracy = rec.accuracy !== undefined && rec.accuracy !== null ? `${rec.accuracy}%` : '-';
                        return (
                          <tr key={rec.id} className="border-t">
                            <td className="px-3 py-3 font-medium text-gray-900">{student?.student_id || student?.name || student?.user?.email || rec.student_id}</td>
                            <td className="px-3 py-3 text-gray-600">{timeIn}</td>
                            <td className="px-3 py-3 text-gray-600">{timeOut}</td>
                            <td className="px-3 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs ${rec.status === 'present' ? 'bg-green-100 text-green-800' : rec.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                {t(`attendance.${rec.status}`)}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-gray-600">{accuracy}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Upcoming Sessions</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : sessions.filter((s) => s.status === 'upcoming').length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {sessions
                .filter((s) => s.status === 'upcoming')
                .slice(0, 8)
                .map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{session.name}</p>
                      <p className="text-sm text-gray-600 mt-1">{new Date(session.start_time).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate('/lecturer/attendance', { state: { sessionId: session.id } })}
                        className="text-primary hover:text-primary-dark font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  tone?: 'blue' | 'purple' | 'green';
}
function StatCard({ title, value, icon: Icon, tone }: StatCardProps) {
  const toneClasses: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${toneClasses[tone || 'blue']}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

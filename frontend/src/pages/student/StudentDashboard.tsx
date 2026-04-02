import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAttendance, getSessions, getAlerts, getStudents, getCourses, getGamificationMe } from '../../services/api';
import { ClassSession, Alert, Student, Course, AttendanceRecord } from '../../types';
import { CheckCircle, Clock, AlertCircle, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function StudentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    present: 0,
    late: 0,
    absent: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState<ClassSession[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsPoints, setRewardsPoints] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const all = await Promise.all([
          getAttendance(),
          getSessions(),
          getAlerts(),
          getStudents(),
          getCourses(),
          getGamificationMe().then((d) => { setRewardsPoints(d.points_balance); return d; }).catch(() => null),
        ]);
        const [attendance, sessions, alerts, studentsData, coursesData] = all;

        // Calculate attendance stats
        const stats = {
          present: attendance.filter((a) => a.status === 'present').length,
          late: attendance.filter((a) => a.status === 'late').length,
          absent: attendance.filter((a) => a.status === 'absent').length,
        };
        setStats(stats);

        // find student record for current user
        let currentStudent: Student | undefined;
        if (user) {
          currentStudent = studentsData.find((s: Student) => s.user_id === user.id || s.email === user.email);
        }
        if (currentStudent) {
          setStudent(currentStudent);
          const sRecords = attendance.filter((a) => a.student_id === currentStudent!.id);
          setStudentAttendance(sRecords);

          // generate low attendance alert per course
          const attendanceByCourse: Record<string, { present: number; total: number }> = {};
          for (const sess of sessions) {
            const courseId = sess.course_id;
            attendanceByCourse[courseId] = attendanceByCourse[courseId] || { present: 0, total: 0 };
            const rec = sRecords.find((r) => r.session_id === sess.id);
            attendanceByCourse[courseId].total += 1;
            if (rec && rec.status === 'present') attendanceByCourse[courseId].present += 1;
          }
          const lowThreshold = 0.75;
          const generatedAlerts: Alert[] = [];
          for (const [courseId, counts] of Object.entries(attendanceByCourse)) {
            const rate = counts.total > 0 ? counts.present / counts.total : 1;
            if (rate < lowThreshold) {
              const courseName = coursesData.find((c) => c.id === courseId)?.name || courseId;
              generatedAlerts.push({
                id: `low-${courseId}`,
                type: 'low_confidence',
                message: `Low attendance in ${courseName}: ${(rate * 100).toFixed(0)}%`,
                student_id: currentStudent.id,
                timestamp: new Date().toISOString(),
                severity: 'warning',
                read: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as Alert);
            }
          }
          setRecentAlerts([...generatedAlerts, ...alerts].slice(0, 5));
        } else {
          setRecentAlerts(alerts.slice(0, 5));
        }

        setCourses(coursesData);

        // Get upcoming sessions (real data from API)
        const upcomingSessionsData = sessions
          .filter((s) => s.status === 'upcoming')
          .slice(0, 5);
        setUpcomingSessions(upcomingSessionsData);
      } catch (err) {
        console.error('Failed to load student dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const sidebarLinks = [
    { label: t('navigation.studentDashboard'), href: '/student/dashboard' },
    { label: t('navigation.attendanceHistory'), href: '/student/history' },
    { label: t('navigation.studentSessions'), href: '/student/sessions' },
    { label: t('navigation.studentAlerts'), href: '/student/alerts' },
    { label: t('navigation.studentRewards') || 'Rewards', href: '/student/rewards' },
  ];

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('pages.studentDashboard')}</h1>

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title={t('attendance.present')}
            value={stats.present}
            icon={CheckCircle}
            color="bg-green-50 text-green-600"
          />
          <StatCard
            title={t('attendance.late')}
            value={stats.late}
            icon={Clock}
            color="bg-yellow-50 text-yellow-600"
          />
          <StatCard
            title={t('attendance.absent')}
            value={stats.absent}
            icon={AlertCircle}
            color="bg-red-50 text-red-600"
          />
        </div>

        {/* Rewards teaser */}
        {rewardsPoints !== null && (
          <div className="mb-8 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Award className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('gamification.points') || 'Points'}: {rewardsPoints}</p>
                <p className="text-sm text-gray-600">{t('gamification.subtitle') || 'Earn badges and redeem rewards for attendance.'}</p>
              </div>
            </div>
            <Link
              to="/student/rewards"
              className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
            >
              {t('navigation.studentRewards') || 'Rewards'}
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              {t('pages.upcomingSessions')}
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : upcomingSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('pages.noUpcomingSessions')}</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {/* show sign-in/out for student if present */}
                    {student && (
                      <div className="text-xs text-gray-500 mb-1">{t('table.course')}: {courses.find(c=>c.id===session.course_id)?.name || session.course_id}</div>
                    )}
                    <p className="font-semibold text-gray-900">{session.name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(session.start_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">{session.location}</p>
                    {student && (
                      <div className="mt-2 text-sm text-gray-600">
                        {(() => {
                          const rec = studentAttendance.find(r => r.session_id === session.id);
                          if (!rec) return <span className="text-gray-500">{t('messages.noData')}</span>;
                          const timeIn = rec.time_in || rec.timestamp || '-';
                          const timeOut = rec.time_out || '-';
                          const duration = timeIn && timeOut && timeIn !== '-' && timeOut !== '-' ?
                            Math.max(0, (new Date(timeOut).getTime() - new Date(timeIn).getTime()) / 60000) :
                            session.end_time ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000 : null;
                          const accuracyPercent = rec.accuracy != null
                            ? Math.min(100, rec.accuracy <= 1 ? Math.round(rec.accuracy * 100) : Math.round(rec.accuracy))
                            : null;
                          return (
                            <div className="space-y-1">
                              <div>{t('attendance.timeIn')}: {timeIn !== '-' ? new Date(timeIn).toLocaleString() : '-'}</div>
                              <div>{t('attendance.timeOut')}: {timeOut !== '-' ? new Date(timeOut).toLocaleString() : '-'}</div>
                              <div>{t('pages.sessionDuration', 'Duration')}: {duration != null ? `${Math.round(duration)} min` : '-'}</div>
                              <div>{t('attendance.accuracy')}: {accuracyPercent != null ? `${accuracyPercent}%` : '-'}</div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              {t('pages.myAlerts')}
            </h2>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : recentAlerts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">{t('pages.noAlertsAvailable')}</p>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border ${
                      alert.severity === 'error'
                        ? 'bg-red-50 border-red-200'
                        : alert.severity === 'warning'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 capitalize">
                      {alert.type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: any;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

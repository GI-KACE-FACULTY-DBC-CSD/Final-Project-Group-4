import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getSessions } from '../../services/api';
import { ClassSession } from '../../types';
import { Clock } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function StudentSessions() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (err) {
        console.error('Failed to load sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  const sidebarLinks = [
    { label: t('navigation.studentDashboard'), href: '/student/dashboard' },
    { label: t('navigation.attendanceHistory'), href: '/student/history' },
    { label: t('navigation.studentSessions'), href: '/student/sessions' },
    { label: t('navigation.studentAlerts'), href: '/student/alerts' },
    { label: t('navigation.studentRewards') || 'Rewards', href: '/student/rewards' },
  ];

  const upcoming = sessions.filter((s) => s.status === 'upcoming');
  const ongoing = sessions.filter((s) => s.status === 'ongoing');
  const completed = sessions.filter((s) => s.status === 'completed');

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Clock className="w-8 h-8 text-blue-600" />
          {t('navigation.studentSessions')}
        </h1>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {!loading && sessions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>{t('pages.noSessionsAvailable')}</p>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <>
            {/* Ongoing Sessions */}
            {ongoing.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.ongoingSessions')}</h2>
                <div className="space-y-4">
                  {ongoing.map((session) => (
                    <SessionCard key={session.id} session={session} status="ongoing" t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            {upcoming.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.upcomingSessions')}</h2>
                <div className="space-y-4">
                  {upcoming.map((session) => (
                    <SessionCard key={session.id} session={session} status="upcoming" t={t} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Sessions */}
            {completed.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{t('pages.completedSessions')}</h2>
                <div className="space-y-4">
                  {completed.map((session) => (
                    <SessionCard key={session.id} session={session} status="completed" t={t} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function SessionCard({
  session,
  status,
  t,
}: {
  session: ClassSession;
  status: 'upcoming' | 'ongoing' | 'completed';
  t: any;
}) {
  const bgColor =
    status === 'ongoing'
      ? 'bg-green-50 border-green-200'
      : status === 'upcoming'
      ? 'bg-blue-50 border-blue-200'
      : 'bg-gray-50 border-gray-200';

  const badgeColor =
    status === 'ongoing'
      ? 'bg-green-100 text-green-800'
      : status === 'upcoming'
      ? 'bg-blue-100 text-blue-800'
      : 'bg-gray-100 text-gray-800';

  return (
    <div className={`p-6 rounded-lg border ${bgColor}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{session.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{session.location}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${badgeColor}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">{t('pages.startTime')}</p>
          <p className="font-semibold text-gray-900">
            {new Date(session.start_time).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('pages.endTime')}</p>
          <p className="font-semibold text-gray-900">
            {new Date(session.end_time).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-600">{t('dashboard.attendance')}</p>
        <p className="font-semibold text-gray-900">
          {session.attendance_count}/{session.total_students}
        </p>
      </div>
    </div>
  );
}

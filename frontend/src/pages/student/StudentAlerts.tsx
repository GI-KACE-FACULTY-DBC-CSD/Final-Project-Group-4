import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAlerts } from '../../services/api';
import { Alert } from '../../types';
import { AlertCircle } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function StudentAlerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const data = await getAlerts();
        setAlerts(data);
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <AlertCircle className="w-8 h-8 text-orange-600" />
          {t('pages.myAlerts')}
        </h1>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>{t('pages.noAlertsAvailable')}</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 rounded-lg border ${
                  alert.severity === 'error'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 capitalize text-lg">
                        {alert.type.replace('_', ' ')}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          alert.severity === 'error'
                            ? 'bg-red-200 text-red-800'
                            : alert.severity === 'warning'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

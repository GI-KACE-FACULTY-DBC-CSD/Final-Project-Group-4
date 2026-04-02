import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAlerts, markAlertAsRead } from '../../services/api';
import { Alert } from '../../types';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function AdminAlerts() {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

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

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAlertAsRead(id);
      setAlerts(alerts.map((a) => (a.id === id ? { ...a, read: true } : a)));
    } catch (err) {
      console.error('Failed to mark alert as read:', err);
    }
  };

  const sidebarLinks = [
    { label: t('navigation.adminDashboard'), href: '/admin/dashboard' },
    { label: t('navigation.adminStudents'), href: '/admin/students' },
    { label: t('navigation.adminLecturers'), href: '/admin/lecturers' },
    { label: t('navigation.adminCourses'), href: '/admin/courses' },
    { label: t('navigation.adminSessions'), href: '/admin/sessions' },
    { label: t('navigation.adminBiometricEnrollment'), href: '/admin/enrollment' },
    { label: t('navigation.adminReports'), href: '/admin/reports' },
  ];

  const filteredAlerts = filter === 'unread' ? alerts.filter((a) => !a.read) : alerts;

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Alerts</h1>

          {/* Filter */}
          <div className="flex gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === 'unread'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Unread ({alerts.filter((a) => !a.read).length})
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No alerts to display</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 rounded-lg border ${
                  alert.severity === 'error'
                    ? 'bg-red-50 border-red-200'
                    : alert.severity === 'warning'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 capitalize">
                        {alert.type.replace('_', ' ')}
                      </h3>
                      {alert.severity === 'error' && (
                        <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded font-semibold">
                          Error
                        </span>
                      )}
                      {alert.severity === 'warning' && (
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded font-semibold">
                          Warning
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 mb-2">{alert.message}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {!alert.read && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="ml-4 flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-gold-dark transition-colors flex-shrink-0"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}

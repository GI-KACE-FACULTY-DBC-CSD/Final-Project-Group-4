import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAttendance } from '../../services/api';
import { AttendanceRecord } from '../../types';
import { Calendar } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function AttendanceHistory() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const data = await getAttendance();
        // Sort by timestamp descending
        setRecords(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (err) {
        console.error('Failed to load attendance records:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, []);

  const sidebarLinks = [
    { label: t('navigation.studentDashboard'), href: '/student/dashboard' },
    { label: t('navigation.attendanceHistory'), href: '/student/history' },
    { label: t('navigation.studentSessions'), href: '/student/sessions' },
    { label: t('navigation.studentAlerts'), href: '/student/alerts' },
    { label: t('navigation.studentRewards') || 'Rewards', href: '/student/rewards' },
  ];

  const filteredRecords =
    filter === 'all' ? records : records.filter((r) => r.status === filter);

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          Attendance History
        </h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {(['all', 'present', 'late', 'absent'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Records */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No attendance records found</p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const timeIn = record.timeIn || record.time_in;
              const timeOut = record.timeOut || record.time_out;
              const rawAccuracy = Number(record.accuracy);
              const accuracyPct = Math.min(100, Math.max(0, Number.isFinite(rawAccuracy) ? (rawAccuracy <= 1 ? Math.round(rawAccuracy * 100) : rawAccuracy) : 0));
              const sessionName = record.session?.name || null;
              return (
              <div
                key={record.id}
                className={`p-6 rounded-lg border ${
                  record.status === 'present'
                    ? 'bg-green-50 border-green-200'
                    : record.status === 'late'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {sessionName && (
                      <p className="text-lg font-bold text-gray-900 mb-1">{sessionName}</p>
                    )}
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-semibold text-gray-900 capitalize">
                        {record.status} at {new Date(record.timestamp).toLocaleDateString()}
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                          record.status === 'present'
                            ? 'bg-green-200 text-green-800'
                            : record.status === 'late'
                            ? 'bg-yellow-200 text-yellow-800'
                            : 'bg-red-200 text-red-800'
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Time In</p>
                        <p className="font-semibold text-gray-900">
                          {timeIn ? new Date(timeIn).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Time Out</p>
                        <p className="font-semibold text-gray-900">
                          {timeOut ? new Date(timeOut).toLocaleString() : '-'}
                        </p>
                      </div>
                    </div>
                    {(record.accuracy != null && record.accuracy !== undefined) && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-1">Recognition Accuracy</p>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-300 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                accuracyPct >= 90
                                  ? 'bg-green-600'
                                  : accuracyPct >= 70
                                  ? 'bg-blue-600'
                                  : 'bg-yellow-600'
                              }`}
                              role="progressbar"
                              aria-label={`Recognition accuracy: ${accuracyPct}%`}
                              aria-valuenow={Math.round(accuracyPct)}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              style={{ width: `${accuracyPct}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {accuracyPct}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}

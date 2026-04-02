import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAttendance } from '../../services/api';
import { AttendanceRecord } from '../../types';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function LecturerAttendance() {
  const { t } = useTranslation();
  const location = useLocation();
  const sessionIdFromState = (location.state as { sessionId?: string })?.sessionId;
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'present' | 'late' | 'absent'>('all');

  useEffect(() => {
    const loadRecords = async () => {
      try {
        const data = await getAttendance(undefined, undefined, sessionIdFromState);
        setRecords(data);
      } catch (err) {
        console.error('Failed to load attendance records:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [sessionIdFromState]);

  const sidebarLinks = [
    { label: t('common.dashboard'), href: '/lecturer/dashboard' },
    { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
    { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
    { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
  ];

  const filteredRecords =
    filter === 'all' ? records : records.filter((r) => r.status === filter);

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Attendance Records</h1>

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

        {/* Records Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No attendance records found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Student name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Student ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Time In
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Time Out
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Accuracy
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {record.student_name ?? record.student_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.studentId ?? record.student_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.time_in
                          ? new Date(record.time_in).toLocaleTimeString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.time_out
                          ? new Date(record.time_out).toLocaleTimeString()
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'late'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {record.accuracy != null
                          ? `${Math.min(100, Math.max(0, record.accuracy))}%`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

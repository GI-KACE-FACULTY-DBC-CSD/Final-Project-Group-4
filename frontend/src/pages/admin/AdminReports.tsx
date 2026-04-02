import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAttendanceReport } from '../../services/api';
import { BarChart3, Download } from 'lucide-react';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function AdminReports() {
  const { t } = useTranslation();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      const data = await getAttendanceReport();
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!reportData) return;
    const rows: string[] = [];
    rows.push('Attendance Report Summary');
    rows.push(`Total Records,${reportData.total_records ?? 0}`);
    rows.push(`Total Students,${reportData.total_students ?? 0}`);
    rows.push(`Average Attendance Rate (%),${reportData.average_rate ?? 0}`);
    rows.push('');
    rows.push('Session,Date,Present,Late,Absent');
    if (reportData.sessions && Array.isArray(reportData.sessions)) {
      for (const s of reportData.sessions) {
        const date = s.date ? new Date(s.date).toLocaleDateString() : '—';
        rows.push(`"${(s.name || '').replace(/"/g, '""')}",${date},${s.present ?? 0},${s.late ?? 0},${s.absent ?? 0}`);
      }
    }
    const csv = rows.join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
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

  return (
    <AppLayout sidebarLinks={sidebarLinks} backgroundImage={getRandomBackgroundImage()}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <button
            onClick={handleExport}
            disabled={loading || !reportData}
            className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Total Attendance Records</p>
                <p className="text-3xl font-bold text-gray-900">
                  {reportData?.total_records || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Average Attendance Rate</p>
                <p className="text-3xl font-bold text-secondary">
                  {reportData?.average_rate?.toFixed(1) || 0}%
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Total Students</p>
                <p className="text-3xl font-bold text-primary">
                  {reportData?.total_students || 0}
                </p>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Attendance Summary by Session
                </h2>
              </div>

              {reportData?.sessions && reportData.sessions.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Session
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Present
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Late
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Absent
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.sessions.map((session: any, idx: number) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{session.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {session.date ? new Date(session.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            {session.present || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                            {session.late || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                            {session.absent || 0}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">No data available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

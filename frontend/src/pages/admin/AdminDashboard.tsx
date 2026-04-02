import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { Users, BookOpen, Clock, AlertCircle, Activity, CheckCircle, BarChart3, Download, FileText, Share2 } from 'lucide-react';
import { getDashboardStats } from '../../services/api';
import { Alert } from '../../types';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    students: 0,
    lecturers: 0,
    sessions: 0,
    alerts: 0,
    totalAttendance: 0,
    attendanceRate: 0,
    ongoingSessions: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getDashboardStats();
        setStats(data.stats);
        setRecentAlerts(data.recentAlerts);
        setAttendanceTrend(data.attendanceTrend);
      } catch (err) {
        console.error('Failed to load admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const sidebarLinks = [
    { label: t('navigation.adminDashboard'), href: '/admin/dashboard' },
    { label: t('navigation.adminStudents'), href: '/admin/students' },
    { label: t('navigation.adminLecturers'), href: '/admin/lecturers' },
    { label: t('navigation.adminCourses'), href: '/admin/courses' },
    { label: t('navigation.adminSessions'), href: '/admin/sessions' },
    { label: t('navigation.adminBiometricEnrollment'), href: '/admin/enrollment' },
    { label: t('navigation.adminReports'), href: '/admin/reports' },
  ];

  if (loading) {
    return (
      <AppLayout
        sidebarLinks={sidebarLinks}
        backgroundImage={getRandomBackgroundImage()}
      >
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600">{t('messages.loadingDashboard')}</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      sidebarLinks={sidebarLinks}
      backgroundImage={getRandomBackgroundImage()}
    >
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-primary mb-2">{t('pages.adminDashboard')}</h1>
          <p className="text-black flex items-center gap-2">
            <span>{t('pages.welcomeBack')}</span>
          </p>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('dashboard.students')}
            value={stats.students}
            icon={Users}
            bgColor="bg-primary"
            trend={`+5 ${t('dashboard.thisMonth')}`}
          />
          <StatCard
            title={t('dashboard.lecturers')}
            value={stats.lecturers}
            icon={BookOpen}
            bgColor="bg-primary"
            trend={`+2 ${t('dashboard.thisMonth')}`}
          />
          <StatCard
            title={t('dashboard.sessions')}
            value={stats.sessions}
            icon={Clock}
            bgColor="bg-secondary"
            subtext={`${stats.ongoingSessions} ${t('dashboard.active')}`}
          />
          <StatCard
            title={t('dashboard.attendance')}
            value={`${stats.attendanceRate}%`}
            icon={CheckCircle}
            bgColor="bg-secondary"
            trend={stats.attendanceRate > 80 ? '+3%' : '-2%'}
          />
        </div>

        {/* Secondary Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sessions Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.sessionsOverview')}</h3>
              <div className="p-2 bg-primary rounded-lg">
                <Clock className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{t('dashboard.upcoming')}</span>
                <span className="text-2xl font-bold text-gray-900">{Math.max(0, stats.sessions - stats.ongoingSessions)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                <span className="text-sm text-gray-600">{t('dashboard.ongoing')}</span>
                <span className="text-2xl font-bold text-secondary">{stats.ongoingSessions}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-600 font-semibold">{t('dashboard.totalSessions')}</span>
                <span className="text-2xl font-bold text-primary">{stats.sessions}</span>
              </div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.attendance')}</h3>
              <div className="p-2 bg-primary rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">{t('dashboard.totalRecords')}</span>
                  <span className="font-semibold text-gray-900">{stats.totalAttendance}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full w-full"></div>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">{t('dashboard.averageRate')}</p>
                <p className="text-2xl font-bold text-primary">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.quickActions')}</h3>
              <div className="p-2 bg-secondary rounded-lg">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 p-3 rounded-lg text-left text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
                <Download className="w-4 h-4" />
                {t('dashboard.exportData')}
              </button>
              <button className="w-full flex items-center gap-2 p-3 rounded-lg text-left text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
                <FileText className="w-4 h-4" />
                {t('dashboard.viewReports')}
              </button>
              <button className="w-full flex items-center gap-2 p-3 rounded-lg text-left text-sm font-medium text-primary hover:bg-primary/5 transition-colors">
                <Share2 className="w-4 h-4" />
                {t('dashboard.shareDashboard')}
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('dashboard.sevenDayTrend')}</h3>
          {attendanceTrend.length > 0 && (
            <div className="space-y-4">
              {attendanceTrend.map((day, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{day.date}</span>
                    <span className="text-xs text-gray-500">{day.total} {t('dashboard.records')}</span>
                  </div>
                  <div className="flex h-6 bg-gray-100 rounded-full overflow-hidden">
                    {day.total > 0 ? (
                      <>
                        <div 
                          className="bg-primary h-full flex items-center justify-center text-xs text-white font-semibold flex-grow"
                          style={{flex: `${(day.present / day.total) * 100}`}}
                        >
                          {day.present > 0 && day.present}
                        </div>
                        <div 
                          className="bg-secondary h-full flex items-center justify-center text-xs text-white font-semibold flex-grow"
                          style={{flex: `${(day.late / day.total) * 100}`}}
                        >
                          {day.late > 0 && day.late}
                        </div>
                        <div 
                          className="bg-red-500 h-full flex items-center justify-center text-xs text-white font-semibold flex-grow"
                          style={{flex: `${(day.absent / day.total) * 100}`}}
                        >
                          {day.absent > 0 && day.absent}
                        </div>
                      </>
                    ) : (
                      <div className="w-full bg-gray-300 flex items-center justify-center text-xs text-gray-500">{t('dashboard.noData')}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-6 mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-sm text-gray-600">{t('dashboard.present')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <span className="text-sm text-gray-600">{t('dashboard.late')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{t('dashboard.absent')}</span>
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.recentAlerts')}</h3>
            <span className="text-sm font-medium text-primary cursor-pointer">{t('dashboard.viewAll')}</span>
          </div>
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.slice(0, 6).map((alert, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{alert.type.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500">{t('dashboard.noRecentAlerts')}</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  bgColor,
  trend,
  subtext,
}: {
  title: string;
  value: string | number;
  icon: any;
  bgColor: string;
  trend?: string;
  subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {trend && <p className="text-xs text-secondary font-semibold mt-2">{trend}</p>}
        {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
      </div>
    </div>
  );
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'error':
      return 'bg-red-100 text-red-600';
    case 'warning':
      return 'bg-yellow-100 text-yellow-600';
    case 'info':
    default:
      return 'bg-blue-100 text-primary';
  }
}

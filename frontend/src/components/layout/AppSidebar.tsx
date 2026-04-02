import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SidebarLink {
  label: string;
  href: string;
}

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  links: SidebarLink[];
}

export function AppSidebar({ isOpen, onClose, links }: AppSidebarProps) {
  const location = useLocation();
  const { t } = useTranslation();

  const labelMap: Record<string, string> = {
    Dashboard: 'navigation.adminDashboard',
    Users: 'navigation.adminUsers',
    Courses: 'navigation.adminCourses',
    Sessions: 'navigation.adminSessions',
    Reports: 'navigation.adminReports',
    Alerts: 'navigation.adminAlerts',
    Attendance: 'common.attendance',
    Settings: 'common.settings',
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 bg-slate-900 text-white
          fixed left-0 top-0 bottom-0 z-40
          md:relative
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold">Attendance</h2>
          <button
            onClick={onClose}
            className="md:hidden p-1 hover:bg-slate-800 rounded"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Takes all remaining space and scrolls if needed */}
        <nav className="flex-1 overflow-y-auto">
          <ul className="space-y-1 p-4">
            {links.map((link) => {
              const isActive = location.pathname === link.href;
              // Use dashboard label by route so lecturer/student see correct title, not "Admin Dashboard"
              let key = labelMap[link.label] || link.label;
              if (link.href === '/lecturer/dashboard') {
                key = 'navigation.lecturerDashboard';
              } else if (link.href === '/student/dashboard' || link.href === '/student') {
                key = 'navigation.studentDashboard';
              } else if (link.href !== '/admin/dashboard' && key === 'navigation.adminDashboard') {
                key = link.label;
              }
              const label = key.includes('.') ? t(key) : t(key) === key ? link.label : t(key);

              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={`
                      block w-full px-4 py-3 rounded-lg
                      transition-colors font-medium text-sm
                      ${
                        isActive
                          ? 'bg-secondary text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400 flex-shrink-0">
          <p>Attendance System v1.0</p>
        </div>
      </aside>
    </>
  );
}

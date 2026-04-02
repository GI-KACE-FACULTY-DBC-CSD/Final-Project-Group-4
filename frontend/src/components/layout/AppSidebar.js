import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
export function AppSidebar({ isOpen, onClose, links }) {
    const location = useLocation();
    const { t } = useTranslation();
    const labelMap = {
        Dashboard: 'navigation.adminDashboard',
        Users: 'navigation.adminUsers',
        Courses: 'navigation.adminCourses',
        Sessions: 'navigation.adminSessions',
        Reports: 'navigation.adminReports',
        Alerts: 'navigation.adminAlerts',
        Attendance: 'common.attendance',
        Settings: 'common.settings',
    };
    return (_jsxs(_Fragment, { children: [isOpen && (_jsx("div", { className: "fixed inset-0 bg-black/50 z-30 md:hidden", onClick: onClose })), _jsxs("aside", { className: `
          w-64 bg-slate-900 text-white
          fixed left-0 top-0 bottom-0 z-40
          md:relative
          transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `, children: [_jsxs("div", { className: "p-6 border-b border-slate-700 flex items-center justify-between flex-shrink-0", children: [_jsx("h2", { className: "text-xl font-bold", children: "Attendance" }), _jsx("button", { onClick: onClose, className: "md:hidden p-1 hover:bg-slate-800 rounded", "aria-label": "Close menu", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("nav", { className: "flex-1 overflow-y-auto", children: _jsx("ul", { className: "space-y-1 p-4", children: links.map((link) => {
                                const isActive = location.pathname === link.href;
                                const key = labelMap[link.label] || link.label;
                                const label = key.includes('.') ? t(key) : t(key) === key ? link.label : t(key);
                                return (_jsx("li", { children: _jsx(Link, { to: link.href, className: `
                      block w-full px-4 py-3 rounded-lg
                      transition-colors font-medium text-sm
                      ${isActive
                                            ? 'bg-secondary text-white'
                                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `, children: label }) }, link.href));
                            }) }) }), _jsx("div", { className: "p-4 border-t border-slate-700 text-xs text-slate-400 flex-shrink-0", children: _jsx("p", { children: "Attendance System v1.0" }) })] })] }));
}
//# sourceMappingURL=AppSidebar.js.map
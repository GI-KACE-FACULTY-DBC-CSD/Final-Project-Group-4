import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAlerts } from '../../services/api';
import { AlertCircle } from 'lucide-react';
export function StudentAlerts() {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const data = await getAlerts();
                setAlerts(data);
            }
            catch (err) {
                console.error('Failed to load alerts:', err);
            }
            finally {
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
    ];
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-8 h-8 text-orange-600" }), t('pages.myAlerts')] }), _jsx("div", { className: "space-y-4", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : alerts.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(AlertCircle, { className: "w-12 h-12 mx-auto mb-4 text-gray-400" }), _jsx("p", { children: t('pages.noAlertsAvailable') })] })) : (alerts.map((alert) => (_jsx("div", { className: `p-6 rounded-lg border ${alert.severity === 'error'
                            ? 'bg-red-50 border-red-200'
                            : alert.severity === 'warning'
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-blue-50 border-blue-200'}`, children: _jsx("div", { className: "flex items-start gap-4", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("h3", { className: "font-semibold text-gray-900 capitalize text-lg", children: alert.type.replace('_', ' ') }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-semibold capitalize ${alert.severity === 'error'
                                                    ? 'bg-red-200 text-red-800'
                                                    : alert.severity === 'warning'
                                                        ? 'bg-yellow-200 text-yellow-800'
                                                        : 'bg-blue-200 text-blue-800'}`, children: alert.severity })] }), _jsx("p", { className: "text-gray-700 mb-2", children: alert.message }), _jsx("p", { className: "text-sm text-gray-500", children: new Date(alert.timestamp).toLocaleString() })] }) }) }, alert.id)))) })] }) }));
}
//# sourceMappingURL=StudentAlerts.js.map
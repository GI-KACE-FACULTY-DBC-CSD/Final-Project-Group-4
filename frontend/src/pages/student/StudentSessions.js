import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getSessions } from '../../services/api';
import { Clock } from 'lucide-react';
export function StudentSessions() {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadSessions = async () => {
            try {
                const data = await getSessions();
                setSessions(data);
            }
            catch (err) {
                console.error('Failed to load sessions:', err);
            }
            finally {
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
    ];
    const upcoming = sessions.filter((s) => s.status === 'upcoming');
    const ongoing = sessions.filter((s) => s.status === 'ongoing');
    const completed = sessions.filter((s) => s.status === 'completed');
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2", children: [_jsx(Clock, { className: "w-8 h-8 text-blue-600" }), t('pages.ongoingSessions')] }), ongoing.length > 0 && (_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-4", children: t('pages.ongoingSessions') }), _jsx("div", { className: "space-y-4", children: ongoing.map((session) => (_jsx(SessionCard, { session: session, status: "ongoing", t: t }, session.id))) })] })), upcoming.length > 0 && (_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-4", children: t('pages.upcomingSessions') }), _jsx("div", { className: "space-y-4", children: upcoming.map((session) => (_jsx(SessionCard, { session: session, status: "upcoming", t: t }, session.id))) })] })), completed.length > 0 && (_jsxs("div", { className: "mb-8", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900 mb-4", children: t('pages.completedSessions') }), _jsx("div", { className: "space-y-4", children: completed.map((session) => (_jsx(SessionCard, { session: session, status: "completed", t: t }, session.id))) })] })), loading && (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })), !loading && sessions.length === 0 && (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(Clock, { className: "w-12 h-12 mx-auto mb-4 text-gray-400" }), _jsx("p", { children: t('pages.noSessionsAvailable') })] }))] }) }));
}
function SessionCard({ session, status, t, }) {
    const bgColor = status === 'ongoing'
        ? 'bg-green-50 border-green-200'
        : status === 'upcoming'
            ? 'bg-blue-50 border-blue-200'
            : 'bg-gray-50 border-gray-200';
    const badgeColor = status === 'ongoing'
        ? 'bg-green-100 text-green-800'
        : status === 'upcoming'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800';
    return (_jsxs("div", { className: `p-6 rounded-lg border ${bgColor}`, children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900", children: session.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: session.location })] }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold capitalize ${badgeColor}`, children: status })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: t('pages.startTime') }), _jsx("p", { className: "font-semibold text-gray-900", children: new Date(session.start_time).toLocaleString() })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: t('pages.endTime') }), _jsx("p", { className: "font-semibold text-gray-900", children: new Date(session.end_time).toLocaleString() })] })] }), _jsxs("div", { className: "mt-4 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: t('dashboard.attendance') }), _jsxs("p", { className: "font-semibold text-gray-900", children: [session.attendance_count, "/", session.total_students] })] }), status === 'ongoing' && (_jsx("button", { className: "bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: "Attend Now" }))] })] }));
}
//# sourceMappingURL=StudentSessions.js.map
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getSessions } from '../../services/api';
import { Plus, Eye } from 'lucide-react';
export function SessionManagement() {
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
        { label: t('common.dashboard'), href: '/lecturer/dashboard' },
        { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
        { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
        { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
    ];
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: t('pages.sessionManagement') }), _jsxs("button", { className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-5 h-5" }), t('buttons.createSession')] })] }), _jsx("div", { className: "bg-white rounded-lg shadow-md overflow-hidden", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : sessions.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-500", children: t('sessions.noSessionsFound') })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200 bg-gray-50", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('sessions.sessionName') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.time') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('sessions.location') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('sessions.status') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('attendance.attendance') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.actions') })] }) }), _jsx("tbody", { children: sessions.map((session) => (_jsxs("tr", { className: "border-b border-gray-200 hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: session.name }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: new Date(session.start_time).toLocaleString() }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: session.location }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-semibold ${session.status === 'ongoing'
                                                        ? 'bg-green-100 text-green-800'
                                                        : session.status === 'completed'
                                                            ? 'bg-gray-100 text-gray-800'
                                                            : 'bg-blue-100 text-blue-800'}`, children: session.status }) }), _jsxs("td", { className: "px-6 py-4 text-sm text-gray-600", children: [session.attendance_count, "/", session.total_students] }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsxs("button", { className: "flex items-center gap-1 text-blue-600 hover:text-blue-800", children: [_jsx(Eye, { className: "w-4 h-4" }), t('common.view')] }) })] }, session.id))) })] }) })) })] }) }));
}
//# sourceMappingURL=SessionManagement.js.map
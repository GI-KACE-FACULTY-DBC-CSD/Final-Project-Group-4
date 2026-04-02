import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getSessions, getAttendance, getStudents } from '../../services/api';
import { Clock, Users, AlertCircle } from 'lucide-react';
export function LecturerDashboard() {
    const { t } = useTranslation();
    const [sessions, setSessions] = useState([]);
    const [ongoingSession, setOngoingSession] = useState(null);
    const [todayAttendance, setTodayAttendance] = useState(0);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [studentsMap, setStudentsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all');
    const pollRef = useRef(null);
    // loadData moved out so it can be retried from UI
    const loadData = async () => {
        setError(null);
        setLoading(true);
        try {
            const [sessionsData, attendanceData, studentsData] = await Promise.all([
                getSessions(),
                getAttendance(),
                getStudents(),
            ]);
            setSessions(sessionsData);
            setAttendanceRecords(attendanceData || []);
            setStudentsMap(Object.fromEntries((studentsData || []).map((s) => [s.id, s])));
            // Get ongoing session
            const ongoing = (sessionsData || []).find((s) => s.status === 'ongoing');
            setOngoingSession(ongoing || null);
            // Count today's attendance
            const today = new Date().toDateString();
            const todayRecords = (attendanceData || []).filter((a) => new Date(a.timestamp).toDateString() === today);
            setTodayAttendance(todayRecords.length);
        }
        catch (err) {
            console.error('Failed to load lecturer dashboard data:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to load data');
        }
        finally {
            setLoading(false);
        }
    };
    // fetchAttendance is a reusable helper to refresh attendance records
    const fetchAttendance = async () => {
        try {
            const data = await getAttendance();
            setAttendanceRecords(data || []);
        }
        catch (e) {
            console.error('Failed to fetch attendance:', e);
            setError('Failed to fetch attendance');
        }
    };
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Poll attendance in real-time while there's an ongoing session
    useEffect(() => {
        if (!ongoingSession) {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
            return;
        }
        // initial fetch for the session
        fetchAttendance();
        // poll every 5 seconds
        const id = window.setInterval(fetchAttendance, 5000);
        pollRef.current = id;
        return () => {
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, [ongoingSession]);
    const sidebarLinks = [
        { label: t('common.dashboard'), href: '/lecturer/dashboard' },
        { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
        { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
        { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
    ];
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto px-2", children: [_jsx("div", { className: "mb-8", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("div", { className: "p-3 bg-primary rounded-lg", children: _jsx(Clock, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: t('pages.lecturerDashboard') }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: t('pages.overviewOfSessions') })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { className: "px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all font-semibold", children: t('buttons.createSession') }), _jsx("button", { className: "px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-all", children: t('buttons.manageSessions') })] })] }) }), error && (_jsx("div", { className: "mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { children: error }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => { setLoading(true); setError(null); (async () => { try {
                                            const a = await getAttendance();
                                            setAttendanceRecords(a);
                                        }
                                        catch (e) {
                                            console.error(e);
                                        }
                                        finally {
                                            setLoading(false);
                                        } })(); }, className: "px-3 py-1 bg-primary text-white rounded-lg text-sm", children: t('buttons.reloadAttendance') }), _jsx("button", { onClick: () => { setLoading(true); setError(null); loadData(); }, className: "px-3 py-1 bg-gray-100 rounded-lg text-sm", children: t('buttons.retry') })] })] }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx(StatCard, { title: t('pages.todayAttendance'), value: todayAttendance, icon: Users, tone: "blue" }), _jsx(StatCard, { title: t('pages.totalSessions'), value: sessions.length, icon: Clock, tone: "purple" }), _jsx(StatCard, { title: t('pages.ongoingSessions'), value: ongoingSession ? 1 : 0, icon: AlertCircle, tone: "green" })] }), ongoingSession && (_jsxs("div", { className: "bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8", children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900 mb-3 flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5 text-gray-700" }), t('pages.currentSession')] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: t('sessions.sessionName') }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: ongoingSession.name })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: t('sessions.location') }), _jsx("p", { className: "text-lg font-semibold text-gray-900", children: ongoingSession.location })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: t('attendance.attendance') }), _jsxs("p", { className: "text-lg font-semibold text-gray-900", children: [ongoingSession.attendance_count, "/", ongoingSession.total_students] })] }), _jsx("div", { className: "flex items-center md:justify-end", children: _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => fetchAttendance(), className: "px-3 py-1 bg-gray-100 rounded-lg text-sm", children: t('buttons.reloadAttendance') }), _jsx("button", { className: "bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors", children: t('buttons.viewDetails') })] }) })] }), _jsxs("div", { className: "mt-6 border-t pt-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold text-gray-900", children: "Attendees" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-gray-500", children: "Filter:" }), ['all', 'present', 'late', 'absent'].map((f) => {
                                                    const count = attendanceRecords.filter((r) => r.session_id === ongoingSession.id && (f === 'all' ? true : r.status === f)).length;
                                                    return (_jsxs("button", { onClick: () => setFilter(f), className: `px-3 py-1 rounded-lg text-sm ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`, children: [f.charAt(0).toUpperCase() + f.slice(1), " (", count, ")"] }, f));
                                                })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-xs text-gray-500", children: [_jsx("th", { className: "px-3 py-2", children: "Student ID" }), _jsx("th", { className: "px-3 py-2", children: "Time In" }), _jsx("th", { className: "px-3 py-2", children: "Time Out" }), _jsx("th", { className: "px-3 py-2", children: "Status" }), _jsx("th", { className: "px-3 py-2", children: "Accuracy" })] }) }), _jsx("tbody", { children: attendanceRecords
                                                    .filter((r) => r.session_id === ongoingSession.id)
                                                    .filter((r) => (filter === 'all' ? true : r.status === filter))
                                                    .map((rec) => {
                                                    const student = studentsMap[rec.student_id];
                                                    const timeIn = rec.time_in || rec.timestamp || '-';
                                                    const timeOut = rec.time_out || '-';
                                                    const accuracy = rec.accuracy !== undefined && rec.accuracy !== null ? `${rec.accuracy}%` : '-';
                                                    return (_jsxs("tr", { className: "border-t", children: [_jsx("td", { className: "px-3 py-3 font-medium text-gray-900", children: student?.student_id || student?.name || student?.user?.email || rec.student_id }), _jsx("td", { className: "px-3 py-3 text-gray-600", children: timeIn }), _jsx("td", { className: "px-3 py-3 text-gray-600", children: timeOut }), _jsx("td", { className: "px-3 py-3 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs ${rec.status === 'present' ? 'bg-green-100 text-green-800' : rec.status === 'late' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`, children: t(`attendance.${rec.status}`) }) }), _jsx("td", { className: "px-3 py-3 text-gray-600", children: accuracy })] }, rec.id));
                                                }) })] }) })] })] })), _jsxs("div", { className: "bg-white rounded-xl shadow-lg border border-gray-100 p-6", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900 mb-4", children: "Upcoming Sessions" }), loading ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" }) })) : sessions.filter((s) => s.status === 'upcoming').length === 0 ? (_jsx("p", { className: "text-gray-500 text-center py-8", children: "No upcoming sessions" })) : (_jsx("div", { className: "space-y-3", children: sessions
                                .filter((s) => s.status === 'upcoming')
                                .slice(0, 8)
                                .map((session) => (_jsxs("div", { className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-gray-900", children: session.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: new Date(session.start_time).toLocaleString() })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => fetchAttendance(), className: "px-3 py-1 bg-gray-100 rounded-lg text-sm", children: "Reload Attendance" }), _jsx("button", { className: "text-primary hover:text-primary-dark", children: "View" })] })] }, session.id))) }))] })] }) }));
}
function StatCard({ title, value, icon: Icon, tone }) {
    const toneClasses = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
    };
    return (_jsxs("div", { className: "bg-white rounded-xl shadow-lg border border-gray-100 p-6", children: [_jsx("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${toneClasses[tone || 'blue']}`, children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsx("p", { className: "text-gray-600 text-sm font-medium mb-1", children: title }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: value })] }));
}
//# sourceMappingURL=LecturerDashboard.js.map
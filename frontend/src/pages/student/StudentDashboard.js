import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAttendance, getSessions, getAlerts, getStudents, getCourses, getStudentReport, changeUserPassword } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
export function StudentDashboard() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [stats, setStats] = useState({
        present: 0,
        late: 0,
        absent: 0,
    });
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [recentAlerts, setRecentAlerts] = useState([]);
    const [student, setStudent] = useState(null);
    const [courses, setCourses] = useState([]);
    const [studentAttendance, setStudentAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const { success: toastSuccess, error: toastError } = useToast();
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);
    useEffect(() => {
        const loadData = async () => {
            try {
                const [attendance, sessions, alerts, studentsData, coursesData] = await Promise.all([
                    getAttendance(),
                    getSessions(),
                    getAlerts(),
                    getStudents(),
                    getCourses(),
                ]);
                // Calculate attendance stats
                const stats = {
                    present: attendance.filter((a) => a.status === 'present').length,
                    late: attendance.filter((a) => a.status === 'late').length,
                    absent: attendance.filter((a) => a.status === 'absent').length,
                };
                setStats(stats);
                // find student record for current user
                let currentStudent;
                if (user) {
                    currentStudent = studentsData.find((s) => s.user_id === user.id || s.email === user.email);
                }
                if (currentStudent) {
                    setStudent(currentStudent);
                    const sRecords = attendance.filter((a) => a.student_id === currentStudent.id);
                    setStudentAttendance(sRecords);
                    // generate low attendance alert per course
                    const attendanceByCourse = {};
                    for (const sess of sessions) {
                        const courseId = sess.course_id;
                        attendanceByCourse[courseId] = attendanceByCourse[courseId] || { present: 0, total: 0 };
                        const rec = sRecords.find((r) => r.session_id === sess.id);
                        attendanceByCourse[courseId].total += 1;
                        if (rec && rec.status === 'present')
                            attendanceByCourse[courseId].present += 1;
                    }
                    const lowThreshold = 0.75;
                    const generatedAlerts = [];
                    for (const [courseId, counts] of Object.entries(attendanceByCourse)) {
                        const rate = counts.total > 0 ? counts.present / counts.total : 1;
                        if (rate < lowThreshold) {
                            generatedAlerts.push({
                                id: `low-${courseId}`,
                                type: 'low_confidence',
                                message: `Low attendance in course ${courseId}: ${(rate * 100).toFixed(0)}%`,
                                student_id: currentStudent.id,
                                timestamp: new Date().toISOString(),
                                severity: 'warning',
                                read: false,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            });
                        }
                    }
                    setRecentAlerts([...generatedAlerts, ...alerts].slice(0, 5));
                }
                else {
                    setRecentAlerts(alerts.slice(0, 5));
                }
                setCourses(coursesData);
                // Get upcoming sessions
                const upcomingSessionsData = sessions
                    .filter((s) => s.status === 'upcoming')
                    .slice(0, 5);
                setUpcomingSessions(upcomingSessionsData);
                // Get recent alerts
                const recentAlertsData = alerts.slice(0, 5);
                setRecentAlerts(recentAlertsData);
            }
            catch (err) {
                console.error('Failed to load student dashboard data:', err);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    const sidebarLinks = [
        { label: t('navigation.studentDashboard'), href: '/student/dashboard' },
        { label: t('navigation.attendanceHistory'), href: '/student/history' },
        { label: t('navigation.studentSessions'), href: '/student/sessions' },
        { label: t('navigation.studentAlerts'), href: '/student/alerts' },
    ];
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-8", children: t('pages.studentDashboard') }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: [_jsx(StatCard, { title: t('attendance.present'), value: stats.present, icon: CheckCircle, color: "bg-green-50 text-green-600" }), _jsx(StatCard, { title: t('attendance.late'), value: stats.late, icon: Clock, color: "bg-yellow-50 text-yellow-600" }), _jsx(StatCard, { title: t('attendance.absent'), value: stats.absent, icon: AlertCircle, color: "bg-red-50 text-red-600" })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-600" }), t('pages.upcomingSessions')] }), loading ? (_jsx("div", { className: "text-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" }) })) : upcomingSessions.length === 0 ? (_jsx("p", { className: "text-gray-500 text-center py-8", children: t('pages.noUpcomingSessions') })) : (_jsx("div", { className: "space-y-3", children: upcomingSessions.map((session) => (_jsxs("div", { className: "p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors", children: [student && (_jsxs("div", { className: "text-xs text-gray-500 mb-1", children: [t('table.course'), ": ", courses.find(c => c.id === session.course_id)?.name || session.course_id] })), _jsx("p", { className: "font-semibold text-gray-900", children: session.name }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: new Date(session.start_time).toLocaleString() }), _jsx("p", { className: "text-sm text-gray-600", children: session.location }), student && (_jsx("div", { className: "mt-2 text-sm text-gray-600", children: (() => {
                                                    const rec = studentAttendance.find(r => r.session_id === session.id);
                                                    if (!rec)
                                                        return _jsx("span", { className: "text-gray-500", children: t('messages.noData') });
                                                    const timeIn = rec.time_in || rec.timestamp || '-';
                                                    const timeOut = rec.time_out || '-';
                                                    const duration = timeIn && timeOut && timeIn !== '-' && timeOut !== '-' ?
                                                        Math.max(0, (new Date(timeOut).getTime() - new Date(timeIn).getTime()) / 60000) :
                                                        session.end_time ? (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000 : null;
                                                    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { children: [t('attendance.timeIn'), ": ", timeIn !== '-' ? new Date(timeIn).toLocaleString() : '-'] }), _jsxs("div", { children: [t('attendance.timeOut'), ": ", timeOut !== '-' ? new Date(timeOut).toLocaleString() : '-'] }), _jsxs("div", { children: [t('pages.sessionDuration'), ": ", duration ? `${Math.round(duration)} min` : '-'] }), _jsxs("div", { children: [t('attendance.accuracy'), ": ", rec.accuracy ? `${Math.round(rec.accuracy * 100)}%` : '-'] })] }));
                                                })() }))] }, session.id))) }))] }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsxs("h2", { className: "text-lg font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx(AlertCircle, { className: "w-5 h-5 text-red-600" }), t('pages.myAlerts')] }), loading ? (_jsx("div", { className: "text-center py-8", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" }) })) : recentAlerts.length === 0 ? (_jsx("p", { className: "text-gray-500 text-center py-8", children: t('pages.noAlertsAvailable') })) : (_jsx("div", { className: "space-y-3", children: recentAlerts.map((alert) => (_jsxs("div", { className: `p-4 rounded-lg border ${alert.severity === 'error'
                                            ? 'bg-red-50 border-red-200'
                                            : alert.severity === 'warning'
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-blue-50 border-blue-200'}`, children: [_jsx("p", { className: "font-semibold text-gray-900 capitalize", children: alert.type.replace('_', ' ') }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: alert.message }), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: new Date(alert.timestamp).toLocaleString() })] }, alert.id))) }))] })] }), _jsxs("div", { className: "mt-8 bg-white rounded-lg shadow-md p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900", children: t('reports.attendanceReport') }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("button", { className: "px-4 py-2 bg-secondary text-white rounded-lg hover:bg-gold-dark", onClick: async () => {
                                            if (!student)
                                                return;
                                            try {
                                                const data = await getStudentReport(student.id);
                                                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `attendance_report_${student.id}.json`;
                                                document.body.appendChild(a);
                                                a.click();
                                                a.remove();
                                                URL.revokeObjectURL(url);
                                            }
                                            catch (e) {
                                                console.error(e);
                                            }
                                        }, children: "Download Report" }) })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200 bg-gray-50", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.course') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.attendance') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.actions') })] }) }), _jsx("tbody", { children: courses.map((course) => {
                                            // compute rate from studentAttendance and global sessions
                                            const courseSessions = []; // placeholder: better computation requires all sessions
                                            const totalSessions = courseSessions.length || 0;
                                            const present = studentAttendance.filter((r) => {
                                                const sess = courseSessions.find(s => s.id === r.session_id);
                                                return sess?.course_id === course.id && r.status === 'present';
                                            }).length;
                                            const rate = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 100;
                                            return (_jsxs("tr", { className: "border-b border-gray-200 hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-sm text-gray-900", children: course.name }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsxs("span", { className: "px-2 py-1 bg-blue-50 text-blue-800 rounded", children: [rate, "%"] }) }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("button", { className: "text-blue-600 hover:text-blue-800", children: t('buttons.view') }) })] }, course.id));
                                        }) })] }) })] }), _jsxs("div", { className: "mt-8 bg-white rounded-lg shadow-md p-6", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900 mb-4", children: t('auth.resetPassword') }), student && student.user?.password === '00000' && (_jsx("p", { className: "text-sm text-yellow-700 mb-4", children: t('messages.initialPasswordNotice') || 'Your initial password is 00000 — please change it now.' })), _jsxs("form", { onSubmit: async (e) => {
                                e.preventDefault();
                                if (!newPassword || newPassword.length < 5) {
                                    toastError('Password must be at least 5 characters');
                                    return;
                                }
                                if (newPassword !== newPasswordConfirm) {
                                    toastError('Passwords do not match');
                                    return;
                                }
                                setChangingPassword(true);
                                try {
                                    await changeUserPassword(undefined, newPassword);
                                    toastSuccess('Password changed successfully');
                                    setNewPassword('');
                                    setNewPasswordConfirm('');
                                    // Update stored user in localStorage if present
                                    try {
                                        const stored = localStorage.getItem('auth_user');
                                        if (stored) {
                                            const obj = JSON.parse(stored);
                                            obj.password = newPassword;
                                            localStorage.setItem('auth_user', JSON.stringify(obj));
                                        }
                                    }
                                    catch (e) {
                                        // ignore
                                    }
                                }
                                catch (err) {
                                    console.error(err);
                                    toastError('Failed to change password');
                                }
                                finally {
                                    setChangingPassword(false);
                                }
                            }, className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "newPassword", className: "block text-sm font-medium text-gray-700 mb-1", children: t('auth.newPassword') }), _jsx("input", { id: "newPassword", type: "password", placeholder: "Enter new password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 mb-1", children: t('auth.confirmPassword') }), _jsx("input", { id: "confirmPassword", type: "password", placeholder: "Confirm password", value: newPasswordConfirm, onChange: (e) => setNewPasswordConfirm(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md" })] }), _jsx("div", { className: "md:col-span-2", children: _jsx("button", { disabled: changingPassword, className: "bg-primary text-white px-4 py-2 rounded-md", children: changingPassword ? t('buttons.saving') : t('buttons.saveChanges') }) })] })] })] }) }));
}
function StatCard({ title, value, icon: Icon, color }) {
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6", children: [_jsx("div", { className: `w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${color}`, children: _jsx(Icon, { className: "w-6 h-6" }) }), _jsx("p", { className: "text-gray-600 text-sm font-medium mb-1", children: title }), _jsx("p", { className: "text-3xl font-bold text-gray-900", children: value })] }));
}
//# sourceMappingURL=StudentDashboard.js.map
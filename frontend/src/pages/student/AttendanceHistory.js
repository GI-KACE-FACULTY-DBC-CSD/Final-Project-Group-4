import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAttendance } from '../../services/api';
import { Calendar } from 'lucide-react';
export function AttendanceHistory() {
    const { t } = useTranslation();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const data = await getAttendance();
                // Sort by timestamp descending
                setRecords(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            }
            catch (err) {
                console.error('Failed to load attendance records:', err);
            }
            finally {
                setLoading(false);
            }
        };
        loadRecords();
    }, []);
    const sidebarLinks = [
        { label: t('navigation.studentDashboard'), href: '/student/dashboard' },
        { label: t('navigation.attendanceHistory'), href: '/student/history' },
        { label: t('navigation.studentSessions'), href: '/student/sessions' },
        { label: t('navigation.studentAlerts'), href: '/student/alerts' },
    ];
    const filteredRecords = filter === 'all' ? records : records.filter((r) => r.status === filter);
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2", children: [_jsx(Calendar, { className: "w-8 h-8 text-blue-600" }), "Attendance History"] }), _jsx("div", { className: "flex flex-wrap gap-3 mb-6", children: ['all', 'present', 'late', 'absent'].map((status) => (_jsx("button", { onClick: () => setFilter(status), className: `px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${filter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: status }, status))) }), _jsx("div", { className: "space-y-4", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : filteredRecords.length === 0 ? (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(Calendar, { className: "w-12 h-12 mx-auto mb-4 text-gray-400" }), _jsx("p", { children: "No attendance records found" })] })) : (filteredRecords.map((record) => (_jsx("div", { className: `p-6 rounded-lg border ${record.status === 'present'
                            ? 'bg-green-50 border-green-200'
                            : record.status === 'late'
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-red-50 border-red-200'}`, children: _jsx("div", { className: "flex items-start justify-between", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsxs("p", { className: "font-semibold text-gray-900 capitalize", children: [record.status, " at ", new Date(record.timestamp).toLocaleDateString()] }), _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-semibold capitalize ${record.status === 'present'
                                                    ? 'bg-green-200 text-green-800'
                                                    : record.status === 'late'
                                                        ? 'bg-yellow-200 text-yellow-800'
                                                        : 'bg-red-200 text-red-800'}`, children: record.status })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Time In" }), _jsx("p", { className: "font-semibold text-gray-900", children: record.time_in
                                                            ? new Date(record.time_in).toLocaleTimeString()
                                                            : '-' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-gray-600", children: "Time Out" }), _jsx("p", { className: "font-semibold text-gray-900", children: record.time_out
                                                            ? new Date(record.time_out).toLocaleTimeString()
                                                            : '-' })] })] }), record.accuracy && (_jsxs("div", { className: "mt-4", children: [_jsx("p", { className: "text-sm text-gray-600 mb-1", children: "Recognition Accuracy" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-32 bg-gray-300 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-300 ${record.accuracy * 100 >= 90
                                                                ? 'bg-green-600'
                                                                : record.accuracy * 100 >= 70
                                                                    ? 'bg-blue-600'
                                                                    : 'bg-yellow-600'}`, role: "progressbar", "aria-label": `Recognition accuracy: ${Math.round(record.accuracy * 100)}%`, "aria-valuenow": Math.round(record.accuracy * 100), "aria-valuemin": 0, "aria-valuemax": 100, style: { width: `${record.accuracy * 100}%` } }) }), _jsxs("span", { className: "text-sm font-semibold text-gray-700", children: [(record.accuracy * 100).toFixed(1), "%"] })] })] }))] }) }) }, record.id)))) })] }) }));
}
//# sourceMappingURL=AttendanceHistory.js.map
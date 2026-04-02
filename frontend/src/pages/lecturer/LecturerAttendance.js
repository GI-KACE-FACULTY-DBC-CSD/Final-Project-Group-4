import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getAttendance } from '../../services/api';
export function LecturerAttendance() {
    const { t } = useTranslation();
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    useEffect(() => {
        const loadRecords = async () => {
            try {
                const data = await getAttendance();
                setRecords(data);
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
        { label: t('common.dashboard'), href: '/lecturer/dashboard' },
        { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
        { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
        { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
    ];
    const filteredRecords = filter === 'all' ? records : records.filter((r) => r.status === filter);
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-8", children: "Attendance Records" }), _jsx("div", { className: "flex flex-wrap gap-3 mb-6", children: ['all', 'present', 'late', 'absent'].map((status) => (_jsx("button", { onClick: () => setFilter(status), className: `px-4 py-2 rounded-lg font-semibold transition-colors capitalize ${filter === status
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, children: status }, status))) }), _jsx("div", { className: "bg-white rounded-lg shadow-md overflow-hidden", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : filteredRecords.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-500", children: "No attendance records found" })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200 bg-gray-50", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Student ID" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Time In" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Time Out" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Accuracy" })] }) }), _jsx("tbody", { children: filteredRecords.map((record) => (_jsxs("tr", { className: "border-b border-gray-200 hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: record.student_id }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: record.time_in
                                                    ? new Date(record.time_in).toLocaleTimeString()
                                                    : '-' }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: record.time_out
                                                    ? new Date(record.time_out).toLocaleTimeString()
                                                    : '-' }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: `px-2 py-1 rounded-full text-xs font-semibold capitalize ${record.status === 'present'
                                                        ? 'bg-green-100 text-green-800'
                                                        : record.status === 'late'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'}`, children: record.status }) }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: record.accuracy ? `${(record.accuracy * 100).toFixed(1)}%` : '-' })] }, record.id))) })] }) })) })] }) }));
}
//# sourceMappingURL=LecturerAttendance.js.map
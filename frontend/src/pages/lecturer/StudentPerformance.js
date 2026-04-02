import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../../components/layout/AppLayout';
import { getStudents, getCourses } from '../../services/api';
import { TrendingUp } from 'lucide-react';
export function StudentPerformance() {
    const { t } = useTranslation();
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadData = async () => {
            try {
                const [studentsData, coursesData] = await Promise.all([
                    getStudents(),
                    getCourses(),
                ]);
                setStudents(studentsData);
                setCourses(coursesData || []);
            }
            catch (err) {
                console.error('Failed to load data:', err);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    const sidebarLinks = [
        { label: t('common.dashboard'), href: '/lecturer/dashboard' },
        { label: t('navigation.lecturerSessions'), href: '/lecturer/sessions' },
        { label: t('navigation.lecturerAttendance'), href: '/lecturer/attendance' },
        { label: t('navigation.lecturerPerformance'), href: '/lecturer/performance' },
    ];
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2", children: [_jsx(TrendingUp, { className: "w-8 h-8 text-blue-600" }), t('pages.studentPerformance')] }), _jsx("div", { className: "bg-white rounded-lg shadow-md overflow-hidden", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : students.length === 0 ? (_jsx("div", { className: "p-8 text-center text-gray-500", children: t('pages.noStudentsFound') })) : (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200 bg-gray-50", children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('attendance.studentId') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.course') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.biometricAccuracy') }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: t('table.status') })] }) }), _jsx("tbody", { children: students.map((student) => (_jsxs("tr", { className: "border-b border-gray-200 hover:bg-gray-50", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: student.student_id }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: courses.find(c => c.id === student.course_id)?.name || '—' }), _jsx("td", { className: "px-6 py-4 text-sm", children: student.accuracy ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-24 bg-gray-200 rounded-full h-2 overflow-hidden", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-300 ${student.accuracy * 100 >= 90
                                                                    ? 'bg-green-600'
                                                                    : student.accuracy * 100 >= 70
                                                                        ? 'bg-blue-600'
                                                                        : 'bg-yellow-600'}`, role: "progressbar", "aria-label": `Performance: ${Math.round(student.accuracy * 100)}%`, "aria-valuenow": Math.round(student.accuracy * 100), "aria-valuemin": 0, "aria-valuemax": 100, style: { width: `${student.accuracy * 100}%` } }) }), _jsxs("span", { className: "text-gray-600", children: [(student.accuracy * 100).toFixed(1), "%"] })] })) : (_jsx("span", { className: "text-gray-500", children: "-" })) }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("button", { className: "text-blue-600 hover:text-blue-800 font-semibold", children: t('buttons.viewReport') }) })] }, student.id))) })] }) })) })] }) }));
}
//# sourceMappingURL=StudentPerformance.js.map
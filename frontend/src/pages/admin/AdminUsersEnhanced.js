import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { getStudents, getLecturers } from '../../services/api';
import { Plus, Edit2, Trash2, Users } from 'lucide-react';
export function AdminUsers() {
    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: activeTab === 'students' ? 'student' : 'lecturer',
        department: '',
        year: '',
    });
    useEffect(() => {
        const loadData = async () => {
            try {
                const [studentsData, lecturersData] = await Promise.all([
                    getStudents(),
                    getLecturers(),
                ]);
                setStudents(studentsData);
                setLecturers(lecturersData);
            }
            catch (err) {
                console.error('Failed to load users:', err);
            }
            finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);
    const handleAddClick = () => {
        setIsEditing(false);
        setEditingId(null);
        setFormData({
            name: '',
            email: '',
            phone: '',
            role: activeTab === 'students' ? 'student' : 'lecturer',
            department: '',
            year: '',
        });
        setShowForm(true);
    };
    const handleEdit = (user) => {
        setIsEditing(true);
        setEditingId(user.id);
        setFormData({
            name: user.user?.name || '',
            email: user.user?.email || '',
            phone: user.user?.phone || '',
            role: activeTab === 'students' ? 'student' : 'lecturer',
            department: user.department || '',
            year: user.year || '',
        });
        setShowForm(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        // API call would go here
        if (isEditing) {
            console.log('Update user:', editingId, formData);
        }
        else {
            console.log('Create user:', formData);
        }
        setShowForm(false);
        setIsEditing(false);
        setEditingId(null);
    };
    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            // API call would go here
            console.log('Delete user:', id);
            if (activeTab === 'students') {
                setStudents(students.filter((s) => s.id !== id));
            }
            else {
                setLecturers(lecturers.filter((l) => l.id !== id));
            }
        }
    };
    const sidebarLinks = [
        { label: 'Dashboard', href: '/admin/dashboard' },
        { label: 'Users', href: '/admin/users' },
        { label: 'Courses', href: '/admin/courses' },
        { label: 'Sessions', href: '/admin/sessions' },
        { label: 'Documents', href: '/admin/documents' },
        { label: 'Import/Export', href: '/admin/import-export' },
        { label: 'Reports', href: '/admin/reports' },
        { label: 'Alerts', href: '/admin/alerts' },
    ];
    return (_jsx(AppLayout, { sidebarLinks: sidebarLinks, children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8", children: [_jsxs("h1", { className: "text-3xl font-bold text-gray-900 flex items-center gap-2", children: [_jsx(Users, { className: "w-8 h-8 text-blue-600" }), "User Management"] }), _jsxs("button", { onClick: handleAddClick, className: "flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors", children: [_jsx(Plus, { className: "w-5 h-5" }), "Add ", activeTab === 'students' ? 'Student' : 'Lecturer'] })] }), _jsxs("div", { className: "flex gap-4 mb-6 border-b border-gray-200", children: [_jsxs("button", { onClick: () => {
                                setActiveTab('students');
                                setShowForm(false);
                            }, className: `px-4 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'students'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: ["Students (", students.length, ")"] }), _jsxs("button", { onClick: () => {
                                setActiveTab('lecturers');
                                setShowForm(false);
                            }, className: `px-4 py-3 font-semibold border-b-2 transition-colors ${activeTab === 'lecturers'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900'}`, children: ["Lecturers (", lecturers.length, ")"] })] }), showForm && (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 mb-8", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-6", children: isEditing ? 'Edit User' : `Add New ${activeTab === 'students' ? 'Student' : 'Lecturer'}` }), _jsxs("form", { onSubmit: handleSubmit, className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Full Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email *" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Phone" }), _jsx("input", { type: "tel", value: formData.phone, onChange: (e) => setFormData({ ...formData, phone: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] }), activeTab === 'lecturers' ? (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Department" }), _jsx("input", { type: "text", value: formData.department, onChange: (e) => setFormData({ ...formData, department: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" })] })) : (_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Year of Study" }), _jsxs("select", { value: formData.year, onChange: (e) => setFormData({ ...formData, year: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "", children: "Select year" }), _jsx("option", { value: "1", children: "Year 1" }), _jsx("option", { value: "2", children: "Year 2" }), _jsx("option", { value: "3", children: "Year 3" }), _jsx("option", { value: "4", children: "Year 4" })] })] })), _jsxs("div", { className: "md:col-span-2 flex gap-3", children: [_jsx("button", { type: "submit", className: "flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium", children: isEditing ? 'Update User' : 'Create User' }), _jsx("button", { type: "button", onClick: () => setShowForm(false), className: "flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium", children: "Cancel" })] })] })] })), _jsx("div", { className: "bg-white rounded-lg shadow-md overflow-hidden", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-12", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) })) : activeTab === 'students' ? (_jsx(StudentTable, { students: students, onEdit: handleEdit, onDelete: handleDelete })) : (_jsx(LecturerTable, { lecturers: lecturers, onEdit: handleEdit, onDelete: handleDelete })) })] }) }));
}
function StudentTable({ students, onEdit, onDelete, }) {
    if (students.length === 0) {
        return _jsx("div", { className: "p-8 text-center text-gray-500", children: "No students found" });
    }
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Year" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: students.map((student) => (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: student.user?.name }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: student.user?.email }), _jsxs("td", { className: "px-6 py-4 text-sm text-gray-600", children: ["Year ", student.year] }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: "inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800", children: "Active" }) }), _jsxs("td", { className: "px-6 py-4 text-sm flex gap-2", children: [_jsx("button", { onClick: () => onEdit(student), className: "text-blue-600 hover:text-blue-700 p-1 transition-colors", "aria-label": "Edit student", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => onDelete(student.id), className: "text-red-600 hover:text-red-700 p-1 transition-colors", "aria-label": "Delete student", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, student.id))) })] }) }));
}
function LecturerTable({ lecturers, onEdit, onDelete, }) {
    if (lecturers.length === 0) {
        return _jsx("div", { className: "p-8 text-center text-gray-500", children: "No lecturers found" });
    }
    return (_jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50 border-b border-gray-200", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Name" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Email" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Department" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Status" }), _jsx("th", { className: "px-6 py-3 text-left text-sm font-semibold text-gray-900", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-200", children: lecturers.map((lecturer) => (_jsxs("tr", { className: "hover:bg-gray-50 transition-colors", children: [_jsx("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: lecturer.user?.name }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: lecturer.user?.email }), _jsx("td", { className: "px-6 py-4 text-sm text-gray-600", children: lecturer.department }), _jsx("td", { className: "px-6 py-4 text-sm", children: _jsx("span", { className: "inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800", children: "Active" }) }), _jsxs("td", { className: "px-6 py-4 text-sm flex gap-2", children: [_jsx("button", { onClick: () => onEdit(lecturer), className: "text-blue-600 hover:text-blue-700 p-1 transition-colors", "aria-label": "Edit lecturer", children: _jsx(Edit2, { className: "w-4 h-4" }) }), _jsx("button", { onClick: () => onDelete(lecturer.id), className: "text-red-600 hover:text-red-700 p-1 transition-colors", "aria-label": "Delete lecturer", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] }, lecturer.id))) })] }) }));
}
//# sourceMappingURL=AdminUsersEnhanced.js.map
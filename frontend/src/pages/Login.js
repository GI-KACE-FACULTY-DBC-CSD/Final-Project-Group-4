import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginUser } from '../services/api';
import { AlertCircle, Loader } from 'lucide-react';
import { GIKACELogo } from '../components/Logo';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuth, isAuthenticated, user } = useAuth();
    const { t } = useTranslation();
    const vantaRef = useRef(null);
    useEffect(() => {
        if (vantaRef.current && window.VANTA) {
            window.VANTA.RINGS({
                el: vantaRef.current,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200,
                minWidth: 200,
                scale: 1,
                scaleMobile: 1,
                backgroundColor: 0xffffff,
                color: 0x7aff00,
            });
        }
    }, []);
    if (isAuthenticated && user?.role !== 'admin') {
        const dashboardMap = {
            lecturer: '/lecturer/dashboard',
            student: '/student/dashboard',
            admin: '/admin/dashboard',
        };
        return _jsx(Navigate, { to: dashboardMap[user?.role || 'student'], replace: true });
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await loginUser(email, password);
            if (response.user.role === 'admin') {
                // Don't reveal that this is an admin account, treat as invalid login
                setError(t('auth.invalidCredentials'));
                setLoading(false);
                return;
            }
            const token = response.plainTextToken || response.token;
            setAuth(response.user, token);
            const dashboardMap = {
                lecturer: '/lecturer/dashboard',
                student: '/student/dashboard',
            };
            navigate(dashboardMap[response.user.role] || '/student/dashboard', { replace: true });
        }
        catch (err) {
            const errorMessage = err.response?.data?.message || err.response?.data?.error || err.message || t('auth.invalidCredentials');
            setError(errorMessage);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden auth-form", children: [_jsx("div", { ref: vantaRef, className: "absolute inset-0 z-0" }), _jsx("div", { className: "absolute top-4 right-4 z-20", children: _jsx(LanguageSwitcher, {}) }), _jsxs("div", { className: "max-w-md w-full bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8 relative z-10", children: [_jsxs("div", { className: "text-center mb-8", children: [_jsx("div", { className: "flex justify-center mb-4", children: _jsx(GIKACELogo, {}) }), _jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "GI-KACE" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: t('navigation.studentDashboard') })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-6", children: [error && (_jsxs("div", { className: "flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm", children: [_jsx(AlertCircle, { className: "w-4 h-4 flex-shrink-0" }), error] })), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: t('auth.email') }), _jsx("input", { type: "email", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "your@email.com", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: t('auth.password') }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", required: true })] }), _jsxs("button", { type: "submit", disabled: loading || !email || !password, className: "w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2", children: [loading && _jsx(Loader, { className: "w-4 h-4 animate-spin" }), loading ? t('auth.signingIn') : t('auth.login')] })] })] })] }));
}
//# sourceMappingURL=Login.js.map
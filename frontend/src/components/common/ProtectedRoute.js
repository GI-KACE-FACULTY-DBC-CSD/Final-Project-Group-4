import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
export function ProtectedRoute({ children, requiredRole }) {
    const { isAuthenticated, user, isLoading } = useAuth();
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading..." })] }) }));
    }
    if (!isAuthenticated) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    if (requiredRole && user?.role !== requiredRole) {
        // Redirect to appropriate dashboard based on role
        const dashboardMap = {
            admin: '/admin/dashboard',
            lecturer: '/lecturer/dashboard',
            student: '/student/dashboard',
        };
        return _jsx(Navigate, { to: dashboardMap[user?.role || 'student'], replace: true });
    }
    return _jsx(_Fragment, { children: children });
}
//# sourceMappingURL=ProtectedRoute.js.map
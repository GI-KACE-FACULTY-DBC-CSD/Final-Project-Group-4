import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { XCircle, CheckCircle, AlertCircle, Info } from 'lucide-react';
export function ToastMessage({ id, message, type, duration = 4000, onClose }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => onClose(id), duration);
            return () => clearTimeout(timer);
        }
        return;
    }, [id, duration, onClose]);
    const icons = {
        success: _jsx(CheckCircle, { className: "w-5 h-5" }),
        error: _jsx(XCircle, { className: "w-5 h-5" }),
        warning: _jsx(AlertCircle, { className: "w-5 h-5" }),
        info: _jsx(Info, { className: "w-5 h-5" }),
    };
    const colors = {
        success: 'bg-green-50 text-green-800 border-green-200',
        error: 'bg-red-50 text-red-800 border-red-200',
        warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
        info: 'bg-blue-50 text-blue-800 border-blue-200',
    };
    const iconColors = {
        success: 'text-green-600',
        error: 'text-red-600',
        warning: 'text-yellow-600',
        info: 'text-blue-600',
    };
    return (_jsxs("div", { className: `${colors[type]} border rounded-lg p-4 flex items-start gap-3 animate-slide-in`, children: [_jsx("div", { className: iconColors[type], children: icons[type] }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "font-semibold text-sm", children: message }) }), _jsx("button", { onClick: () => onClose(id), className: "text-gray-400 hover:text-gray-600 transition-colors", children: "\u00D7" })] }));
}
export function ToastContainer({ toasts, onRemove }) {
    return (_jsx("div", { className: "fixed top-4 right-4 z-50 space-y-2 w-96 max-w-[calc(100vw-2rem)]", children: toasts.map((toast) => (_jsx(ToastMessage, { ...toast, onClose: onRemove }, toast.id))) }));
}
//# sourceMappingURL=Toast.js.map
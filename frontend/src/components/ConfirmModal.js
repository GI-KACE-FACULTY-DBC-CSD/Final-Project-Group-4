import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ConfirmModal({ isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false, isLoading = false, onConfirm, onCancel, }) {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center", children: _jsx("div", { className: "bg-white rounded-lg shadow-xl max-w-sm w-full mx-4", children: _jsxs("div", { className: "p-6", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900 mb-2", children: title }), _jsx("p", { className: "text-gray-600 text-sm mb-6", children: message }), _jsxs("div", { className: "flex gap-3 justify-end", children: [_jsx("button", { onClick: onCancel, disabled: isLoading, className: "px-4 py-2 text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50", children: cancelText }), _jsx("button", { onClick: onConfirm, disabled: isLoading, className: `px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${isDestructive
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-blue-600 hover:bg-blue-700'}`, children: isLoading ? 'Loading...' : confirmText })] })] }) }) }));
}
//# sourceMappingURL=ConfirmModal.js.map
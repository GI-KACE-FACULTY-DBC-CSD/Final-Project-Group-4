import { useState } from 'react';
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const addToast = (message, type = 'info', duration = 4000) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type, duration }]);
    };
    const removeToast = (id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };
    const success = (message) => addToast(message, 'success');
    const error = (message) => addToast(message, 'error', 5000);
    const warning = (message) => addToast(message, 'warning');
    const info = (message) => addToast(message, 'info');
    return { toasts, addToast, removeToast, success, error, warning, info };
}
//# sourceMappingURL=useToast.js.map
export type ToastType = 'success' | 'error' | 'warning' | 'info';
export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}
interface ToastProps extends Toast {
    onClose: (id: string) => void;
}
export declare function ToastMessage({ id, message, type, duration, onClose }: ToastProps): import("react/jsx-runtime").JSX.Element;
interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}
export declare function ToastContainer({ toasts, onRemove }: ToastContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Toast.d.ts.map
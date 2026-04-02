interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}
export declare function ConfirmModal({ isOpen, title, message, confirmText, cancelText, isDestructive, isLoading, onConfirm, onCancel, }: ConfirmModalProps): import("react/jsx-runtime").JSX.Element | null;
export {};
//# sourceMappingURL=ConfirmModal.d.ts.map
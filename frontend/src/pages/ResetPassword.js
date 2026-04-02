import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { AppLayout } from '../components/layout/AppLayout';
export function ResetPassword() {
    const { t } = useTranslation();
    return (_jsx(AppLayout, { sidebarLinks: [], children: _jsx("div", { className: "min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-lg w-full bg-white rounded-2xl shadow p-8 text-center", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: t('messages.contactAdmin') }), _jsx("p", { className: "text-sm text-gray-600", children: t('messages.resetHandledByAdmin') })] }) }) }));
}
export default ResetPassword;
//# sourceMappingURL=ResetPassword.js.map
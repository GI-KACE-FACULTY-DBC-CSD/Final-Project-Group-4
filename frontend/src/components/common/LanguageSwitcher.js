import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [currentLang, setCurrentLang] = useState(i18n.language || 'en');
    const languages = [
        { code: 'en', name: 'English', flag: '🇬🇧' },
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'Français', flag: '🇫🇷' },
    ];
    const currentLanguage = languages.find((lang) => lang.code === currentLang) || languages[0];
    useEffect(() => {
        setCurrentLang(i18n.language || 'en');
    }, [i18n.language]);
    const handleLanguageChange = async (langCode) => {
        try {
            await i18n.changeLanguage(langCode);
            localStorage.setItem('i18nextLng', langCode);
            setCurrentLang(langCode);
            setShowDropdown(false);
        }
        catch (error) {
            console.error('Error changing language:', error);
        }
    };
    return (_jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setShowDropdown(!showDropdown), className: "flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors", title: "Change language", "aria-label": "Change language", children: [_jsx(Globe, { className: "w-4 h-4 text-gray-600" }), _jsx("span", { className: "text-sm font-medium text-gray-700", children: currentLanguage.flag })] }), showDropdown && (_jsx("div", { className: "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50", children: _jsx("div", { className: "py-1", children: languages.map((lang) => (_jsxs("button", { onClick: () => handleLanguageChange(lang.code), className: `w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${currentLang === lang.code
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'}`, "aria-current": currentLang === lang.code ? 'true' : 'false', children: [_jsx("span", { className: "text-lg", children: lang.flag }), _jsx("span", { children: lang.name })] }, lang.code))) }) }))] }));
}
//# sourceMappingURL=LanguageSwitcher.js.map
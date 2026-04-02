import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
export function Debug() {
    const [results, setResults] = useState([]);
    const [testing, setTesting] = useState(false);
    const runTests = async () => {
        setTesting(true);
        setResults([]);
        const testResults = [];
        // Test 1: Check if frontend can reach backend
        testResults.push({
            name: 'Backend Connectivity',
            status: 'pending',
            message: 'Testing...',
        });
        setResults([...testResults]);
        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
            });
            testResults[0] = {
                name: 'Backend Connectivity',
                status: 'success',
                message: `Backend reachable (Status: ${response.status})`,
            };
        }
        catch (err) {
            testResults[0] = {
                name: 'Backend Connectivity',
                status: 'error',
                message: `Cannot reach backend: ${err.message}. Make sure Laravel is running on http://localhost:8000`,
            };
        }
        // Test 2: Check API base URL via proxy
        testResults.push({
            name: 'API Proxy',
            status: 'pending',
            message: 'Testing...',
        });
        setResults([...testResults]);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@test.com', password: 'test' }),
            });
            testResults[1] = {
                name: 'API Proxy',
                status: 'success',
                message: `Proxy working (Status: ${response.status})`,
            };
        }
        catch (err) {
            testResults[1] = {
                name: 'API Proxy',
                status: 'error',
                message: `Proxy error: ${err.message}. Check vite.config.ts`,
            };
        }
        // Test 3: Check localStorage
        testResults.push({
            name: 'Browser Storage',
            status: 'pending',
            message: 'Testing...',
        });
        setResults([...testResults]);
        try {
            localStorage.setItem('test', 'ok');
            localStorage.removeItem('test');
            testResults[2] = {
                name: 'Browser Storage',
                status: 'success',
                message: `localStorage working`,
            };
        }
        catch (err) {
            testResults[2] = {
                name: 'Browser Storage',
                status: 'error',
                message: `localStorage error: ${err.message}`,
            };
        }
        setResults([...testResults]);
        setTesting(false);
    };
    return (_jsx("div", { className: "min-h-screen bg-gray-50 p-8", children: _jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-2", children: "Debug & Test" }), _jsx("p", { className: "text-gray-600 mb-8", children: "Check connectivity between frontend and backend" }), _jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 mb-8", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900 mb-4", children: "System Information" }), _jsxs("div", { className: "space-y-2 font-mono text-sm", children: [_jsxs("p", { children: [_jsx("span", { className: "text-gray-600", children: "Frontend URL:" }), ' ', _jsx("span", { className: "text-blue-600", children: window.location.origin })] }), _jsxs("p", { children: [_jsx("span", { className: "text-gray-600", children: "Backend URL:" }), ' ', _jsx("span", { className: "text-blue-600", children: "http://localhost:8000" })] }), _jsxs("p", { children: [_jsx("span", { className: "text-gray-600", children: "API Base URL:" }), ' ', _jsx("span", { className: "text-blue-600", children: "/api" })] })] })] }), _jsx("button", { onClick: runTests, disabled: testing, className: "w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mb-8", children: testing ? 'Testing...' : 'Run Connection Tests' }), results.length > 0 && (_jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-bold text-gray-900", children: "Test Results" }), results.map((result, idx) => (_jsx("div", { className: `p-4 rounded-lg border ${result.status === 'success'
                                ? 'bg-green-50 border-green-200'
                                : result.status === 'error'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-blue-50 border-blue-200'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [result.status === 'pending' && (_jsx(Loader, { className: "w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" })), result.status === 'success' && (_jsx(CheckCircle, { className: "w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" })), result.status === 'error' && (_jsx(AlertCircle, { className: "w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" })), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-gray-900", children: result.name }), _jsx("p", { className: `text-sm mt-1 ${result.status === 'success'
                                                    ? 'text-green-700'
                                                    : result.status === 'error'
                                                        ? 'text-red-700'
                                                        : 'text-blue-700'}`, children: result.message })] })] }) }, idx)))] })), _jsx("div", { className: "mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg", children: _jsxs("p", { className: "text-sm text-blue-700", children: [_jsx("span", { className: "font-semibold", children: "Quick Setup:" }), " Make sure Laravel backend is running with ", _jsx("code", { className: "bg-blue-100 px-1.5 py-0.5 rounded", children: "php artisan serve" })] }) }), _jsx("div", { className: "mt-4 text-center", children: _jsx("a", { href: "/login", className: "text-blue-600 hover:underline", children: "Back to Login" }) })] }) }));
}
//# sourceMappingURL=Debug.js.map
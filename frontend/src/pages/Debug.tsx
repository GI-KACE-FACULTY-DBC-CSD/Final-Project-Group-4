import { useState } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
}

export function Debug() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    setResults([]);

    const testResults: TestResult[] = [];

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
    } catch (err: any) {
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
    } catch (err: any) {
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
    } catch (err: any) {
      testResults[2] = {
        name: 'Browser Storage',
        status: 'error',
        message: `localStorage error: ${err.message}`,
      };
    }

    setResults([...testResults]);
    setTesting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Debug & Test</h1>
        <p className="text-gray-600 mb-8">Check connectivity between frontend and backend</p>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">System Information</h2>
          <div className="space-y-2 font-mono text-sm">
            <p>
              <span className="text-gray-600">Frontend URL:</span>{' '}
              <span className="text-blue-600">{window.location.origin}</span>
            </p>
            <p>
              <span className="text-gray-600">Backend URL:</span>{' '}
              <span className="text-blue-600">http://localhost:8000</span>
            </p>
            <p>
              <span className="text-gray-600">API Base URL:</span>{' '}
              <span className="text-blue-600">/api</span>
            </p>
          </div>
        </div>

        <button
          onClick={runTests}
          disabled={testing}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 mb-8"
        >
          {testing ? 'Testing...' : 'Run Connection Tests'}
        </button>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Test Results</h2>
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  result.status === 'success'
                    ? 'bg-green-50 border-green-200'
                    : result.status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.status === 'pending' && (
                    <Loader className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                  )}
                  {result.status === 'success' && (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  {result.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{result.name}</p>
                    <p
                      className={`text-sm mt-1 ${
                        result.status === 'success'
                          ? 'text-green-700'
                          : result.status === 'error'
                          ? 'text-red-700'
                          : 'text-blue-700'
                      }`}
                    >
                      {result.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Quick Setup:</span> Make sure Laravel backend is
            running with <code className="bg-blue-100 px-1.5 py-0.5 rounded">php artisan serve</code>
          </p>
        </div>

        <div className="mt-4 text-center">
          <a href="/login" className="text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    </div>
  );
}

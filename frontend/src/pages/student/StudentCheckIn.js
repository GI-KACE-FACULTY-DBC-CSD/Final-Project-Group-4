import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Loader, Shield, Camera } from 'lucide-react';
import { verifyFaceAttendance } from '../../services/api';
import { faceApiService } from '../../services/faceApiService';
import { getPublicSessions } from '../../services/api';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
export function StudentCheckIn() {
    const { t } = useTranslation();
    const videoRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [currentSession, setCurrentSession] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [cooldown, setCooldown] = useState(0);
    const cooldownRef = useRef(null);
    const [faceApiInitialized, setFaceApiInitialized] = useState(false);
    const [initError, setInitError] = useState('');
    const [cameraActive, setCameraActive] = useState(false);
    useEffect(() => {
        const initializeFaceApi = async () => {
            try {
                // Initialize face-api service
                await faceApiService.initialize();
                setFaceApiInitialized(true);
                setMessage('');
                // Load active session
                const sessions = await getPublicSessions();
                const active = sessions.find((s) => s.status === 'ongoing');
                if (active)
                    setCurrentSession(active);
                // Try to start camera
                await startCamera();
            }
            catch (err) {
                console.error('Failed to initialize Face API:', err);
                setInitError(err?.response?.data?.message || 'Failed to initialize facial recognition system');
                setMessageType('error');
            }
        };
        initializeFaceApi();
        return () => {
            // Cleanup cooldown interval and stop camera
            if (cooldownRef.current) {
                window.clearInterval(cooldownRef.current);
                cooldownRef.current = null;
            }
            if (videoRef.current?.srcObject) {
                const tracks = videoRef.current.srcObject.getTracks();
                tracks.forEach((t) => t.stop());
            }
        };
    }, []);
    const startCooldown = (seconds = 5) => {
        setCooldown(seconds);
        cooldownRef.current = window.setInterval(() => {
            setCooldown((c) => {
                if (c <= 1) {
                    if (cooldownRef.current) {
                        window.clearInterval(cooldownRef.current);
                        cooldownRef.current = null;
                    }
                    setMessage('');
                    setMessageType('');
                    setLastResult(null);
                    return 0;
                }
                return c - 1;
            });
        }, 1000);
    };
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setCameraActive(true);
                setMessage('');
            }
        }
        catch (err) {
            setMessage('Unable to access camera. Please check permissions.');
            setMessageType('error');
        }
    };
    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach((t) => t.stop());
            setCameraActive(false);
        }
    };
    const performFaceVerification = async () => {
        if (!faceApiInitialized) {
            setMessage('Facial recognition system not ready. Please wait...');
            setMessageType('error');
            return;
        }
        if (!videoRef.current)
            return;
        if (cooldown > 0) {
            setMessage(`Please wait ${cooldown} seconds before next scan`);
            setMessageType('info');
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            console.log('Starting face verification...');
            // Verify face 
            const biometricData = await faceApiService.verifyFace(videoRef.current, new Float32Array([]));
            console.log('Face verification successful:', biometricData);
            // Send verification to backend for attendance marking
            const attendanceResult = await verifyFaceAttendance(biometricData.hash, biometricData.confidence, biometricData.descriptor.toString());
            const timeLabel = attendanceResult.time_in
                ? new Date(attendanceResult.time_in).toLocaleTimeString()
                : new Date().toLocaleTimeString();
            setLastResult({
                name: attendanceResult.student_name || attendanceResult.student_id,
                time: timeLabel,
            });
            setMessage(`${t('frontgate.checkedInAs')} ${attendanceResult.student_name || attendanceResult.student_id}\n${t('frontgate.attendanceMarked', {
                time: timeLabel,
            })}`);
            setMessageType('success');
            // Start cooldown after successful verification
            startCooldown(5);
        }
        catch (err) {
            console.error('Face verification error:', err);
            const errorMsg = err?.message || 'Facial verification failed. Please try again.';
            setMessage(errorMsg);
            setMessageType('error');
        }
        finally {
            setLoading(false);
        }
    };
    if (initError && !faceApiInitialized) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6", children: _jsxs("div", { className: "max-w-md bg-white rounded-xl shadow-lg p-8 border border-red-200 text-center", children: [_jsx(AlertCircle, { className: "w-16 h-16 mx-auto mb-4 text-red-500" }), _jsx("h1", { className: "text-2xl font-bold text-gray-900 mb-2", children: "System Initialization Error" }), _jsx("p", { className: "text-gray-600 mb-6", children: initError }), _jsx("button", { onClick: () => window.location.reload(), className: "bg-primary text-white px-6 py-2 rounded-md font-semibold hover:bg-primary-dark", children: "Retry" })] }) }));
    }
    return (_jsx("div", { className: `min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50`, children: _jsxs("div", { className: `bg-white rounded-xl shadow-2xl flex overflow-hidden w-full max-w-4xl`, children: [_jsxs("div", { className: `w-1/2 bg-black flex items-center justify-center relative`, children: [_jsx("video", { ref: videoRef, autoPlay: true, playsInline: true, className: "w-full h-full object-cover" }), !cameraActive && (_jsx("div", { className: "absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center", children: _jsx(Camera, { className: "w-16 h-16 text-white opacity-50" }) }))] }), _jsxs("div", { className: `w-1/2 p-8 flex flex-col`, children: [_jsxs("div", { className: "mb-6 flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Face Recognition Check-In" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Using Face-API.js (Open Source)" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [cameraActive ? (_jsx("button", { onClick: stopCamera, className: "bg-red-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-red-600 transition", children: t('frontgate.stopCamera') })) : (_jsx("button", { onClick: startCamera, className: "bg-primary text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-primary-dark transition", children: "Start Camera" })), _jsx(LanguageSwitcher, {})] })] }), _jsx("div", { className: "mb-6", children: currentSession ? (_jsxs("div", { className: "p-4 border border-blue-200 rounded-lg bg-blue-50", children: [_jsx("p", { className: "text-xs text-blue-600 font-semibold uppercase", children: t('frontgate.currentSession') }), _jsx("p", { className: "text-lg font-bold text-gray-900 mt-1", children: currentSession.name }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mt-3 text-sm text-gray-600", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Location" }), _jsx("p", { className: "font-semibold text-gray-800", children: currentSession.location || 'TBA' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-gray-500", children: "Time" }), _jsx("p", { className: "font-semibold text-gray-800", children: currentSession.start_time ? new Date(currentSession.start_time).toLocaleTimeString() : '—' })] })] })] })) : (_jsx("div", { className: "p-4 border border-yellow-200 rounded-lg bg-yellow-50 text-yellow-800", children: _jsx("p", { className: "text-sm font-semibold", children: t('frontgate.noActiveSession') }) })) }), _jsx("div", { className: "mb-6 min-h-20", children: lastResult ? (_jsx("div", { className: "p-6 rounded-lg bg-green-50 border border-green-200", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx(CheckCircle, { className: "w-12 h-12 text-green-600 flex-shrink-0" }), _jsxs("div", { children: [_jsx("p", { className: "text-lg font-bold text-green-900", children: t('frontgate.checkedIn') }), _jsx("p", { className: "text-green-700 font-semibold mt-1", children: lastResult.name }), _jsx("p", { className: "text-sm text-green-600 mt-1", children: lastResult.time })] })] }) })) : message ? (_jsx("div", { className: `p-4 rounded-lg border ${messageType === 'success'
                                    ? 'bg-green-50 border-green-200 text-green-800'
                                    : messageType === 'error'
                                        ? 'bg-red-50 border-red-200 text-red-800'
                                        : 'bg-blue-50 border-blue-200 text-blue-800'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [messageType === 'success' ? (_jsx(CheckCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" })) : messageType === 'error' ? (_jsx(AlertCircle, { className: "w-5 h-5 flex-shrink-0 mt-0.5" })) : (_jsx(Loader, { className: "w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" })), _jsx("p", { className: "text-sm font-medium whitespace-pre-line", children: message })] }) })) : (_jsx("div", { className: "p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-600", children: _jsx("p", { className: "text-sm", children: faceApiInitialized ? 'Ready to scan. Click the button below to begin.' : 'Initializing facial recognition...' }) })) }), _jsxs("div", { className: "mb-6 flex items-center gap-3", children: [_jsx("div", { className: `w-3 h-3 rounded-full ${faceApiInitialized && cameraActive ? 'bg-green-500' : 'bg-yellow-500'}` }), _jsx("p", { className: "text-xs text-gray-600", children: faceApiInitialized && cameraActive ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-semibold", children: "System Ready" }), " - Face-API with basic liveness detection"] })) : faceApiInitialized ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-semibold", children: "System Ready" }), " - Start camera to begin"] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "font-semibold", children: "Initializing" }), " - Please wait..."] })) }), cooldown > 0 && (_jsx("div", { className: "ml-auto text-sm font-semibold text-orange-600", children: t('frontgate.nextScan', { seconds: cooldown }) }))] }), _jsx("button", { onClick: performFaceVerification, disabled: loading || !faceApiInitialized || !cameraActive || !currentSession || cooldown > 0, className: `w-full py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition ${loading || !faceApiInitialized || !cameraActive || !currentSession || cooldown > 0
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-gradient-to-r from-primary to-indigo-600 text-white hover:shadow-lg active:scale-95'}`, children: loading ? (_jsxs(_Fragment, { children: [_jsx(Loader, { className: "w-6 h-6 animate-spin" }), _jsx("span", { children: t('frontgate.processing') })] })) : (_jsxs(_Fragment, { children: [_jsx(Shield, { className: "w-6 h-6" }), _jsx("span", { children: t('frontgate.captureAndCheckIn') })] })) }), _jsx("div", { className: "mt-6 pt-4 border-t border-gray-200 text-center", children: _jsx("p", { className: "text-xs text-gray-500", children: "This system uses free, open-source facial recognition with basic liveness detection." }) })] })] }) }));
}
export default StudentCheckIn;
//# sourceMappingURL=StudentCheckIn.js.map
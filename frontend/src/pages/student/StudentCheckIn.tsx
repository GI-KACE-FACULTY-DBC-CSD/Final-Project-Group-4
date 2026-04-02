import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, AlertCircle, Loader, Shield, Camera, Sparkles } from 'lucide-react';
import { verifyFaceAttendance, verifyFaceCheckout } from '../../services/api';
import { faceApiService } from '../../services/faceApiService';
import { ClassSession } from '../../types';
import { getPublicSessions } from '../../services/api';
import { LanguageSwitcher } from '../../components/common/LanguageSwitcher';
import { getRandomBackgroundImage } from '../../utils/bgImages';

export function StudentCheckIn() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | ''>('');
  const [currentSession, setCurrentSession] = useState<ClassSession | null>(null);
  const [lastResult, setLastResult] = useState<{ name?: string; time?: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef<number | null>(null);
  const [faceApiInitialized, setFaceApiInitialized] = useState(false);
  const [initError, setInitError] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [lastAction, setLastAction] = useState<'checkin' | 'checkout' | null>(null);
  const [alreadyCheckedInToday, setAlreadyCheckedInToday] = useState<{ time: string; name: string } | null>(null);


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
        if (active) setCurrentSession(active);

        // Try to start camera
        await startCamera();
      } catch (err: any) {
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
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((t) => t.stop());
      }
    };
  }, []);

  const startCooldown = (seconds: number = 5) => {
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
    }, 1000) as unknown as number;
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
    } catch (err) {
      setMessage('Unable to access camera. Please check permissions.');
      setMessageType('error');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((t) => t.stop());
      setCameraActive(false);
    }
  };

  const performFaceVerification = async (action: 'checkin' | 'checkout') => {
    if (!faceApiInitialized) {
      setMessage('Facial recognition system not ready. Please wait...');
      setMessageType('error');
      return;
    }

    if (!videoRef.current) return;

    if (cooldown > 0) {
      setMessage(`Please wait ${cooldown} seconds before next scan`);
      setMessageType('info');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      console.log('Starting face verification...');
      const biometricData = await faceApiService.verifyFace(videoRef.current, new Float32Array([]));
      console.log('Face verification successful:', biometricData);

      const isCheckout = action === 'checkout';
      const payload = {
        hash: biometricData.hash,
        confidence: biometricData.confidence,
        descriptor: biometricData.descriptor.toString(),
      };

      if (isCheckout) {
        const result = await verifyFaceCheckout(payload.hash, payload.confidence, payload.descriptor);
        const timeLabel = result.time_out ? new Date(result.time_out).toLocaleTimeString() : new Date().toLocaleTimeString();
        setLastResult({
          name: result.student_name || result.student_id,
          time: timeLabel,
          sessionName: result.session_name,
          action: 'checkout',
        });
        setLastAction('checkout');
        setMessage(
          `Signed out: ${result.student_name || result.student_id}\nSession: ${result.session_name || '—'}\nTime: ${timeLabel}`
        );
        setMessageType('success');
      } else {
        const attendanceResult = await verifyFaceAttendance(payload.hash, payload.confidence, payload.descriptor);
        if (attendanceResult.already_checked_in_today) {
          const timeLabel = attendanceResult.time_in
            ? new Date(attendanceResult.time_in).toLocaleTimeString()
            : '';
          setAlreadyCheckedInToday({
            time: timeLabel,
            name: attendanceResult.student_name || attendanceResult.student_id || 'You',
          });
          setMessageType('success');
        } else {
          const timeLabel = attendanceResult.time_in
            ? new Date(attendanceResult.time_in).toLocaleTimeString()
            : new Date().toLocaleTimeString();
          setLastResult({
            name: attendanceResult.student_name || attendanceResult.student_id,
            time: timeLabel,
            sessionName: attendanceResult.session_name,
            action: 'checkin',
          });
          setLastAction('checkin');
          setMessage(
            `${t('frontgate.checkedInAs')} ${attendanceResult.student_name || attendanceResult.student_id}\nSession: ${attendanceResult.session_name || '—'}\n${t('frontgate.attendanceMarked', { time: timeLabel })}`
          );
          setMessageType('success');
        }
      }

      startCooldown(5);
    } catch (err: any) {
      console.error('Face verification error:', err);
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Facial verification failed. Please try again.';
      setMessage(errorMsg);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  if (initError && !faceApiInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-6">
        <div className="max-w-md bg-white rounded-xl shadow-lg p-8 border border-red-200 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">System Initialization Error</h1>
          <p className="text-gray-600 mb-6">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-md font-semibold hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const backgroundImage = getRandomBackgroundImage();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 bg-cover bg-center`}
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div
        className={`bg-white rounded-xl shadow-2xl flex overflow-hidden w-full max-w-4xl`}
      >
        {/* Left: Camera feed */}
        <div className={`w-1/2 bg-black flex items-center justify-center relative`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {!cameraActive && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Camera className="w-16 h-16 text-white opacity-50" />
            </div>
          )}
        </div>

        {/* Right: Interface */}
        <div className={`w-1/2 p-8 flex flex-col`}>
          {/* Already checked in today — friendly one-per-day message */}
          {alreadyCheckedInToday ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mb-6 animate-pulse">
                <CheckCircle className="w-14 h-14 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're already in!</h2>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold text-gray-800">{alreadyCheckedInToday.name}</span>, you checked in today at{' '}
                <span className="font-bold text-emerald-600">{alreadyCheckedInToday.time}</span>.
              </p>
              <p className="text-gray-500 text-sm mt-4">No need to scan again — enjoy your day.</p>
              <p className="text-emerald-600 font-medium mt-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                See you tomorrow!
              </p>
              <button
                type="button"
                onClick={() => setAlreadyCheckedInToday(null)}
                className="mt-8 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Scan again (same result)
              </button>
              <div className="mt-6">
                <LanguageSwitcher />
              </div>
            </div>
          ) : (
            <>
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Face Recognition Check-In</h2>
              <p className="text-sm text-gray-600 mt-1">Using Face-API.js (Open Source)</p>
            </div>
            <div className="flex items-center gap-3">
              {cameraActive ? (
                <button
                  onClick={stopCamera}
                  className="bg-red-500 text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-red-600 transition"
                >
                  {t('frontgate.stopCamera')}
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  className="bg-primary text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-primary-dark transition"
                >
                  Start Camera
                </button>
              )}
              <LanguageSwitcher />
            </div>
          </div>

          {/* Info: session is determined by your course when you scan */}
          <div className="mb-6">
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <p className="text-xs text-blue-600 font-semibold uppercase">How it works</p>
              <p className="text-sm text-gray-700 mt-1">
                Scan your face to <strong>check in</strong> when you arrive or <strong>sign out</strong> when you leave. The system will use your assigned course and its current session automatically.
              </p>
            </div>
          </div>

          {/* Status Messages */}
          <div className="mb-6 min-h-20">
            {lastResult ? (
              <div className="p-6 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-12 h-12 text-green-600 flex-shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-green-900">
                      {lastResult.action === 'checkout' ? 'Signed out' : t('frontgate.checkedIn')}
                    </p>
                    <p className="text-green-700 font-semibold mt-1">{lastResult.name}</p>
                    {lastResult.sessionName && (
                      <p className="text-sm text-green-700 mt-1">
                        Session: <span className="font-medium">{lastResult.sessionName}</span>
                      </p>
                    )}
                    <p className="text-sm text-green-600 mt-1">{lastResult.time}</p>
                  </div>
                </div>
              </div>
            ) : message ? (
              <div
                className={`p-4 rounded-lg border ${
                  messageType === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : messageType === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {messageType === 'success' ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : messageType === 'error' ? (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Loader className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  <p className="text-sm font-medium whitespace-pre-line">{message}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-gray-600">
                <p className="text-sm">
                  {faceApiInitialized ? 'Ready to scan. Click the button below to begin.' : 'Initializing facial recognition...'}
                </p>
              </div>
            )}
          </div>

          {/* Status indicator */}
          <div className="mb-6 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${faceApiInitialized && cameraActive ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <p className="text-xs text-gray-600">
              {faceApiInitialized && cameraActive ? (
                <>
                  <span className="font-semibold">System Ready</span> - Face-API with basic liveness detection
                </>
              ) : faceApiInitialized ? (
                <>
                  <span className="font-semibold">System Ready</span> - Start camera to begin
                </>
              ) : (
                <>
                  <span className="font-semibold">Initializing</span> - Please wait...
                </>
              )}
            </p>
            {cooldown > 0 && (
              <div className="ml-auto text-sm font-semibold text-orange-600">{t('frontgate.nextScan', { seconds: cooldown })}</div>
            )}
          </div>

          {/* Check in / Sign out buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => performFaceVerification('checkin')}
              disabled={loading || !faceApiInitialized || !cameraActive || cooldown > 0}
              className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition ${
                loading || !faceApiInitialized || !cameraActive || cooldown > 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary to-indigo-600 text-white hover:shadow-lg active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader className="w-6 h-6 animate-spin" />
                  <span>{t('frontgate.processing')}</span>
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6" />
                  <span>Check in</span>
                </>
              )}
            </button>
            <button
              onClick={() => performFaceVerification('checkout')}
              disabled={loading || !faceApiInitialized || !cameraActive || cooldown > 0}
              className={`flex-1 py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition ${
                loading || !faceApiInitialized || !cameraActive || cooldown > 0
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  : 'bg-gray-700 text-white hover:bg-gray-800 hover:shadow-lg active:scale-95'
              }`}
            >
              Sign out
            </button>
          </div>

          {/* Info footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">
              This system uses free, open-source facial recognition with basic liveness detection.
            </p>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentCheckIn;

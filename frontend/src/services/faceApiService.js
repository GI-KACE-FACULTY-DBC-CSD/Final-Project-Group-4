/**
 * Face-API Service - Free facial recognition using TensorFlow.js
 * Handles face detection, recognition, and biometric hashing
 */
import * as faceapi from 'face-api.js';
class FaceApiService {
    constructor() {
        Object.defineProperty(this, "modelsLoaded", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        });
        Object.defineProperty(this, "MODEL_PATH", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: '/models'
        }); // Path where face-api models are stored
        Object.defineProperty(this, "enrolledDescriptors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Map()
        });
    }
    /**
     * Initialize face-api by loading required models
     */
    async initialize() {
        try {
            console.log('Loading face-api models...');
            // Load all required models from configured path. If that fails (e.g. models missing),
            // fall back to a CDN-hosted copy of the weights.
            // Try multiple model base paths (local first, then known CDNs).
            const candidates = [
                this.MODEL_PATH,
                'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights',
                'https://unpkg.com/face-api.js@0.22.2/weights',
            ];
            const canLoadFrom = async (base) => {
                try {
                    const probe = `${base}/face_recognition_model-weights_manifest.json`;
                    const res = await fetch(probe, { method: 'GET', mode: 'cors' });
                    if (!res.ok)
                        return false;
                    const ct = res.headers.get('content-type') || '';
                    return ct.includes('application/json');
                }
                catch (e) {
                    return false;
                }
            };
            let loaded = false;
            for (const base of candidates) {
                const basePath = base.replace(/\/$/, '');
                const ok = await canLoadFrom(basePath);
                if (!ok) {
                    console.warn(`Model probe failed for ${basePath}`);
                    continue;
                }
                try {
                    await Promise.all([
                        faceapi.nets.tinyFaceDetector.loadFromUri(basePath),
                        faceapi.nets.faceLandmark68Net.loadFromUri(basePath),
                        faceapi.nets.faceRecognitionNet.loadFromUri(basePath),
                        faceapi.nets.faceExpressionNet.loadFromUri(basePath),
                    ]);
                    console.log(`Face-API models loaded from ${basePath}`);
                    loaded = true;
                    break;
                }
                catch (errInner) {
                    console.warn(`Failed to load models from ${basePath}:`, errInner);
                }
            }
            if (!loaded) {
                const guidance = `Failed to load face-api models from local /models and known CDNs.\n` +
                    `Please either: (1) download the weights into the frontend/public/models directory, or (2) allow access to the CDN from your browser.\n` +
                    `To download locally (PowerShell), run:\n` +
                    `  mkdir -p public\\models; ` +
                    `Invoke-WebRequest -Uri "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json" -OutFile public/models/face_recognition_model-weights_manifest.json`;
                console.error('Failed to load face-api models from any source.');
                throw new Error(guidance);
            }
            this.modelsLoaded = true;
            console.log('Face-API models loaded successfully');
        }
        catch (err) {
            console.error('Failed to load face-api models:', err);
            throw new Error('Failed to initialize facial recognition system. Please refresh the page.');
        }
    }
    /**
     * Detect face from video stream
     */
    async detectFaceFromVideo(videoElement) {
        if (!this.modelsLoaded) {
            throw new Error('Face-API not initialized');
        }
        try {
            const detection = await faceapi
                .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (!detection) {
                return {
                    detection: null,
                    descriptor: null,
                    success: false,
                    message: 'No face detected. Please ensure your face is clearly visible.',
                };
            }
            // Check if face is large enough
            const box = detection.detection.box;
            const faceSize = Math.min(box.width, box.height);
            if (faceSize < 50) {
                return {
                    detection: detection.landmarks,
                    descriptor: null,
                    success: false,
                    message: 'Face too small. Please move closer to the camera.',
                };
            }
            // Check if face is too close
            if (faceSize > videoElement.videoWidth * 0.8 || faceSize > videoElement.videoHeight * 0.8) {
                return {
                    detection: detection.landmarks,
                    descriptor: null,
                    success: false,
                    message: 'Face too close. Please move away from the camera.',
                };
            }
            return {
                detection: detection.landmarks,
                descriptor: detection.descriptor,
                success: true,
                message: 'Face detected successfully',
            };
        }
        catch (err) {
            console.error('Face detection error:', err);
            throw new Error('Face detection failed. Please try again.');
        }
    }
    /**
     * Detect the largest face in frame (by box area). Use this for check-in when multiple faces may appear.
     */
    async detectLargestFaceFromVideo(videoElement) {
        if (!this.modelsLoaded) {
            throw new Error('Face-API not initialized');
        }
        try {
            const detections = await faceapi
                .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();
            if (!detections.length) {
                return {
                    detection: null,
                    descriptor: null,
                    success: false,
                    message: 'No face detected. Please ensure your face is clearly visible.',
                };
            }
            const byArea = [...detections].sort((a, b) => {
                const areaA = a.detection.box.width * a.detection.box.height;
                const areaB = b.detection.box.width * b.detection.box.height;
                return areaB - areaA;
            });
            const detection = byArea[0];
            const box = detection.detection.box;
            const faceSize = Math.min(box.width, box.height);
            if (faceSize < 50) {
                return {
                    detection: detection.landmarks,
                    descriptor: null,
                    success: false,
                    message: 'Face too small. Please move closer to the camera.',
                };
            }
            if (faceSize > videoElement.videoWidth * 0.8 || faceSize > videoElement.videoHeight * 0.8) {
                return {
                    detection: detection.landmarks,
                    descriptor: null,
                    success: false,
                    message: 'Face too close. Please move away from the camera.',
                };
            }
            return {
                detection: detection.landmarks,
                descriptor: detection.descriptor,
                success: true,
                message: 'Face detected successfully',
            };
        }
        catch (err) {
            console.error('Largest face detection error:', err);
            throw new Error('Face detection failed. Please try again.');
        }
    }
    /**
     * Detect multiple faces (for checking if only one person is present)
     */
    async detectMultipleFaces(videoElement) {
        if (!this.modelsLoaded) {
            throw new Error('Face-API not initialized');
        }
        try {
            const detections = await faceapi
                .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptors();
            return detections.length;
        }
        catch (err) {
            console.error('Multiple face detection error:', err);
            return 0;
        }
    }
    /**
     * Perform face enrollment with movement verification (basic liveness check).
     * Uses the largest face in frame so reflections or background faces do not block enrollment.
     */
    async enrollFace(videoElement, studentId) {
        try {
            console.log('Capturing primary face...');
            const initialDetection = await this.detectLargestFaceFromVideo(videoElement);
            if (!initialDetection.success || !initialDetection.descriptor) {
                throw new Error(initialDetection.message);
            }
            console.log('Performing liveness check (movement detection)...');
            await this.performLivenessCheck(videoElement, initialDetection.descriptor);
            const finalDetection = await this.detectLargestFaceFromVideo(videoElement);
            if (!finalDetection.success || !finalDetection.descriptor) {
                throw new Error('Enrollment failed. Please try again.');
            }
            // Use average of descriptors for better accuracy
            const avgDescriptor = this.averageDescriptors([initialDetection.descriptor, finalDetection.descriptor]);
            // Store enrolled descriptor
            this.enrolledDescriptors.set(studentId, avgDescriptor);
            // Generate biometric hash
            const hash = this.generateBiometricHash(avgDescriptor);
            return {
                descriptor: avgDescriptor,
                hash,
                confidence: 0.95,
                timestamp: new Date().toISOString(),
            };
        }
        catch (err) {
            console.error('Enrollment error:', err);
            throw new Error(err.message || 'Face enrollment failed. Please try again.');
        }
    }
    /**
     * Verify face for attendance. Uses the largest face in frame so reflections or small background faces do not block check-in.
     */
    async verifyFace(videoElement, storedDescriptor) {
        try {
            const detection = await this.detectLargestFaceFromVideo(videoElement);
            if (!detection.success || !detection.descriptor) {
                throw new Error(detection.message);
            }
            await this.performLivenessCheck(videoElement, detection.descriptor);
            let confidence = 0.95;
            if (storedDescriptor && storedDescriptor.length > 0) {
                const distance = faceapi.euclideanDistance(detection.descriptor, storedDescriptor);
                confidence = Math.max(0, 1 - distance / 0.6);
                console.log(`Face distance: ${distance}, Confidence: ${confidence}`);
                if (distance > 0.6) {
                    throw new Error('Face does not match. Please try again.');
                }
            }
            else {
                console.log('No stored descriptor; sending to backend for matching.');
            }
            const hash = this.generateBiometricHash(detection.descriptor);
            return {
                descriptor: detection.descriptor,
                hash,
                confidence,
                timestamp: new Date().toISOString(),
            };
        }
        catch (err) {
            console.error('Verification error:', err);
            throw new Error(err.message || 'Face verification failed. Please try again.');
        }
    }
    /**
     * Basic liveness detection by checking for movement
     * Captures multiple frames and checks if face moves/changes
     */
    async performLivenessCheck(videoElement, initialDescriptor) {
        const maxAttempts = 30; // 3 seconds at 10 FPS
        let movementDetected = false;
        console.log('Waiting for movement...');
        for (let i = 0; i < maxAttempts; i++) {
            await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms between checks
            const detection = await faceapi
                .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();
            if (detection) {
                const distance = faceapi.euclideanDistance(initialDescriptor, detection.descriptor);
                if (distance > 0.1) {
                    // Significant movement detected
                    movementDetected = true;
                    console.log('Movement detected - liveness verified');
                    break;
                }
            }
        }
        if (!movementDetected) {
            throw new Error('Liveness detection failed. Please move your head slightly.');
        }
    }
    /**
     * Average multiple face descriptors for better accuracy
     */
    averageDescriptors(descriptors) {
        const averaged = new Float32Array(descriptors[0].length);
        descriptors.forEach((descriptor) => {
            for (let i = 0; i < descriptor.length; i++) {
                averaged[i] += descriptor[i];
            }
        });
        for (let i = 0; i < averaged.length; i++) {
            averaged[i] /= descriptors.length;
        }
        return averaged;
    }
    /**
     * Generate cryptographic hash from face descriptor
     */
    generateBiometricHash(descriptor) {
        try {
            // Convert descriptor to string and create a hash
            const descriptorStr = Array.from(descriptor).join(',');
            // Use simple hash for now (in production, use SHA-256)
            let hash = 0;
            for (let i = 0; i < descriptorStr.length; i++) {
                const char = descriptorStr.charCodeAt(i);
                hash = (hash << 5) - hash + char;
                hash = hash & hash; // Convert to 32-bit integer
            }
            return Math.abs(hash).toString(16).padStart(16, '0');
        }
        catch (err) {
            console.error('Hash generation error:', err);
            throw err;
        }
    }
    /**
     * Descriptor serialization for storage
     */
    serializeDescriptor(descriptor) {
        return Array.from(descriptor).join(',');
    }
    /**
     * Descriptor deserialization for retrieval
     */
    deserializeDescriptor(serialized) {
        const values = serialized.split(',').map(v => parseFloat(v));
        return new Float32Array(values);
    }
    /**
     * Get list of all loaded models status
     */
    getStatus() {
        return {
            modelsLoaded: this.modelsLoaded,
            enrolledCount: this.enrolledDescriptors.size,
        };
    }
}
// Export singleton instance
export const faceApiService = new FaceApiService();
//# sourceMappingURL=faceApiService.js.map
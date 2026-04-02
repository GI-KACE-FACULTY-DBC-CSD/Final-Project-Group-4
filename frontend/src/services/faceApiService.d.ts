/**
 * Face-API Service - Free facial recognition using TensorFlow.js
 * Handles face detection, recognition, and biometric hashing
 */
import * as faceapi from 'face-api.js';
interface FaceDetectionResult {
    detection: faceapi.FaceLandmarks68 | null;
    descriptor: Float32Array | null;
    success: boolean;
    message: string;
}
interface BiometricData {
    descriptor: Float32Array;
    hash: string;
    confidence: number;
    timestamp: string;
}
declare class FaceApiService {
    private modelsLoaded;
    private MODEL_PATH;
    private enrolledDescriptors;
    /**
     * Initialize face-api by loading required models
     */
    initialize(): Promise<void>;
    /**
     * Detect face from video stream
     */
    detectFaceFromVideo(videoElement: HTMLVideoElement): Promise<FaceDetectionResult>;
    /**
     * Detect multiple faces (for checking if only one person is present)
     */
    detectMultipleFaces(videoElement: HTMLVideoElement): Promise<number>;
    /**
     * Perform face enrollment with movement verification (basic liveness check)
     */
    enrollFace(videoElement: HTMLVideoElement, studentId: string): Promise<BiometricData>;
    /**
     * Verify face for attendance
     */
    verifyFace(videoElement: HTMLVideoElement, storedDescriptor: Float32Array): Promise<BiometricData>;
    /**
     * Basic liveness detection by checking for movement
     * Captures multiple frames and checks if face moves/changes
     */
    private performLivenessCheck;
    /**
     * Average multiple face descriptors for better accuracy
     */
    private averageDescriptors;
    /**
     * Generate cryptographic hash from face descriptor
     */
    generateBiometricHash(descriptor: Float32Array): string;
    /**
     * Descriptor serialization for storage
     */
    serializeDescriptor(descriptor: Float32Array): string;
    /**
     * Descriptor deserialization for retrieval
     */
    deserializeDescriptor(serialized: string): Float32Array;
    /**
     * Get list of all loaded models status
     */
    getStatus(): {
        modelsLoaded: boolean;
        enrolledCount: number;
    };
}
export declare const faceApiService: FaceApiService;
export {};
//# sourceMappingURL=faceApiService.d.ts.map
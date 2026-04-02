/**
 * FACEIO Service - Secure facial biometric authentication with active liveness detection
 * Handles enrollment, verification, and attendance marking with FACEIO SDK
 */
declare global {
    interface Window {
        faceIO: any;
    }
}
interface FaceIOEnrollmentResponse {
    faceioid: string;
    payload: string;
}
interface FaceIOVerificationResponse {
    faceioid: string;
    payload: string;
    confidence: number;
    isLiveness: boolean;
}
interface BiometricHash {
    hash: string;
    payload: string;
    timestamp: string;
    livenessScore: number;
}
declare class FaceIOService {
    private faceio;
    /**
     * Initialize FACEIO with your public application ID
     * Store this securely - preferably from backend config
     */
    initialize(publicId: string): Promise<void>;
    /**
     * Enroll a new face with automatic liveness detection
     * Returns FACEIO enrollment response with biometric hash for secure storage
     */
    enrollFace(): Promise<FaceIOEnrollmentResponse>;
    /**
     * Verify a face with automatic liveness detection for authentication
     * Returns FACEIO verification response with biometric payload
     */
    verifyFace(): Promise<FaceIOVerificationResponse>;
    /**
     * Generate a secure cryptographic hash of the biometric payload
     * This should be stored in the database instead of raw biometric data
     */
    generateBiometricHash(payload: string): BiometricHash;
    /**
     * Simple hash function for demonstration
     * In production, use Web Crypto API for SHA-256
     */
    private simpleHash;
    /**
     * Check if FACEIO SDK is available
     */
    isAvailable(): boolean;
    /**
     * Get current FACEIO status
     */
    getStatus(): Promise<{
        isInitialized: boolean;
        isSupported: boolean;
    }>;
    /**
     * Handle FACEIO errors gracefully
     */
    getErrorMessage(errorCode: string): string;
}
export declare const faceioService: FaceIOService;
export type { FaceIOEnrollmentResponse, FaceIOVerificationResponse, BiometricHash };
//# sourceMappingURL=faceioService.d.ts.map
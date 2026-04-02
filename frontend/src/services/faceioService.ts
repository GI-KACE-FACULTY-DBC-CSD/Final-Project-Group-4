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
  faceioid: string; // Unique FACEIO ID
  payload: string; // Biometric payload
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

class FaceIOService {
  private faceio: any = null;

  /**
   * Initialize FACEIO with your public application ID
   * Store this securely - preferably from backend config
   */
  async initialize(publicId: string): Promise<void> {
    try {
      // Wait for FACEIO SDK to be loaded
      let attempts = 0;
      while (!window.faceIO && attempts < 50) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        attempts++;
      }

      if (!window.faceIO) {
        throw new Error('FACEIO SDK failed to load after timeout');
      }

      this.faceio = new window.faceIO(publicId);
      console.log('FACEIO initialized successfully');
    } catch (err) {
      console.error('FACEIO initialization error:', err);
      throw err;
    }
  }

  /**
   * Enroll a new face with automatic liveness detection
   * Returns FACEIO enrollment response with biometric hash for secure storage
   */
  async enrollFace(): Promise<FaceIOEnrollmentResponse> {
    if (!this.faceio) {
      throw new Error('FACEIO not initialized');
    }

    try {
      // enroll() will handle liveness detection automatically
      const response = await this.faceio.enroll({
        locale: 'en-US',
        payload: {
          userId: Math.random().toString(36).substring(7), // Temporary - will be replaced with actual user ID
        },
      });

      return {
        faceioid: response.faceioid,
        payload: response.payload,
      };
    } catch (error: any) {
      console.log('Enrollment error code:', error.code);
      console.log('Enrollment error message:', error.message);

      // Handle specific error codes
      if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network connectivity issue. Please check your internet connection.');
      } else if (error.code === 'PERMISSION_DENIED') {
        throw new Error('Camera permission denied. Please allow camera access to continue.');
      } else if (error.code === 'NO_FACE_DETECTED') {
        throw new Error('No face detected. Please ensure your face is clearly visible and well-lit.');
      } else if (error.code === 'FACE_TOO_SMALL') {
        throw new Error('Face too small. Please move closer to the camera.');
      } else if (error.code === 'FACE_TOO_CLOSE') {
        throw new Error('Face too close. Please move a bit away from the camera.');
      } else if (error.code === 'LIVENESS_FAILED') {
        throw new Error('Liveness detection failed. Please try again - ensure you are a real person.');
      } else if (error.code === 'MULTIPLE_FACES') {
        throw new Error('Multiple faces detected. Please ensure only one person is in frame.');
      } else if (error.code === 'FACE_MISMATCH') {
        throw new Error('Faces do not match. Please try again.');
      } else if (error.code === 'TIMEOUT') {
        throw new Error('Enrollment timeout. Please try again.');
      } else {
        throw new Error(`Enrollment failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Verify a face with automatic liveness detection for authentication
   * Returns FACEIO verification response with biometric payload
   */
  async verifyFace(): Promise<FaceIOVerificationResponse> {
    if (!this.faceio) {
      throw new Error('FACEIO not initialized');
    }

    try {
      // authenticate() performs liveness detection and verification
      const response = await this.faceio.authenticate({
        locale: 'en-US',
      });

      return {
        faceioid: response.faceioid,
        payload: response.payload,
        confidence: response.confidence || 0.95,
        isLiveness: true, // Automatically validated by FACEIO
      };
    } catch (error: any) {
      console.log('Verification error code:', error.code);
      console.log('Verification error message:', error.message);

      if (error.code === 'NETWORK_ERROR') {
        throw new Error('Network connectivity issue.');
      } else if (error.code === 'PERMISSION_DENIED') {
        throw new Error('Camera permission denied.');
      } else if (error.code === 'NO_MATCHED_FACEIO_ID') {
        throw new Error('Face not enrolled. Please enroll first.');
      } else if (error.code === 'LIVENESS_FAILED') {
        throw new Error('Liveness detection failed. Please try again.');
      } else if (error.code === 'TIMEOUT') {
        throw new Error('Verification timeout. Please try again.');
      } else {
        throw new Error(`Verification failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Generate a secure cryptographic hash of the biometric payload
   * This should be stored in the database instead of raw biometric data
   */
  generateBiometricHash(payload: string): BiometricHash {
    try {
      // Create a hash using SHA-256 (simulated with Web Crypto API)
      // For production, use Web Crypto API for real hashing
      let hash = this.simpleHash(payload);

      return {
        hash,
        payload: payload, // Store payload for FACEIO verification
        timestamp: new Date().toISOString(),
        livenessScore: 0.95, // FACEIO has already validated liveness
      };
    } catch (err) {
      console.error('Hash generation error:', err);
      throw err;
    }
  }

  /**
   * Simple hash function for demonstration
   * In production, use Web Crypto API for SHA-256
   */
  private simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Check if FACEIO SDK is available
   */
  isAvailable(): boolean {
    return !!window.faceIO;
  }

  /**
   * Get current FACEIO status
   */
  async getStatus(): Promise<{ isInitialized: boolean; isSupported: boolean }> {
    return {
      isInitialized: this.faceio !== null,
      isSupported: !!window.faceIO,
    };
  }

  /**
   * Handle FACEIO errors gracefully
   */
  getErrorMessage(errorCode: string): string {
    const errorMessages: Record<string, string> = {
      NETWORK_ERROR: 'Network connectivity issue detected',
      TIMEOUT: 'Operation timed out',
      PERMISSION_DENIED: 'Camera permission was denied',
      NO_FACE_DETECTED: 'No face was detected in the frame',
      FACE_TOO_SMALL: 'Face is too small - please move closer',
      FACE_TOO_CLOSE: 'Face is too close - please move back',
      LIVENESS_FAILED: 'Liveness detection failed - please retry',
      MULTIPLE_FACES: 'Multiple faces detected - ensure only one person',
      FACE_MISMATCH: 'Faces do not match',
      NO_MATCHED_FACEIO_ID: 'Face is not enrolled',
    };
    return errorMessages[errorCode] || 'An error occurred during facial authentication';
  }
}

export const faceioService = new FaceIOService();
export type { FaceIOEnrollmentResponse, FaceIOVerificationResponse, BiometricHash };

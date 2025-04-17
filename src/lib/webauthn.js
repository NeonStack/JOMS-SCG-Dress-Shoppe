import { startAuthentication } from '@simplewebauthn/browser';

/**
 * Checks if WebAuthn is supported in the current browser
 */
export function isWebAuthnSupported() {
  try {
    return window && window.PublicKeyCredential !== undefined;
  } catch (error) {
    console.error("Error checking WebAuthn support:", error);
    return false;
  }
}

/**
 * Detects if running on Android device
 */
export function isAndroid() {
  return typeof window !== 'undefined' && /android/i.test(window.navigator.userAgent);
}

/**
 * Checks if the device has a platform authenticator (fingerprint, face ID, PIN)
 * Android has special handling since it sometimes returns false incorrectly
 */
export async function hasAuthenticator() {
  if (!isWebAuthnSupported()) {
    return false;
  }
  
  // Android often returns false for platform authenticator check even though 
  // fingerprint is available, so we'll assume it's available on Android
  if (isAndroid()) {
    console.log("Android device detected, assuming authenticator available");
    return true;
  }
  
  try {
    // Check if platform authenticator is available for non-Android devices
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return false;
  } catch (error) {
    console.error("Error checking for authenticator:", error);
    return false;
  }
}

/**
 * Requests biometric authentication from the device
 * Modified to handle Android authentication better
 */
export async function verifyBiometric() {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser");
  }

  try {
    // Create simple authentication options
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);
    
    // Define authentication options based on device type
    const authOptions = {
      challenge: challenge.buffer,
      timeout: 60000, // 1 minute
      rpId: window.location.hostname,
      userVerification: "required", // Requires biometric or PIN
    };
    
    // For Android, we need to be more permissive with the options
    if (isAndroid()) {
      console.log("Using Android-specific WebAuthn configuration");
      // Android Chrome might not work well with some options
      authOptions.userVerification = "preferred";
    }

    // This will trigger the device's biometric verification
    const credential = await startAuthentication(authOptions);
    return credential;
  } catch (error) {
    console.error("Biometric verification failed", error);
    throw error;
  }
}

/**
 * Creates a credential for the current user
 * This should be called when setting up WebAuthn for a user
 */
export async function registerBiometric(userId, username) {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser");
  }

  // Generate a random challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);

  // Create credential options
  const createOptions = {
    challenge,
    rp: {
      name: "SCG Dress Shoppe JOMS",
      id: window.location.hostname,
    },
    user: {
      id: new TextEncoder().encode(userId),
      name: username,
      displayName: username,
    },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 }, // ES256
      { type: "public-key", alg: -257 }, // RS256
    ],
    timeout: 60000,
    authenticatorSelection: {
      authenticatorAttachment: "platform", // Use built-in authenticator like fingerprint reader
      userVerification: "required", // Requires the user to verify with biometric or PIN
    },
    attestation: "none",
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: createOptions,
    });
    return credential;
  } catch (error) {
    console.error("Biometric registration failed", error);
    throw error;
  }
}

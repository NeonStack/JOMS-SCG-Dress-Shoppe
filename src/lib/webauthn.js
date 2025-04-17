import { startAuthentication } from '@simplewebauthn/browser';

/**
 * Checks if the environment is Android
 */
export function isAndroid() {
  return typeof window !== 'undefined' && /android/i.test(window.navigator.userAgent);
}

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
 * Checks if the device has a platform authenticator (fingerprint, face ID, PIN)
 */
export async function hasAuthenticator() {
  if (!isWebAuthnSupported()) {
    return false;
  }
  
  try {
    // Check if platform authenticator is available
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
 * Optimized for Android compatibility
 */
export async function verifyBiometric() {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser");
  }

  // Generate a random challenge
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  
  // Special handling for Android
  const isAndroidDevice = isAndroid();

  try {
    console.log("Starting biometric verification", isAndroidDevice ? "on Android" : "on non-Android");
    
    // Basic options that work across platforms
    const authOptions = {
      publicKey: {
        challenge: challenge.buffer,
        timeout: 60000,
        userVerification: isAndroidDevice ? "preferred" : "required",
        // Empty allowCredentials list to allow any credential
        allowCredentials: [],
      }
    };

    // For Android, we need to set rpId to avoid issues
    if (isAndroidDevice) {
      authOptions.publicKey.rpId = window.location.hostname;
    }

    console.log("Authentication options:", JSON.stringify({
      ...authOptions.publicKey,
      challenge: "[Challenge Buffer]"
    }, null, 2));
    
    // This will trigger the fingerprint prompt
    const credential = await navigator.credentials.get(authOptions);
    
    console.log("Credential received:", credential ? "success" : "null");
    return credential;
  } catch (error) {
    console.error("Biometric verification error:", error);
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

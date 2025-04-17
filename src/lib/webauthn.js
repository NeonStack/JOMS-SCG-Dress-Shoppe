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
 * Creates a random challenge for WebAuthn
 */
function createChallenge() {
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  return challenge;
}

/**
 * Requests fingerprint authentication specifically on Android
 */
export async function verifyBiometric() {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser");
  }

  const isAndroidDevice = isAndroid();
  const challenge = createChallenge();

  try {
    console.log("Attempting biometric verification on", isAndroidDevice ? "Android" : "non-Android device");
    
    // Configure options specifically for fingerprint on Android
    // This approach avoids triggering the passkey selection UI
    const options = {
      publicKey: {
        challenge: challenge.buffer,
        timeout: 60000,
        // For Android fingerprint, we need to set this to discouraged to avoid passkeys
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          requireResidentKey: false,
          userVerification: "required"
        },
        // Using an empty allowCredentials forces the browser to use the platform authenticator (fingerprint)
        allowCredentials: [],
        // This helps on Android to specify we want fingerprint
        extensions: {
          uvm: true
        }
      }
    };
    
    if (isAndroidDevice) {
      // Set specific Android options
      options.publicKey.rpId = window.location.hostname;
    }
    
    console.log("Authentication options:", JSON.stringify({
      ...options.publicKey,
      challenge: "[Challenge Buffer]"
    }));

    // This is a workaround for Android - we'll use "get" which works better for fingerprint
    // than "create" on many Android devices
    const credential = await navigator.credentials.get(options);
    
    console.log("Authentication successful");
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

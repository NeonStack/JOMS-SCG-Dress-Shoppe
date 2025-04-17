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
 * Generates a random user ID for WebAuthn 
 */
function generateRandomUserId() {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return array;
}

/**
 * Convert a string to an ArrayBuffer
 */
function stringToBuffer(str) {
  return new TextEncoder().encode(str);
}

/**
 * A simplified approach that uses fingerprint directly on Android
 * This creates a temporary credential specific for this authentication check
 */
export async function verifyBiometric(userId = null) {
  if (!isWebAuthnSupported()) {
    throw new Error("WebAuthn is not supported in this browser");
  }

  // This userId is just for the temporary credential
  const tempUserId = userId || generateRandomUserId();
  const challenge = new Uint8Array(32);
  window.crypto.getRandomValues(challenge);
  
  // Device identifier
  const deviceId = `${window.navigator.userAgent.replace(/\W+/g, '_').toLowerCase()}_${window.location.hostname}`;
  
  try {
    console.log("Starting fingerprint verification");
    
    // For Android, we create a temporary authenticator that forces fingerprint use
    const createOptions = {
      publicKey: {
        challenge: challenge.buffer,
        rp: {
          name: "SCG Dress Shoppe JOMS",
          id: window.location.hostname
        },
        user: {
          id: typeof tempUserId === 'string' ? stringToBuffer(tempUserId) : tempUserId,
          name: `temp_auth_${deviceId}`,
          displayName: "Temporary Authentication"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 } // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Use built-in authenticator like fingerprint
          userVerification: "required",
          residentKey: "discouraged", // Avoid passkeys
          requireResidentKey: false // Avoid passkeys
        },
        excludeCredentials: [], // Prevent conflicts with existing credentials
        attestation: "none"
      }
    };
    
    console.log("Creating temporary credential to force fingerprint...");
    const credential = await navigator.credentials.create(createOptions);
    
    if (credential) {
      console.log("Fingerprint verification successful");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Fingerprint verification error:", error);
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

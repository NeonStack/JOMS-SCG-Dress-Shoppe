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
 * More robust implementation to handle edge cases
 */
export async function hasAuthenticator() {
  if (!isWebAuthnSupported()) {
    return false;
  }
  
  try {
    // First check using the standard API
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      // Secondary test - some devices incorrectly report availability
      if (available) {
        try {
          // Try to create a temporary credential to verify if platform authenticator really works
          const tempUserId = new Uint8Array(16);
          window.crypto.getRandomValues(tempUserId);
          
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          const options = {
            publicKey: {
              challenge: challenge.buffer,
              rp: { name: "Verification Check", id: window.location.hostname },
              user: {
                id: tempUserId,
                name: "verification_check",
                displayName: "Verification Check",
              },
              pubKeyCredParams: [
                { type: "public-key", alg: -7 },
                { type: "public-key", alg: -257 },
              ],
              timeout: 2000, // Short timeout for quick check
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
              },
            }
          };
          
          // Just checking if the request starts - we don't wait for user interaction
          const abortController = new AbortController();
          const signal = abortController.signal;
          
          const credPromise = navigator.credentials.create({ ...options, signal });
          
          // We immediately abort - we're just checking if the API works
          setTimeout(() => abortController.abort(), 100);
          
          try {
            await credPromise;
            console.log("Platform authenticator seems to work");
            return true;
          } catch (e) {
            // If we get an abort error, that's good - it means the API was working before we aborted
            if (e.name === 'AbortError' || e.name === 'NotAllowedError') {
              console.log("Platform authenticator API responded before abort");
              return true;
            }
            
            // If we get other errors, the device might not have a real authenticator
            console.warn("Platform authenticator test failed:", e);
            return false;
          }
        } catch (testError) {
          console.warn("Platform authenticator verification error:", testError);
          // Fall back to the initial API result
          return available;
        }
      }
      
      return available;
    }
    return false;
  } catch (error) {
    console.error("Error checking for platform authenticator:", error);
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
 * A simplified approach that uses device verification for authentication check
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
    console.log("Starting device verification");
    
    // We create a temporary authenticator that requires user verification
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
          displayName: "Device Owner Verification"
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 }, // ES256
          { type: "public-key", alg: -257 } // RS256
        ],
        timeout: 60000,
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Use built-in authenticator
          userVerification: "required", // Requires verification (fingerprint, PIN, etc)
          residentKey: "discouraged", // Avoid passkeys
          requireResidentKey: false // Avoid passkeys
        },
        excludeCredentials: [], // Prevent conflicts with existing credentials
        attestation: "none"
      }
    };
    
    console.log("Creating temporary credential to verify device ownership...");
    const credential = await navigator.credentials.create(createOptions);
    
    if (credential) {
      console.log("Device verification successful");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Device verification error:", error);
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

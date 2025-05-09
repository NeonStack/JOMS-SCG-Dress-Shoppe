<script>
  import { enhance } from "$app/forms";
  import {
    isWebAuthnSupported,
    verifyBiometric,
    hasAuthenticator,
    isAndroid,
  } from "$lib/webauthn";
  import { onMount } from "svelte";
  import { slide, fade, draw } from "svelte/transition";

  let username = "";
  let password = "";
  let showPassword = false;
  let loginError = "";
  let loading = false;
  let biometricSupported = false;
  let platformAuthenticatorAvailable = false;
  let showBiometricPrompt = false;
  let userId = "";
  let userRole = "";
  let verificationAttempts = 0;
  let isAndroidDevice = false;
  let checkingCapabilities = true;
  let showingVerificationUI = false;
  let attemptingLogin = false;
  let loginState = "initial"; // initial, authenticating, verification, redirecting
  let loginMessage = "";

  // Homepage toggle
  let showHomepage = true; // Start with homepage view
  let transitioning = false;

  // Updated features with detailed descriptions and Iconify icons
  const adminFeatures = [
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22 21H2V3h2v16h2v-9h4v9h2V6h4v13h2v-5h4z"/>
        </svg>
      `,
      title: "AI Sales Forecasting",
      description:
        "View monthly and yearly income projections powered by the Prophet algorithm. Includes prediction bounds for data-driven planning and seasonality awareness.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
        </svg>
      `,
      title: "Admin Dashboard & Analytics",
      description:
        "Monitor order volume, payment breakdowns, order status counts, and overdue metrics. Visual breakdowns for smarter decision-making.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5S5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05c1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      `,
      title: "Tailor Performance Monitoring",
      description:
        "Track each employee's order completion history, volume, and timelines. Identify top performers and support performance-based decision making.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1s-1-.45-1-1s.45-1 1-1zm-2 14l-4-4l1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
        </svg>
      `,
      title: "Order Management",
      description:
        "Access all customer orders. Assign orders to tailors, update status, manage due dates and payments. Generate receipts with QR codes.",
    },
  ];

  const moreAdminFeatures = [
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm6.5 1.5h-2v-2H18v2h2v1.5h-2v2h-1.5v-2h-2v-1.5h2v-2H18v2z"/>
        </svg>
      `,
      title: "Student Records Management",
      description:
        "Centralized system for student profiles. Includes gender, course, measurements, order history, and contact info.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8-1.79 8-4v-1.7c-.4.21-.82.41-1.26.59c-1.87.76-4.2 1.11-6.74 1.11c-2.55 0-4.88-.35-6.75-1.11A9.24 9.24 0 0 1 4 12.3V14c0 2.21 3.58 4 8 4m0-18C7.58 4 4 5.79 4 8c0 1.19 1.06 2.23 2.71 2.94c1.66.72 3.81 1.06 5.29 1.06c1.47 0 3.63-.34 5.29-1.06C18.94 10.23 20 9.19 20 8c0-2.21-3.59-4-8-4"/>
        </svg>
      `,
      title: "Uniform Configuration",
      description:
        "Define pricing logic per course, gender, and wear type. Set measurement specifications and additional per-cm charges.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3l7 3V5c0-1.1-.9-2-2-2zm0 14.97l-4.21-1.81l-.79-.34l-.79.34L7 17.97V5h10v12.97z"/>
        </svg>
      `,
      title: "Course & Measurement Type Management",
      description:
        "Add and update academic courses and measurement categories. Keeps measurement options consistent across orders.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
        </svg>
      `,
      title: "Admin Role & Access Control",
      description:
        "Assign and revoke access to specific routes and modules. Manage superadmin/admin roles via admin_permissions.",
    },
  ];

  const tailorFeatures = [
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="m21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4S7 4.67 7 5.5S6.33 7 5.5 7z"/>
        </svg>
      `,
      title: "Assigned Orders",
      description:
        "View and manage only the orders assigned to them. Track deadlines, order status, and update progress accordingly.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2m-7 15h-2v-4H6v-2h4V8h2v4h4v2h-4z"/>
        </svg>
      `,
      title: "Tailor Dashboard",
      description:
        "See a personalized overview of current tasks, in-progress jobs, and order summaries. Fast access to important work data.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5S14 7.01 14 9.5S11.99 14 9.5 14z"/>
        </svg>
      `,
      title: "Student Lookup",
      description:
        "Quickly search for student profiles. View and update measurements as needed for order accuracy.",
    },
    {
      icon: `
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      `,
      title: "Profile Management",
      description:
        "Update personal details like contact info, address, and position. Review work history via linked orders.",
    },
  ];

  const securityFeature = {
    icon: `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12c5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4l1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
    `,
    title: "Device Ownership Verification",
    description:
      "When logging in, the system checks if the device supports platform-level authentication. If supported, the user must prove ownership before proceeding.",
  };

  function loadViewPreference() {
    if (typeof window !== "undefined") {
      const storedPreference = localStorage.getItem("joms-view-preference");
      // Only update if a preference exists
      if (storedPreference !== null) {
        showHomepage = storedPreference === "homepage";
      }
    }
  }

  // Function to save the user's preference to localStorage
  function saveViewPreference(isHomepage) {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "joms-view-preference",
        isHomepage ? "homepage" : "signin"
      );
    }
  }

  // Smooth transition between homepage and login
  function toggleView() {
    if (transitioning) return;
    transitioning = true;

    // Immediately change state without waiting
    showHomepage = !showHomepage;

    saveViewPreference(showHomepage);

    // Reset transitioning flag after a minimal duration
    setTimeout(() => {
      transitioning = false;
    }, 100);
  }

  // Check WebAuthn support on mount with better Android handling
  onMount(async () => {
    isAndroidDevice = isAndroid();
    biometricSupported = isWebAuthnSupported();

    if (biometricSupported) {
      try {
        // For Android, we need to make a special assumption
        if (isAndroidDevice) {
          platformAuthenticatorAvailable = true;
          console.log("Android device detected, assuming biometrics available");
        } else {
          platformAuthenticatorAvailable = await hasAuthenticator();
          console.log(
            "Platform authenticator available:",
            platformAuthenticatorAvailable
          );
        }
      } catch (error) {
        console.error("Error checking authenticator:", error);
        platformAuthenticatorAvailable = false;
      }
    } else {
      platformAuthenticatorAvailable = false;
    }

    checkingCapabilities = false;
    console.log("Final device capabilities:", {
      isAndroidDevice,
      biometricSupported,
      platformAuthenticatorAvailable,
    });

    // If we're already at the biometric prompt and device doesn't support verification,
    // automatically proceed to dashboard without showing any UI
    if (
      showBiometricPrompt &&
      (!biometricSupported || !platformAuthenticatorAvailable)
    ) {
      console.log(
        "Device doesn't have verification capabilities, proceeding directly"
      );
      loginState = "redirecting";
      loginMessage = "Taking you to your dashboard...";
      proceedWithoutVerification();
    } else if (
      showBiometricPrompt &&
      biometricSupported &&
      platformAuthenticatorAvailable
    ) {
      // Only show the verification UI if device actually has capabilities
      loginState = "verification";
      showingVerificationUI = true;
    }
  });

  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }

  async function handleBiometricVerification() {
    verificationAttempts++;
    loginError = "";
    loading = true;

    try {
      console.log("Starting device verification attempt", verificationAttempts);
      // Pass userId to help identify the temporary credential
      await verifyBiometric(userId);

      console.log("Device verification successful");
      // Submit form for server-side verification
      const form = document.getElementById("biometric-form");
      form.elements.verified.value = "true";
      form.submit();
    } catch (error) {
      console.error("Device verification failed:", error);

      if (error.name === "NotAllowedError") {
        loginError = "Verification was denied. Please try again.";
      } else if (error.name === "NotSupportedError") {
        loginError = "Your device doesn't support this verification method.";
        // Auto-proceed to dashboard if verification isn't available
        proceedWithoutVerification();
      } else if (verificationAttempts >= 3) {
        loginError =
          "Too many failed verification attempts. You will be signed out.";

        // After 3 attempts, force sign out
        setTimeout(() => {
          window.location.href = "/signout";
        }, 1500);
      } else {
        loginError = "Verification failed. Please try again.";
      }
    } finally {
      loading = false;
    }
  }

  // Function to proceed without verification
  function proceedWithoutVerification() {
    loginState = "redirecting";
    loginMessage = "Taking you to your dashboard...";
    const form = document.getElementById("biometric-form");
    form.elements.verified.value = "true";
    form.elements.skipBiometric.value = "true";
    form.submit();
  }

  const handleEnhance = () => {
    loading = true;
    attemptingLogin = true;
    loginState = "authenticating";
    loginMessage = "Signing you in...";

    return async ({ result }) => {
      attemptingLogin = false;

      if (result.type === "success") {
        if (result.data?.requiresBiometric) {
          // Store biometric info for admin/superadmin
          showBiometricPrompt = true;
          userId = result.data.userId;
          userRole = result.data.role;

          // Check if device supports biometrics
          if (checkingCapabilities) {
            loginState = "authenticating";
            loginMessage = "Checking device capabilities...";

            // Set a timer to check again after capabilities detection completes
            setTimeout(function checkCapabilities() {
              if (!checkingCapabilities) {
                if (!biometricSupported || !platformAuthenticatorAvailable) {
                  console.log(
                    "Device confirmed to not support security verification, proceeding directly"
                  );
                  proceedWithoutVerification();
                } else {
                  loginState = "verification";
                  showingVerificationUI = true;
                }
              } else {
                setTimeout(checkCapabilities, 100);
              }
            }, 100);
          } else if (!biometricSupported || !platformAuthenticatorAvailable) {
            // Device doesn't support biometrics, proceed without showing verification UI
            console.log(
              "Device doesn't support security verification, proceeding directly"
            );
            proceedWithoutVerification();
          } else {
            // Device has verification capabilities, show the UI
            loginState = "verification";
            showingVerificationUI = true;
          }

          loading = false;
          return;
        } else if (result.location) {
          // No biometric needed, redirect
          loginState = "redirecting";
          loginMessage = "Taking you to your dashboard...";
          window.location.href = result.location;
          return;
        }
      }

      if (result.type === "redirect") {
        loginState = "redirecting";
        loginMessage = "Redirecting...";
        window.location.href = result.location || "/";
        return;
      }

      if (result.type === "failure") {
        loginError = result.data?.error || "Failed to sign in";
        loginState = "initial";
      }
      loading = false;
    };
  };

  // Function to handle sign-out directly
  function handleSignOut(event) {
    event.preventDefault();

    // Clear cookies client-side first
    document.cookie =
      "sb-access-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "sb-refresh-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie =
      "biometric-verified=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Then navigate away immediately without waiting for the server
    window.location.href = "/";

    // As a fallback, still submit the request to the server
    setTimeout(() => {
      fetch("/signout", { method: "GET", credentials: "include" }).catch(
        () => {}
      ); // Ignore any errors
    }, 0);
  }

  // Function to render a feature card
  function renderFeatureCard(feature, style = "admin") {
    const bgClass =
      style === "tailor"
        ? "bg-gray-50 hover:bg-white"
        : "bg-white hover:bg-gray-50";

    return `
      <div class="${bgClass} transition-all rounded-xl p-6 border-2 border-gray-200 hover:border-primary shadow-md hover:shadow-lg overflow-hidden relative group">
        <div class="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary to-accent transform origin-left transition-transform duration-300 scale-x-0 group-hover:scale-x-100"></div>
        <div class="flex items-start">
          <div class="text-primary p-3 bg-primary/5 rounded-lg mr-4 group-hover:bg-primary/10 transition-all">${feature.icon}</div>
          <div>
            <h3 class="text-xl font-bold mb-2 text-foreground">
              ${feature.title}
            </h3>
            <p class="text-secondary leading-relaxed">${feature.description}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Function to render security feature card with additional label
  function renderSecurityFeatureCard(feature) {
    return `
      <div class="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-primary shadow-md hover:shadow-lg overflow-hidden relative group transition-all">
        <div class="flex items-start">
          <div class="text-primary p-3 bg-primary/5 rounded-lg mr-4 group-hover:bg-primary/10 transition-all">${feature.icon}</div>
          <div>
            <div class="inline-block px-3 py-1 bg-primary/10 rounded-full text-primary font-medium mb-2">
              Security Feature
            </div>
            <h3 class="text-xl font-bold mb-2 text-foreground">
              ${feature.title}
            </h3>
            <p class="text-secondary leading-relaxed">${feature.description}</p>
          </div>
        </div>
      </div>
    `;
  }

  // Animation states for decorative elements
  let heroCircle1AnimState = { x: 0, y: 0, delay: 0 };
  let heroCircle2AnimState = { x: 0, y: 0, delay: 300 };
  let signInCircle1AnimState = { x: 0, y: 0, scale: 1, delay: 100 };
  let signInCircle2AnimState = { x: 0, y: 0, scale: 1, delay: 400 };

  // Function to animate decorative circles with subtle random movement
  function animateCircles() {
    // Helper to get random movement values
    const getRandomMovement = (min, max) => Math.random() * (max - min) + min;

    // Update hero circles position
    heroCircle1AnimState = {
      x: getRandomMovement(-8, 8),
      y: getRandomMovement(-8, 8),
      delay: getRandomMovement(0, 300),
    };

    heroCircle2AnimState = {
      x: getRandomMovement(-8, 8),
      y: getRandomMovement(-8, 8),
      delay: getRandomMovement(0, 300),
    };

    // Update signin page circles
    signInCircle1AnimState = {
      x: getRandomMovement(-10, 10),
      y: getRandomMovement(-10, 10),
      scale: getRandomMovement(0.95, 1.05),
      delay: getRandomMovement(0, 300),
    };

    signInCircle2AnimState = {
      x: getRandomMovement(-15, 15),
      y: getRandomMovement(-15, 15),
      scale: getRandomMovement(0.9, 1.1),
      delay: getRandomMovement(0, 300),
    };

    // Schedule next animation
    setTimeout(animateCircles, 6000);
  }

  onMount(() => {
    loadViewPreference();

    // Start the circle animations after a short delay
    setTimeout(animateCircles, 1000);
  });
</script>

<div class="min-h-screen bg-white">
  <!-- Updated navigation with proper transitions -->
  <header
    class="w-full py-4 px-6 md:px-10 bg-white shadow-md border-b-4 border-primary"
  >
    <div
      class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div>
        <img
          on:click={() => {
            if (!showHomepage) toggleView();
          }}
          src="./SCGHorizontal.png"
          alt="SCG logo"
          class="h-10 sm:h-12 md:h-14 w-auto"
        />
      </div>
      <div class="flex items-center">
        <div
          class="inline-flex rounded-lg overflow-hidden border-2 border-primary relative"
        >
          <!-- Track background -->
          <div class="absolute inset-0 bg-white"></div>

          <!-- Sliding active background -->
          <div
            class="absolute top-0 bottom-0 w-1/2 bg-primary transition-all duration-300 ease-in-out rounded-sm"
            style={`left: ${showHomepage ? "0" : "50%"}`}
            transition:slide={{ duration: 200 }}
          ></div>

          <!-- Buttons -->
          <button
            on:click={() => {
              if (!showHomepage) toggleView();
            }}
            class="px-4 py-2 font-medium text-sm transition-all duration-200 z-10 relative"
            class:text-white={showHomepage}
            class:text-primary={!showHomepage}
          >
            Home
          </button>
          <button
            on:click={() => {
              if (showHomepage) toggleView();
            }}
            class="px-4 py-2 font-medium text-sm transition-all duration-200 z-10 relative"
            class:text-white={!showHomepage}
            class:text-primary={showHomepage}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  </header>

  <div id="main-container" class="w-full">
    {#if showHomepage}
      <!-- Homepage Content with improved features section -->
      <div
        class="overflow-x-hidden w-full flex flex-col"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 150 }}
      >
        <!-- Hero section with animated circles -->
        <section
          class="w-full flex-1 flex flex-col items-center justify-center px-6 py-24 md:py-32 relative"
        >
          <!-- Decorative background elements with animation -->
          <div
            class="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 floating-circle"
            style="transform: translate({heroCircle1AnimState.x}px, {heroCircle1AnimState.y}px); transition-delay: {heroCircle1AnimState.delay}ms;"
          ></div>
          <div
            class="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full translate-y-1/3 -translate-x-1/4 floating-circle"
            style="transform: translate({heroCircle2AnimState.x}px, {heroCircle2AnimState.y}px); transition-delay: {heroCircle2AnimState.delay}ms;"
          ></div>

          <div class="max-w-6xl mx-auto text-center relative z-10">
            <div
              class="inline-block mb-8 px-4 py-1 bg-primary/10 rounded-full text-primary font-semibold"
            >
              SCG Dress Shoppe
            </div>

            <h1
              class="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6"
            >
              Job Order <span class="text-primary">Monitoring</span> System
            </h1>
            <p
              class="text-xl md:text-2xl text-secondary mb-10 max-w-3xl mx-auto"
            >
              A comprehensive platform for managing student uniform orders,
              measurements, and tailoring operations.
            </p>
            <button
              on:click={toggleView}
              class="bg-primary text-accent-foreground hover:bg-accent-hover py-3 md:py-4 px-8 md:px-10 rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all text-lg shadow-lg"
            >
              Sign In to Continue
            </button>

            <!-- Colorful accent line -->
            <div
              class="max-w-xs mx-auto mt-16 h-1 bg-gradient-to-r from-primary to-accent"
            ></div>
          </div>
        </section>

        <!-- For Administrators Section - Removed emoji -->
        <section class="w-full py-16 px-6 bg-gray-50">
          <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12">
              <div
                class="inline-block px-4 py-1 bg-primary/10 rounded-full text-primary font-medium mb-4"
              >
                For Administrators
              </div>
              <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Powerful Management Tools
              </h2>
              <div class="h-1 w-24 bg-primary mx-auto"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {#each adminFeatures as feature}
                {@html renderFeatureCard(feature, "admin")}
              {/each}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {#each moreAdminFeatures as feature}
                {@html renderFeatureCard(feature, "admin")}
              {/each}
            </div>
          </div>
        </section>

        <!-- For Tailors Section - Removed emoji -->
        <section class="w-full py-16 px-6 bg-white">
          <div class="max-w-6xl mx-auto">
            <div class="text-center mb-12">
              <div
                class="inline-block px-4 py-1 bg-primary/10 rounded-full text-primary font-medium mb-4"
              >
                For Tailors
              </div>
              <h2 class="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Workflow Tools
              </h2>
              <div class="h-1 w-24 bg-primary mx-auto"></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              {#each tailorFeatures as feature}
                {@html renderFeatureCard(feature, "tailor")}
              {/each}
            </div>
          </div>
        </section>

        <!-- Security Feature Section - Removed emoji -->
        <section class="w-full py-12 px-6 bg-gray-50 border-t border-gray-200">
          <div class="max-w-6xl mx-auto">
            {@html renderSecurityFeatureCard(securityFeature)}
          </div>
        </section>

        <!-- Footer section with gradient accent -->
        <footer
          class="w-full py-10 md:py-8 px-6 md:px-10 bg-white border-t border-gray-200"
        >
          <div class="max-w-6xl mx-auto">
            <div
              class="h-1 w-full bg-gradient-to-r from-primary to-accent mb-8"
            ></div>
            <div class="flex flex-col md:flex-row justify-between items-center">
              <div class="mb-4 md:mb-0">
                <p class="text-secondary">
                  SCG Dress Shoppe &copy; {new Date().getFullYear()}
                </p>
              </div>
              <div>
                <p class="text-primary font-medium">
                  JOMS v1.0 - Job Order Monitoring System
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    {:else}
      <!-- Sign In Content -->
      <div
        class="flex items-center justify-center min-h-[calc(100vh-88px)] p-4 bg-white"
        in:fade={{ duration: 200 }}
        out:fade={{ duration: 150 }}
      >
        <div class="max-w-6xl mx-auto w-full">
          <div
            class="flex flex-col-reverse lg:flex-row overflow-hidden rounded-2xl shadow-xl border-2 border-primary"
          >
            <!-- Left panel with brand colors and animated circles -->
            <div
              class="lg:w-5/12 hidden lg:block bg-gradient-to-br from-primary to-accent p-8 md:p-12 text-white relative"
            >
              <div class="mt-4 relative z-10">
                <h2 class="text-3xl font-bold text-white mb-6">Welcome Back</h2>
                <p class="text-white/80 mb-3">
                  Sign in to access your JOMS account and manage your tailoring
                  operations.
                </p>
                <p class="text-white/80 mb-6">
                  This system is exclusively for SCG Dress Shoppe employees.
                </p>
                <p class="text-sm text-white/70">
                  If you're having trouble logging in, please contact the admin.
                </p>
              </div>

              <!-- Decorative elements with animation -->
              <div class="mt-20 relative">
                <div
                  class="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full floating-circle"
                  style="transform: translate({signInCircle1AnimState.x}px, {signInCircle1AnimState.y}px) scale({signInCircle1AnimState.scale}); transition-delay: {signInCircle1AnimState.delay}ms;"
                ></div>
                <div
                  class="absolute bottom-12 right-12 w-16 h-16 bg-white/10 rounded-full floating-circle"
                  style="transform: translate({signInCircle2AnimState.x}px, {signInCircle2AnimState.y}px) scale({signInCircle2AnimState.scale}); transition-delay: {signInCircle2AnimState.delay}ms;"
                ></div>
                <p class="text-white/90 text-sm relative z-10">
                  JOMS v1.0 - Job Order Monitoring System
                </p>
              </div>
            </div>

            <!--right panel for sign in form -->
            <div class="lg:w-7/12 bg-white p-8 md:p-12">
              <h2 class="text-3xl font-bold text-primary mb-10 text-center">
                Sign In
              </h2>

              {#if loginError}
                <div
                  class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
                  role="alert"
                >
                  <span class="block sm:inline">{loginError}</span>
                </div>
              {/if}

              <!-- Use loginState to control what UI is shown -->
              {#if loginState === "verification" && showingVerificationUI}
                <!-- Verification UI -->
                <div class="text-center">
                  <div
                    class="w-24 h-24 mx-auto mb-8 bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-12 w-12 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                      />
                    </svg>
                  </div>
                  <h3 class="text-xl font-semibold mb-4">Verify Your Device</h3>
                  <p class="mb-6 text-secondary">
                    For security purposes, please verify that you are the owner
                    of this device.
                  </p>

                  <button
                    on:click={handleBiometricVerification}
                    disabled={loading}
                    class="w-full bg-primary text-accent-foreground py-3 rounded-lg font-semibold hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 transition-all disabled:opacity-50"
                  >
                    {#if loading}
                      <svg
                        class="animate-spin h-5 w-5 mx-auto"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    {:else}
                      Verify Device Ownership
                    {/if}
                  </button>

                  <a
                    href="/signout"
                    class="text-red-500 hover:underline block mt-6"
                    on:click={handleSignOut}
                  >
                    Sign Out
                  </a>
                </div>
              {:else if loginState === "authenticating" || loginState === "redirecting"}
                <!-- Loading/waiting UI -->
                <div class="text-center py-10">
                  <div
                    class="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-primary border-t-transparent animate-spin"
                  ></div>
                  <p class="text-lg text-primary font-medium">{loginMessage}</p>
                </div>
              {:else}
                <!-- Initial login form -->
                <form
                  class="space-y-6"
                  method="POST"
                  action="?/signin"
                  use:enhance={handleEnhance}
                >
                  <div>
                    <label
                      for="username"
                      class="block text-sm font-medium text-foreground mb-2"
                      >Username</label
                    >
                    <div class="relative">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        bind:value={username}
                        disabled={loading || attemptingLogin}
                        class="w-full pl-10 px-4 py-3 rounded-lg border border-gray-600 focus:border-primary bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                        placeholder="Enter your username"
                        required
                      />
                    </div>
                  </div>

                  <div class="relative">
                    <label
                      for="password"
                      class="block text-sm font-medium text-foreground mb-2"
                      >Password</label
                    >
                    <div class="relative">
                      <div
                        class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      {#if showPassword}
                        <input
                          type="text"
                          id="password"
                          name="password"
                          bind:value={password}
                          disabled={loading || attemptingLogin}
                          class="w-full pl-10 px-4 py-3 pr-10 rounded-lg border border-gray-600 focus:border-primary bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                          placeholder="Enter your password"
                          required
                          autocomplete="off"
                        />
                      {:else}
                        <input
                          type="password"
                          id="password"
                          name="password"
                          bind:value={password}
                          disabled={loading || attemptingLogin}
                          class="w-full pl-10 px-4 py-3 pr-10 rounded-lg border border-gray-600 focus:border-primary bg-white text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                          placeholder="Enter your password"
                          required
                          autocomplete="off"
                        />
                      {/if}
                      <button
                        type="button"
                        class="absolute inset-y-0 right-0 pr-3 flex items-center focus-visible:outline-none"
                        disabled={loading || attemptingLogin}
                        on:click={togglePasswordVisibility}
                      >
                        {#if showPassword}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 text-primary"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fill-rule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clip-rule="evenodd"
                            />
                          </svg>
                        {:else}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-5 w-5 text-primary"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fill-rule="evenodd"
                              d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                              clip-rule="evenodd"
                            />
                            <path
                              d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"
                            />
                          </svg>
                        {/if}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || attemptingLogin}
                    class="w-full bg-gradient-to-r from-primary to-accent text-accent-foreground py-3 rounded-lg font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {#if loading || attemptingLogin}
                      <svg
                        class="animate-spin h-5 w-5 mx-auto"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    {:else}
                      Sign in
                    {/if}
                  </button>
                </form>
              {/if}

              <form
                id="biometric-form"
                method="POST"
                action="?/verifyBiometric"
                class="hidden"
              >
                <input type="hidden" name="verified" value="false" />
                <input type="hidden" name="skipBiometric" value="false" />
                <input type="hidden" name="role" value={userRole} />
                <input type="hidden" name="userId" value={userId} />
              </form>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Circle animation styles */
  .floating-circle {
    transition: transform 6s cubic-bezier(0.21, 0.68, 0.55, 0.9);
  }
</style>

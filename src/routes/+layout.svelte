<script>
  import "../app.css";
  import { page } from "$app/stores";

  $: metaData = {
    "/": {
      title: "Sign In | SCG Dress Shoppe JOMS",
      description:
      "Secure login portal for SCG Dress Shoppe's comprehensive job order management system. Access tailoring services, order tracking and uniform management tools.",
      keywords: "SCG JOMS, login, sign in, uniform management",
    },
    "/employee/orders": {
      title: "Tailor Orders | SCG Dress Shoppe JOMS",
      description:
      "Comprehensive order list management interface for SCG Dress Shoppe staff. View, sort, and process customer uniform orders efficiently.",
      keywords: "SCG JOMS, orders, uniform orders, order management",
    },
    "/employee/dashboard": {
      title: "Tailor Dashboard | SCG Dress Shoppe JOMS",
      description:
      "Central dashboard for SCG Dress Shoppe staff to monitor orders, track metrics, and manage daily tasks efficiently.",
      keywords: "SCG JOMS, dashboard, tailor dashboard, tasks",
    },
    "/employee/students": {
      title: "Student Management | SCG Dress Shoppe JOMS",
      description:
      "Manage and access student uniform records, measurements, and order history for SCG Dress Shoppe uniform services.",
      keywords: "SCG JOMS, students, measurements, uniforms",
    },
    "/employee/profile": {
      title: "Tailor Profile | SCG Dress Shoppe JOMS",
      description:
      "Manage your SCG Dress Shoppe staff profile, view work history, and update personal information.",
      keywords: "SCG JOMS, profile, tailor profile, staff",
    },
    "/admin/dashboard": {
      title: "Admin Dashboard | SCG Dress Shoppe JOMS",
      description:
      "Comprehensive analytics dashboard for SCG Dress Shoppe administrators. Monitor orders, revenue, student demographics and tailor performance metrics.",
      keywords: "SCG JOMS, admin dashboard, analytics, metrics",
    },
    "/admin/tailor-performance": {
      title: "Tailor Performance | SCG Dress Shoppe JOMS",
      description:
      "Track and analyze tailor productivity, completion rates, order quality and efficiency metrics for SCG Dress Shoppe staff.",
      keywords: "SCG JOMS, tailor performance, metrics, productivity",
    },
    "/admin/course": {
      title: "Course Management | SCG Dress Shoppe JOMS",
      description:
      "Manage academic programs and courses for SCG Dress Shoppe uniform system. Add, edit and organize student course information.",
      keywords: "SCG JOMS, courses, programs, academic",
    },
    "/admin/measurement": {
      title: "Measurement Types | SCG Dress Shoppe JOMS",
      description:
      "Configure and manage uniform measurement specifications and standards for SCG Dress Shoppe tailoring system.",
      keywords: "SCG JOMS, measurements, specifications, standards",
    },
    "/admin/uniform-configuration": {
      title: "Uniform Configuration | SCG Dress Shoppe JOMS",
      description:
      "Set up and manage uniform specifications, pricing, and measurement requirements by course and gender.",
      keywords: "SCG JOMS, uniform config, specifications, pricing",
    },
    "/admin/account-management": {
      title: "Account Management | SCG Dress Shoppe JOMS",
      description:
      "Manage staff accounts, roles and access permissions for SCG Dress Shoppe JOMS platform.",
      keywords: "SCG JOMS, accounts, roles, permissions",
    },
    "/admin/orders": {
      title: "Order Management | SCG Dress Shoppe JOMS",
      description:
      "Central order management system for processing uniform orders, tracking status and managing tailor assignments.",
      keywords: "SCG JOMS, orders, tracking, management",
    },
    "/admin/students": {
      title: "Student Management | SCG Dress Shoppe JOMS",
      description:
      "Manage student profiles, measurements and uniform orders for SCG Dress Shoppe system.",
      keywords: "SCG JOMS, students, profiles, uniforms",
    },
  }[$page.url.pathname];
</script>

<svelte:head>
  <title>{metaData?.title || "SCG Dress Shoppe JOMS"}</title>
  <meta name="description" content={metaData?.description} />
  <meta name="keywords" content={metaData?.keywords} />

  <!-- Add Open Graph tags -->
  <meta property="og:title" content={metaData?.title} />
  <meta property="og:description" content={metaData?.description} />
  <meta property="og:type" content="website" />
  <meta
    property="og:url"
    content={`https://scgjoms.vercel.app${$page.url.pathname}`}
  />

  <!-- Add Twitter Card tags -->
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content={metaData?.title} />
  <meta name="twitter:description" content={metaData?.description} />

  <!-- Add canonical URL -->
  <link
    rel="canonical"
    href={`https://scgjoms.vercel.app${$page.url.pathname}`}
  />

  <!-- Add structured data -->
  {@html `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "${metaData?.title}",
        "description": "${metaData?.description}",
        "url": "https://scgjoms.vercel.app${$page.url.pathname}"
      }
      </script>
    `}
</svelte:head>
<slot />

<script>
  import "../app.css";
  import { page } from '$app/stores';

  $: metaData = {
    '/': {
      title: 'Sign In | SCG Dress Shoppe JOMS',
      description: 'Secure login portal for SCG Dress Shoppe\'s comprehensive job order management system. Access tailoring services, order tracking and uniform management tools.',
      keywords: 'SCG JOMS, login portal, sign in, authentication, uniform management system, SCG Dress Shoppe, tailoring service, school uniforms, professional uniforms, job order system, order tracking, uniform measurements, student uniforms, corporate uniforms, dress shop, garment management, tailoring workflow, order monitoring, uniform specifications, measurement tracking, order status, uniform customization, garment fitting, uniform alterations, dress making, sewing services, garment production, uniform standards, quality control, deadline tracking, inventory management, customer orders, uniform requests, measurement records, uniform sizing, garment specifications, order processing, uniform manufacturing, tailor shop, uniform delivery, order fulfillment, measurement data, uniform types, garment categories, order history, production timeline, uniform requirements, measurement standards, quality assurance'
    },
    '/employee': {
      title: 'Tailor Portal | SCG Dress Shoppe JOMS',
      description: 'Comprehensive employee portal for SCG Dress Shoppe tailors and staff. Manage uniform orders, track measurements, update order status, and maintain production schedules efficiently.',
      keywords: 'SCG JOMS, employee dashboard, tailor portal, order management, uniform production, measurement tracking, SCG employee portal, order status updates, production timeline, uniform measurements, garment tracking, deadline management, work assignments, order processing, task management, uniform specifications, measurement records, production workflow, order fulfillment, quality control, uniform alterations, garment fitting, sewing tasks, tailoring assignments, work queue, order priorities, completion tracking, measurement data, uniform customization, production status, task scheduling, work progress, uniform standards, order details, measurement guidelines, production efficiency, quality checks, uniform types, order history, measurement updates, completion reports, performance metrics, work planning, order coordination, production goals, task completion, uniform requirements'
    }
  }[$page.url.pathname];

  $: showMeta = !$page.url.pathname.startsWith('/admin');
</script>

<svelte:head>
  {#if showMeta}
    <title>{metaData?.title}</title>
    <meta name="description" content={metaData?.description} />
    <meta name="keywords" content={metaData?.keywords} />
    <meta property="og:title" content={metaData?.title} />
    <meta property="og:description" content={metaData?.description} />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={`https://scgjoms.vercel.app${$page.url.pathname}`} />
    {@html `
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "SCG Dress Shoppe JOMS",
        "url": "https://scgjoms.vercel.app",
        "description": "${metaData?.description}"
      }
      </script>
    `}
  {/if}
</svelte:head>
<slot />
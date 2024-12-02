<script>
  import "../app.css";
  import { page } from "$app/stores";

  $: metaData = {
    "/": {
      title: "Sign In | SCG Dress Shoppe JOMS",
      description:
        "Secure login portal for SCG Dress Shoppe's comprehensive job order management system. Access tailoring services, order tracking and uniform management tools.",
      keywords:
        "SCG JOMS, login portal, sign in, authentication, uniform management system, SCG Dress Shoppe, tailoring service, school uniforms, professional uniforms, job order system, order tracking, uniform measurements, student uniforms, corporate uniforms, dress shop, garment management, tailoring workflow, order monitoring, uniform specifications, measurement tracking, order status, uniform customization, garment fitting, uniform alterations, dress making, sewing services, garment production, uniform standards, quality control, deadline tracking, inventory management, customer orders, uniform requests, measurement records, uniform sizing, garment specifications, order processing, uniform manufacturing, tailor shop, uniform delivery, order fulfillment, measurement data, uniform types, garment categories, order history, production timeline, uniform requirements, measurement standards, quality assurance",
    },
    "/employee/orders": {
      title: "Tailor Orders | SCG Dress Shoppe JOMS",
      description:
        "Comprehensive order list management interface for SCG Dress Shoppe staff. View, sort, and process customer uniform orders efficiently.",
      keywords:
        "order list, uniform orders, order processing, SCG JOMS, order tracking, order status, order management, customer orders, uniform requests, order sorting, order filtering, order details, uniform specifications, order queue, pending orders, completed orders, order history, order timeline, order priority, rush orders, regular orders, bulk orders, special orders, order categories, order search, order export, order reports, order metrics, order assignment, order workflow, order documentation, measurement details, customer information, delivery status, payment status, order modifications, order updates, order notes, order comments, quality checks, order verification, order approval, order rejection, order cancellation, order rescheduling, order phases, production status, fitting schedule, delivery schedule, order items, item quantities, fabric details, design specifications, size requirements, custom requirements, alterations needed, order problems, order solutions, customer feedback, order ratings, completion time, processing time, estimated delivery, actual delivery, order costs, pricing details, discount information, payment method, payment verification, order type, school orders, corporate orders, individual orders, seasonal orders, uniform type, measurement history, customer history, order patterns, repeat orders, new orders, order templates, batch processing, order grouping, order sorting, priority handling, urgent requests, standard requests, order flags, order tags, order categories, order classification, order importance, delivery options, pickup options, shipping details, courier information, tracking numbers, order location, branch details, staff assignments, tailor assignments, quality control, final inspection, customer satisfaction, order feedback",
    },
    "/employee/dashboard": {
      title: "Tailor Dashboard | SCG Dress Shoppe JOMS",
      description:
        "Central dashboard for SCG Dress Shoppe staff to monitor orders, track metrics, and manage daily tasks efficiently.",
      keywords:
        "staff dashboard, performance metrics, order overview, task management, daily statistics, work queue, order summary, productivity tracking, task overview, work management, active orders, pending tasks, completed tasks, daily goals, weekly targets, monthly objectives, performance indicators, efficiency metrics, production speed, quality ratings, work schedule, task allocation, workload distribution, priority tasks, deadline tracking, time management, resource allocation, staff availability, work progress, completion rates, success metrics, bottleneck identification, workflow optimization, process improvement, task scheduling, work planning, resource management, team coordination, quality control metrics, customer satisfaction rates, delivery performance, order accuracy, measurement precision, alteration success, fitting satisfaction, production timeline, workflow status, task categories, work types, skill utilization, capacity planning, resource optimization, staff performance, individual metrics, team metrics, department goals, production targets, quality standards, compliance tracking, error rates, revision requests, customer feedback metrics, task difficulty, complexity levels, time estimation, actual time spent, efficiency ratios, productivity measures, work balance, task distribution, urgent matters, critical tasks, routine tasks, maintenance duties, quality checks, inspection tasks, verification processes, documentation duties, reporting requirements, communication tasks, team updates, progress reports, status updates, performance reviews, goal achievement, target completion, success rates, improvement areas, development needs, training requirements, skill assessment, competency tracking, expertise levels, specialization areas, workstation management, equipment utilization, material management, inventory tasks, supply tracking, order coordination, production planning, schedule management, time tracking, attendance monitoring, break management, shift planning, work rotation, task variation, skill development",
    },
    "/employee/students": {
      title: "Student Management | SCG Dress Shoppe JOMS",
      description:
        "Manage and access student uniform records, measurements, and order history for SCG Dress Shoppe uniform services.",
      keywords:
        "student records, uniform measurements, student database, measurement history, student profiles, uniform specifications, student data, measurement records, student information, uniform sizing, academic level, grade level, section details, school information, institution name, student ID, enrollment status, uniform requirements, measurement dates, size updates, growth tracking, uniform history, order frequency, special requirements, custom modifications, fitting preferences, style preferences, fabric choices, design specifications, measurement changes, size adjustments, body measurements, height tracking, weight tracking, chest measurements, waist measurements, hip measurements, shoulder width, sleeve length, inseam measurements, outseam measurements, neck size, wrist size, ankle measurements, torso length, back length, front length, uniform type, uniform category, school guidelines, dress code compliance, uniform standards, measurement accuracy, fitting history, alteration history, uniform condition, wear patterns, replacement frequency, uniform sets, uniform pieces, complete uniforms, separate items, seasonal uniforms, special uniforms, physical education uniforms, formal uniforms, casual uniforms, house uniforms, team uniforms, club uniforms, organization uniforms, measurement notes, fitting comments, special instructions, care instructions, washing guidelines, maintenance notes, uniform durability, quality assessment, wear resistance, comfort factors, mobility requirements, activity considerations, climate adaptations, material preferences, fabric durability, color fastness, style consistency, size consistency, batch tracking, uniform batches, production cycles, delivery scheduling, pickup arrangements, parent contacts, guardian information, emergency contacts, billing details, payment history, order status, delivery status, satisfaction ratings, feedback records, complaint history, resolution tracking, communication logs, fitting appointments, measurement sessions, update frequency, verification process, quality control, accuracy checks, measurement standards, size charts, growth allowance, comfort allowance, movement allowance, durability requirements, school compliance",
    },
    "/employee/profile": {
      title: "Tailor Profile | SCG Dress Shoppe JOMS",
      description:
        "Manage your SCG Dress Shoppe staff profile, view work history, and update personal information.",
      keywords:
        "staff profile, employee information, work history, personal details, profile management, account settings, user profile, staff credentials, profile updates, employment status, job title, position details, work schedule, shift assignments, specialization areas, skill sets, expertise levels, experience details, years of service, performance history, achievement records, training certificates, professional development, qualifications, certifications, attendance records, leave history, overtime records, work preferences, station assignment, equipment proficiency, tool expertise, measurement accuracy, fitting expertise, alteration skills, sewing techniques, design knowledge, fabric expertise, material handling, quality standards, production speed, efficiency ratings, customer feedback, satisfaction scores, completed orders, order history, task completion, project involvement, team collaboration, communication skills, leadership roles, mentoring experience, training participation, skill development, career progression, salary information, benefits details, employee ID, contact information, emergency contacts, address details, documentation status, identification records, employment documents, contract details, work permits, security clearance, access levels, system permissions, login credentials, account security, profile privacy, data protection, work references, professional relationships, team assignments, department allocation, branch location, reporting structure, supervisor details, subordinate management, performance goals, development plans, career objectives, improvement targets, skill enhancement, knowledge areas, specialization focus, work priorities, responsibility scope, task ownership, quality commitment, compliance awareness, safety standards, workplace protocols, communication preferences, notification settings, profile visibility, account management, password security, profile backup, data accuracy, information updates, verification status, profile completion, document uploads, profile photo, digital signature, authentication details, access history, login records, profile modifications",
    },
  }[$page.url.pathname];

  $: showMeta = !$page.url.pathname.startsWith("/admin");
</script>

<svelte:head>
  {#if showMeta}
    <title>{metaData?.title}</title>
    <link rel="icon" href="%sveltekit.assets%/SCGLogo.png" />
    <meta name="description" content={metaData?.description} />
    <meta name="keywords" content={metaData?.keywords} />
    <meta property="og:title" content={metaData?.title} />
    <meta property="og:description" content={metaData?.description} />
    <meta property="og:type" content="website" />
    <meta
      property="og:url"
      content={`https://scgjoms.vercel.app${$page.url.pathname}`}
    />
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

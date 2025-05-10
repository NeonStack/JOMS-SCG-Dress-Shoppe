<script>
  import { onMount, createEventDispatcher } from "svelte";
  import { format } from "date-fns";
  import { browser } from "$app/environment";
  import QRCode from "qrcode";
  // Import html2pdf at the top level instead of dynamically
  import html2pdf from 'html2pdf.js';

  export let orderForReceipt = null;

  const dispatch = createEventDispatcher();

  function closeModal() {
    dispatch("close");
  }

  function displayPaymentStatus(order) {
    if (order.amount_paid === 0) return "Not Paid";
    if (order.amount_paid >= order.total_amount) return "Fully Paid";
    return "Partial";
  }

  async function generateQRCode(order) {
    const qrData = {
      id: order.id,
      student: `${order.student?.first_name} ${order.student?.last_name}`,
      amount_paid: order.amount_paid,
      total_amount: order.total_amount,
      payment_date: order.payment_date,
      payment_status: order.payment_status,
      payment_updated_by: order.payment_updated_by,
      timestamp: new Date().toISOString(),
    };

    const qrCanvas = document.createElement("canvas");
    const qrCtx = qrCanvas.getContext("2d");

    // Generate QR code with larger quiet zone
    const qrCodeData = await QRCode.toCanvas(qrCanvas, JSON.stringify(qrData), {
      width: 200,
      margin: 2,
      color: {
        dark: "#000",
        light: "#fff",
      },
    });

    // Load and draw logo
    const logo = new Image();
    logo.src = "/SCGLogo.png";
    await new Promise((resolve) => {
      logo.onload = resolve;
    });

    // Calculate logo size (30% of QR code)
    const logoSize = qrCanvas.width * 0.3;
    const logoPos = (qrCanvas.width - logoSize) / 2;

    // Draw logo in center
    qrCtx.drawImage(logo, logoPos, logoPos, logoSize, logoSize);

    return qrCanvas.toDataURL();
  }

  let isGenerating = false;
  let errorMessage = '';

  async function generateReceipt() {
    if (browser) {
      try {
        isGenerating = true;
        errorMessage = '';
        
        const receiptElement = document.getElementById("receipt");
        if (!receiptElement) {
          throw new Error("Receipt element not found");
        }
        
        const opt = {
          margin: 1,
          filename: `receipt-${orderForReceipt.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            backgroundColor: "#ffffff",
          },
          jsPDF: {
            unit: "in",
            format: "letter",
            orientation: "portrait",
          },
        };

        // Use the imported html2pdf directly
        await html2pdf().set(opt).from(receiptElement).save();
        console.log("PDF generation completed");
      } catch (error) {
        console.error("PDF generation failed:", error);
        errorMessage = `Failed to generate PDF: ${error.message}. Try restarting the dev server with "npm run dev" or clear browser cache.`;
      } finally {
        isGenerating = false;
      }
    }
  }

  onMount(async () => {
    if (browser && orderForReceipt) {
      // Generate and set watermark
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 200;
      canvas.height = 200;
      ctx.fillStyle = "#f3f4f6";
      ctx.font = "14px Arial";
      ctx.rotate((-45 * Math.PI) / 180);
      ctx.fillText("SCG DRESSHOPPE OFFICIAL RECEIPT", -100, 100);

      // Set watermark background
      const receiptElement = document.getElementById("receipt");
      if (receiptElement) {
        receiptElement.style.backgroundImage = `url(${canvas.toDataURL()})`;
      }

      // Generate and set QR code
      const qrCodeData = await generateQRCode(orderForReceipt);
      const qrElement = document.getElementById("qrcode");
      if (qrElement) {
        qrElement.src = qrCodeData;
      }
    }
  });
</script>

<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-lg w-[800px] max-h-[90vh] flex flex-col select-none">
    <div class="flex-1 overflow-y-auto overflow-x-hidden">
      <!-- Receipt Content -->
      <div id="receipt" class="p-8 relative pointer-events-none" style="background-repeat: repeat;">
        <!-- Add security strip at the top -->
        <div class="bg-gradient-to-r from-primary to-accent h-4 -mx-8 mb-4"></div>

        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold">SCG Dresshoppe</h1>
          <p>Official Receipt</p>
        </div>

        <!-- Add security features -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full aspect-square opacity-10">
          <img src="/SCGLogo.png" alt="Logo" class="w-full h-full object-contain" />
        </div>

        <!-- Add microcopy security text -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-[8px] whitespace-nowrap" style="word-spacing: 20px;">
          {Array(20).fill("SCG DRESSHOPPE OFFICIAL DOCUMENT").join(" ")}
        </div>

        <!-- Add QR code section -->
        <div class="absolute top-8 right-8">
          <img id="qrcode" alt="Verification QR Code" class="w-24 h-24" />
          <p class="text-xs text-center mt-1">Scan to verify</p>
        </div>

        <!-- Receipt Details -->
        <div class="space-y-4">
          <div class="flex justify-between">
            <div>
              <p><strong>Receipt No:</strong> {orderForReceipt.id}</p>
              <p>
                <strong>Latest Payment Date:</strong>
                {format(
                  new Date(
                    orderForReceipt.payment_date || orderForReceipt.created_at
                  ),
                  "MMM d, yyyy"
                )}
              </p>
            </div>
            <div>
              <p>
                <strong>Status:</strong>
                {displayPaymentStatus(orderForReceipt)}
              </p>
            </div>
          </div>

          <div class="border-t border-b py-4">
            <h3 class="font-bold mb-2">Customer Information</h3>
            <p>
              <strong>Name:</strong>
              {orderForReceipt.student?.first_name}
              {orderForReceipt.student?.last_name}
            </p>
            <p>
              <strong>Course:</strong>
              {orderForReceipt.student?.course?.course_code}
            </p>
          </div>

          <div class="border-b py-4">
            <h3 class="font-bold mb-2">Order Details</h3>
            <div class="grid grid-cols-2 gap-4">
              <p>
                <strong>Order Type:</strong>
                {orderForReceipt.uniform_type}
              </p>
              <p><strong>Status:</strong> {orderForReceipt.status}</p>
              <p>
                <strong>Due Date:</strong>
                {format(new Date(orderForReceipt.due_date), "MMM d, yyyy")}
              </p>
              {#if orderForReceipt.employee}
                <p>
                  <strong>Assigned To:</strong>
                  {orderForReceipt.employee.first_name}
                  {orderForReceipt.employee.last_name}
                </p>
              {/if}
            </div>
          </div>

          <div class="py-4">
            <h3 class="font-bold mb-2">Payment Summary</h3>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Total Amount:</span>
                <span>₱{orderForReceipt.total_amount}</span>
              </div>
              <div class="flex justify-between">
                <span>Amount Paid:</span>
                <span>₱{orderForReceipt.amount_paid}</span>
              </div>
              <div class="flex justify-between font-bold">
                <span>Balance:</span>
                <span>₱{orderForReceipt.balance}</span>
              </div>
            </div>
          </div>

          {#if orderForReceipt.payment_updated_by}
            <div class="text-sm text-gray-500 mt-8">
              <p>
                Last payment recorded by: {orderForReceipt.payment_updated_by}
              </p>
            </div>
          {/if}
        </div>

        <!-- Add footer with security information -->
        <div class="mt-8 pt-4 border-t text-xs text-gray-500">
          <p class="mt-2">
            This is an official receipt from SCG Dresshoppe. Any alterations
            void this document.
          </p>
          <p>
            Receipt ID: {orderForReceipt.id} • Generated: {new Date().toLocaleString()}
          </p>
        </div>

        <!-- Add bottom security strip -->
        <div class="bg-gradient-to-r from-accent to-primary h-4 -mx-8 mt-4"></div>
      </div>
    </div>

    <div class="border-t p-4 flex justify-between bg-white rounded-b-lg">
      <!-- Show error message if any -->
      {#if errorMessage}
        <div class="text-red-500 text-sm self-center">{errorMessage}</div>
      {:else}
        <div></div> <!-- Empty div for spacing -->
      {/if}
      
      <div class="flex gap-3">
        <button
          class="px-4 py-2 border rounded hover:bg-gray-50"
          on:click={closeModal}
          disabled={isGenerating}
        >
          Close
        </button>
        <button
          class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark flex items-center justify-center min-w-[120px]"
          on:click={generateReceipt}
          disabled={isGenerating}
        >
          {#if isGenerating}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          {:else}
            Download PDF
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

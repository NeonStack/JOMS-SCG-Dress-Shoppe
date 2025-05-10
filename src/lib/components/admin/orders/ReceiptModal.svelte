<script>
  import { onMount, createEventDispatcher } from "svelte";
  import { format } from "date-fns";
  import { browser } from "$app/environment";
  import QRCode from "qrcode";
  // Remove the top-level import
  // import html2pdf from 'html2pdf.js';

  export let orderForReceipt = null;

  const dispatch = createEventDispatcher();
  let html2pdfLib; // We'll assign this dynamically 

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
      width: 250, // Increased from 200
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
  let isPrinting = false;

  // Shared function for PDF generation with different output types
  async function generatePDF(action = 'download') {
    if (browser) {
      try {
        if (action === 'download') {
          isGenerating = true;
        } else {
          isPrinting = true;
        }
        errorMessage = '';

        // Dynamically import html2pdf.js only in the browser
        if (!html2pdfLib) {
          html2pdfLib = await import('html2pdf.js');
        }
        
        const receiptElement = document.getElementById("receipt");
        if (!receiptElement) {
          throw new Error("Receipt element not found");
        }
        
        // Common options for PDF generation
        const opt = {
          margin: 0.2,
          filename: `receipt-${orderForReceipt.id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            backgroundColor: "#ffffff",
          },
          jsPDF: {
            unit: "in",
            format: [3.14, 11], // 80mm width (3.14 inches) with adequate height
            orientation: "portrait",
          }
        };
        
        // Create the PDF generator instance
        const worker = html2pdfLib.default().set(opt).from(receiptElement);
        
        if (action === 'download') {
          // Save the PDF to disk
          await worker.save();
          console.log("PDF download completed");
        } else {
          // For printing: generate the PDF, open in new window, and print
          const pdfBlob = await worker.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          
          const printWindow = window.open(pdfUrl, '_blank');
          if (!printWindow) {
            throw new Error("Popup blocked. Please allow popups for this site.");
          }
          
          // Add a listener to detect when the PDF has loaded
          printWindow.addEventListener('load', () => {
            // Trigger print after PDF is loaded
            printWindow.setTimeout(() => {
              printWindow.focus();
              printWindow.print();
            }, 1000);
          });
          
          // Fallback timeout in case the load event doesn't fire
          setTimeout(() => {
            isPrinting = false;
          }, 5000);
        }
      } catch (error) {
        console.error(`${action === 'download' ? 'PDF generation' : 'Print'} failed:`, error);
        errorMessage = `Failed to ${action === 'download' ? 'generate PDF' : 'print'}: ${error.message}`;
      } finally {
        if (action === 'download') {
          isGenerating = false;
        } else {
          isPrinting = false;
        }
      }
    }
  }

  // Update these functions to use the shared generator
  async function generateReceipt() {
    await generatePDF('download');
  }

  async function printReceipt() {
    await generatePDF('print');
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
  <div class="bg-white rounded-lg w-[400px] max-h-[90vh] flex flex-col select-none">
    <div class="flex-1 overflow-y-auto overflow-x-hidden">
      <!-- Receipt Content - Updated with narrower width -->
      <div id="receipt" class="p-6 relative pointer-events-none" style="background-repeat: repeat; max-width: 350px; margin: 0 auto;">
        <!-- Add security strip at the top -->
        <div class="bg-gradient-to-r from-primary to-accent h-3 -mx-6 mb-3"></div>

        <!-- Header -->
        <div class="text-center mb-3">
          <h1 class="text-xl font-bold">SCG Dresshoppe</h1>
          <p class="text-sm">Official Receipt</p>
        </div>
        
        <!-- Add QR code section - Repositioned below title -->
        <div class="flex justify-center mb-4">
          <div class="text-center">
            <img id="qrcode" alt="Verification QR Code" class="w-28 h-28 mx-auto" />
            <p class="text-xs text-center mt-1">Scan to verify</p>
          </div>
        </div>

        <!-- Add security features -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full aspect-square opacity-10">
          <img src="/SCGLogo.png" alt="Logo" class="w-full h-full object-contain" />
        </div>

        <!-- Add microcopy security text -->
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-[6px] whitespace-nowrap" style="word-spacing: 15px;">
          {Array(15).fill("SCG DRESSHOPPE OFFICIAL DOCUMENT").join(" ")}
        </div>

        <!-- Receipt Details - Using smaller text and single-column layout -->
        <div class="space-y-3 text-sm">
          <!-- Receipt Info - Modified to stack vertically -->
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
            <p>
              <strong>Status:</strong>
              {displayPaymentStatus(orderForReceipt)}
            </p>
          </div>

          <div class="border-t border-b py-2">
            <h3 class="font-bold mb-1 text-sm">Customer Information</h3>
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

          <div class="border-b py-2">
            <h3 class="font-bold mb-1 text-sm">Order Details</h3>
            <!-- Replaced grid with stacked layout -->
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

          <div class="py-2">
            <h3 class="font-bold mb-1 text-sm">Payment Summary</h3>
            <div class="space-y-1">
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
            <div class="text-xs text-gray-500 mt-4">
              <p>
                Last payment recorded by: {orderForReceipt.payment_updated_by}
              </p>
            </div>
          {/if}
        </div>

        <!-- Add footer with security information -->
        <div class="mt-4 pt-2 border-t text-xs text-gray-500">
          <p class="mt-1">
            This is an official receipt from SCG Dresshoppe. Any alterations
            void this document.
          </p>
          <p>
            Receipt ID: {orderForReceipt.id} • Generated: {new Date().toLocaleString()}
          </p>
        </div>

        <!-- Add bottom security strip -->
        <div class="bg-gradient-to-r from-accent to-primary h-3 -mx-6 mt-3"></div>
      </div>
    </div>

    <div class="border-t p-4 flex justify-between bg-white rounded-b-lg">
      <!-- Show error message if any -->
      {#if errorMessage}
        <div class="text-red-500 text-sm self-center">{errorMessage}</div>
      {:else}
        <div></div> <!-- Empty div for spacing -->
      {/if}
      
      <div class="flex gap-2">
        <button
          class="px-3 py-1 border rounded hover:bg-gray-50"
          on:click={closeModal}
          disabled={isGenerating || isPrinting}
        >
          Close
        </button>
        
        <button
          class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center min-w-[100px]"
          on:click={printReceipt}
          disabled={isGenerating || isPrinting}
        >
          {#if isPrinting}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Printing...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          {/if}
        </button>
        
        <button
          class="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark flex items-center justify-center min-w-[100px]"
          on:click={generateReceipt}
          disabled={isGenerating || isPrinting}
        >
          {#if isGenerating}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>

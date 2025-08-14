import crypto from "crypto";

// It's recommended to store these in environment variables
const PHONEPE_USERNAME = process.env.PHONEPE_USERNAME;
const PHONEPE_PASSWORD = process.env.PHONEPE_PASSWORD;

function getExpectedAuthHash() {
  const authString = `${PHONEPE_USERNAME}:${PHONEPE_PASSWORD}`;
  return crypto.createHash("sha256").update(authString).digest("hex");
}

// Placeholder for sending WhatsApp message
async function sendWhatsAppMessage(to, message) {
  console.log(`Sending WhatsApp message to ${to}: "${message}"`);
  // Replace this with your actual WhatsApp sending logic
  // Example using an API:
  // await fetch('https://api.whatsapp.com/...', {
  //   method: 'POST',
  //   headers: { 'Authorization': 'Bearer YOUR_API_KEY' },
  //   body: JSON.stringify({ to, message })
  // });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const incomingAuth = req.headers["authorization"];
    const expectedHash = getExpectedAuthHash();

    if (!incomingAuth || incomingAuth !== expectedHash) {
      console.error("Unauthorized attempt:", {
        incomingAuth,
        expectedHash
      });
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { event, payload } = req.body;

    // Log the event and payload
    console.log("✅ Received Webhook:");
    console.log("Event:", event);
    console.log("Payload:", payload);

    // Process the webhook based on the event type
    switch (event) {
      case "checkout.order.completed":
        if (payload.state === "COMPLETED") {
          // Send a success message to the customer
          await sendWhatsAppMessage(
            payload.metaInfo.udf1, // Assuming UDF1 stores the customer's WhatsApp number
            `✅ Your payment of ₹${payload.amount / 100} for order ${payload.merchantOrderId} was successful.`
          );
        }
        break;

      case "checkout.order.failed":
        if (payload.state === "FAILED") {
          // Send a failure message to the customer
          await sendWhatsAppMessage(
            payload.metaInfo.udf1, // Assuming UDF1 stores the customer's WhatsApp number
            `❌ Your payment for order ${payload.merchantOrderId} failed. Please try again.`
          );
        }
        break;

      // Add more cases for other events like refunds
      // case "pg.refund.completed":
      //   ...
      //   break;

      default:
        console.log(`Unhandled event type: ${event}`);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("🔥 Webhook processing error:", err);
    res.status(500).json({ error: "Server error" });
  }
}
import crypto from "crypto";
import axios from "axios";

// PhonePe Credentials - Loaded from Environment Variables
const PHONEPE_USERNAME = process.env.PHONEPE_USERNAME;
const PHONEPE_PASSWORD = process.env.PHONEPE_PASSWORD;

// Flaxxa WAPI Credentials - Loaded from Environment Variables
const FLAXXA_API_URL = process.env.FLAXXA_API_URL; // e.g., 'https://api.flaxxa.com/v1/messages'
const FLAXXA_API_KEY = process.env.FLAXXA_API_KEY; // Your API Key or Access Token

function getExpectedAuthHash() {
  const authString = `${PHONEPE_USERNAME}:${PHONEPE_PASSWORD}`;
  return crypto.createHash("sha256").update(authString).digest("hex");
}

/**
 * Sends a WhatsApp message using the Flaxxa WAPI.
 * @param {string} to - The recipient's phone number (e.g., '+919876543210')
 * @param {string} message - The text message to send.
 */
async function sendWhatsAppMessage(to, message) {
  console.log(`Sending WhatsApp message to ${to} via Flaxxa WAPI...`);

  // --- IMPORTANT ---
  // You may need to adjust the 'data' object below based on the
  // official documentation from Flaxxa WAPI.
  const data = {
    to: to, // The recipient's phone number
    message: message, // The message content
    // Some APIs might require a different structure, for example:
    // messaging_product: "whatsapp",
    // recipient_type: "individual",
    // to: to,
    // type: "text",
    // text: {
    //   body: message
    // }
  };

  try {
    const response = await axios.post(FLAXXA_API_URL, data, {
      headers: {
        // --- IMPORTANT ---
        // Check the Flaxxa WAPI documentation for the correct authorization header.
        // It could be 'Authorization': `Bearer ${FLAXXA_API_KEY}`
        // or 'x-api-key': FLAXXA_API_KEY, or something similar.
        'Authorization': `Bearer ${FLAXXA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log("✅ WhatsApp message sent successfully via Flaxxa WAPI:", response.data);
  } catch (error) {
    console.error("🔥 Error sending WhatsApp message:", error.response ? error.response.data : error.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const incomingAuth = req.headers["authorization"];
    const expectedHash = getExpectedAuthHash();

    if (!incomingAuth || incomingAuth !== expectedHash) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { event, payload } = req.body;
    console.log("✅ Received Webhook:", { event, payload });

    const customerPhoneNumber = payload.metaInfo?.udf1;

    if (!customerPhoneNumber) {
        console.warn("Webhook received, but no customer phone number (udf1) found.");
        return res.status(200).send("OK - No number");
    }

    switch (event) {
      case "checkout.order.completed":
        if (payload.state === "COMPLETED") {
          await sendWhatsAppMessage(
            customerPhoneNumber,
            `✅ Your payment of ₹${payload.amount / 100} for order ${payload.merchantOrderId} was successful.`
          );
        }
        break;

      case "checkout.order.failed":
        if (payload.state === "FAILED") {
          await sendWhatsAppMessage(
            customerPhoneNumber,
            `❌ Your payment for order ${payload.merchantOrderId} failed. Please try again.`
          );
        }
        break;

      default:
        console.log(`- Unhandled event type: ${event}`);
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("🔥 Webhook processing error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
}

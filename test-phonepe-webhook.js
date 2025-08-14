// test-phonepe-webhook.js
const crypto = require("crypto");
const axios = require("axios");

// ====== CONFIG ======
const WEBHOOK_URL = "http://localhost:3000/api/phonepe-webhook"; // Your local webhook endpoint
const USERNAME = "pawanjoshi"; // Replace with your username
const PASSWORD = "Pawan1joshi"; // Replace with your password
// ====================

// 1️⃣ Generate Authorization header
function generateAuthHash(username, password) {
  const authString = `${username}:${password}`;
  return crypto.createHash("sha256").update(authString).digest("hex");
}

// 2️⃣ Create test payloads
const completedPayload = {
  event: "checkout.order.completed",
  payload: {
    orderId: "TESTORDER123",
    merchantId: "merchantId",
    merchantOrderId: "MERCHANT_ORDER_ID_1",
    state: "COMPLETED",
    amount: 10000,
    expireAt: Date.now() + 3600000,
    metaInfo: {
      udf1: "CUSTOMER_WHATSAPP_NUMBER" // Replace with a test number
    }
  }
};

const failedPayload = {
    event: "checkout.order.failed",
    payload: {
      orderId: "TESTORDER456",
      merchantId: "merchantId",
      merchantOrderId: "MERCHANT_ORDER_ID_2",
      state: "FAILED",
      amount: 5000,
      expireAt: Date.now() + 3600000,
      metaInfo: {
        udf1: "CUSTOMER_WHATSAPP_NUMBER" // Replace with a test number
      }
    }
};

// 3️⃣ Send request
async function sendTestWebhook(payload) {
  try {
    const authHash = generateAuthHash(USERNAME, PASSWORD);

    console.log(`\n\n--- Sending '${payload.event}' webhook ---`);
    console.log("🔐 Generated Authorization Hash:", authHash);

    const response = await axios.post(WEBHOOK_URL, payload, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHash
      }
    });

    console.log("✅ Webhook sent successfully");
    console.log("📜 Response from server:", response.data);
  } catch (error) {
    if (error.response) {
      console.error("❌ Server responded with error:", error.response.status, error.response.data);
    } else {
      console.error("🔥 Request failed:", error.message);
    }
  }
}

// Run tests
async function runTests() {
    await sendTestWebhook(completedPayload);
    await sendTestWebhook(failedPayload);
}

runTests();
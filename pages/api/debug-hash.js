import crypto from "crypto";

// Use same credentials as your webhook file
const PHONEPE_USERNAME = "pawanjoshi";
const PHONEPE_PASSWORD = "Pawan1joshi";

export default function handler(req, res) {
  const authString = `${PHONEPE_USERNAME}:${PHONEPE_PASSWORD}`;
  const expectedHash = crypto.createHash("sha256").update(authString).digest("hex");

  res.status(200).json({
    username: PHONEPE_USERNAME,
    password: PHONEPE_PASSWORD,
    expectedHash
  });
}

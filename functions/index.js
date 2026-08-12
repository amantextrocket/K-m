const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const Razorpay = require("razorpay");

const RAZORPAY_KEY_ID = defineSecret("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = defineSecret("RAZORPAY_KEY_SECRET");

exports.createRazorpayOrder = onRequest(
  {
    secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET],
    cors: true
  },
  async (req, res) => {
    try {
      if (req.method !== "POST") {
        return res.status(405).json({
          success: false,
          message: "Only POST requests are allowed"
        });
      }

      const { amount, receipt } = req.body || {};

      if (!amount || Number(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid amount is required"
        });
      }

      const razorpay = new Razorpay({
        key_id: RAZORPAY_KEY_ID.value(),
        key_secret: RAZORPAY_KEY_SECRET.value()
      });

      const order = await razorpay.orders.create({
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: receipt || `vornex_${Date.now()}`,
        payment_capture: 1
      });

      return res.status(200).json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID.value()
      });

    } catch (error) {
      console.error("Razorpay order error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to create Razorpay order"
      });
    }
  }
);

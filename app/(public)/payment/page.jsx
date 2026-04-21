"use client";

import { useState } from "react";

export default function PaymentPage() {
  const [amount, setAmount] = useState(100); // Default amount in rupees
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async () => {
    if (!amount || amount <= 0) {
      setMessage("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Create order
      const orderResponse = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderData.error);

      // Load Razorpay script if not loaded
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // This should be set in .env.local
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Servzy",
        description: "Test Payment",
        order_id: orderData.id,
        handler: async function (response) {
          // Verify payment
          const verifyResponse = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();
          if (verifyResponse.ok) {
            setMessage("Payment successful!");
          } else {
            setMessage("Payment verification failed: " + verifyData.error);
          }
        },
        prefill: {
          name: "Test User",
          email: "test@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      setMessage("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Test Payment</h1>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (INR)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="1"
            step="1"
          />
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : "Pay Now"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center ${message.includes("successful") ? "text-green-600" : "text-red-600"}`}
          >
            {message}
          </p>
        )}

        <p className="mt-4 text-sm text-gray-600 text-center">
          This is a test payment using Razorpay sandbox. No real money will be
          charged.
        </p>
      </div>
    </div>
  );
}

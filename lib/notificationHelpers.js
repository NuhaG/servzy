/**
 * Helper functions to create and send notifications
 * Use these throughout the app when significant events happen
 */

export async function createNotification({
  userId,
  providerId,
  adminId,
  bookingId,
  title,
  message,
  type,
  actionUrl,
  metadata,
}) {
  try {
    // Only send in client-side or if passing full URL on server-side
    // If you plan to call this direct from server components, it's better to import the Model directly.
    // For now, this assumes it's called from client or API routes expecting relative URLs.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Check if we are running in the browser
    const isBrowser = typeof window !== 'undefined';
    const url = isBrowser ? '/api/notifications' : `${baseUrl}/api/notifications`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        providerId,
        adminId,
        bookingId,
        title,
        message,
        type,
        actionUrl,
        metadata,
      }),
    });

    if (!res.ok) {
      console.error("Failed to create notification");
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

// User specified triggers

export async function notifyBookingCreated({ userId, providerId, adminId, bookingId, serviceTitle, userName }) {
  return createNotification({
    userId,
    providerId,
    adminId,
    bookingId,
    title: "New Booking Started",
    message: `A new booking has been created for "${serviceTitle}" by ${userName}.`,
    type: "booking",
    actionUrl: `/bookings/${bookingId}`,
  });
}

export async function notifyBookingAccepted({ userId, providerId, adminId, bookingId, serviceTitle, providerName }) {
  return createNotification({
    userId,
    providerId,
    adminId,
    bookingId,
    title: "Booking Accepted",
    message: `${providerName} has accepted the booking for "${serviceTitle}".`,
    type: "booking",
    actionUrl: `/bookings/${bookingId}`,
  });
}

export async function notifyPaymentDone({ userId, providerId, adminId, amount, serviceTitle, bookingId }) {
  return createNotification({
    userId,
    providerId,
    adminId,
    bookingId,
    title: "Payment Successful",
    message: `Payment of ₹${amount} for "${serviceTitle}" has been processed successfully.`,
    type: "payment",
  });
}

export async function notifyReviewSubmitted({ userId, providerId, adminId, serviceTitle, rating, userName }) {
  return createNotification({
    userId,
    providerId,
    adminId,
    title: "New Review",
    message: `${userName} submitted a ${rating}-star review for "${serviceTitle}".`,
    type: "review",
  });
}

export async function notifyWarning({ userId, providerId, adminId, warningMessage }) {
  return createNotification({
    userId,
    providerId,
    adminId,
    title: "Account Warning",
    message: warningMessage,
    type: "warning",
  });
}

// Service Request Notifications

export async function notifyServiceRequestCreated({ providerId, bookingId, serviceTitle, scheduledDate, timeSlot }) {
  return createNotification({
    providerId,
    bookingId,
    title: "New Service Request 🔔",
    message: `You have a new service request for "${serviceTitle}". Review and accept or reject the request.`,
    type: "service_request",
    actionUrl: `/provider/bookings`,
    metadata: {
      serviceName: serviceTitle,
      scheduledDate,
      timeSlot,
    },
  });
}

export async function notifyServiceRequestAccepted({ userId, bookingId, providerName }) {
  return createNotification({
    userId,
    bookingId,
    title: "Request Accepted ✅",
    message: `${providerName} has accepted your service request. You can now proceed to payment.`,
    type: "service_request",
    actionUrl: `/user/bookings`,
  });
}

export async function notifyServiceRequestRejected({ userId, bookingId, providerName }) {
  return createNotification({
    userId,
    bookingId,
    title: "Request Rejected ❌",
    message: `${providerName} has rejected your service request.`,
    type: "service_request",
    actionUrl: `/user/bookings`,
  });
}

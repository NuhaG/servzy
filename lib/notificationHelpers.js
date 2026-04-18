/**
 * Helper functions to create and send notifications
 * Use these throughout the app when significant events happen
 */

export async function createNotification({
  userId,
  providerId,
  bookingId,
  title,
  message,
  type,
  actionUrl,
  metadata,
}) {
  try {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        providerId,
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

// Specific notification creators
export async function notifyRequestSent(userId, serviceTitle, providerName) {
  return createNotification({
    userId,
    title: "Request Sent",
    message: `Your request for "${serviceTitle}" has been sent to ${providerName}.`,
    type: "request_sent",
  });
}

export async function notifyRequestAccepted(userId, serviceTitle, providerName, bookingId) {
  return createNotification({
    userId,
    bookingId,
    title: "Request Accepted",
    message: `${providerName} has accepted your request for "${serviceTitle}".`,
    type: "request_accepted",
    actionUrl: `/user/bookings/${bookingId}`,
  });
}

export async function notifyRequestRejected(userId, serviceTitle, providerName) {
  return createNotification({
    userId,
    title: "Request Rejected",
    message: `${providerName} has declined your request for "${serviceTitle}".`,
    type: "request_rejected",
  });
}

export async function notifyPaymentMade(userId, amount, serviceTitle) {
  return createNotification({
    userId,
    title: "Payment Made",
    message: `Payment of ₹${amount} for "${serviceTitle}" has been processed.`,
    type: "payment_made",
  });
}

export async function notifyNewServiceRequest(providerId, userName, serviceTitle) {
  return createNotification({
    providerId,
    title: "New Service Request",
    message: `${userName} has requested "${serviceTitle}".`,
    type: "request_sent",
    actionUrl: `/provider/bookings`,
  });
}

export async function notifyPaymentReceived(providerId, amount, userName, serviceTitle) {
  return createNotification({
    providerId,
    title: "Payment Received",
    message: `You received ₹${amount} from ${userName} for "${serviceTitle}".`,
    type: "payment_received",
  });
}

export async function notifyServiceScheduled(providerId, userName, scheduledDate) {
  return createNotification({
    providerId,
    title: "Service Scheduled",
    message: `Service scheduled for ${new Date(scheduledDate).toLocaleDateString()} by ${userName}.`,
    type: "service_scheduled",
  });
}

export async function notifyWarning(userId, warning) {
  return createNotification({
    userId,
    title: "Warning",
    message: warning,
    type: "warning",
  });
}

export async function notifyReviewReceived(providerId, userName, rating, serviceTitle) {
  return createNotification({
    providerId,
    title: "New Review",
    message: `${userName} left a ${rating}-star review for "${serviceTitle}".`,
    type: "review_received",
  });
}

export async function notifyComplaintFiled(providerId, userName, reason) {
  return createNotification({
    providerId,
    title: "Complaint Filed",
    message: `${userName} has filed a complaint: "${reason}"`,
    type: "complaint_filed",
  });
}

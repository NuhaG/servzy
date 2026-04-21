import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import Provider from "@/models/Provider";
import { getSessionUser } from "@/lib/rbac";

// DEBUG only - list all notifications and show provider context
export async function GET(req) {
  try {
    await connectDB();
    const { user } = await getSessionUser({ createIfMissing: true });

    const all = await Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const count = await Notification.countDocuments({});

    // Get current user's provider doc
    let currentUserProvider = null;
    if (user) {
      currentUserProvider = await Provider.findOne({ clerkId: user.clerkId }).lean();
    }

    // Show what the notification query would return for this user
    let notificationsForUser = [];
    let queryUsed = {};
    
    if (currentUserProvider) {
      queryUsed = { 
        providerId: currentUserProvider._id,
        type: "service_request"
      };
      notificationsForUser = await Notification.find(queryUsed).lean();
    } else if (user.role === "admin") {
      queryUsed = {};
      notificationsForUser = await Notification.find(queryUsed).lean();
    } else {
      queryUsed = { 
        userId: user._id,
        providerId: { $exists: false },
        adminId: { $exists: false }
      };
      notificationsForUser = await Notification.find(queryUsed).lean();
    }

    // Check for problematic notifications
    const problematicNotifications = all.filter(n => {
      const recipientCount = [n.userId, n.providerId, n.adminId].filter(r => r !== undefined && r !== null).length;
      return recipientCount !== 1;
    });

    return NextResponse.json({
      totalCount: count,
      countForCurrentUser: notificationsForUser.length,
      problematicNotificationsCount: problematicNotifications.length,
      currentUser: {
        _id: user?._id.toString(),
        role: user?.role,
        clerkId: user?.clerkId,
      },
      currentUserProvider: currentUserProvider ? {
        _id: currentUserProvider._id.toString(),
        clerkId: currentUserProvider.clerkId,
      } : null,
      queryUsedStr: JSON.stringify(queryUsed),
      notificationsForCurrentUser: notificationsForUser.map(n => ({
        _id: n._id.toString(),
        userId: n.userId?.toString?.() || n.userId,
        providerId: n.providerId?.toString?.() || n.providerId,
        adminId: n.adminId?.toString?.() || n.adminId,
        type: n.type,
        title: n.title,
        createdAt: n.createdAt,
      })),
      problematicNotifications: problematicNotifications.map(n => ({
        _id: n._id.toString(),
        userId: n.userId?.toString?.() || n.userId,
        providerId: n.providerId?.toString?.() || n.providerId,
        adminId: n.adminId?.toString?.() || n.adminId,
        type: n.type,
        title: n.title,
        recipientCount: [n.userId, n.providerId, n.adminId].filter(r => r).length,
      })),
      allNotificationsInDb: all.slice(0, 20).map(n => ({
        _id: n._id.toString(),
        userId: n.userId?.toString?.() || n.userId,
        providerId: n.providerId?.toString?.() || n.providerId,
        adminId: n.adminId?.toString?.() || n.adminId,
        type: n.type,
        title: n.title,
        createdAt: n.createdAt,
      })),
      message: "DEBUG: Check 'notificationsForCurrentUser' count and 'queryUsedStr' to understand the issue"
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

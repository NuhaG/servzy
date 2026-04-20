import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { ROLES } from "@/lib/roles";
import { syncClerkUserRole } from "@/lib/clerk";
import { getSessionUser, hasRole } from "@/lib/rbac";

export async function PATCH(req, { params }) {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(user, [ROLES.ADMIN])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { id } = await params; // provider _id

    // find provider
    const provider = await Provider.findById(id);
    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 },
      );
    }

    provider.status = "blocked";
    provider.blocked = true;
    await provider.save();

    const userDoc = await User.findOneAndUpdate(
      { clerkId: provider.clerkId },
      { role: ROLES.USER, blocked: true },
    );

    if (provider.clerkId) {
      try {
        await syncClerkUserRole(provider.clerkId, ROLES.USER);
      } catch (clerkError) {
        console.warn("Clerk metadata update failed:", clerkError.message);
      }
    }

    // Send notification to blocked provider
    try {
      await Notification.create({
        providerId: provider._id,
        title: "Account Blocked 🚫",
        message: `Your account has been blocked by an administrator. You can no longer provide services. Please contact support for more information.`,
        type: "warning",
        actionUrl: `/provider/profile`,
      });

      // Also notify the user
      if (userDoc?._id) {
        await Notification.create({
          userId: userDoc._id,
          title: "Account Blocked 🚫",
          message: `Your account has been blocked by an administrator. You can no longer provide services or book services. Please contact support for more information.`,
          type: "warning",
          actionUrl: `/provider/profile`,
        });
      }
    } catch (notifErr) {
      console.error("Failed to create block notification:", notifErr);
    }

    return NextResponse.json(
      { message: "Provider blocked successfully", provider },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to block provider" },
      { status: 500 },
    );
  }
}

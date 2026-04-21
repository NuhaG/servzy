import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

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
    const { id } = await params;

    const provider = await Provider.findById(id);
    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 },
      );
    }

    provider.flaggedCount = Number(provider.flaggedCount || 0) + 1;
    await provider.save();

    // Send notification to provider
    try {
      await Notification.create({
        providerId: provider._id,
        title: "Account Flagged ⚠️",
        message: `Your account has been flagged for review by an administrator. Please review your account and contact support if you have concerns.`,
        type: "warning",
        actionUrl: `/provider/profile`,
      });

      // Also update the associated user
      const providerUser = await User.findOne({ clerkId: provider.clerkId });
      if (providerUser) {
        providerUser.flagged = true;
        providerUser.flaggedCount = Number(providerUser.flaggedCount || 0) + 1;
        await providerUser.save();

        await Notification.create({
          userId: providerUser._id,
          title: "Account Flagged ⚠️",
          message: `Your account has been flagged for review by an administrator. Please review your account and contact support if you have concerns.`,
          type: "warning",
          actionUrl: `/provider/profile`,
        });
      }
    } catch (notifErr) {
      console.error("Failed to create flag notification:", notifErr);
    }

    return NextResponse.json(
      { message: "Provider flagged for review", provider },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to flag provider" },
      { status: 500 },
    );
  }
}

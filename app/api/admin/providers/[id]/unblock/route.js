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

        provider.status = "pending"; // Set to pending so admin can review again
        provider.blocked = false;
        await provider.save();

        const userDoc = await User.findOneAndUpdate(
            { clerkId: provider.clerkId },
            { role: ROLES.PROVIDER, blocked: false },
        );

        if (provider.clerkId) {
            try {
                await syncClerkUserRole(provider.clerkId, ROLES.PROVIDER);
            } catch (clerkError) {
                console.warn("Clerk metadata update failed:", clerkError.message);
            }
        }

        // Send notification to unblocked provider
        if (userDoc) {
            await Notification.create({
                userId: userDoc._id,
                title: "Account Unblocked",
                message: "Your provider account has been unblocked. You can now provide services again.",
                type: "warning",
                read: false,
            });
        }

        return NextResponse.json({ message: "Provider unblocked successfully", provider }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to unblock provider" }, { status: 500 });
    }
}
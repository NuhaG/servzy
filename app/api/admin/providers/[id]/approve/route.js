import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";
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
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        provider.status = "approved";
        provider.blocked = false;
        await provider.save();

        await User.findOneAndUpdate(
            { clerkId: provider.clerkId },
            { role: ROLES.PROVIDER }
        );

        if (provider.clerkId) {
            try {
                await syncClerkUserRole(provider.clerkId, ROLES.PROVIDER);
            } catch (clerkError) {
                console.warn("Clerk metadata update failed:", clerkError.message);
            }
        }

        return NextResponse.json({ message: "Provider approved successfully", provider }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to approve provider" }, { status: 500 });
    }
}

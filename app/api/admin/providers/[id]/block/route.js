import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";
import { ROLES } from "@/lib/roles";
import { syncClerkUserRole } from "@/lib/clerk";

export async function PATCH(req, { params }) {
    try {
        await connectDB();

        const { id } = await params; // provider _id

        // find provider
        const provider = await Provider.findById(id);
        if (!provider) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        provider.status = "blocked";
        provider.blocked = true;
        await provider.save();

        await User.findOneAndUpdate(
            { clerkId: provider.clerkId },
            { role: ROLES.USER }
        );

        if (provider.clerkId) {
            try {
                await syncClerkUserRole(provider.clerkId, ROLES.USER);
            } catch (clerkError) {
                console.warn("Clerk metadata update failed:", clerkError.message);
            }
        }

        return NextResponse.json({ message: "Provider blocked successfully", provider }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to block provider" }, { status: 500 });
    }
}

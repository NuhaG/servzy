import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import { clerkClient } from "@clerk/nextjs/server";

export async function PATCH(req, { params }) {
    try {
        await connectDB();
        const client = await clerkClient();

        const { id } = await params; // provider _id

        // find provider
        const provider = await Provider.findById(id);
        if (!provider) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        provider.status = "approved";
        provider.blocked = false;
        await provider.save();

        // update Clerk user role to 'provider'
        if (provider.clerkId) {
            try {
                await client.users.updateUser(provider.clerkId, {
                    publicMetadata: { role: "provider" }
                });
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

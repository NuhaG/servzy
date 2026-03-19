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

        provider.status = "blocked";
        provider.blocked = true;
        await provider.save();

        // optionally, update Clerk user role to "user" (blocked provider loses provider access)
        if (provider.clerkId) {
            try {
                await client.users.updateUser(provider.clerkId, {
                    publicMetadata: { role: "user" }
                });
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

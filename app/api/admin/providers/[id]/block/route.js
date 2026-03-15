import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import { clerkClient } from "@clerk/nextjs/server";

export async function PATCH(req, { params }) {
    try {
        await connectDB();

        const { id } = params; // provider _id

        // find provider
        const provider = await Provider.findById(id);
        if (!provider) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        provider.status = "blocked";
        await provider.save();

        // optionally, update Clerk user role to "user" (blocked provider loses provider access)
        if (provider.clerkId) {
            await clerkClient.users.updateUser(provider.clerkId, {
                publicMetadata: { role: "user" }
            });
        }

        return NextResponse.json({ message: "Provider blocked successfully", provider }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to block provider" }, { status: 500 });
    }
}
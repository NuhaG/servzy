import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";

// CREATE provider profile
export async function POST(req) {
    try {
        await connectDB();

        const body = await req.json();
        const { userId, businessName, bio, categories, location } = body;

        // check user exists
        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // check if provider profile already exists
        const existing = await Provider.findOne({ userId });
        if (existing) {
            return NextResponse.json(
                { error: "Provider profile already exists" },
                { status: 400 }
            );
        }

        const provider = await Provider.create({
            userId,
            clerkId: user.clerkId,
            businessName,
            bio: bio || "",
            categories: categories || [],
            location: location || "",
            status: "pending", // initial status
            avgRating: 0,
            totalReviews: 0
        });

        return NextResponse.json(provider, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to create provider profile" },
            { status: 500 }
        );
    }
}
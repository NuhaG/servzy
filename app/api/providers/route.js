import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";
import { ROLES } from "@/lib/roles";
import { syncClerkUserRole } from "@/lib/clerk";

// GET providers
export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const clerkId = searchParams.get("clerkId");
        const includeAll = searchParams.get("includeAll") === "1";
        const status = searchParams.get("status");
        const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 200);

        if (clerkId) {
            const provider = await Provider.findOne({ clerkId }).lean();
            if (!provider) {
                return NextResponse.json({ error: "Provider not found" }, { status: 404 });
            }
            return NextResponse.json(provider, { status: 200 });
        }

        const query = {};
        if (!includeAll) {
            query.status = "approved";
            query.blocked = { $ne: true };
        } else if (status) {
            query.status = status;
        }

        const providers = await Provider.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        return NextResponse.json(providers, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch providers" },
            { status: 500 }
        );
    }
}

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
        user.role = ROLES.PROVIDER;
        await user.save();

        if (user.clerkId) {
            try {
                await syncClerkUserRole(user.clerkId, ROLES.PROVIDER);
            } catch (clerkError) {
                console.warn("Clerk metadata update failed:", clerkError.message);
            }
        }

        return NextResponse.json(provider, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to create provider profile" },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/db";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// GET all users (admin only)
export async function GET(req) {
    try {
        const { userId, user } = await getSessionUser({ createIfMissing: true });
        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!hasRole(user, [ROLES.ADMIN])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");

        const users = await User.find()
            .select("name email role createdAt") // avoid exposing clerkId
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        const totalUsers = await User.countDocuments();

        return NextResponse.json({
            users,
            page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
    }
}

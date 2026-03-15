import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// GET all users (admin only)
export async function GET(req) {
    try {
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
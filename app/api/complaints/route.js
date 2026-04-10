import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Complaint from "@/models/Complaint";
import Provider from "@/models/Provider";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";

export async function POST(request) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const { category, description, attachments, providerId } = await request.json();

        if (!providerId) {
            return NextResponse.json({ error: "providerId is required" }, { status: 400 });
        }

        const provider = await Provider.findById(providerId);
        if (!provider) {
            return NextResponse.json({ error: "Provider not found" }, { status: 404 });
        }

        const complaint = new Complaint({
            userId: user._id,
            providerId,
            category,
            description,
            attachments: attachments || [],
        });

        await complaint.save();
        await complaint.populate({
            path: "providerId",
            select: "businessName userId",
            populate: {
                path: "userId",
                select: "email",
            },
        });

        // avoid passing mongoose doc internals to JSON serializer
        return NextResponse.json(complaint.toObject());
    } catch (error) {
        console.error("Create complaint error:", error);
        return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();

        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const complaints = await Complaint.find({ userId: user._id })
            .populate({
                path: "providerId",
                select: "businessName userId",
                populate: {
                    path: "userId",
                    select: "email",
                },
            })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(complaints);
    } catch (error) {
        console.error("Get complaints error:", error);
        return NextResponse.json({ error: "Failed to get complaints" }, { status: 500 });
    }
}
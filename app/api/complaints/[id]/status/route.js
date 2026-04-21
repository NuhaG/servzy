import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Complaint from "@/models/Complaint";
import Provider from "@/models/Provider";
import { auth } from "@clerk/nextjs/server";
import User from "@/models/User";

export async function PUT(request, { params }) {
    try {
        await connectDB();
        const { userId: clerkId } = await auth();
        console.log(clerkId);
        if (!clerkId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await User.findOne({ clerkId });
        if (!user || user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const { status, internalNotes } = await request.json();

        const complaint = await Complaint.findById(id);
        if (!complaint) {
            return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        }

        const updates = { status };
        if (internalNotes !== undefined) {
            updates.internalNotes = internalNotes;
        }

        let updatedComplaint = await Complaint.findByIdAndUpdate(id, updates, {
            returnDocument: 'after',
            runValidators: true,
            context: "query",
        });

        if (!updatedComplaint) {
            return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
        }

        await updatedComplaint.populate([
            { path: "userId", select: "name email" },
            {
                path: "providerId",
                select: "businessName userId",
                populate: {
                    path: "userId",
                    select: "email",
                },
            },
        ]);

        return NextResponse.json(updatedComplaint);
    } catch (error) {
        console.error("Update complaint status error:", error);
        return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
    }
}
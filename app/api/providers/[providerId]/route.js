import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";
import { uploadToCloudinary } from "@/lib/cloudinary";

// GET provider profile
export async function GET(req, { params }) {
    try {
        const { user } = await getSessionUser({ createIfMissing: false });
        await connectDB();

        const { providerId } = await params;

        // fetch provider
        const provider = await Provider.findById(providerId).lean();

        if (!provider) {
            return NextResponse.json(
                { error: "Provider not found" },
                { status: 404 }
            );
        }

        const isPublicVisible = provider.blocked !== true && provider.status !== "blocked";
        const isAdmin = hasRole(user, [ROLES.ADMIN]);
        const isOwner = Boolean(user?.clerkId && provider.clerkId === user.clerkId);

        if (!isPublicVisible && !isAdmin && !isOwner) {
            return NextResponse.json(
                { error: "Provider not found" },
                { status: 404 }
            );
        }

        // fetch active services for this provider
        const services = await Service.find({
            providerId: provider._id,
            isActive: true
        }).lean();

        // derive live stats from bookings so details page always has real values
        const bookings = await Booking.find({ providerId: provider._id })
            .select("status")
            .lean();
        const totalBookings = bookings.length;
        const acceptedOrCompleted = bookings.filter(
            (item) => item.status === "accepted" || item.status === "completed"
        ).length;
        const cancelled = bookings.filter((item) => item.status === "cancelled").length;
        const rejected = bookings.filter((item) => item.status === "rejected").length;

        const liveAcceptRate = totalBookings
            ? Math.round((acceptedOrCompleted / totalBookings) * 100)
            : 0;
        const cancellationRate = totalBookings
            ? Math.round(((cancelled + rejected) / totalBookings) * 100)
            : 0;
        const liveReliability = totalBookings
            ? Math.max(0, Math.min(100, Math.round((liveAcceptRate * 0.8) + ((100 - cancellationRate) * 0.2))))
            : 0;

        // combine data
        const result = {
            ...provider,
            totalBookings,
            acceptRate: Number.isFinite(Number(provider.acceptRate))
                ? Number(provider.acceptRate)
                : liveAcceptRate,
            reliabilityScore: Number.isFinite(Number(provider.reliabilityScore))
                ? Number(provider.reliabilityScore)
                : liveReliability,
            cancellations: Number.isFinite(Number(provider.cancellations))
                ? Number(provider.cancellations)
                : cancelled,
            services
        };

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch provider profile" },
            { status: 500 }
        );
    }
}

// UPDATE provider profile (including profile picture)
export async function PATCH(req, { params }) {
    try {
        const { user } = await getSessionUser({ createIfMissing: false });
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const { providerId } = await params;

        // Check if provider exists and belongs to current user
        const provider = await Provider.findById(providerId);
        if (!provider) {
            return NextResponse.json(
                { error: "Provider not found" },
                { status: 404 }
            );
        }

        // Check authorization - must be owner or admin
        const isAdmin = hasRole(user, [ROLES.ADMIN]);
        const isOwner = user.clerkId === provider.clerkId;

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        // Parse FormData
        const formData = await req.formData();
        const updates = {};

        // Handle text fields
        const businessName = formData.get("businessName");
        const bio = formData.get("bio");
        const location = formData.get("location");

        if (businessName) updates.businessName = businessName;
        if (bio !== null) updates.bio = bio;
        if (location !== null) updates.location = location;

        // Handle file upload for profile picture
        const profilePicFile = formData.get("profilePic");
        if (profilePicFile && profilePicFile.size > 0) {
            try {
                const buffer = await profilePicFile.arrayBuffer();
                const result = await uploadToCloudinary(
                    Buffer.from(buffer),
                    "servzy/provider_profiles"
                );
                if (result) {
                    updates.avatarUrl = result.secure_url;
                } else {
                    return NextResponse.json(
                        { error: "Failed to upload profile picture" },
                        { status: 400 }
                    );
                }
            } catch (uploadError) {
                console.error("Upload error:", uploadError);
                return NextResponse.json(
                    { error: "Failed to upload profile picture" },
                    { status: 400 }
                );
            }
        }

        // Update provider
        const updatedProvider = await Provider.findByIdAndUpdate(
            providerId,
            updates,
            { new: true }
        );

        return NextResponse.json(updatedProvider, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to update provider profile" },
            { status: 500 }
        );
    }
}

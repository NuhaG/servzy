import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import Service from "@/models/Service";
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

        // combine data
        const result = {
            ...provider,
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

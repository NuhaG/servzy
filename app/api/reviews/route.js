import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";
import Service from "@/models/Service";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

async function updateProviderRating(providerId) {
    const providerServices = await Service.find({ providerId }).select("_id").lean();
    const serviceIds = providerServices.map((service) => service._id);

    const reviews = await Review.find({ serviceId: { $in: serviceIds } }).select("rating").lean();

    const totalReviews = reviews.length;
    const avgRating = totalReviews
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    await Provider.findByIdAndUpdate(providerId, { avgRating, totalReviews });
}

// POST a review
export async function POST(req) {
    try {
        const { userId: sessionUserId, user } = await getSessionUser({ createIfMissing: true });
        if (!sessionUserId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!hasRole(user, [ROLES.USER, ROLES.ADMIN])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { userId, serviceId, bookingId, rating, comment } = await req.json();

        // check booking exists and completed
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        if (booking.status !== "completed") {
            return NextResponse.json({ error: "Booking not completed yet" }, { status: 400 });
        }

        if (!hasRole(user, [ROLES.ADMIN]) && booking.userId.toString() !== String(user._id)) {
            return NextResponse.json({ error: "You can only review your own booking" }, { status: 403 });
        }

        if (booking.serviceId.toString() !== serviceId) {
            return NextResponse.json({ error: "serviceId does not match booking" }, { status: 400 });
        }

        // prevent duplicate review for same booking
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return NextResponse.json({ error: "Review already submitted for this booking" }, { status: 400 });
        }

        const review = await Review.create({
            userId: hasRole(user, [ROLES.ADMIN]) && userId ? userId : user._id,
            serviceId,
            bookingId,
            rating,
            comment: comment || ""
        });

        await updateProviderRating(booking.providerId);

        return NextResponse.json(review, { status: 201 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
    }
}

// GET reviews for a service
export async function GET(req) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const serviceId = searchParams.get("serviceId");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");

        if (!serviceId) {
            return NextResponse.json({ error: "serviceId is required" }, { status: 400 });
        }

        const reviews = await Review.find({ serviceId })
            .populate("userId", "name avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return NextResponse.json(reviews, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }
}

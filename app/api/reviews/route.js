import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";

// POST a review
export async function POST(req) {
    try {
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

        // prevent duplicate review for same booking
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return NextResponse.json({ error: "Review already submitted for this booking" }, { status: 400 });
        }

        const review = await Review.create({
            userId,
            serviceId,
            bookingId,
            rating,
            comment: comment || ""
        });

        // update provider avgRating and totalReviews
        const reviews = await Review.find({ serviceId });
        const totalReviews = reviews.length;
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

        const bookingServiceProviderId = booking.providerId;
        await Provider.findByIdAndUpdate(bookingServiceProviderId, {
            avgRating,
            totalReviews
        });

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
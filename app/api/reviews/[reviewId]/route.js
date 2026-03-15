import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Provider from "@/models/Provider";

// DELETE a review
export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const { reviewId } = params;
        const { userId, isAdmin } = await req.json(); // provide current user info

        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // only review owner or admin can delete
        if (review.userId.toString() !== userId && !isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const serviceId = review.serviceId;
        await review.deleteOne();

        // recalculate provider avgRating and totalReviews
        const remainingReviews = await Review.find({ serviceId });
        const totalReviews = remainingReviews.length;
        const avgRating = totalReviews
            ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
            : 0;

        const provider = await Provider.findOne({ _id: review.providerId });
        if (provider) {
            provider.avgRating = avgRating;
            provider.totalReviews = totalReviews;
            await provider.save();
        }

        return NextResponse.json({ message: "Review deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}
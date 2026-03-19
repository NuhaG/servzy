import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Review from "@/models/Review";
import Provider from "@/models/Provider";
import Service from "@/models/Service";

async function updateProviderRating(providerId) {
    const providerServices = await Service.find({ providerId }).select("_id").lean();
    const serviceIds = providerServices.map((service) => service._id);

    const remainingReviews = await Review.find({ serviceId: { $in: serviceIds } })
        .select("rating")
        .lean();

    const totalReviews = remainingReviews.length;
    const avgRating = totalReviews
        ? remainingReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    await Provider.findByIdAndUpdate(providerId, { avgRating, totalReviews });
}

// DELETE a review
export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const { reviewId } = await params;
        const { userId, isAdmin } = await req.json(); // provide current user info

        const review = await Review.findById(reviewId);
        if (!review) {
            return NextResponse.json({ error: "Review not found" }, { status: 404 });
        }

        // only review owner or admin can delete
        if (review.userId.toString() !== userId && !isAdmin) {
            return NextResponse.json({ error: "Not authorized" }, { status: 403 });
        }

        const service = await Service.findById(review.serviceId).select("providerId").lean();
        if (!service?.providerId) {
            return NextResponse.json({ error: "Related service not found" }, { status: 404 });
        }

        await review.deleteOne();

        await updateProviderRating(service.providerId);

        return NextResponse.json({ message: "Review deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
    }
}

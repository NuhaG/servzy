import mongoose from "mongoose";

const ComplaintSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            required: true,
            enum: ["service_quality", "provider_behavior", "booking_issue", "payment_problem", "technical_issue", "other"],
        },
        description: {
            type: String,
            required: true,
        },
        attachments: [String], // URLs to uploaded images
        status: {
            type: String,
            enum: ["open", "in_review", "resolved"],
            default: "open",
        },
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            required: true,
        },
        internalNotes: String, // For admin/provider notes
    },
    { timestamps: true },
);

export default mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);
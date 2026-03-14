import mongoose from "mongoose";

const ProviderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    businessName: {
      type: String,
      required: true,
    },
    bio: String,
    categories: [String],
    location: String,
    status: {
      type: String,
      enum: ["pending", "approved", "blocked"],
      default: "pending",
    },
    avgRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Provider ||
  mongoose.model("Provider", ProviderSchema);

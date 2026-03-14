import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
    },
    title: { type: String, required: true },
    description: String,
    category: { type: String, required: true },
    price: { type: Number, required: true },
    priceUnit: {
      type: String,
      enum: ["per_hour", "per_job", "per_day"],
      default: "per_hour",
    },
    images: [String],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("Service", ServiceSchema);

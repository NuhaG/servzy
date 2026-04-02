import mongoose from "mongoose";

const ServiceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    category: String,
    price: Number,
    priceUnit: {
      type: String,
      enum: ["per_hour", "per_job", "per_day"],
      default: "per_hour",
    },
    serviceImages: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export default mongoose.models.Service ||
  mongoose.model("Service", ServiceSchema);

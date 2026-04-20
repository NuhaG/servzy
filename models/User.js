import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    name: String,
    email: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    avatarUrl: String,
    location: String,
    lat: Number,
    lng: Number,
    phone: String,
    blocked: {
      type: Boolean,
      default: false,
    },
    flagged: {
      type: Boolean,
      default: false,
    },
    flaggedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

export default mongoose.models.User || mongoose.model("User", UserSchema);

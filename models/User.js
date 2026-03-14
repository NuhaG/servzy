import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    avatar: String,
  },
  { timestamps: true },
);

export default mongoose.model("User", UserSchema);

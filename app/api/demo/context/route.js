import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Provider from "@/models/Provider";
import Service from "@/models/Service";

export async function GET() {
  try {
    await connectDB();

    const currentUser = await User.findOne({ email: "aryan@servzy.demo" }).select("_id name email").lean();
    const primaryProvider = await Provider.findOne({ businessName: "Priya Sharma" })
      .select("_id businessName")
      .lean();
    const primaryService = primaryProvider
      ? await Service.findOne({ providerId: primaryProvider._id }).select("_id title").lean()
      : null;

    return NextResponse.json(
      {
        currentUser,
        primaryProvider,
        primaryService,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load demo context" }, { status: 500 });
  }
}

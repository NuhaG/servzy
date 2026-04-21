import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";
import { getSessionUser } from "@/lib/rbac";

// DEBUG - check current user's provider info
export async function GET(req) {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });
    
    if (!userId || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    // Find provider
    const provider = await Provider.findOne({ clerkId: user.clerkId });

    return NextResponse.json({
      currentUser: {
        userId: user._id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
      },
      provider: provider ? {
        _id: provider._id,
        businessName: provider.businessName,
        clerkId: provider.clerkId,
        userId: provider.userId,
      } : null,
      message: "DEBUG: Current user and provider info"
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { ROLES } from "@/lib/roles";
import { syncClerkUserRole } from "@/lib/clerk";

const ALLOWED_SELF_ASSIGN = new Set([ROLES.USER, ROLES.PROVIDER]);

export async function PATCH(req) {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();
    if (!ALLOWED_SELF_ASSIGN.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const user = await User.findOne({ clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === ROLES.ADMIN) {
      return NextResponse.json({ error: "Admin role cannot be changed here" }, { status: 403 });
    }

    user.role = role;
    await user.save();

    try {
      await syncClerkUserRole(userId, role);
    } catch (clerkError) {
      console.warn("Clerk metadata update failed:", clerkError.message);
    }

    return NextResponse.json({ message: "Role updated", role }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}


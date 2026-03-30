import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

export async function PATCH(req, { params }) {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(user, [ROLES.ADMIN])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;

    const provider = await Provider.findById(id);
    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    provider.flaggedCount = Number(provider.flaggedCount || 0) + 1;
    await provider.save();

    return NextResponse.json(
      { message: "Provider flagged for review", provider },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to flag provider" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { ROLES } from "@/lib/roles";
import { syncClerkUserRole } from "@/lib/clerk";
import { getSessionUser } from "@/lib/rbac";

const ALLOWED_SELF_ASSIGN = new Set([ROLES.USER, ROLES.PROVIDER]);

export async function PATCH(req) {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role } = await req.json();
    if (!ALLOWED_SELF_ASSIGN.has(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
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

import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Provider from "@/models/Provider";
import { isValidRole, ROLES } from "@/lib/roles";
import { syncClerkUserRole } from "@/lib/clerk";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "demo.admin+1@gmail.com")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
);

function normalizeName(clerkUser) {
  if (!clerkUser) return "User";
  if (clerkUser.fullName) return clerkUser.fullName;
  const first = clerkUser.firstName || "";
  const last = clerkUser.lastName || "";
  const name = `${first} ${last}`.trim();
  return name || clerkUser.username || "User";
}

function normalizeEmail(clerkUser, userId) {
  const email = clerkUser?.primaryEmailAddress?.emailAddress;
  return email || `${userId}@clerk.local`;
}

export async function GET() {
  try {
    await connectDB();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clerk = await currentUser();
    const metadataRole = clerk?.publicMetadata?.role;
    const role = isValidRole(metadataRole) ? metadataRole : ROLES.USER;

    let user = await User.findOne({ clerkId: userId });
    const normalizedEmail = normalizeEmail(clerk, userId).toLowerCase();
    const shouldBeAdmin = ADMIN_EMAILS.has(normalizedEmail);

    if (!user) {
      user = await User.create({
        clerkId: userId,
        name: normalizeName(clerk),
        email: normalizedEmail,
        role: shouldBeAdmin ? ROLES.ADMIN : role,
      });
      if (shouldBeAdmin) {
        try {
          await syncClerkUserRole(userId, ROLES.ADMIN);
        } catch (clerkError) {
          console.warn("Clerk metadata update failed:", clerkError.message);
        }
      }
    } else {
      let shouldSave = false;

      if (clerk && !user.name) {
        user.name = normalizeName(clerk);
        shouldSave = true;
      }

      if (!user.email) {
        user.email = normalizedEmail;
        shouldSave = true;
      }

      if (shouldBeAdmin && user.role !== ROLES.ADMIN) {
        user.role = ROLES.ADMIN;
        shouldSave = true;
        try {
          await syncClerkUserRole(userId, ROLES.ADMIN);
        } catch (clerkError) {
          console.warn("Clerk metadata update failed:", clerkError.message);
        }
      } else if (!isValidRole(user.role)) {
        user.role = role;
        shouldSave = true;
      }

      if (shouldSave) await user.save();
    }

    const provider = await Provider.findOne({ clerkId: userId })
      .select("_id businessName status blocked location avgRating totalReviews")
      .lean();

    return NextResponse.json(
      {
        user: {
          _id: user._id,
          clerkId: user.clerkId,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        provider,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load current user" }, { status: 500 });
  }
}

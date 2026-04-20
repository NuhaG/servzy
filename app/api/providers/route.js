import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import User from "@/models/User";
import { ROLES } from "@/lib/roles";
import { syncClerkUserRole } from "@/lib/clerk";
import { getSessionUser, hasRole } from "@/lib/rbac";

// GET providers
export async function GET(req) {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });
    await connectDB();

    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");
    const includeAll = searchParams.get("includeAll") === "1";
    const status = searchParams.get("status");
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      200,
    );

    if (clerkId) {
      if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const isAdmin = hasRole(user, [ROLES.ADMIN]);
      if (!isAdmin && user.clerkId !== clerkId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      const provider = await Provider.findOne({ clerkId }).lean();
      if (!provider) {
        return NextResponse.json(
          { error: "Provider not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(provider, { status: 200 });
    }

    const query = {};
    if (!includeAll) {
      query.blocked = { $ne: true };
    } else if (status) {
      if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!hasRole(user, [ROLES.ADMIN])) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      query.status = status;
    } else if (includeAll) {
      if (!userId || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (!hasRole(user, [ROLES.ADMIN])) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const providers = await Provider.find(query)
      .populate({
        path: "userId",
        match: includeAll ? {} : { role: "provider" }, // Only filter by role for non-admin requests
        select: "name email role",
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Filter out providers where userId is null (user doesn't exist or doesn't have provider role)
    const filteredProviders = providers.filter((p) => p.userId);

    return NextResponse.json(filteredProviders, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 },
    );
  }
}

// CREATE provider profile
export async function POST(req) {
  try {
    const { userId: sessionUserId, user: sessionUser } = await getSessionUser({
      createIfMissing: true,
    });
    if (!sessionUserId || !sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(sessionUser, [ROLES.USER, ROLES.PROVIDER, ROLES.ADMIN])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();
    const { userId, businessName, bio, categories, location } = body;

    const resolvedUserId =
      hasRole(sessionUser, [ROLES.ADMIN]) && userId ? userId : sessionUser._id;

    // check user exists
    const user = await User.findById(resolvedUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // check if provider profile already exists
    const existing = await Provider.findOne({ userId: resolvedUserId });
    if (existing) {
      return NextResponse.json(
        { error: "Provider profile already exists" },
        { status: 400 },
      );
    }

    const provider = await Provider.create({
      userId: resolvedUserId,
      clerkId: user.clerkId,
      businessName: (businessName || user.name || "Provider").trim(),
      bio: bio || "",
      categories: categories || [],
      location: location || "",
      status: "pending", // initial status
      avgRating: 0,
      totalReviews: 0,
    });
    user.role = ROLES.PROVIDER;
    await user.save();

    if (user.clerkId) {
      try {
        await syncClerkUserRole(user.clerkId, ROLES.PROVIDER);
      } catch (clerkError) {
        console.warn("Clerk metadata update failed:", clerkError.message);
      }
    }

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create provider profile" },
      { status: 500 },
    );
  }
}

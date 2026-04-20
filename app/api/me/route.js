import { NextResponse } from "next/server";
import Provider from "@/models/Provider";
import { getSessionUser } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

export async function GET() {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });

    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let provider = await Provider.findOne({ clerkId: userId })
      .select("_id businessName status blocked location avgRating totalReviews")
      .lean();

    // Self-heal older accounts: if role is provider but profile doc is missing, create one.
    if (!provider && user.role === "provider") {
      try {
        await Provider.create({
          userId: user._id,
          clerkId: user.clerkId,
          businessName: user.name ? `${user.name} Services` : "Provider Services",
          status: "pending",
          avgRating: 0,
          totalReviews: 0,
        });
      } catch (createError) {
        const msg = String(createError?.message || "");
        if (!msg.toLowerCase().includes("duplicate")) {
          throw createError;
        }
      }

      provider = await Provider.findOne({ clerkId: userId })
        .select("_id businessName status blocked location avgRating totalReviews")
        .lean();
    }

    // Self-heal older provider accounts whose app role did not get updated.
    if (provider && user.role !== ROLES.PROVIDER && user.role !== ROLES.ADMIN) {
      user.role = ROLES.PROVIDER;
      await user.save();
    }

    return NextResponse.json(
      {
        user: {
          _id: user._id,
          clerkId: user.clerkId,
          name: user.name,
          email: user.email,
          role: provider && user.role !== ROLES.ADMIN ? ROLES.PROVIDER : user.role,
        },
        provider,
        hasProvider: !!provider,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load current user" }, { status: 500 });
  }
}

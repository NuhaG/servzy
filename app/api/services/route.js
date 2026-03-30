import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";
import Provider from "@/models/Provider";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// GET all services
export async function GET(req) {
  try {
    await connectDB();

    const services = await Service.find({ isActive: true })
      .populate({
        path: "providerId",
        select: "businessName location avgRating status blocked",
        match: { blocked: { $ne: true } },
      })
      .sort({ createdAt: -1 });

    const visibleServices = services.filter((item) => item.providerId);

    return NextResponse.json(visibleServices, { status: 200 });
  } catch (error) {
    console.error("GET /api/services failed:", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Failed to fetch services: ${error.message}`
            : "Failed to fetch services",
      },
      { status: 500 }
    );
  }
}

// CREATE service (provider only)
export async function POST(req) {
  try {
    const { userId, user } = await getSessionUser({ createIfMissing: true });
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasRole(user, [ROLES.PROVIDER, ROLES.ADMIN])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const body = await req.json();

    const {
      providerId,
      title,
      description,
      category,
      price,
      priceUnit,
      images
    } = body;

    // check provider exists
    const provider = await Provider.findById(providerId);

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // blocked providers cannot create services
    if (provider.blocked === true || provider.status === "blocked") {
      return NextResponse.json(
        { error: "Provider is blocked" },
        { status: 403 }
      );
    }

    if (!hasRole(user, [ROLES.ADMIN]) && provider.clerkId !== user.clerkId) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const service = await Service.create({
      providerId,
      title,
      description,
      category,
      price,
      priceUnit,
      images,
      isActive: true
    });

    return NextResponse.json(service, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}

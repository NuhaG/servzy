import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";
import Provider from "@/models/Provider";

// GET all services
export async function GET(req) {
  try {
    await connectDB();

    const services = await Service.find({ isActive: true })
      .populate("providerId", "businessName location avgRating")
      .sort({ createdAt: -1 });

    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

// CREATE service (provider only)
export async function POST(req) {
  try {
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

    // check provider approved
    if (provider.status !== "approved") {
      return NextResponse.json(
        { error: "Provider not approved" },
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
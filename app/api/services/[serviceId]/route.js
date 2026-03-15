import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";

// GET single service
export async function GET(req, { params }) {
    try {
        await connectDB();

        const { serviceId } = params;

        const service = await Service.findById(serviceId)
            .populate("providerId", "businessName location avgRating");

        if (!service) {
            return NextResponse.json(
                { error: "Service not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(service, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch service" },
            { status: 500 }
        );
    }
}

// UPDATE service
export async function PATCH(req, { params }) {
    try {
        await connectDB();

        const { serviceId } = params;
        const body = await req.json();

        const service = await Service.findByIdAndUpdate(
            serviceId,
            body,
            { new: true }
        );

        if (!service) {
            return NextResponse.json(
                { error: "Service not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(service, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update service" },
            { status: 500 }
        );
    }
}

// DELETE service
export async function DELETE(req, { params }) {
    try {
        await connectDB();

        const { serviceId } = params;

        const service = await Service.findByIdAndDelete(serviceId);

        if (!service) {
            return NextResponse.json(
                { error: "Service not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Service deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete service" },
            { status: 500 }
        );
    }
}
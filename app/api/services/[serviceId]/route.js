import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";
import Provider from "@/models/Provider";
import { getSessionUser, hasRole } from "@/lib/rbac";
import { ROLES } from "@/lib/roles";

// GET single service
export async function GET(req, { params }) {
    try {
        await connectDB();

        const { serviceId } = await params;

        const service = await Service.findById(serviceId)
            .populate({
                path: "providerId",
                select: "businessName location avgRating status blocked",
                match: { blocked: { $ne: true } },
            });

        if (!service || !service.providerId) {
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
        const { userId, user } = await getSessionUser({ createIfMissing: true });
        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!hasRole(user, [ROLES.PROVIDER, ROLES.ADMIN])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { serviceId } = await params;
        const body = await req.json();
        const currentService = await Service.findById(serviceId).lean();
        if (!currentService) {
            return NextResponse.json(
                { error: "Service not found" },
                { status: 404 }
            );
        }

        const ownerProvider = await Provider.findById(currentService.providerId).select("clerkId").lean();
        if (!ownerProvider) {
            return NextResponse.json(
                { error: "Provider not found" },
                { status: 404 }
            );
        }

        if (!hasRole(user, [ROLES.ADMIN]) && ownerProvider.clerkId !== user.clerkId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

        const service = await Service.findByIdAndUpdate(
            serviceId,
            body,
            { returnDocument: "after" }
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
        const { userId, user } = await getSessionUser({ createIfMissing: true });
        if (!userId || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (!hasRole(user, [ROLES.PROVIDER, ROLES.ADMIN])) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await connectDB();

        const { serviceId } = await params;
        const currentService = await Service.findById(serviceId).lean();
        if (!currentService) {
            return NextResponse.json(
                { error: "Service not found" },
                { status: 404 }
            );
        }

        const ownerProvider = await Provider.findById(currentService.providerId).select("clerkId").lean();
        if (!ownerProvider) {
            return NextResponse.json(
                { error: "Provider not found" },
                { status: 404 }
            );
        }

        if (!hasRole(user, [ROLES.ADMIN]) && ownerProvider.clerkId !== user.clerkId) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            );
        }

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

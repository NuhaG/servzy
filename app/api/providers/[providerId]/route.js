import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import Service from "@/models/Service";

// GET provider profile
export async function GET(req, { params }) {
    try {
        await connectDB();

        const { providerId } = await params;

        // fetch provider
        const provider = await Provider.findById(providerId).lean();

        if (!provider) {
            return NextResponse.json(
                { error: "Provider not found" },
                { status: 404 }
            );
        }

        // fetch active services for this provider
        const services = await Service.find({
            providerId: provider._id,
            isActive: true
        }).lean();

        // combine data
        const result = {
            ...provider,
            services
        };

        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch provider profile" },
            { status: 500 }
        );
    }
}

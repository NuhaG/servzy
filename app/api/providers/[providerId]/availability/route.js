import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Provider from "@/models/Provider";

const SLOT_OPTIONS = [
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { providerId } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!providerId) {
      return NextResponse.json({ error: "providerId is required" }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ error: "date is required" }, { status: 400 });
    }

    const provider = await Provider.findById(providerId).select("_id blocked status").lean();
    if (!provider || provider.blocked === true || provider.status === "blocked") {
      return NextResponse.json({ error: "Provider not available" }, { status: 404 });
    }

    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    const bookings = await Booking.find({
      providerId,
      scheduledDate: { $gte: start, $lte: end },
      status: { $in: ["pending", "accepted"] },
    })
      .select("timeSlot")
      .lean();

    const bookedSlots = Array.from(
      new Set((bookings || []).map((item) => String(item.timeSlot || "").trim()).filter(Boolean)),
    );
    const availableSlots = SLOT_OPTIONS.filter((slot) => !bookedSlots.includes(slot));

    return NextResponse.json({ date, bookedSlots, availableSlots }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch slot availability" }, { status: 500 });
  }
}


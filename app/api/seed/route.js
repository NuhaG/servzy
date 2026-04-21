import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Provider from "@/models/Provider";
import Service from "@/models/Service";
import Booking from "@/models/Booking";
import Review from "@/models/Review";

function randomImageUrl(label) {
  const seed = `${label.toLowerCase().replace(/\s+/g, "-")}-${Math.floor(Math.random() * 100000)}`;
  return `https://picsum.photos/seed/${seed}/1200/800`;
}

function toClerkId(value) {
  return `demo_${value.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
}

const currentUserData = {
  id: "u1",
  name: "Aryan Sharma",
  city: "Bengaluru, India",
};

const providersData = [
  { id: "1", name: "Priya Sharma", rating: 4.9, reliabilityScore: 98, basePrice: 699, distance: "1.2 km", acceptRate: 96, rejectRate: 4, serviceTuple: ["House Cleaning", "Deep Cleaning"], services: ["House Cleaning", "Deep Cleaning", "Move-in Cleaning"], consultationFee: 99, serviceFee: 79, bookingCharge: 49, totalBookings: 542, cancellations: 5, location: "Powai, Mumbai", lat: 19.1176, lng: 72.906, flaggedCount: 0 },
  { id: "2", name: "Rahul Mehta", rating: 4.8, reliabilityScore: 95, basePrice: 899, distance: "2.1 km", acceptRate: 92, rejectRate: 8, serviceTuple: ["Plumbing", "Emergency Repairs"], services: ["Plumbing", "Emergency Repairs", "Bathroom Installation"], consultationFee: 149, serviceFee: 99, bookingCharge: 59, totalBookings: 431, cancellations: 9, location: "Andheri West, Mumbai", lat: 19.1367, lng: 72.8295, flaggedCount: 1 },
  { id: "3", name: "Ananya Nair", rating: 4.7, reliabilityScore: 93, basePrice: 549, distance: "3.0 km", acceptRate: 89, rejectRate: 11, serviceTuple: ["Pet Sitting", "Dog Walking"], services: ["Pet Sitting", "Dog Walking", "Pet Grooming Support"], consultationFee: 89, serviceFee: 69, bookingCharge: 39, totalBookings: 388, cancellations: 14, location: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295, flaggedCount: 0 },
  { id: "4", name: "Siddharth Rao", rating: 4.9, reliabilityScore: 97, basePrice: 999, distance: "1.7 km", acceptRate: 95, rejectRate: 5, serviceTuple: ["Electrical Work", "Wiring"], services: ["Electrical Work", "Wiring", "Fan and Light Installation"], consultationFee: 149, serviceFee: 119, bookingCharge: 69, totalBookings: 324, cancellations: 4, location: "Goregaon East, Mumbai", lat: 19.1663, lng: 72.8526, flaggedCount: 0 },
  { id: "5", name: "Aditi Verma", rating: 4.6, reliabilityScore: 91, basePrice: 749, distance: "4.2 km", acceptRate: 86, rejectRate: 14, serviceTuple: ["Gardening", "Landscaping"], services: ["Gardening", "Landscaping", "Lawn Care"], consultationFee: 119, serviceFee: 89, bookingCharge: 49, totalBookings: 276, cancellations: 11, location: "Thane West, Mumbai", lat: 19.2183, lng: 72.9781, flaggedCount: 0 },
  { id: "6", name: "Manoj Kulkarni", rating: 4.9, reliabilityScore: 99, basePrice: 1199, distance: "0.9 km", acceptRate: 98, rejectRate: 2, serviceTuple: ["AC Repair", "HVAC Installation"], services: ["AC Repair", "HVAC Installation", "Seasonal Maintenance"], consultationFee: 179, serviceFee: 129, bookingCharge: 79, totalBookings: 603, cancellations: 2, location: "Vashi, Navi Mumbai", lat: 19.076, lng: 72.9986, flaggedCount: 0 },
  { id: "7", name: "Harsh Jain", rating: 4.8, reliabilityScore: 96, basePrice: 849, distance: "2.4 km", acceptRate: 93, rejectRate: 7, serviceTuple: ["Carpentry", "Furniture Assembly"], services: ["Carpentry", "Furniture Assembly", "Door Repair"], consultationFee: 129, serviceFee: 99, bookingCharge: 59, totalBookings: 359, cancellations: 6, location: "Viman Nagar, Pune", lat: 18.5679, lng: 73.9143, flaggedCount: 0 },
  { id: "8", name: "Kavya Iyer", rating: 4.7, reliabilityScore: 94, basePrice: 629, distance: "3.5 km", acceptRate: 90, rejectRate: 10, serviceTuple: ["Salon at Home", "Facial Services"], services: ["Salon at Home", "Facial Services", "Bridal Makeup"], consultationFee: 99, serviceFee: 79, bookingCharge: 49, totalBookings: 412, cancellations: 10, location: "Chembur, Mumbai", lat: 19.0522, lng: 72.9005, flaggedCount: 0 },
  { id: "9", name: "Imran Khan", rating: 4.8, reliabilityScore: 95, basePrice: 779, distance: "2.9 km", acceptRate: 92, rejectRate: 8, serviceTuple: ["Appliance Repair", "Refrigerator Repair"], services: ["Appliance Repair", "Refrigerator Repair", "Washing Machine Repair"], consultationFee: 119, serviceFee: 89, bookingCharge: 59, totalBookings: 337, cancellations: 7, location: "Dadar, Mumbai", lat: 19.0178, lng: 72.8478, flaggedCount: 0 },
  { id: "10", name: "Nikita Banerjee", rating: 4.9, reliabilityScore: 97, basePrice: 689, distance: "1.8 km", acceptRate: 95, rejectRate: 5, serviceTuple: ["Home Painting", "Wall Texturing"], services: ["Home Painting", "Wall Texturing", "Touch-up Painting"], consultationFee: 109, serviceFee: 89, bookingCharge: 49, totalBookings: 451, cancellations: 4, location: "Lower Parel, Mumbai", lat: 19.0048, lng: 72.8258, flaggedCount: 0 },
  { id: "11", name: "Arvind Patel", rating: 4.7, reliabilityScore: 94, basePrice: 559, distance: "2.6 km", acceptRate: 91, rejectRate: 9, serviceTuple: ["Pest Control", "Termite Treatment"], services: ["Pest Control", "Termite Treatment", "Mosquito Control"], consultationFee: 89, serviceFee: 69, bookingCharge: 39, totalBookings: 288, cancellations: 8, location: "Mulund West, Mumbai", lat: 19.171, lng: 72.956, flaggedCount: 0 },
  { id: "12", name: "Sneha Reddy", rating: 4.8, reliabilityScore: 96, basePrice: 749, distance: "2.3 km", acceptRate: 94, rejectRate: 6, serviceTuple: ["Home Organizing", "Kitchen Setup"], services: ["Home Organizing", "Kitchen Setup", "Wardrobe Setup"], consultationFee: 99, serviceFee: 79, bookingCharge: 49, totalBookings: 311, cancellations: 5, location: "Ghatkopar East, Mumbai", lat: 19.0817, lng: 72.9081, flaggedCount: 0 },
];

const userBookingsData = [
  { providerId: "3", service: "Pet Sitting", date: "2026-02-21", time: "09:00 AM", status: "confirmed", amount: 746, type: "contract" },
  { providerId: "1", service: "Deep Cleaning", date: "2026-02-14", time: "10:00 AM", status: "completed", amount: 926, type: "one-time" },
  { providerId: "2", service: "Plumbing", date: "2026-02-10", time: "12:30 PM", status: "completed", amount: 1206, type: "one-time" },
  { providerId: "6", service: "AC Repair", date: "2026-02-05", time: "04:00 PM", status: "completed", amount: 1586, type: "one-time" },
  { providerId: "7", service: "Furniture Assembly", date: "2026-02-01", time: "11:30 AM", status: "completed", amount: 1136, type: "one-time" },
  { providerId: "8", service: "Salon at Home", date: "2026-01-27", time: "06:00 PM", status: "completed", amount: 856, type: "contract" },
  { providerId: "10", service: "Home Painting", date: "2026-01-22", time: "03:00 PM", status: "completed", amount: 936, type: "one-time" },
  { providerId: "5", service: "Gardening", date: "2026-01-18", time: "08:30 AM", status: "cancelled", amount: 1006, type: "contract" },
];

const providerBookingsData = [
  { providerId: "1", customerName: "Arjun Gupta", service: "House Cleaning", date: "2026-02-20", time: "11:00 AM", status: "pending", amount: 926, type: "one-time" },
  { providerId: "1", customerName: "Ishita Reddy", service: "Deep Cleaning", date: "2026-02-22", time: "03:00 PM", status: "pending", amount: 1149, type: "one-time" },
  { providerId: "2", customerName: "Tanya Shah", service: "Emergency Repairs", date: "2026-02-19", time: "09:00 AM", status: "pending", amount: 1250, type: "one-time" },
  { providerId: "6", customerName: "Ajay Kumar", service: "AC Repair", date: "2026-02-23", time: "02:00 PM", status: "pending", amount: 1599, type: "one-time" },
  { providerId: "10", customerName: "Prerna Das", service: "Home Painting", date: "2026-02-25", time: "11:30 AM", status: "confirmed", amount: 1280, type: "contract" },
];

export async function POST(req) {
  try {
    await connectDB();

    const { reset = true } = await req.json().catch(() => ({}));

    if (reset) {
      await Promise.all([
        Review.deleteMany({}),
        Booking.deleteMany({}),
        Service.deleteMany({}),
        Provider.deleteMany({}),
        User.deleteMany({}),
      ]);
    }

    const userCache = new Map();
    const providerCache = new Map();
    const serviceCache = new Map();
    const createdBookings = [];

    const adminUser = await User.create({
      clerkId: "demo_admin",
      name: "Admin User",
      email: "admin@servzy.demo",
      role: "admin",
      avatar: randomImageUrl("admin"),
    });

    const currentUser = await User.create({
      clerkId: toClerkId(currentUserData.name),
      name: currentUserData.name,
      email: "aryan@servzy.demo",
      role: "user",
      avatar: randomImageUrl(currentUserData.name),
    });
    userCache.set(currentUserData.name, currentUser);

    for (const item of providersData) {
      const providerUser = await User.create({
        clerkId: toClerkId(item.name),
        name: item.name,
        email: `${item.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+/g, ".").replace(/^\./, "").replace(/\.$/, "")}@servzy.demo`,
        role: "provider",
        avatar: randomImageUrl(item.name),
      });

      const provider = await Provider.create({
        userId: providerUser._id,
        clerkId: providerUser.clerkId,
        businessName: item.name,
        avatarUrl: randomImageUrl(`${item.name}-photo`),
        bio: `${item.serviceTuple[0]} and ${item.serviceTuple[1]} specialist`,
        serviceTuple: item.serviceTuple,
        categories: [item.serviceTuple[0], item.serviceTuple[1]],
        services: item.services,
        location: item.location,
        lat: item.lat,
        lng: item.lng,
        status: "approved",
        reliabilityScore: item.reliabilityScore,
        basePrice: item.basePrice,
        distance: item.distance,
        acceptRate: item.acceptRate,
        rejectRate: item.rejectRate,
        totalBookings: item.totalBookings,
        cancellations: item.cancellations,
        consultationFee: item.consultationFee,
        serviceFee: item.serviceFee,
        bookingCharge: item.bookingCharge,
        avgRating: item.rating,
        totalReviews: 0,
        blocked: false,
        flaggedCount: item.flaggedCount,
      });

      providerCache.set(item.id, provider);

      const createdServices = [];
      for (let index = 0; index < item.services.length; index += 1) {
        const serviceName = item.services[index];
        const service = await Service.create({
          providerId: provider._id,
          title: serviceName,
          description: `${serviceName} by ${item.name}`,
          category: item.serviceTuple[0],
          price: item.basePrice + index * 120,
          priceUnit: "per_job",
          images: [randomImageUrl(`${item.name}-${serviceName}`)],
          isActive: true,
        });
        createdServices.push(service);
        serviceCache.set(`${item.id}:${serviceName.toLowerCase()}`, service);
      }

      if (!createdServices.length) {
        const fallbackService = await Service.create({
          providerId: provider._id,
          title: item.serviceTuple[0],
          description: `${item.serviceTuple[0]} by ${item.name}`,
          category: item.serviceTuple[0],
          price: item.basePrice,
          priceUnit: "per_job",
          images: [randomImageUrl(`${item.name}-fallback`)],
          isActive: true,
        });
        serviceCache.set(`${item.id}:${item.serviceTuple[0].toLowerCase()}`, fallbackService);
      }
    }

    for (const bookingInput of userBookingsData) {
      const provider = providerCache.get(bookingInput.providerId);
      if (!provider) continue;

      const service =
        serviceCache.get(`${bookingInput.providerId}:${bookingInput.service.toLowerCase()}`) ||
        (await Service.findOne({ providerId: provider._id }).sort({ createdAt: 1 }));
      if (!service) continue;

      const dbStatus =
        bookingInput.status === "confirmed"
          ? "accepted"
          : bookingInput.status;

      const booking = await Booking.create({
        userId: currentUser._id,
        providerId: provider._id,
        serviceId: service._id,
        scheduledDate: new Date(bookingInput.date),
        timeSlot: bookingInput.time,
        status: dbStatus,
        notes: "Seeded user booking",
        amount: bookingInput.amount,
        type: bookingInput.type,
      });
      createdBookings.push(booking);
    }

    for (const bookingInput of providerBookingsData) {
      const provider = providerCache.get(bookingInput.providerId);
      if (!provider) continue;

      const service =
        serviceCache.get(`${bookingInput.providerId}:${bookingInput.service.toLowerCase()}`) ||
        (await Service.findOne({ providerId: provider._id }).sort({ createdAt: 1 }));
      if (!service) continue;

      let customer = userCache.get(bookingInput.customerName);
      if (!customer) {
        customer = await User.create({
          clerkId: toClerkId(bookingInput.customerName),
          name: bookingInput.customerName,
          email: `${bookingInput.customerName.toLowerCase().replace(/[^a-z]+/g, ".").replace(/\.+/g, ".").replace(/^\./, "").replace(/\.$/, "")}@servzy.demo`,
          role: "user",
          avatar: randomImageUrl(bookingInput.customerName),
        });
        userCache.set(bookingInput.customerName, customer);
      }

      const dbStatus =
        bookingInput.status === "confirmed"
          ? "accepted"
          : bookingInput.status;

      const booking = await Booking.create({
        userId: customer._id,
        providerId: provider._id,
        serviceId: service._id,
        scheduledDate: new Date(bookingInput.date),
        timeSlot: bookingInput.time,
        status: dbStatus,
        notes: "Seeded provider-side booking",
        amount: bookingInput.amount,
        type: bookingInput.type,
      });
      createdBookings.push(booking);
    }

    const reviewedBooking = createdBookings.find((booking) => booking.status === "completed");
    let review = null;
    if (reviewedBooking) {
      review = await Review.create({
        userId: reviewedBooking.userId,
        serviceId: reviewedBooking.serviceId,
        bookingId: reviewedBooking._id,
        rating: 5,
        comment: "Excellent service and very punctual.",
      });
    }

    for (const provider of providerCache.values()) {
      const providerBookings = await Booking.find({ providerId: provider._id }).select("status").lean();
      const providerReviews = await Review.find({ serviceId: { $in: (await Service.find({ providerId: provider._id }).select("_id").lean()).map((item) => item._id) } })
        .select("rating")
        .lean();

      const totalReviews = providerReviews.length;
      const avgRating = totalReviews
        ? Number((providerReviews.reduce((sum, item) => sum + item.rating, 0) / totalReviews).toFixed(1))
        : provider.avgRating || 0;

      const totalBookings = providerBookings.length || provider.totalBookings || 0;
      const cancellations = providerBookings.filter((item) => item.status === "cancelled").length;

      await Provider.findByIdAndUpdate(provider._id, {
        avgRating,
        totalReviews,
        totalBookings,
        cancellations,
      });
    }

    const primaryProvider = providerCache.get("1");
    const primaryProviderService = await Service.findOne({ providerId: primaryProvider?._id }).sort({ createdAt: 1 });

    return NextResponse.json(
      {
        message: "Database seeded successfully",
        data: {
          adminUserId: adminUser._id,
          currentUserId: currentUser._id,
          currentUserName: currentUser.name,
          primaryProviderId: primaryProvider?._id || null,
          primaryProviderName: primaryProvider?.businessName || null,
          primaryServiceId: primaryProviderService?._id || null,
          providersCount: providerCache.size,
          servicesCount: await Service.countDocuments(),
          bookingsCount: await Booking.countDocuments(),
          reviewId: review?._id || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to seed database" }, { status: 500 });
  }
}

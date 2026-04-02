import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request) {
    try {
        const formData = await request.formData();
        const files = formData.getAll("files");

        const uploadedUrls = [];

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
            }
            if (file.size > MAX_SIZE) {
                return NextResponse.json({ error: "File too large" }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const result = await uploadToCloudinary(buffer, "servzy");
            if (result) {
                uploadedUrls.push(result.secure_url);
            }
        }

        return NextResponse.json({ urls: uploadedUrls });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
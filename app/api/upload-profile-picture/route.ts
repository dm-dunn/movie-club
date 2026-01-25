import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64File = `data:${file.type};base64,${buffer.toString("base64")}`;

    console.log(`[Upload] Uploading to Cloudinary for user:`, session.user.id);

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(base64File, {
      folder: "movie-club/profile-pictures",
      public_id: `user-${session.user.id}`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto" },
      ],
    });

    const url = uploadResult.secure_url;
    console.log(`[Upload] Cloudinary URL:`, url);

    // Update the user's profile picture URL in the database
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { profilePictureUrl: url },
    });

    console.log(`[Upload] User ${session.user.id} profile picture updated to:`, url);
    console.log(`[Upload] Verified in DB:`, updatedUser.profilePictureUrl);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

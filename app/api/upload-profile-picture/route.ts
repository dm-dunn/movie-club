import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExtension = file.name.split(".").pop() || "jpg";
    const uniqueFilename = `${randomUUID()}.${fileExtension}`;

    // Save to public/uploads directory
    const uploadsDir = join(process.cwd(), "public", "uploads", "profile-pictures");
    const filePath = join(uploadsDir, uniqueFilename);

    // Ensure directory exists
    const { mkdir } = await import("fs/promises");
    await mkdir(uploadsDir, { recursive: true });

    // Write file
    await writeFile(filePath, buffer);

    // Return the public URL
    const url = `/uploads/profile-pictures/${uniqueFilename}`;

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

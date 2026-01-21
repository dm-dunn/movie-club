import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // TODO: Replace with actual authenticated user once auth is implemented
    // For now, get the first user in the database
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePictureUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No active users found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    );
  }
}

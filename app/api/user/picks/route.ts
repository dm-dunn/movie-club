import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // TODO: Replace with actual authenticated user once auth is implemented
    const user = await prisma.user.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "No active users found" },
        { status: 404 }
      );
    }

    const picks = await prisma.moviePick.findMany({
      where: {
        userId: user.id,
      },
      include: {
        movie: true,
        user: {
          select: {
            name: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: {
        pickedAt: "desc",
      },
    });

    // Transform data to match component expectations
    const transformedMovies = picks.map((pick) => ({
      id: pick.movie.id,
      title: pick.movie.title,
      posterUrl: pick.movie.posterUrl,
      pickerName: pick.user.name,
      pickerProfilePicture: pick.user.profilePictureUrl,
    }));

    return NextResponse.json(transformedMovies);
  } catch (error) {
    console.error("Error fetching personal picks:", error);
    return NextResponse.json(
      { error: "Failed to fetch personal picks" },
      { status: 500 }
    );
  }
}

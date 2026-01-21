import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = { id: session.user.id };

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

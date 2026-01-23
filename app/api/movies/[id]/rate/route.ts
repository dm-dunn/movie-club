import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rating } = await request.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const { id: movieId } = await params;

    // Check if movie exists and is CURRENT
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    if (movie.status !== "CURRENT") {
      return NextResponse.json(
        { error: "Can only rate movies in current watchlist" },
        { status: 400 }
      );
    }

    // Create or update rating
    const existingRating = await prisma.rating.findUnique({
      where: {
        userId_movieId: {
          userId: session.user.id,
          movieId: movieId,
        },
      },
    });

    if (existingRating) {
      await prisma.rating.update({
        where: { id: existingRating.id },
        data: { rating },
      });
    } else {
      await prisma.rating.create({
        data: {
          userId: session.user.id,
          movieId: movieId,
          rating,
        },
      });
    }

    // Get current watchedBy array
    const currentMovie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { watchedBy: true },
    });

    // Add user to watchedBy array if not already present
    const watchedByArray = currentMovie?.watchedBy || [];
    if (!watchedByArray.includes(session.user.id)) {
      watchedByArray.push(session.user.id);
    }

    // Update movie status to WATCHED after first rating and update watchedBy
    await prisma.movie.update({
      where: { id: movieId },
      data: {
        status: "WATCHED",
        watchedDate: new Date(),
        watchedBy: watchedByArray,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting rating:", error);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}

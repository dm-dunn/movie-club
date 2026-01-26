import { prisma } from "@/lib/prisma";

const GROUP_MEMBER_COUNT = 9;

interface PersonStats {
  name: string;
  count: number;
  totalRuntime: number;
}

export interface GroupStatsData {
  totalMinutesWatched: number;
  totalOscarNominations: number;
  totalOscarWins: number;
  mostNominationsMovieTitle: string | null;
  mostNominationsCount: number;
  mostWinsMovieTitle: string | null;
  mostWinsCount: number;
  mostWatchedActorName: string | null;
  mostWatchedActorCount: number;
  mostWatchedActressName: string | null;
  mostWatchedActressCount: number;
  mostWatchedDirectorName: string | null;
  mostWatchedDirectorCount: number;
}

export async function calculateGroupStats(): Promise<GroupStatsData> {
  // Get all watched movies with their cast, crew, and runtime
  const watchedMovies = await prisma.movie.findMany({
    where: { status: "WATCHED" },
    include: {
      castMembers: true,
      crewMembers: {
        where: { job: "Director" },
      },
    },
  });

  // Calculate totals
  let totalMinutes = 0;
  let totalNominations = 0;
  let totalWins = 0;
  let mostNominationsMovie: { title: string; count: number } | null = null;
  let mostWinsMovie: { title: string; count: number } | null = null;

  // Aggregate person stats
  const actorStats: Record<string, PersonStats> = {};
  const actressStats: Record<string, PersonStats> = {};
  const directorStats: Record<string, PersonStats> = {};

  for (const movie of watchedMovies) {
    const runtime = movie.runtimeMinutes || 0;
    totalMinutes += runtime;
    totalNominations += movie.academyNominations;
    totalWins += movie.academyWins;

    // Track most nominations
    if (!mostNominationsMovie || movie.academyNominations > mostNominationsMovie.count) {
      mostNominationsMovie = { title: movie.title, count: movie.academyNominations };
    }

    // Track most wins
    if (!mostWinsMovie || movie.academyWins > mostWinsMovie.count) {
      mostWinsMovie = { title: movie.title, count: movie.academyWins };
    }

    // Aggregate cast members (top 10 per movie)
    for (const cast of movie.castMembers) {
      const key = `${cast.tmdbPersonId}-${cast.name}`;

      if (cast.gender === 2) {
        // Male actor
        if (!actorStats[key]) {
          actorStats[key] = { name: cast.name, count: 0, totalRuntime: 0 };
        }
        actorStats[key].count++;
        actorStats[key].totalRuntime += runtime;
      } else if (cast.gender === 1) {
        // Female actress
        if (!actressStats[key]) {
          actressStats[key] = { name: cast.name, count: 0, totalRuntime: 0 };
        }
        actressStats[key].count++;
        actressStats[key].totalRuntime += runtime;
      }
    }

    // Aggregate directors
    for (const crew of movie.crewMembers) {
      const key = `${crew.tmdbPersonId}-${crew.name}`;
      if (!directorStats[key]) {
        directorStats[key] = { name: crew.name, count: 0, totalRuntime: 0 };
      }
      directorStats[key].count++;
      directorStats[key].totalRuntime += runtime;
    }
  }

  // Sort and find top person in each category (by count, then by runtime as tiebreaker)
  const sortByCountThenRuntime = (a: PersonStats, b: PersonStats) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.totalRuntime - a.totalRuntime;
  };

  const topActor = Object.values(actorStats).sort(sortByCountThenRuntime)[0];
  const topActress = Object.values(actressStats).sort(sortByCountThenRuntime)[0];
  const topDirector = Object.values(directorStats).sort(sortByCountThenRuntime)[0];

  return {
    totalMinutesWatched: totalMinutes * GROUP_MEMBER_COUNT,
    totalOscarNominations: totalNominations,
    totalOscarWins: totalWins,
    mostNominationsMovieTitle: mostNominationsMovie?.title || null,
    mostNominationsCount: mostNominationsMovie?.count || 0,
    mostWinsMovieTitle: mostWinsMovie?.title || null,
    mostWinsCount: mostWinsMovie?.count || 0,
    mostWatchedActorName: topActor?.name || null,
    mostWatchedActorCount: topActor?.count || 0,
    mostWatchedActressName: topActress?.name || null,
    mostWatchedActressCount: topActress?.count || 0,
    mostWatchedDirectorName: topDirector?.name || null,
    mostWatchedDirectorCount: topDirector?.count || 0,
  };
}

export async function updateGroupStats(): Promise<void> {
  const stats = await calculateGroupStats();

  await prisma.groupStats.upsert({
    where: { id: "singleton" },
    update: stats,
    create: { id: "singleton", ...stats },
  });
}

// Prisma Seed Script - Excel Import with TMDB Enrichment
// Run with: npx tsx prisma/seed.ts

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as XLSX from "xlsx";
import axios from "axios";

// Initialize Prisma Client with direct TCP connection
// Use the TCP connection string from .env or fallback to the one from prisma.config.ts
const connectionString = process.env.DATABASE_URL?.startsWith("prisma+postgres")
  ? "postgres://postgres:postgres@localhost:51214/template1?sslmode=disable"
  : process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const TMDB_API_KEY =
  process.env.TMDB_API_KEY || "6d721574a10153f995aee23258db7a56";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const EXCEL_PATH = "./prisma/data/club.xlsx";

// ============================================================================
// TYPES
// ============================================================================

interface ExcelMovie {
  title: string;
  runtimeMinutes?: number;
  academyNominations: number;
  academyWins: number;
  pickedBy: string;
  ratings: Record<string, number | null>; // username -> rating
}

interface TMDBSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
}

interface UserTopTen {
  username: string;
  rankings: { movieTitle: string; rank: number }[];
}

interface TMDBCredits {
  id: number;
  cast: Array<{
    id: number;
    name: string;
    gender: number;
    order: number;
  }>;
  crew: Array<{
    id: number;
    name: string;
    job: string;
  }>;
}

// ============================================================================
// TMDB API FUNCTIONS
// ============================================================================

async function searchTMDB(
  title: string,
  year?: number,
): Promise<TMDBSearchResult | null> {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query: title,
        year: year,
      },
    });

    if (response.data.results.length > 0) {
      return response.data.results[0]; // Return best match
    }
    return null;
  } catch (error) {
    console.error(`TMDB search failed for "${title}":`, error);
    return null;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMovieCredits(tmdbId: number): Promise<TMDBCredits | null> {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`TMDB credits fetch failed for ID ${tmdbId}:`, error);
    return null;
  }
}

// ============================================================================
// EXCEL PARSING FUNCTIONS
// ============================================================================

function parseExcel(filePath: string): {
  movies: ExcelMovie[];
  userTopTens: UserTopTen[];
  usernames: string[];
} {
  const workbook = XLSX.readFile(filePath);

  // Get all user sheet names (exclude Summary, Data Configuration)
  const userSheets = workbook.SheetNames.filter(
    (name) => !["Summary", "Data Configuration"].includes(name),
  );

  const usernames = userSheets;

  // Parse Data Configuration sheet for master movie list
  const configSheet = workbook.Sheets["Data Configuration"];
  const configData = XLSX.utils.sheet_to_json<any>(configSheet, { header: 1 });

  const movies: ExcelMovie[] = [];
  const userTopTens: UserTopTen[] = [];

  // First row is the header - extract it to understand column positions
  const headers = configData[0] as any[];
  console.log("   Headers found:", headers);

  // Extract movies with ratings - start from row 1 (skip header row 0)
  for (let i = 1; i < configData.length; i++) {
    const row = configData[i] as any[];
    const movieTitle = row[0]?.toString().trim();

    // Skip empty rows
    if (!movieTitle || movieTitle === "") continue;

    const ratings: Record<string, number | null> = {};

    // Match usernames to their column positions (columns 4-13 based on the analysis)
    usernames.forEach((username, idx) => {
      const ratingValue = row[4 + idx]; // Ratings start at column 4 (E)
      if (
        ratingValue === undefined ||
        ratingValue === null ||
        ratingValue === "" ||
        ratingValue === "-" ||
        ratingValue === "N/a" ||
        ratingValue === "NaN"
      ) {
        ratings[username] = null;
      } else if (typeof ratingValue === "number") {
        // Ensure rating is within 0-5 range (keep 0 for unrated)
        if (ratingValue === 0) {
          ratings[username] = null;
        } else {
          ratings[username] = Math.max(1, Math.min(5, ratingValue));
        }
      } else if (typeof ratingValue === "string") {
        const parsed = parseFloat(ratingValue);
        if (!isNaN(parsed) && parsed > 0) {
          ratings[username] = Math.max(1, Math.min(5, parsed));
        } else {
          ratings[username] = null;
        }
      }
    });

    movies.push({
      title: movieTitle,
      runtimeMinutes: row[1] ? parseInt(row[1]) : undefined, // Column B (1)
      academyNominations: row[2] ? parseInt(row[2]) : 0, // Column C (2)
      academyWins: row[3] ? parseInt(row[3]) : 0, // Column D (3)
      pickedBy: "", // Will get from Summary sheet
      ratings,
    });
  }

  // Parse Summary sheet for picker assignments
  const summarySheet = workbook.Sheets["Summary"];
  const summaryData = XLSX.utils.sheet_to_json<any>(summarySheet);

  summaryData.forEach((row) => {
    const movieTitle = row["Movies"]?.trim();
    const pickedBy = row["Picked By"]?.trim();

    if (movieTitle && pickedBy) {
      const movie = movies.find((m) => m.title === movieTitle);
      if (movie) {
        movie.pickedBy = pickedBy;
      }
    }
  });

  // Parse user sheets for Top 10 rankings
  userSheets.forEach((username) => {
    const sheet = workbook.Sheets[username];
    const data = XLSX.utils.sheet_to_json<any>(sheet);

    const rankings: { movieTitle: string; rank: number }[] = [];
    const seenRanks = new Set<number>();

    data.forEach((row) => {
      const topTenValue = row["Top 10 All Time"];
      const movieTitle = row["Movies"]?.trim();

      if (topTenValue && typeof topTenValue === "number" && movieTitle) {
        // Skip duplicate ranks for the same user
        if (seenRanks.has(topTenValue)) {
          console.log(
            `   ⚠️  Skipping duplicate rank ${topTenValue} for ${username}: ${movieTitle}`,
          );
          return;
        }
        seenRanks.add(topTenValue);
        rankings.push({ movieTitle, rank: topTenValue });
      }
    });

    if (rankings.length > 0) {
      userTopTens.push({ username, rankings });
    }
  });

  return { movies, userTopTens, usernames };
}

// ============================================================================
// GROUP STATISTICS CALCULATION
// ============================================================================

const GROUP_MEMBER_COUNT = 9;

interface PersonStats {
  name: string;
  count: number;
  totalRuntime: number;
}

async function calculateAndStoreGroupStats() {
  const watchedMovies = await prisma.movie.findMany({
    where: { status: "WATCHED" },
    include: {
      castMembers: true,
      crewMembers: {
        where: { job: "Director" },
      },
    },
  });

  let totalMinutes = 0;
  let totalNominations = 0;
  let totalWins = 0;
  let mostNominationsMovie: { title: string; count: number } | null = null;
  let mostWinsMovie: { title: string; count: number } | null = null;

  const actorStats: Record<string, PersonStats> = {};
  const actressStats: Record<string, PersonStats> = {};
  const directorStats: Record<string, PersonStats> = {};

  for (const movie of watchedMovies) {
    const runtime = movie.runtimeMinutes || 0;
    totalMinutes += runtime;
    totalNominations += movie.academyNominations;
    totalWins += movie.academyWins;

    if (!mostNominationsMovie || movie.academyNominations > mostNominationsMovie.count) {
      mostNominationsMovie = { title: movie.title, count: movie.academyNominations };
    }
    if (!mostWinsMovie || movie.academyWins > mostWinsMovie.count) {
      mostWinsMovie = { title: movie.title, count: movie.academyWins };
    }

    for (const cast of movie.castMembers) {
      const key = `${cast.tmdbPersonId}-${cast.name}`;
      if (cast.gender === 2) {
        if (!actorStats[key]) actorStats[key] = { name: cast.name, count: 0, totalRuntime: 0 };
        actorStats[key].count++;
        actorStats[key].totalRuntime += runtime;
      } else if (cast.gender === 1) {
        if (!actressStats[key]) actressStats[key] = { name: cast.name, count: 0, totalRuntime: 0 };
        actressStats[key].count++;
        actressStats[key].totalRuntime += runtime;
      }
    }

    for (const crew of movie.crewMembers) {
      const key = `${crew.tmdbPersonId}-${crew.name}`;
      if (!directorStats[key]) directorStats[key] = { name: crew.name, count: 0, totalRuntime: 0 };
      directorStats[key].count++;
      directorStats[key].totalRuntime += runtime;
    }
  }

  const sortByCountThenRuntime = (a: PersonStats, b: PersonStats) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.totalRuntime - a.totalRuntime;
  };

  const topActor = Object.values(actorStats).sort(sortByCountThenRuntime)[0];
  const topActress = Object.values(actressStats).sort(sortByCountThenRuntime)[0];
  const topDirector = Object.values(directorStats).sort(sortByCountThenRuntime)[0];

  await prisma.groupStats.upsert({
    where: { id: "singleton" },
    update: {
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
    },
    create: {
      id: "singleton",
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
    },
  });
}

// ============================================================================
// DATABASE SEEDING
// ============================================================================

async function seedDatabase() {
  console.log("🎬 Starting Movie Club Database Seed...\n");

  // Step 1: Parse Excel
  console.log("📊 Parsing Excel file...");
  const { movies, userTopTens, usernames } = parseExcel(EXCEL_PATH);
  console.log(`   Found ${movies.length} movies`);
  console.log(`   Found ${usernames.length} users\n`);

  // Step 2: Create Users
  console.log("👥 Creating users...");
  const userMap = new Map<string, string>(); // username -> userId

  for (const username of usernames) {
    const user = await prisma.user.upsert({
      where: { username: username.toLowerCase() },
      update: {},
      create: {
        name: username,
        username: username.toLowerCase(),
        password: "placeholder", // Placeholder - users set real passwords on first login
        email: `${username.toLowerCase()}@movieclub.com`,
        isAdmin: username === "Liam", // Make Liam admin (adjust as needed)
      },
    });
    userMap.set(username, user.id);
    console.log(`   ✓ Created ${username}`);
  }

  // Create "Extra Credit" system user
  const extraCreditUser = await prisma.user.upsert({
    where: { username: "extracredit" },
    update: {},
    create: {
      name: "Extra Credit",
      username: "extracredit",
      password: "placeholder",
      email: "extracredit@movieclub.com",
      isAdmin: false,
    },
  });
  userMap.set("Extra Credit", extraCreditUser.id);
  console.log(`   ✓ Created Extra Credit\n`);

  // Step 3: Create Movies with TMDB Enrichment
  console.log("🎥 Creating movies with TMDB enrichment...");
  const movieMap = new Map<string, string>(); // title -> movieId

  for (const [index, movieData] of movies.entries()) {
    console.log(
      `   [${index + 1}/${movies.length}] Processing "${movieData.title}"...`,
    );

    // Search TMDB
    let tmdbData: TMDBSearchResult | null = null;
    if (TMDB_API_KEY) {
      tmdbData = await searchTMDB(movieData.title);
      await delay(350); // Rate limit: ~3 requests/sec
    }

    const year = tmdbData?.release_date
      ? parseInt(tmdbData.release_date.split("-")[0])
      : undefined;

    const movie = await prisma.movie.create({
      data: {
        title: movieData.title,
        year,
        runtimeMinutes: movieData.runtimeMinutes,
        tmdbId: tmdbData?.id,
        posterUrl: tmdbData?.poster_path
          ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
          : null,
        backdropUrl: tmdbData?.backdrop_path
          ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
          : null,
        overview: tmdbData?.overview,
        academyNominations: movieData.academyNominations,
        academyWins: movieData.academyWins,
        status: "WATCHED", // All imported movies are watched
      },
    });

    movieMap.set(movieData.title, movie.id);
    console.log(`      ✓ Created with TMDB ID: ${movie.tmdbId || "N/A"}`);

    // Fetch and store cast/crew credits
    if (tmdbData?.id) {
      const credits = await getMovieCredits(tmdbData.id);
      if (credits) {
        // Store top 10 cast members
        const topCast = credits.cast.slice(0, 10);
        for (const cast of topCast) {
          await prisma.castMember.create({
            data: {
              movieId: movie.id,
              tmdbPersonId: cast.id,
              name: cast.name,
              gender: cast.gender,
              castOrder: cast.order,
            },
          });
        }

        // Store directors
        const directors = credits.crew.filter((c) => c.job === "Director");
        for (const director of directors) {
          await prisma.crewMember.create({
            data: {
              movieId: movie.id,
              tmdbPersonId: director.id,
              name: director.name,
              job: "Director",
            },
          });
        }
        console.log(`      ✓ Added ${topCast.length} cast, ${directors.length} directors`);
      }
      await delay(350); // Rate limit for credits API
    }

    // Create movie pick assignment
    if (movieData.pickedBy) {
      const pickerId = userMap.get(movieData.pickedBy);
      if (pickerId) {
        await prisma.moviePick.create({
          data: {
            movieId: movie.id,
            userId: pickerId,
            pickRound: 1, // All historical picks are round 1
          },
        });
      }
    }

    // Create ratings
    for (const [username, rating] of Object.entries(movieData.ratings)) {
      if (rating !== null) {
        const userId = userMap.get(username);
        if (userId) {
          await prisma.rating.create({
            data: {
              userId,
              movieId: movie.id,
              rating,
            },
          });
        }
      }
    }
  }
  console.log("   ✓ All movies created\n");

  // Step 4: Create Personal Rankings (Top 10)
  console.log("⭐ Creating personal top 10 rankings...");
  for (const userTopTen of userTopTens) {
    const userId = userMap.get(userTopTen.username);
    if (!userId) continue;

    for (const ranking of userTopTen.rankings) {
      const movieId = movieMap.get(ranking.movieTitle);
      if (movieId && ranking.rank >= 1 && ranking.rank <= 10) {
        await prisma.personalRanking.create({
          data: {
            userId,
            movieId,
            rank: ranking.rank,
          },
        });
      }
    }
    console.log(`   ✓ Created Top 10 for ${userTopTen.username}`);
  }
  console.log("");

  // Step 5: Initialize Picking Season
  console.log("🎲 Initializing picking season...");
  const allUserIds = Array.from(userMap.values());

  // Shuffle all user IDs using Fisher-Yates algorithm
  const shuffledUserIds = [...allUserIds];
  for (let i = shuffledUserIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledUserIds[i], shuffledUserIds[j]] = [shuffledUserIds[j], shuffledUserIds[i]];
  }

  // Get the next 3 pickers
  const nextThreePickers = shuffledUserIds.slice(0, 3);

  // Create Season 1
  await prisma.pickingSeason.create({
    data: {
      seasonNumber: 1,
      availablePickerIds: nextThreePickers,
      usedPickerIds: [],
      currentPickerId: nextThreePickers[0],
      isActive: true,
    },
  });
  console.log(`   ✓ Season 1 initialized with 3 pickers\n`);

  // Step 6: Seed Award Categories (for Phase 2)
  console.log("🏆 Creating award categories...");
  const categories = [
    { name: "Best Actor", requiresTextInput: true, displayOrder: 1 },
    { name: "Best Actress", requiresTextInput: true, displayOrder: 2 },
    { name: "Best Supporting Actor", requiresTextInput: true, displayOrder: 3 },
    {
      name: "Best Supporting Actress",
      requiresTextInput: true,
      displayOrder: 4,
    },
    { name: "Best Movie", requiresTextInput: false, displayOrder: 5 },
    { name: "Best Soundtrack", requiresTextInput: false, displayOrder: 6 },
    { name: "Best Cover Art", requiresTextInput: false, displayOrder: 7 },
    { name: "Best Vibes", requiresTextInput: false, displayOrder: 8 },
    {
      name: "Best Outfits / Makeup",
      requiresTextInput: false,
      displayOrder: 9,
    },
    { name: "Best Worst Movie", requiresTextInput: false, displayOrder: 10 },
  ];

  for (const category of categories) {
    await prisma.awardCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    console.log(`   ✓ Created "${category.name}"`);
  }
  console.log("");

  // Step 7: Calculate and store Group Statistics
  console.log("📊 Calculating group statistics...");
  await calculateAndStoreGroupStats();
  console.log("   ✓ Group statistics calculated\n");

  // Final Statistics
  const stats = {
    users: await prisma.user.count(),
    movies: await prisma.movie.count(),
    ratings: await prisma.rating.count(),
    picks: await prisma.moviePick.count(),
  };

  console.log("✅ Seed Complete!\n");
  console.log("📈 Final Statistics:");
  console.log(`   Users: ${stats.users}`);
  console.log(`   Movies: ${stats.movies}`);
  console.log(`   Ratings: ${stats.ratings}`);
  console.log(`   Picks: ${stats.picks}\n`);

  console.log("🎬 Database ready for Movie Club! 🍿\n");
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

seedDatabase()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

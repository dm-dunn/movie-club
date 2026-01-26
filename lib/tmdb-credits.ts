import axios from "axios";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  gender: number; // 0=unknown, 1=female, 2=male
  order: number;
  profile_path: string | null;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  gender: number;
  profile_path: string | null;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export async function getMovieCredits(tmdbId: number): Promise<TMDBCredits | null> {
  if (!TMDB_API_KEY) {
    console.error("TMDB_API_KEY not configured");
    return null;
  }

  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
      params: {
        api_key: TMDB_API_KEY,
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch credits for TMDB ID ${tmdbId}:`, error);
    return null;
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches and returns top cast members (first 10) and directors
 */
export async function fetchCreditsForMovie(tmdbId: number): Promise<{
  cast: Array<{ tmdbPersonId: number; name: string; gender: number; castOrder: number }>;
  directors: Array<{ tmdbPersonId: number; name: string }>;
} | null> {
  const credits = await getMovieCredits(tmdbId);
  if (!credits) return null;

  // Get top 10 cast members
  const cast = credits.cast.slice(0, 10).map((member) => ({
    tmdbPersonId: member.id,
    name: member.name,
    gender: member.gender,
    castOrder: member.order,
  }));

  // Get directors only
  const directors = credits.crew
    .filter((member) => member.job === "Director")
    .map((member) => ({
      tmdbPersonId: member.id,
      name: member.name,
    }));

  return { cast, directors };
}

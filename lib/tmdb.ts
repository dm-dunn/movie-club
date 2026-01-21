import axios from "axios";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function searchMovie(title: string, year?: number) {
  const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      query: title,
      year,
    },
  });
  return response.data.results[0] || null;
}

export function getImageUrl(path: string, size: "w500" | "original" = "w500") {
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

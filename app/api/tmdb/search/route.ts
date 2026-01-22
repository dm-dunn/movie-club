import { NextResponse } from "next/server";
import axios from "axios";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
      params: {
        api_key: TMDB_API_KEY,
        query,
      },
    });

    return NextResponse.json({
      results: response.data.results.slice(0, 10), // Limit to 10 results
    });
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return NextResponse.json(
      { error: "Failed to search movies" },
      { status: 500 }
    );
  }
}

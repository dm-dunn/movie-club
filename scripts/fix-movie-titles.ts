import 'dotenv/config';
import { prisma } from '../lib/prisma';
import axios from 'axios';

const TMDB_API_KEY = process.env.TMDB_API_KEY || '6d721574a10153f995aee23258db7a56';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBSearchResult {
  id: number;
  title: string;
  release_date: string;
  poster_path: string;
  backdrop_path: string;
  overview: string;
}

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
      return response.data.results[0];
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

async function main() {
  console.log('\n🎬 Fixing Movie Titles\n');
  console.log('=' .repeat(80));

  const moviesToFix = [
    { oldTitle: 'Suckerpunch (2011)', newTitle: 'Sucker Punch', year: 2011 },
    { oldTitle: 'My Life (1993)', newTitle: 'My Life', year: 1993 },
    { oldTitle: 'Malcolm X (1992)', newTitle: 'Malcolm X', year: 1992 },
    { oldTitle: 'Kicking and Screaming (1995)', newTitle: 'Kicking and Screaming', year: 1995 },
    { oldTitle: 'Life (1999)', newTitle: 'Life', year: 1999 },
  ];

  for (const movie of moviesToFix) {
    // Try to find the movie with the old title
    const existingMovie = await prisma.movie.findFirst({
      where: {
        title: {
          contains: movie.oldTitle.split('(')[0].trim(),
          mode: 'insensitive',
        },
      },
    });

    if (existingMovie) {
      console.log(`\nFound: ${existingMovie.title}`);

      // Search TMDB for poster and metadata
      console.log(`  Searching TMDB for "${movie.newTitle}" (${movie.year})...`);
      const tmdbData = await searchTMDB(movie.newTitle, movie.year);
      await delay(350); // Rate limit

      if (tmdbData) {
        // Update the title, year, and TMDB data
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: {
            title: movie.newTitle,
            year: movie.year,
            tmdbId: tmdbData.id,
            posterUrl: tmdbData.poster_path
              ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
              : null,
            backdropUrl: tmdbData.backdrop_path
              ? `https://image.tmdb.org/t/p/original${tmdbData.backdrop_path}`
              : null,
            overview: tmdbData.overview,
          },
        });

        console.log(`  ✓ Updated: ${existingMovie.title} -> ${movie.newTitle} (${movie.year})`);
        console.log(`  ✓ TMDB ID: ${tmdbData.id}`);
        console.log(`  ✓ Poster: ${tmdbData.poster_path ? 'Found' : 'Not found'}`);
      } else {
        // Update just the title and year if TMDB not found
        await prisma.movie.update({
          where: { id: existingMovie.id },
          data: {
            title: movie.newTitle,
            year: movie.year,
          },
        });

        console.log(`  ✓ Updated: ${existingMovie.title} -> ${movie.newTitle} (${movie.year})`);
        console.log(`  ⚠️  TMDB data not found`);
      }
    } else {
      console.log(`\n✗ Not found: ${movie.oldTitle}`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Movie titles fixed successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

"use client";

import { MovieCard } from "./movie-card";

interface HallOfFameMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture?: string | null;
  averageRating: number;
}

interface HallOfFameProps {
  movies: HallOfFameMovie[];
}

export function HallOfFame({ movies }: HallOfFameProps) {
  // Duplicate the movies array to create seamless infinite scroll
  const duplicatedMovies = [...movies, ...movies];

  return (
    <section className="w-full flex flex-col items-center overflow-hidden">
      <h2 className="text-xl font-bold mb-4 text-secondary">Hall of Fame</h2>
      {movies.length === 0 ? (
        <p className="text-secondary text-center py-8">No rated movies yet</p>
      ) : (
        <div className="relative w-full max-w-[800px] overflow-hidden">
          <div className="flex gap-4 animate-scroll">
            {duplicatedMovies.map((movie, index) => (
              <div key={`${movie.id}-${index}`} className="flex-shrink-0">
                <MovieCard
                  title={movie.title}
                  posterUrl={movie.posterUrl}
                  pickerName={movie.pickerName}
                  pickerProfilePicture={movie.pickerProfilePicture}
                  averageRating={movie.averageRating}
                  borderStyle="gold"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

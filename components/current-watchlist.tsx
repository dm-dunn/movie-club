import { MovieCard } from "./movie-card";

interface WatchlistMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture?: string | null;
}

interface CurrentWatchlistProps {
  movies: WatchlistMovie[];
}

export function CurrentWatchlist({ movies }: CurrentWatchlistProps) {
  return (
    <section className="w-full flex flex-col items-center">
      <h2 className="text-xl font-bold mb-4 text-secondary">
        Current Watchlist
      </h2>
      {movies.length === 0 ? (
        <p className="text-secondary text-center py-8">
          No movies in the watchlist yet
        </p>
      ) : (
        <div className="flex flex-wrap gap-4 justify-center max-w-[800px]">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              title={movie.title}
              posterUrl={movie.posterUrl}
              pickerName={movie.pickerName}
              pickerProfilePicture={movie.pickerProfilePicture}
            />
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type TMDBMovie = {
  id: number;
  title: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  runtime?: number;
};

type MoviePickerProps = {
  onPickSubmitted: () => void;
};

export function MoviePicker({ onPickSubmitted }: MoviePickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `/api/tmdb/search?query=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectMovie = async (movie: TMDBMovie) => {
    // Fetch full movie details to get runtime
    try {
      const response = await fetch(`/api/tmdb/movie/${movie.id}`);
      const fullMovie = await response.json();
      setSelectedMovie(fullMovie);
    } catch (error) {
      console.error("Error fetching movie details:", error);
      setSelectedMovie(movie);
    }
  };

  const handleSubmitPick = async () => {
    if (!selectedMovie) return;

    setSubmitting(true);
    try {
      const year = selectedMovie.release_date
        ? new Date(selectedMovie.release_date).getFullYear()
        : undefined;

      const response = await fetch("/api/user/submit-pick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdbId: selectedMovie.id,
          title: selectedMovie.title,
          year,
          posterUrl: selectedMovie.poster_path
            ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}`
            : null,
          backdropUrl: selectedMovie.backdrop_path
            ? `https://image.tmdb.org/t/p/original${selectedMovie.backdrop_path}`
            : null,
          overview: selectedMovie.overview,
          runtimeMinutes: selectedMovie.runtime,
        }),
      });

      if (response.ok) {
        onPickSubmitted();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit pick");
      }
    } catch (error) {
      console.error("Error submitting pick:", error);
      alert("Failed to submit pick");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-secondary mb-2">
          Your Movie Club Movie Pick
        </h3>
        <p className="text-sm text-secondary/70 mb-4">
          Search for a movie to pick for the club
        </p>
      </div>

      {!selectedMovie ? (
        <>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a movie..."
              className="flex-1"
            />
            <Button type="submit" disabled={searching || !searchQuery.trim()}>
              {searching ? "Searching..." : "Search"}
            </Button>
          </form>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-secondary">
                Search Results
              </h4>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchResults.map((movie) => (
                  <button
                    key={movie.id}
                    onClick={() => handleSelectMovie(movie)}
                    className="w-full flex gap-3 p-3 bg-muted/20 hover:bg-muted/40 rounded-lg transition-colors text-left"
                  >
                    {movie.poster_path ? (
                      <Image
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        width={60}
                        height={90}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="w-[60px] h-[90px] bg-muted rounded flex items-center justify-center text-xs text-secondary/50">
                        No Image
                      </div>
                    )}
                    <div className="flex-1">
                      <h5 className="font-semibold text-secondary">
                        {movie.title}
                      </h5>
                      <p className="text-xs text-secondary/70">
                        {movie.release_date
                          ? new Date(movie.release_date).getFullYear()
                          : "Unknown"}
                      </p>
                      <p className="text-xs text-secondary/70 mt-1 line-clamp-2">
                        {movie.overview}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-secondary">
            Confirm Your Pick
          </h4>
          <div className="flex gap-4 p-4 bg-muted/20 rounded-lg">
            {selectedMovie.poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w185${selectedMovie.poster_path}`}
                alt={selectedMovie.title}
                width={120}
                height={180}
                className="rounded object-cover"
              />
            ) : (
              <div className="w-[120px] h-[180px] bg-muted rounded flex items-center justify-center text-xs text-secondary/50">
                No Image
              </div>
            )}
            <div className="flex-1">
              <h5 className="font-bold text-lg text-secondary">
                {selectedMovie.title}
              </h5>
              <p className="text-sm text-secondary/70 mb-2">
                {selectedMovie.release_date
                  ? new Date(selectedMovie.release_date).getFullYear()
                  : "Unknown"}
                {selectedMovie.runtime && ` • ${selectedMovie.runtime} min`}
              </p>
              <p className="text-sm text-secondary/70">{selectedMovie.overview}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setSelectedMovie(null)}
              variant="outline"
              disabled={submitting}
            >
              Change Movie
            </Button>
            <Button onClick={handleSubmitPick} disabled={submitting}>
              {submitting ? "Submitting..." : "Confirm Pick"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

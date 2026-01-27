"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { MovieCard } from "./movie-card";
import { StarRating } from "./star-rating";
import { LoginModal } from "./login-modal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WatchlistMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture?: string | null;
  userHasRated: boolean;
  userRating: number | null;
}

interface CurrentWatchlistProps {
  movies: WatchlistMovie[];
  onRefresh: () => void;
}

export function CurrentWatchlist({ movies, onRefresh }: CurrentWatchlistProps) {
  const { data: session } = useSession();
  const [selectedMovie, setSelectedMovie] = useState<WatchlistMovie | null>(
    null
  );
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingMovie, setPendingMovie] = useState<WatchlistMovie | null>(null);

  const handleRateClick = (movie: WatchlistMovie) => {
    if (!session) {
      setPendingMovie(movie);
      setShowLoginModal(true);
      return;
    }
    setSelectedMovie(movie);
    setRating(movie.userRating || 0);
  };

  const handleLoginSuccess = () => {
    if (pendingMovie) {
      setSelectedMovie(pendingMovie);
      setPendingMovie(null);
      setRating(0);
    }
  };

  const handleSubmitRating = async () => {
    if (!selectedMovie || rating === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/movies/${selectedMovie.id}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit rating");
      }

      toast.success(
        selectedMovie.userHasRated
          ? "Rating updated successfully!"
          : "Rating submitted successfully!"
      );
      setSelectedMovie(null);
      setRating(0);
      onRefresh();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLoginSuccess={handleLoginSuccess}
      />
      <section className="w-full flex flex-col items-center">
        <h2 className="text-xl font-bold mb-4 text-secondary">
          Current Watchlist
        </h2>
        {movies.length === 0 ? (
          <p className="text-secondary text-center py-8">
            No movies in the watchlist yet
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center w-full max-w-[800px]">
            {movies.map((movie) => (
              <div key={movie.id} className="flex flex-col items-center gap-2 w-full max-w-[185px]">
                <MovieCard
                  title={movie.title}
                  posterUrl={movie.posterUrl}
                  pickerName={movie.pickerName}
                  pickerProfilePicture={movie.pickerProfilePicture}
                  borderStyle="gold"
                />
                {movie.userHasRated && movie.userRating ? (
                  <div className="relative group">
                    <StarRating
                      value={movie.userRating}
                      size={24}
                      readOnly
                    />
                    <Button
                      variant="default"
                      size="sm"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-[oklch(0.88_0.06_75)] border-2 border-[#B8860B] hover:bg-primary/90 hover:border-[#DAA520]"
                      onClick={() => handleRateClick(movie)}
                    >
                      Edit Rating
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-[180px] bg-primary text-[oklch(0.88_0.06_75)] border-2 border-[#B8860B] hover:bg-primary/90 hover:border-[#DAA520]"
                    onClick={() => handleRateClick(movie)}
                  >
                    Rate
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={!!selectedMovie} onOpenChange={() => setSelectedMovie(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMovie?.userHasRated ? "Edit" : "Rate"} {selectedMovie?.title}
            </DialogTitle>
            <DialogDescription>
              How would you rate this movie? (1-5 stars)
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <StarRating value={rating} onChange={setRating} />
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                onClick={() => setSelectedMovie(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRating}
                disabled={rating === 0 || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Submit Rating"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

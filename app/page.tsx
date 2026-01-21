"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { CurrentWatchlist } from "@/components/current-watchlist";
import { HallOfFame } from "@/components/hall-of-fame";
import { ComingSoon } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";

type Movie = {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture: string | null;
};

type HallOfFameMovie = Movie & {
  averageRating: number;
};

export default function Home() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameMovie[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from API on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [watchlistRes, hallOfFameRes] = await Promise.all([
          fetch("/api/movies/current"),
          fetch("/api/movies/hall-of-fame"),
        ]);

        if (watchlistRes.ok) {
          const watchlistData = await watchlistRes.json();
          setWatchlist(watchlistData);
        }

        if (hallOfFameRes.ok) {
          const hallOfFameData = await hallOfFameRes.json();
          setHallOfFame(hallOfFameData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center relative">
          <h1 className="text-4xl font-bold text-secondary">The Movie Club</h1>
          <div className="absolute right-4">
            <Link href="/profile">
              <Button
                variant="ghost"
                className="rounded-full hover:bg-secondary group"
                aria-label="User profile"
              >
                <User className="size-6 text-accent group-hover:!text-primary transition-colors" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary">Loading...</p>
          </div>
        ) : (
          <>
            <CurrentWatchlist movies={watchlist} />
            <HallOfFame movies={hallOfFame} />
            <ComingSoon />
          </>
        )}
      </main>
    </div>
  );
}

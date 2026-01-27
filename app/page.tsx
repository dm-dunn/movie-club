"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { CurrentWatchlist } from "@/components/current-watchlist";
import { HallOfFame } from "@/components/hall-of-fame";
import { ComingSoon } from "@/components/coming-soon";
import { GroupStatsSidebar, GroupStatsMobile, GroupStatsData } from "@/components/group-statistics";
import { Button } from "@/components/ui/button";

type Movie = {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture: string | null;
  userHasRated: boolean;
  userRating: number | null;
};

type HallOfFameMovie = {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture: string | null;
  averageRating: number;
};

export default function Home() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameMovie[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from API on mount
  const fetchData = async () => {
    try {
      setLoading(true);
      const [watchlistRes, hallOfFameRes, groupStatsRes] = await Promise.all([
        fetch("/api/movies/current"),
        fetch("/api/movies/hall-of-fame"),
        fetch("/api/group/stats"),
      ]);

      if (watchlistRes.ok) {
        const watchlistData = await watchlistRes.json();
        setWatchlist(watchlistData);
      }

      if (hallOfFameRes.ok) {
        const hallOfFameData = await hallOfFameRes.json();
        setHallOfFame(hallOfFameData);
      }

      if (groupStatsRes.ok) {
        const groupStatsData = await groupStatsRes.json();
        setGroupStats(groupStatsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      <main className="px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-secondary">Loading...</p>
          </div>
        ) : (
          <>
            {/* Watchlist and Hall of Fame with Stats Sidebars */}
            <div className="flex justify-center">
              {/* Left Stats Sidebar */}
              <GroupStatsSidebar stats={groupStats} side="left" />

              {/* Center Content */}
              <div className="flex-1 max-w-4xl space-y-8">
                <CurrentWatchlist movies={watchlist} onRefresh={fetchData} />
                <HallOfFame movies={hallOfFame} />
              </div>

              {/* Right Stats Sidebar */}
              <GroupStatsSidebar stats={groupStats} side="right" />
            </div>

            {/* Mobile Stats and Coming Soon - outside the sidebar layout */}
            <div className="max-w-4xl mx-auto space-y-8">
              <GroupStatsMobile stats={groupStats} />
              <ComingSoon />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

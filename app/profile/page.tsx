"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import { MovieCard } from "@/components/movie-card";
import { Button } from "@/components/ui/button";

type Movie = {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture: string | null;
};

type User = {
  id: string;
  name: string;
  email: string;
  profilePictureUrl: string | null;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [personalTop4, setPersonalTop4] = useState<Movie[]>([]);
  const [personalPicks, setPersonalPicks] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Fetch data from API on mount
  useEffect(() => {
    setIsClient(true);

    async function fetchData() {
      try {
        setLoading(true);
        const [userRes, top4Res, picksRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/user/top-4"),
          fetch("/api/user/picks"),
        ]);

        if (userRes.ok) {
          const userData = await userRes.json();
          setUser(userData);
        }

        if (top4Res.ok) {
          const top4Data = await top4Res.json();
          setPersonalTop4(top4Data);
        }

        if (picksRes.ok) {
          const picksData = await picksRes.json();
          setPersonalPicks(picksData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (!isClient) {
    return null; // Prevents SSR issues
  }

  // Handle profile picture upload
  const handleProfilePictureUpload = (url: string) => {
    if (user) {
      setUser({ ...user, profilePictureUrl: url });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button
              variant="ghost"
              className="text-secondary hover:bg-primary/10"
            >
              ← Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-secondary">My Profile</h1>
          <div className="w-[120px]" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Section */}
        <section className="flex flex-col items-center">
          <div className="flex flex-col items-center gap-3 mb-8">
            <ProfilePictureUpload
              currentPictureUrl={user.profilePictureUrl}
              userInitials={initials}
              onUploadSuccess={handleProfilePictureUpload}
            />
            <h2 className="text-sm font-semibold text-secondary">
              {user.name}
            </h2>
          </div>
        </section>

        {/* Personal Top 4 */}
        <section className="flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-2 text-secondary">My Top 4</h3>
          <p className="text-xs text-secondary/70 mb-6">
            My highest-rated movies from our group watchlist
          </p>
          {personalTop4.length === 0 ? (
            <p className="text-secondary text-center py-8">No rankings yet</p>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center max-w-[800px]">
              {personalTop4.map((movie) => (
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

        {/* Personal Picks */}
        <section className="flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-6 text-secondary">My Picks</h3>
          {personalPicks.length === 0 ? (
            <p className="text-secondary text-center py-8">
              You haven't picked any movies yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center max-w-[800px]">
              {personalPicks.map((movie) => (
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

        {/* Awards Voting */}
        <section className="flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-6 text-secondary">
            Awards Voting
          </h3>
          <div className="bg-muted/20 rounded-lg p-12 text-center max-w-[600px]">
            <p className="text-secondary">
              Award voting will be available here when the voting period opens
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

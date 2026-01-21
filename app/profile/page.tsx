"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ProfilePictureUpload } from "@/components/profile-picture-upload";
import { MovieCard } from "@/components/movie-card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  // Mock data - will be replaced with actual data from database
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const [isClient, setIsClient] = useState(false);

  // Load profile picture from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const savedProfilePic = localStorage.getItem("userProfilePicture");
    console.log(savedProfilePic);
    if (savedProfilePic) {
      setProfilePictureUrl(savedProfilePic);
    }
  }, []);

  if (!isClient) {
    return null; // Prevents SSR issues
  }

  // Handle profile picture upload and save to localStorage
  const handleProfilePictureUpload = (url: string) => {
    setProfilePictureUrl(url);
    localStorage.setItem("userProfilePicture", url);
  };

  const mockUser = {
    name: "John Doe",
    profilePictureUrl: profilePictureUrl,
  };

  const mockPersonalTop4 = [
    {
      id: "7",
      title: "Interstellar",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      pickerName: "Mike",
      pickerProfilePicture: null,
    },
  ];

  const mockPersonalPicks = [
    {
      id: "1",
      title: "The Shawshank Redemption",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      pickerName: "John",
      pickerProfilePicture: profilePictureUrl,
    },
    {
      id: "5",
      title: "Inception",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      pickerName: "John",
      pickerProfilePicture: profilePictureUrl,
    },
  ];

  const initials = mockUser.name
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
              currentPictureUrl={mockUser.profilePictureUrl}
              userInitials={initials}
              onUploadSuccess={handleProfilePictureUpload}
            />
            <h2 className="text-sm font-semibold text-secondary">
              {mockUser.name}
            </h2>
          </div>
        </section>

        {/* Personal Top 4 */}
        <section className="flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-2 text-secondary">My Top 4</h3>
          <p className="text-xs text-secondary/70 mb-6">
            My highest-rated movies from our group watchlist
          </p>
          {mockPersonalTop4.length === 0 ? (
            <p className="text-secondary text-center py-8">No rankings yet</p>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center max-w-[800px]">
              {mockPersonalTop4.map((movie) => (
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
          {mockPersonalPicks.length === 0 ? (
            <p className="text-secondary text-center py-8">
              You haven't picked any movies yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center max-w-[800px]">
              {mockPersonalPicks.map((movie) => (
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

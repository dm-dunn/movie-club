"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { CurrentWatchlist } from "@/components/current-watchlist";
import { HallOfFame } from "@/components/hall-of-fame";
import { ComingSoon } from "@/components/coming-soon";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

  // Load profile picture from localStorage on mount
  useEffect(() => {
    const savedProfilePic = localStorage.getItem("userProfilePicture");
    if (savedProfilePic) {
      setProfilePictureUrl(savedProfilePic);
    }
  }, []);
  // Mock data - will be replaced with actual data from database
  const mockWatchlist = [
    {
      id: "1",
      title: "The Shawshank Redemption",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      pickerName: "John",
      pickerProfilePicture: profilePictureUrl,
    },
    {
      id: "2",
      title: "The Godfather",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      pickerName: "Sarah",
      pickerProfilePicture: null,
    },
  ];

  const mockHallOfFame = [
    {
      id: "3",
      title: "Pulp Fiction",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      pickerName: "Mike",
      pickerProfilePicture: null,
      averageRating: 4.8,
    },
    {
      id: "4",
      title: "The Dark Knight",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      pickerName: "Emma",
      pickerProfilePicture: null,
      averageRating: 4.7,
    },
    {
      id: "5",
      title: "Inception",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      pickerName: "John",
      pickerProfilePicture: profilePictureUrl,
      averageRating: 4.6,
    },
    {
      id: "6",
      title: "Fight Club",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      pickerName: "Sarah",
      pickerProfilePicture: null,
      averageRating: 4.5,
    },
    {
      id: "7",
      title: "The Matrix",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      pickerName: "Mike",
      pickerProfilePicture: null,
      averageRating: 4.4,
    },
    {
      id: "8",
      title: "Goodfellas",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
      pickerName: "John",
      pickerProfilePicture: profilePictureUrl,
      averageRating: 4.3,
    },
    {
      id: "9",
      title: "The Silence of the Lambs",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
      pickerName: "Emma",
      pickerProfilePicture: null,
      averageRating: 4.2,
    },
    {
      id: "10",
      title: "Forrest Gump",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      pickerName: "Sarah",
      pickerProfilePicture: null,
      averageRating: 4.1,
    },
    {
      id: "11",
      title: "The Usual Suspects",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/9Xw0I5RV2ZqNLpul6lMcsWSCcoI.jpg",
      pickerName: "Mike",
      pickerProfilePicture: null,
      averageRating: 4.0,
    },
    {
      id: "12",
      title: "The Prestige",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/1o80kd3r7ZgnxyxZOb0wb0blPyS.jpg",
      pickerName: "John",
      pickerProfilePicture: profilePictureUrl,
      averageRating: 3.9,
    },
  ];

  const mockUser = {
    name: "John Doe",
    profilePictureUrl: null,
  };

  const mockPersonalTop4 = [
    {
      id: "7",
      title: "Interstellar",
      posterUrl:
        "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      pickerName: "Mike",
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
        <CurrentWatchlist movies={mockWatchlist} />
        <HallOfFame movies={mockHallOfFame} />
        <ComingSoon />
      </main>
    </div>
  );
}

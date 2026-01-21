"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MovieCard } from "./movie-card";
import { Button } from "@/components/ui/button";

interface UserMovie {
  id: string;
  title: string;
  posterUrl: string | null;
  pickerName: string;
}

interface UserAccountDialogProps {
  user: {
    name: string;
    profilePictureUrl: string | null;
  };
  personalTop4: UserMovie[];
  personalPicks: UserMovie[];
}

export function UserAccountDialog({
  user,
  personalTop4,
  personalPicks,
}: UserAccountDialogProps) {
  const [open, setOpen] = useState(false);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full hover:bg-primary/10"
          aria-label="User account"
        >
          <span className="text-2xl text-primary">👤</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">My Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.profilePictureUrl || undefined} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
            </div>
          </div>

          {/* Personal Top 4 */}
          <div>
            <h4 className="text-lg font-semibold mb-4">My Top 4</h4>
            {personalTop4.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No rankings yet
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {personalTop4.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    title={movie.title}
                    posterUrl={movie.posterUrl}
                    pickerName={movie.pickerName}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Personal Picks */}
          <div>
            <h4 className="text-lg font-semibold mb-4">My Picks</h4>
            {personalPicks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                You haven't picked any movies yet
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {personalPicks.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    title={movie.title}
                    posterUrl={movie.posterUrl}
                    pickerName={movie.pickerName}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Awards Voting - Coming Soon */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Awards Voting</h4>
            <div className="bg-muted rounded-lg p-8 text-center">
              <p className="text-muted-foreground">
                Award voting will be available here when the voting period opens
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

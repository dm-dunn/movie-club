"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";

interface MovieCardProps {
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture?: string | null;
  averageRating?: number;
  borderStyle?: "gold" | "amc" | "none";
}

export function MovieCard({
  title,
  posterUrl,
  pickerName,
  pickerProfilePicture,
  averageRating,
  borderStyle = "none",
}: MovieCardProps) {
  const pickerInitials = pickerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  // Random shimmer effect for gold borders
  const [shimmerCorner, setShimmerCorner] = useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | null
  >(null);

  useEffect(() => {
    if (borderStyle !== "gold") return;

    const triggerShimmer = () => {
      const corners = [
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ] as const;
      const randomCorner = corners[Math.floor(Math.random() * corners.length)];
      setShimmerCorner(randomCorner);

      // Reset after animation duration
      setTimeout(() => setShimmerCorner(null), 800);

      // Schedule next shimmer at random interval (1-10 seconds)
      const nextInterval = Math.random() * 9000 + 1000;
      setTimeout(triggerShimmer, nextInterval);
    };

    // Start the shimmer cycle
    const initialDelay = Math.random() * 9000 + 1000;
    const timeout = setTimeout(triggerShimmer, initialDelay);

    return () => clearTimeout(timeout);
  }, [borderStyle]);

  // Define border styles
  const borderClasses = {
    none: "",
    gold: "shadow-[0_0_0_8px_#B8860B,0_0_0_10px_#DAA520,0_0_0_12px_#B8860B,0_0_0_14px_#8B7500] relative before:absolute before:inset-0 before:shadow-[inset_0_0_0_2px_rgba(218,165,32,0.4)]",
    amc: "shadow-[0_0_0_3px_#000000,0_0_0_6px_#DC143C,0_0_0_9px_#000000] relative",
  };

  const containerClasses = {
    none: "",
    gold: "p-3.5 pb-6",
    amc: "p-2.5",
  };

  return (
    <div className={`w-[180px] flex flex-col gap-2 ${containerClasses[borderStyle]}`}>
      <div className={`relative aspect-[2/3] w-full bg-muted/50 overflow-hidden ${borderClasses[borderStyle]}`}>
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={`${title} poster`}
            fill
            className="object-cover"
            sizes="180px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-secondary text-xs">
            No Image
          </div>
        )}
        {/* Gold shimmer effects for each corner */}
        {borderStyle === "gold" && shimmerCorner && (
          <>
            {shimmerCorner === "top-left" && (
              <div className="absolute -top-[14px] -left-[14px] w-12 h-12 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-200/80 via-transparent to-transparent animate-corner-shimmer" />
              </div>
            )}
            {shimmerCorner === "top-right" && (
              <div className="absolute -top-[14px] -right-[14px] w-12 h-12 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-bl from-yellow-200/80 via-transparent to-transparent animate-corner-shimmer" />
              </div>
            )}
            {shimmerCorner === "bottom-left" && (
              <div className="absolute -bottom-[14px] -left-[14px] w-12 h-12 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-tr from-yellow-200/80 via-transparent to-transparent animate-corner-shimmer" />
              </div>
            )}
            {shimmerCorner === "bottom-right" && (
              <div className="absolute -bottom-[14px] -right-[14px] w-12 h-12 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-tl from-yellow-200/80 via-transparent to-transparent animate-corner-shimmer" />
              </div>
            )}
          </>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold text-xs line-clamp-2 text-secondary">
          {title}
        </p>
        {averageRating !== undefined && (
          <p className="text-[10px] text-accent font-medium">
            Group Agg. Rank: {averageRating.toFixed(1)}
          </p>
        )}
        <div className="flex items-center gap-1.5">
          <Avatar className="h-4 w-4">
            <AvatarImage src={pickerProfilePicture || undefined} />
            <AvatarFallback className="text-[6px] bg-secondary text-primary">
              {pickerInitials}
            </AvatarFallback>
          </Avatar>
          <p className="text-[10px] text-secondary">Picked by {pickerName}</p>
        </div>
      </div>
    </div>
  );
}

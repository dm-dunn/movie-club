import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MovieCardProps {
  title: string;
  posterUrl: string | null;
  pickerName: string;
  pickerProfilePicture?: string | null;
  averageRating?: number;
}

export function MovieCard({
  title,
  posterUrl,
  pickerName,
  pickerProfilePicture,
  averageRating,
}: MovieCardProps) {
  const pickerInitials = pickerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  return (
    <div className="w-[180px] flex flex-col gap-2">
      <div className="relative aspect-[2/3] w-full bg-muted/50 rounded-sm overflow-hidden">
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

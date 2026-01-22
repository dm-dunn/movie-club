"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 32 }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={size}
            className={`transition-colors ${
              star <= (hoverValue || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-400"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

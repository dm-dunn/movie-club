"use client";

import { useState } from "react";
import { Star, StarHalf } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
  readOnly?: boolean;
}

function StarIcon({ filled, half, size }: { filled: boolean; half: boolean; size: number }) {
  if (half) {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <Star size={size} className="text-gray-400 absolute" />
        <StarHalf size={size} className="fill-yellow-400 text-yellow-400 absolute" />
      </div>
    );
  }
  return (
    <Star
      size={size}
      className={filled ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}
    />
  );
}

export function StarRating({ value, onChange, size = 32, readOnly = false }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  if (readOnly) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          const half = !filled && star - 0.5 === value;
          return (
            <StarIcon key={star} filled={filled} half={half} size={size} />
          );
        })}
      </div>
    );
  }

  const displayValue = hoverValue || value;

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        const half = !filled && star - 0.5 === displayValue;
        return (
          <button
            key={star}
            type="button"
            className="transition-transform hover:scale-110 relative"
            onMouseLeave={() => setHoverValue(0)}
          >
            <div className="flex">
              {/* Left half - clicking gives X.5 rating, hovering on left half shows half star */}
              <div
                className="w-1/2 h-full absolute left-0 top-0 z-10"
                style={{ height: size }}
                onClick={() => onChange?.(star - 0.5)}
                onMouseEnter={() => setHoverValue(star - 0.5)}
              />
              {/* Right half - clicking gives X rating, hovering on right half shows full star */}
              <div
                className="w-1/2 h-full absolute right-0 top-0 z-10"
                style={{ height: size }}
                onClick={() => onChange?.(star)}
                onMouseEnter={() => setHoverValue(star)}
              />
              <StarIcon filled={filled} half={half} size={size} />
            </div>
          </button>
        );
      })}
    </div>
  );
}

import { Lock, DollarSign } from "lucide-react";

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-105"
        >
          {/* Circle background */}
          <circle cx="20" cy="20" r="18" fill="hsl(var(--accent))" className="opacity-20" />
          {/* Lock icon */}
          <path
            d="M15 18V16C15 13.7909 16.7909 12 19 12H21C23.2091 12 25 13.7909 25 16V18"
            stroke="hsl(var(--accent))"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="13"
            y="18"
            width="14"
            height="10"
            rx="2"
            fill="hsl(var(--accent))"
            className="opacity-90"
          />
          {/* Dollar sign */}
          <path
            d="M20 14V26"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M17 17C17 16.4477 17.4477 16 18 16H19C19.5523 16 20 16.4477 20 17C20 17.5523 19.5523 18 19 18H18C17.4477 18 17 18.4477 17 19C17 19.5523 17.4477 20 18 20H19C19.5523 20 20 20.4477 20 21"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-xl font-bold text-foreground">EncryptedBid</span>
    </div>
  );
};

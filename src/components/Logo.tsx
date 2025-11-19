import { Shield } from "lucide-react";

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
          {/* Shield */}
          <path
            d="M20 4L8 10V18C8 26 13 33 20 36C27 33 32 26 32 18V10L20 4Z"
            fill="hsl(var(--secondary))"
            className="opacity-90"
          />
          {/* Handshake */}
          <path
            d="M14 20C14 20 15 19 16.5 19C18 19 19 20 20 20C21 20 22 19 23.5 19C25 19 26 20 26 20L24 24H16L14 20Z"
            fill="hsl(var(--primary))"
          />
          <path
            d="M16 21L18 19L20 20L22 19L24 21"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <span className="text-xl font-bold text-foreground">SecureTrade</span>
    </div>
  );
};

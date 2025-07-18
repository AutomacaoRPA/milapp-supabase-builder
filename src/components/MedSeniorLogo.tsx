import { cn } from "@/lib/utils";

interface MedSeniorLogoProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const MedSeniorLogo = ({ 
  className,
  showTagline = true,
  size = "md"
}: MedSeniorLogoProps) => {
  const sizeClasses = {
    sm: "text-2xl",
    md: "text-4xl",
    lg: "text-5xl",
    xl: "text-6xl"
  };

  return (
    <div className={cn("flex flex-col items-center space-y-1", className)}>
      {/* Logo Text */}
      <div className="flex items-center">
        <span className={cn(
          "font-heading font-bold text-primary",
          sizeClasses[size]
        )}>
          Med
        </span>
        <span className={cn(
          "font-heading font-bold text-secondary",
          sizeClasses[size]
        )}>
          Sênior
        </span>
        
        {/* Leaf Icon - Simplified SVG */}
        <div className="ml-2 relative">
          <svg 
            viewBox="0 0 40 24" 
            className={cn(
              "text-primary",
              size === "sm" && "w-6 h-4",
              size === "md" && "w-8 h-5",
              size === "lg" && "w-10 h-6",
              size === "xl" && "w-12 h-7"
            )}
            fill="currentColor"
          >
            {/* Main leaf */}
            <path d="M8 2C8 2 20 4 28 12C20 20 8 22 8 22C8 22 4 16 4 12C4 8 8 2 8 2Z" 
                  className="text-primary" />
            {/* Secondary leaf */}
            <path d="M20 4C20 4 32 6 36 12C32 18 20 20 20 20C20 20 24 14 24 12C24 10 20 4 20 4Z" 
                  className="text-secondary opacity-80" />
          </svg>
        </div>
      </div>
      
      {/* Tagline */}
      {showTagline && (
        <p className={cn(
          "font-heading font-medium text-primary/80 tracking-wide",
          size === "sm" && "text-xs",
          size === "md" && "text-sm",
          size === "lg" && "text-base",
          size === "xl" && "text-lg"
        )}>
          bem envelhecer
        </p>
      )}
    </div>
  );
};
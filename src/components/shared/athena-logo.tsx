type LogoVariant = "full" | "symbol"
type LogoSize = "sm" | "md" | "lg" | "xl"

interface AthenaLogoProps {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
}

const sizeMap = {
  sm: "h-24 sm:h-32",
  md: "h-32 sm:h-40",
  lg: "h-48 sm:h-64",
  xl: "h-64 sm:h-96",
} as const

export function AthenaLogo({ variant = "full", size = "md", className = "" }: AthenaLogoProps) {
  const src = variant === "full" ? "/athena-full.png" : "/athena-symbol.png"
  return (
    <img
      src={src}
      alt="athena"
      className={`${sizeMap[size]} object-contain ${className}`}
    />
  )
}

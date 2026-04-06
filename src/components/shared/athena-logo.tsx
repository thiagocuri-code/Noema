type LogoVariant = "full" | "symbol"
type LogoSize = "sm" | "md" | "lg" | "xl"

interface AthenaLogoProps {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
}

const sizeMap = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
  xl: "h-16",
} as const

export function AthenaLogo({ variant = "full", size = "md", className = "" }: AthenaLogoProps) {
  return (
    <img
      src="/athena-logo.png"
      alt="athena"
      className={`${sizeMap[size]} w-auto object-contain ${className}`}
    />
  )
}

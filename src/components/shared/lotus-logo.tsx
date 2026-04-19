type LogoVariant = "full" | "symbol" | "logo"
type LogoSize = "sm" | "md" | "lg" | "xl"

interface LotusLogoProps {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
}

const sizeMap = {
  sm: "h-12",
  md: "h-16",
  lg: "h-24",
  xl: "h-32",
} as const

const srcMap = {
  full: "/lotus-full.png",
  symbol: "/lotus-symbol.png",
  logo: "/lotus-logo.png",
} as const

export function LotusLogo({ variant = "full", size = "md", className = "" }: LotusLogoProps) {
  return (
    <img
      src={srcMap[variant]}
      alt="lótus"
      className={`${sizeMap[size]} w-auto object-contain ${className}`}
    />
  )
}

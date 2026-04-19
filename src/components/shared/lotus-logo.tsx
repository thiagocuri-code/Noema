type LogoVariant = "full" | "symbol" | "logo"
type LogoSize = "sm" | "md" | "lg" | "xl"

interface LotusLogoProps {
  variant?: LogoVariant
  size?: LogoSize
  className?: string
}

const sizeMap = {
  sm: "h-24",
  md: "h-32",
  lg: "h-48",
  xl: "h-64",
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

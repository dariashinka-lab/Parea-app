import React from 'react'
import Svg, { Path } from 'react-native-svg'

// Boost icon — three ascending sparkle stars (small, medium, large) on the
// bottom-left → top-right diagonal. Generated for Parea's Boost feature
// (premium, ascending, sparkle vibe) — distinct from Tinder/Bumble flame
// and from any rocket/arrow shapes. Single fill so the parent picks color.
export function BoostIcon({ size = 24, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Centers: (5,19) → (12,12) → (19,5) — 7 units apart diagonally
          (even spacing). Sizes 6/8/10 — clean step-up. */}
      <Path d="M5 16L6 18L8 19L6 20L5 22L4 20L2 19L4 18Z" fill={color} />
      <Path d="M12 8L13 11L16 12L13 13L12 16L11 13L8 12L11 11Z" fill={color} />
      <Path d="M19 0L20 4L24 5L20 6L19 10L18 6L14 5L18 4Z" fill={color} />
    </Svg>
  )
}

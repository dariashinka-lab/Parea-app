// Pure helper functions extracted from index.tsx (Stage 1 of refactor).

// Parse a Parea event time string into a Date (date only, hours zeroed).
// Supports the formats produced across the app:
//   • ISO date: "2026-03-31" (from createDay)
//   • DMY: "26/03/2026" or "26.03.2026"
//   • Long: "Thursday, 26 March 2026" or "26 March 2026"
//   • Relative: "today", "tomorrow", or short weekday like "Sat" / "Mon"
// Returns null when nothing matches.
export function parseEventDate(timeStr: string): Date | null {
  if (!timeStr) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const lower = timeStr.toLowerCase()
  if (lower.startsWith('today')) return today
  if (lower.startsWith('tomorrow')) { const d = new Date(today); d.setDate(d.getDate() + 1); return d }
  const isoMatch = timeStr.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const d = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
    d.setHours(0, 0, 0, 0)
    return d
  }
  const dmyMatch = timeStr.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/)
  if (dmyMatch) {
    const d = new Date(parseInt(dmyMatch[3]), parseInt(dmyMatch[2]) - 1, parseInt(dmyMatch[1]))
    d.setHours(0, 0, 0, 0)
    return d
  }
  const monthMap: Record<string, number> = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 }
  const longMatch = timeStr.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (longMatch) {
    const month = monthMap[longMatch[2].toLowerCase()]
    if (month !== undefined) {
      const d = new Date(parseInt(longMatch[3]), month, parseInt(longMatch[1]))
      d.setHours(0, 0, 0, 0)
      return d
    }
  }
  const dayMap: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 }
  const prefix = lower.slice(0, 3)
  if (prefix in dayMap) {
    const d = new Date(today)
    const diff = ((dayMap[prefix] - d.getDay()) + 7) % 7 || 7
    d.setDate(d.getDate() + diff)
    return d
  }
  return null
}

// Same as parseEventDate but also reads "HH:MM" if present, otherwise sets to
// end of day so isEventPast doesn't drop a date-only event mid-day.
export function parseEventDateTime(timeStr: string): Date | null {
  const date = parseEventDate(timeStr)
  if (!date) return null
  const match = timeStr.match(/(\d{1,2}):(\d{2})/)
  if (match) {
    date.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0)
  } else {
    date.setHours(23, 59, 59, 0)
  }
  return date
}

// True if the parsed event time is before now. Returns false for unparseable
// strings — keep the event visible rather than risk hiding something valid.
export function isEventPast(timeStr: string): boolean {
  const dt = parseEventDateTime(timeStr)
  if (!dt) return false
  return dt < new Date()
}

export const prettyEventTime = (s: string | undefined | null) => {
  if (!s) return s
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return s
    .replace(/(\d{4})-(\d{2})-(\d{2})/, (_, _y, m, d) => `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`)
    .replace(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/, (_, d, m, y) => `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`)
}

// Maximum age gap (in years) Parea considers compatible for social matching.
// Tighter than dating apps (Parea = events/companions), wider than ±5 to allow
// inter-generational social mixing. Hard-applied only at FEED discovery — once a
// joiner has the event (e.g. via deep link), the host decides for themselves.
export const MAX_AGE_GAP = 15

// Score a join requester's compatibility with the host (0–100)
export function scoreRequesterForHost(
  req: { langs?: string[]; age?: number; drinksPref?: string; smokingPref?: string; interests?: string[]; hasPets?: boolean },
  host: { langs?: string[]; age?: string | number; drinksPref?: string; smokingPref?: string; interests?: string[]; dealbreakers?: string[] },
  eventCategory?: string
): number {
  // Hard host dealbreakers — return 0 so they're filtered out of the approval list.
  const hostDb = host.dealbreakers || []
  if (hostDb.includes('no_smoking') && (req.smokingPref === 'Smoker' || req.smokingPref === 'Social')) return 0
  if (hostDb.includes('sober_only') && req.drinksPref === 'Social drinker') return 0
  if (hostDb.includes('pets_allergy') && req.hasPets) return 0
  let score = 0
  // Language overlap (30 pts)
  const reqLangs = req.langs || []
  const hostLangs = host.langs || []
  const langOverlap = reqLangs.filter(l => hostLangs.includes(l)).length
  score += Math.min(30, langOverlap * 18)
  // Age proximity (25 pts)
  const hAge = typeof host.age === 'string' ? parseInt(host.age || '25') : (host.age || 25)
  const ageDiff = Math.abs((req.age || 25) - hAge)
  score += ageDiff <= 3 ? 25 : ageDiff <= 7 ? 18 : ageDiff <= 12 ? 10 : 3
  // Lifestyle match (25 pts)
  if (!host.drinksPref || req.drinksPref === host.drinksPref) score += 13
  if (!host.smokingPref || req.smokingPref === host.smokingPref) score += 12
  // Interests overlap (20 pts)
  const reqI = req.interests || []
  const hostI = host.interests || []
  const overlap = reqI.filter(i => hostI.includes(i)).length
  if (overlap >= 2) score += 20
  else if (overlap === 1) score += 12
  else if (eventCategory && reqI.includes(eventCategory)) score += 8
  return Math.min(100, score)
}

// Score how well an event fits a requester (0–100)
export function scoreEventForRequester(
  user: { langs?: string[]; age?: string | number; drinksPref?: string; smokingPref?: string; interests?: string[] },
  event: { category?: string; title?: string; maxParticipants?: number }
): number {
  let score = 30 // base
  const interests = user.interests || []
  const category = event.category || ''
  // Category matches interests (35 pts)
  if (interests.includes(category)) score += 35
  else if (interests.some(i => category.includes(i) || i.includes(category))) score += 18
  // Title keyword match (15 pts)
  const titleWords = (event.title || '').toLowerCase().split(/\s+/)
  const titleHits = interests.filter(i => titleWords.some(w => w.includes(i.toLowerCase()) || i.toLowerCase().includes(w))).length
  score += Math.min(15, titleHits * 8)
  // Group size preference (20 pts)
  const max = event.maxParticipants || 5
  const age = typeof user.age === 'string' ? parseInt(user.age || '25') : (user.age || 25)
  if (max <= 2) score += age < 28 ? 20 : 12
  else if (max <= 6) score += 20
  else score += 10
  return Math.min(100, score)
}

import { useState, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = 'map' | 'collection' | 'trades' | 'achievements' | 'profile'
type Screen =
  | { id: 'main' }
  | { id: 'editProfile' }
  | { id: 'cardDetail'; card: PlayerCard }
  | { id: 'newTrade' }

interface PlayerCard {
  id: string
  name: string
  position: string
  country: string
  flag: string
  rating: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  speed: number
  power: number
  boost: number
  discovered: boolean
  lat: number
  lng: number
}

interface Achievement {
  id: string
  title: string
  desc: string
  icon: string
  progress: number
  total: number
  unlocked: boolean
  xp: number
}

interface TradeOffer {
  id: string
  from: string
  fromFlag: string
  offering: PlayerCard
  wanting: string
  wantingFlag: string
  timeLeft: string
}

interface UserProfile {
  username: string
  division: string
  region: string
  bio: string
  avatar: string
  gameMode: string
  notifications: boolean
  privacy: 'Public' | 'Friends' | 'Private'
}

// ── Data ──────────────────────────────────────────────────────────────────
const PLAYER_CARDS: PlayerCard[] = [
  { id: 'c1', name: 'Álvaro Reyes', position: 'ST', country: 'Spain', flag: '🇪🇸', rating: 96, rarity: 'legendary', speed: 94, power: 97, boost: 99, discovered: true, lat: 40, lng: -3 },
  { id: 'c2', name: 'Kai Müller', position: 'CM', country: 'Germany', flag: '🇩🇪', rating: 91, rarity: 'epic', speed: 88, power: 90, boost: 85, discovered: true, lat: 52, lng: 13 },
  { id: 'c3', name: 'Luca Ferraro', position: 'GK', country: 'Italy', flag: '🇮🇹', rating: 89, rarity: 'epic', speed: 72, power: 85, boost: 88, discovered: true, lat: 41, lng: 12 },
  { id: 'c4', name: 'Marcus Webb', position: 'CB', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rating: 87, rarity: 'rare', speed: 80, power: 92, boost: 76, discovered: true, lat: 51, lng: 0 },
  { id: 'c5', name: 'Diego Vasco', position: 'LW', country: 'Brazil', flag: '🇧🇷', rating: 95, rarity: 'legendary', speed: 98, power: 89, boost: 96, discovered: false, lat: -15, lng: -47 },
  { id: 'c6', name: 'Yuki Tanaka', position: 'RW', country: 'Japan', flag: '🇯🇵', rating: 83, rarity: 'rare', speed: 91, power: 78, boost: 82, discovered: false, lat: 35, lng: 139 },
  { id: 'c7', name: 'Omar Al-Rashid', position: 'AM', country: 'Saudi Arabia', flag: '🇸🇦', rating: 80, rarity: 'common', speed: 84, power: 76, boost: 79, discovered: true, lat: 24, lng: 45 },
  { id: 'c8', name: 'Pierre Dubois', position: 'CDM', country: 'France', flag: '🇫🇷', rating: 93, rarity: 'epic', speed: 86, power: 91, boost: 90, discovered: true, lat: 48, lng: 2 },
]

const ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', title: 'First Launch', desc: 'Complete your first scan', icon: '🚀', progress: 1, total: 1, unlocked: true, xp: 100 },
  { id: 'a2', title: 'Card Collector', desc: 'Discover 10 player cards', icon: '🃏', progress: 4, total: 10, unlocked: false, xp: 500 },
  { id: 'a3', title: 'World Explorer', desc: 'Scan all 6 continents', icon: '🌍', progress: 2, total: 6, unlocked: false, xp: 1000 },
  { id: 'a4', title: 'Legendary Find', desc: 'Discover a Legendary card', icon: '⭐', progress: 1, total: 1, unlocked: true, xp: 750 },
  { id: 'a5', title: 'Fuel Master', desc: 'Refuel 25 times', icon: '⛽', progress: 8, total: 25, unlocked: false, xp: 250 },
  { id: 'a6', title: 'Trade Baron', desc: 'Complete 5 successful trades', icon: '🤝', progress: 2, total: 5, unlocked: false, xp: 600 },
]

const TRADE_OFFERS: TradeOffer[] = [
  { id: 't1', from: 'StarScout_BR', fromFlag: '🇧🇷', offering: PLAYER_CARDS[1], wanting: 'Legendary / ST', wantingFlag: '⭐', timeLeft: '2h 14m' },
  { id: 't2', from: 'RocketKing_DE', fromFlag: '🇩🇪', offering: PLAYER_CARDS[3], wanting: 'Epic / GK', wantingFlag: '🟣', timeLeft: '45m' },
  { id: 't3', from: 'BlitzFan_JP', fromFlag: '🇯🇵', offering: PLAYER_CARDS[6], wanting: 'Rare / LW', wantingFlag: '🔵', timeLeft: '5h 30m' },
]

const DEFAULT_PROFILE: UserProfile = {
  username: 'RocketScout_42',
  division: 'Europe Division',
  region: 'Europe',
  bio: 'Chasing legends across every continent 🌍🚀',
  avatar: '🚀',
  gameMode: 'Explorer',
  notifications: true,
  privacy: 'Public',
}

// ── Helpers ───────────────────────────────────────────────────────────────
const rarityColor: Record<string, string> = {
  common: '#6b7280',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#ffd700',
}
const rarityGlow: Record<string, string> = {
  common: 'rgba(107,114,128,0.3)',
  rare: 'rgba(59,130,246,0.4)',
  epic: 'rgba(139,92,246,0.4)',
  legendary: 'rgba(255,215,0,0.5)',
}
const rarityLabel: Record<string, string> = {
  common: 'COMMON',
  rare: 'RARE',
  epic: 'EPIC',
  legendary: 'LEGENDARY',
}

const SIGNALS = [
  { id: 's1', x: '18%', y: '30%', discovered: false },
  { id: 's2', x: '72%', y: '22%', discovered: true },
  { id: 's3', x: '55%', y: '60%', discovered: false },
  { id: 's4', x: '82%', y: '55%', discovered: false },
  { id: 's5', x: '30%', y: '65%', discovered: true },
  { id: 's6', x: '45%', y: '38%', discovered: false },
]

const AVATARS = ['🚀', '⚽', '🌍', '🔥', '⚡', '🦅', '🏆', '🎯', '💫', '🛸']
const REGIONS = ['Europe', 'South America', 'North America', 'Asia', 'Africa', 'Oceania']
const GAME_MODES = ['Explorer', 'Collector', 'Trader', 'Competitive']

// ── Sub-components ────────────────────────────────────────────────────────
function RarityBadge({ rarity }: { rarity: string }) {
  return (
    <span
      className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
      style={{ color: rarityColor[rarity], border: `1px solid ${rarityColor[rarity]}`, background: `${rarityGlow[rarity]}` }}
    >
      {rarityLabel[rarity]}
    </span>
  )
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[9px] text-gray-500 w-7">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-800">
        <div
          className="h-full rounded-full animate-bar-fill"
          style={{ width: `${value}%`, background: color, boxShadow: `0 0 4px ${color}` }}
        />
      </div>
      <span className="font-mono text-[10px] font-bold" style={{ color }}>{value}</span>
    </div>
  )
}

function CardFace({ card, compact = false }: { card: PlayerCard; compact?: boolean }) {
  const rc = rarityColor[card.rarity]
  const rg = rarityGlow[card.rarity]
  return (
    <div
      className={`relative rounded-xl overflow-hidden flex flex-col ${compact ? 'p-2.5' : 'p-4'}`}
      style={{
        background: `linear-gradient(135deg, #0f1520 0%, #1a2235 50%, #0f1520 100%)`,
        border: `1px solid ${rc}`,
        boxShadow: `0 4px 24px ${rg}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div className="absolute inset-0 animate-shimmer pointer-events-none" />
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-mono text-xs font-bold" style={{ color: rc }}>{card.position}</div>
          <div className="font-display text-lg font-bold leading-tight text-white">{card.name}</div>
          <div className="font-body text-xs text-gray-400">{card.flag} {card.country}</div>
        </div>
        <div className="text-right">
          <div className="font-display text-3xl font-black" style={{ color: rc }}>{card.rating}</div>
          <RarityBadge rarity={card.rarity} />
        </div>
      </div>
      <div
        className="w-full rounded-lg mb-3 flex items-center justify-center relative overflow-hidden"
        style={{ height: compact ? 64 : 96, background: `linear-gradient(160deg, #1a2235, #0f1520)` }}
      >
        <div className="absolute inset-0 map-grid opacity-40" />
        <div className="font-display text-5xl font-black opacity-10 absolute" style={{ color: rc }}>{card.position}</div>
        <div className="text-4xl relative z-10">{card.flag}</div>
        <div className="absolute bottom-0 left-0 right-0 h-8" style={{ background: `linear-gradient(transparent, ${rg})` }} />
      </div>
      {!compact && (
        <div className="space-y-1.5">
          <StatBar label="SPD" value={card.speed} color="#00d4ff" />
          <StatBar label="PWR" value={card.power} color="#ff6b00" />
          <StatBar label="BST" value={card.boost} color="#8b5cf6" />
        </div>
      )}
    </div>
  )
}

// ── CARD LIST ROW ─────────────────────────────────────────────────────────
function CardListRow({ card, onPress }: { card: PlayerCard; onPress: () => void }) {
  const rc = rarityColor[card.rarity]
  const rg = rarityGlow[card.rarity]
  return (
    <button
      onClick={onPress}
      className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 active:scale-98 text-left"
      style={{
        background: 'rgba(15,21,32,0.8)',
        border: `1px solid ${rc}30`,
        boxShadow: `0 2px 12px ${rg}`,
      }}
    >
      {/* Mini avatar */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #1a2235, #0f1520)`, border: `1px solid ${rc}50` }}
      >
        <div className="absolute inset-0 map-grid opacity-30" />
        <span className="relative z-10">{card.flag}</span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-display text-sm font-bold text-white truncate">{card.name}</span>
          <RarityBadge rarity={card.rarity} />
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-gray-500">{card.country}</span>
          <span className="font-mono text-[10px]" style={{ color: rc }}>{card.position}</span>
        </div>
        {/* Inline mini stats */}
        <div className="flex gap-3 mt-1">
          {[['SPD', card.speed, '#00d4ff'], ['PWR', card.power, '#ff6b00'], ['BST', card.boost, '#8b5cf6']].map(([l, v, c]) => (
            <div key={l as string} className="flex items-center gap-1">
              <span className="font-mono text-[8px] text-gray-600">{l}</span>
              <span className="font-mono text-[9px] font-bold" style={{ color: c as string }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Rating */}
      <div className="flex-shrink-0 text-right">
        <div className="font-display text-2xl font-black" style={{ color: rc }}>{card.rating}</div>
        <div className="font-mono text-[8px] text-gray-600">OVR</div>
      </div>
      <div className="text-gray-600 ml-1">›</div>
    </button>
  )
}

// ── CARD DETAIL SCREEN ────────────────────────────────────────────────────
function CardDetailScreen({ card, onBack, onTrade }: { card: PlayerCard; onBack: () => void; onTrade: () => void }) {
  const rc = rarityColor[card.rarity]
  const rg = rarityGlow[card.rarity]

  const allStats = [
    { label: 'SPEED', value: card.speed, color: '#00d4ff', icon: '⚡' },
    { label: 'POWER', value: card.power, color: '#ff6b00', icon: '💪' },
    { label: 'BOOST', value: card.boost, color: '#8b5cf6', icon: '🚀' },
    { label: 'OVERALL', value: card.rating, color: rc, icon: '⭐' },
    { label: 'DRIBBLE', value: Math.round((card.speed + card.boost) / 2), color: '#22c55e', icon: '🎯' },
    { label: 'DEFENSE', value: Math.round((card.power + 60) / 2), color: '#f59e0b', icon: '🛡️' },
  ]

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: '#040710' }}>
      {/* Hero section */}
      <div
        className="relative flex-shrink-0 overflow-hidden"
        style={{
          height: 280,
          background: `radial-gradient(ellipse at 50% 0%, ${rg}, #040710 70%)`,
        }}
      >
        <div className="absolute inset-0 map-grid opacity-20" />
        {/* Decorative rings */}
        {[80, 120, 160].map((size, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size * 2,
              height: size * 2,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              border: `1px solid ${rc}${Math.round(18 - i * 5).toString(16).padStart(2, '0')}`,
            }}
          />
        ))}

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-12 left-4 z-10 w-9 h-9 rounded-xl glass flex items-center justify-center neon-border"
        >
          <span className="font-mono text-sm neon-text">‹</span>
        </button>

        {/* Rarity badge top right */}
        <div className="absolute top-12 right-4 z-10">
          <RarityBadge rarity={card.rarity} />
        </div>

        {/* Center avatar */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl mb-3 animate-float"
            style={{
              background: `linear-gradient(135deg, #1a2235, #0f1520)`,
              border: `2px solid ${rc}`,
              boxShadow: `0 0 32px ${rg}`,
            }}
          >
            {card.flag}
          </div>
          <div className="font-display text-2xl font-black text-white">{card.name}</div>
          <div className="font-mono text-xs text-gray-400 mt-0.5">{card.flag} {card.country} · {card.position}</div>
          <div className="font-display text-5xl font-black mt-1" style={{ color: rc }}>{card.rating}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Stats grid */}
        <div className="glass rounded-2xl p-4" style={{ border: `1px solid ${rc}20` }}>
          <div className="font-mono text-[10px] text-gray-600 mb-3">PLAYER STATS</div>
          <div className="grid grid-cols-2 gap-3">
            {allStats.map(s => (
              <div key={s.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">{s.icon}</span>
                    <span className="font-mono text-[9px] text-gray-500">{s.label}</span>
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-800">
                  <div
                    className="h-full rounded-full animate-bar-fill"
                    style={{ width: `${s.value}%`, background: s.color, boxShadow: `0 0 4px ${s.color}` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card info */}
        <div className="glass rounded-2xl p-4">
          <div className="font-mono text-[10px] text-gray-600 mb-3">CARD INFO</div>
          <div className="space-y-2">
            {[
              ['NATIONAL TEAM', `${card.flag} ${card.country}`],
              ['POSITION', card.position],
              ['RARITY', rarityLabel[card.rarity]],
              ['CARD ID', `#GRL-${card.id.toUpperCase()}`],
              ['DISCOVERED', 'Sept 2024'],
              ['MARKET VALUE', card.rarity === 'legendary' ? '4,200 ⚡' : card.rarity === 'epic' ? '1,800 ⚡' : card.rarity === 'rare' ? '640 ⚡' : '120 ⚡'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-mono text-[10px] text-gray-600">{k}</span>
                <span className="font-body text-sm font-bold" style={{ color: k === 'RARITY' ? rc : '#e8eaf0' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lore / description */}
        <div className="glass rounded-2xl p-4">
          <div className="font-mono text-[10px] text-gray-600 mb-2">LEGEND</div>
          <p className="font-body text-sm text-gray-400 leading-relaxed">
            Discovered in the orbit zone above {card.country}, this card was locked inside an encrypted signal beacon for 3 years. Only 142 scouts have ever found it. {card.rarity === 'legendary' ? 'One of the rarest cards in existence — a true collector\'s crown jewel.' : 'A formidable find on any world map.'}
          </p>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pb-4">
          <button
            onClick={onTrade}
            className="py-4 rounded-2xl font-display font-bold text-sm neon-border neon-text hover:bg-cyan-400 hover:text-black transition-all duration-200"
          >
            ⇌ TRADE
          </button>
          <button
            className="py-4 rounded-2xl font-display font-bold text-sm text-gray-900 transition-all duration-200"
            style={{ background: rc, boxShadow: `0 0 16px ${rg}` }}
          >
            ★ FAVORITE
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAP SCREEN ────────────────────────────────────────────────────────────
function MapScreen() {
  const [scanning, setScanning] = useState(false)
  const [revealedCard, setRevealedCard] = useState<PlayerCard | null>(null)
  const [fuel, setFuel] = useState(78)
  const [xp] = useState(14250)
  const [level] = useState(23)
  const [scanProgress, setScanProgress] = useState(0)

  const doScan = useCallback(() => {
    if (scanning || fuel < 10) return
    setScanning(true)
    setScanProgress(0)
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100 }
        return p + 4
      })
    }, 60)
    setTimeout(() => {
      setScanning(false)
      setFuel(f => Math.max(0, f - 12))
      const undiscovered = PLAYER_CARDS.filter(c => !c.discovered)
      if (undiscovered.length > 0) {
        setRevealedCard(undiscovered[Math.floor(Math.random() * undiscovered.length)])
      }
    }, 1800)
  }, [scanning, fuel])

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#040710]">
      <div className="absolute inset-0">
        <div className="w-full h-full map-grid" />
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 390 680" preserveAspectRatio="xMidYMid slice">
          <defs><filter id="glow"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          <ellipse cx="210" cy="170" rx="40" ry="30" fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.15)" strokeWidth="0.5" />
          <ellipse cx="210" cy="280" rx="35" ry="55" fill="rgba(0,212,255,0.05)" stroke="rgba(0,212,255,0.12)" strokeWidth="0.5" />
          <ellipse cx="100" cy="260" rx="45" ry="80" fill="rgba(0,212,255,0.05)" stroke="rgba(0,212,255,0.12)" strokeWidth="0.5" />
          <ellipse cx="300" cy="200" rx="60" ry="45" fill="rgba(0,212,255,0.05)" stroke="rgba(0,212,255,0.12)" strokeWidth="0.5" />
          <ellipse cx="315" cy="380" rx="28" ry="22" fill="rgba(0,212,255,0.05)" stroke="rgba(0,212,255,0.12)" strokeWidth="0.5" />
          {[120, 200, 280, 360, 440].map(y => (
            <line key={y} x1="0" y1={y} x2="390" y2={y} stroke="rgba(0,212,255,0.06)" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
          {[78, 156, 234, 312].map(x => (
            <line key={x} x1={x} y1="80" x2={x} y2="600" stroke="rgba(0,212,255,0.06)" strokeWidth="0.5" strokeDasharray="4 8" />
          ))}
          <line x1="0" y1="220" x2="390" y2="220" stroke="rgba(255,107,0,0.08)" strokeWidth="0.5" strokeDasharray="2 6" />
          <line x1="0" y1="340" x2="390" y2="340" stroke="rgba(255,107,0,0.08)" strokeWidth="0.5" strokeDasharray="2 6" />
          <line x1="0" y1="280" x2="390" y2="280" stroke="rgba(0,212,255,0.12)" strokeWidth="0.8" strokeDasharray="3 5" />
        </svg>
        {SIGNALS.map(sig => (
          <div key={sig.id} className="absolute" style={{ left: sig.x, top: sig.y, transform: 'translate(-50%, -50%)' }}>
            {!sig.discovered && (
              <>
                <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-60" style={{ animation: 'ping-signal 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <div className="absolute inset-0 rounded-full bg-cyan-400 opacity-40" style={{ animation: 'ping-signal 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s' }} />
              </>
            )}
            <div className="relative w-3 h-3 rounded-full" style={{ background: sig.discovered ? '#22c55e' : '#00d4ff', boxShadow: `0 0 8px ${sig.discovered ? '#22c55e' : '#00d4ff'}` }} />
            {!sig.discovered && <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-cyan-400 whitespace-nowrap">SIGNAL</div>}
          </div>
        ))}
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full border-2 border-cyan-400 opacity-60" style={{ width: `${scanProgress * 3.5}px`, height: `${scanProgress * 3.5}px`, transition: 'width 0.06s, height 0.06s', boxShadow: '0 0 20px rgba(0,212,255,0.4)' }} />
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 opacity-70 animate-[scan-line_1.8s_linear_forwards]" />
          </div>
        )}
      </div>

      {/* HUD Top */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-12 z-20">
        <div className="glass rounded-2xl p-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center neon-border">
            <div className="text-center">
              <div className="font-mono text-[8px] text-gray-500 leading-none">LVL</div>
              <div className="font-display text-base font-black neon-text leading-none">{level}</div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="font-mono text-[10px] text-gray-400">XP</span>
              <span className="font-mono text-[10px] neon-text">{xp.toLocaleString()} / 20,000</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800">
              <div className="progress-bar h-full rounded-full animate-bar-fill" style={{ width: `${(xp / 20000) * 100}%` }} />
            </div>
          </div>
          <div className="text-xl animate-float">🚀</div>
        </div>
        <div className="glass mt-2 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-base">⛽</span>
          <div className="flex-1">
            <div className="flex justify-between mb-0.5">
              <span className="font-mono text-[9px] text-gray-500">ROCKET FUEL</span>
              <span className="font-mono text-[10px] fire-text font-bold">{fuel}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-800">
              <div className="fuel-bar h-full rounded-full transition-all duration-700" style={{ width: `${fuel}%` }} />
            </div>
          </div>
          {fuel < 30 && <div className="font-mono text-[8px] text-orange-400 animate-pulse">LOW</div>}
        </div>
      </div>

      {/* Scan button */}
      <div className="absolute bottom-28 left-0 right-0 flex justify-center z-20">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={doScan}
            disabled={scanning || fuel < 10}
            className="relative w-20 h-20 rounded-full font-display font-bold text-sm transition-all duration-300 active:scale-95 disabled:opacity-50"
            style={{
              background: scanning ? 'radial-gradient(circle, rgba(0,212,255,0.3), rgba(0,212,255,0.05))' : 'radial-gradient(circle, rgba(0,212,255,0.2), rgba(0,212,255,0.05))',
              border: '2px solid rgba(0,212,255,0.6)',
              boxShadow: '0 0 24px rgba(0,212,255,0.4), 0 0 48px rgba(0,212,255,0.15)',
            }}
          >
            {scanning ? (
              <div className="flex flex-col items-center"><div className="text-lg mb-0.5">📡</div><div className="font-mono text-[9px] neon-text">SCANNING</div></div>
            ) : (
              <div className="flex flex-col items-center"><div className="text-lg mb-0.5">🔍</div><div className="font-mono text-[9px] neon-text">SCAN</div></div>
            )}
            {scanning && <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(0,212,255,0.8)', animation: 'ping-signal 1s ease-out infinite' }} />}
          </button>
          <div className="font-mono text-[9px] text-gray-600">-12% FUEL PER SCAN</div>
        </div>
      </div>

      {/* Card Reveal */}
      {revealedCard && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" style={{ background: 'rgba(4, 7, 16, 0.92)', backdropFilter: 'blur(8px)' }} onClick={() => setRevealedCard(null)}>
          <div className="w-64 animate-card-reveal" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="font-display text-2xl font-black text-white mb-1">CARD DISCOVERED!</div>
              <div className="font-mono text-xs" style={{ color: rarityColor[revealedCard.rarity] }}>✦ {rarityLabel[revealedCard.rarity]} ✦</div>
            </div>
            <CardFace card={revealedCard} />
            <button onClick={() => setRevealedCard(null)} className="w-full mt-4 py-3 rounded-xl font-display font-bold text-sm neon-border neon-text hover:bg-cyan-400 hover:text-black transition-all duration-200">
              ADD TO COLLECTION
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── COLLECTION SCREEN ─────────────────────────────────────────────────────
function CollectionScreen({ onCardDetail }: { onCardDetail: (card: PlayerCard) => void }) {
  const [filter, setFilter] = useState<'all' | 'legendary' | 'epic' | 'rare' | 'common'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const discovered = PLAYER_CARDS.filter(c => c.discovered)
  const filtered = filter === 'all' ? discovered : discovered.filter(c => c.rarity === filter)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 glass-strong border-b border-cyan-900/20">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-display text-xl font-black text-white">COLLECTION</h1>
            <div className="font-mono text-xs text-gray-500">{discovered.length}/{PLAYER_CARDS.length} DISCOVERED</div>
          </div>
          <div className="flex items-center gap-2">
            {/* Grid/List toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="w-9 h-9 flex items-center justify-center transition-all duration-200"
                style={{ background: viewMode === 'grid' ? 'rgba(0,212,255,0.2)' : 'transparent' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="0" y="0" width="6" height="6" rx="1.5" fill={viewMode === 'grid' ? '#00d4ff' : '#4b5563'} />
                  <rect x="8" y="0" width="6" height="6" rx="1.5" fill={viewMode === 'grid' ? '#00d4ff' : '#4b5563'} />
                  <rect x="0" y="8" width="6" height="6" rx="1.5" fill={viewMode === 'grid' ? '#00d4ff' : '#4b5563'} />
                  <rect x="8" y="8" width="6" height="6" rx="1.5" fill={viewMode === 'grid' ? '#00d4ff' : '#4b5563'} />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="w-9 h-9 flex items-center justify-center transition-all duration-200"
                style={{ background: viewMode === 'list' ? 'rgba(0,212,255,0.2)' : 'transparent' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="0" y="0" width="14" height="3" rx="1.5" fill={viewMode === 'list' ? '#00d4ff' : '#4b5563'} />
                  <rect x="0" y="5.5" width="14" height="3" rx="1.5" fill={viewMode === 'list' ? '#00d4ff' : '#4b5563'} />
                  <rect x="0" y="11" width="14" height="3" rx="1.5" fill={viewMode === 'list' ? '#00d4ff' : '#4b5563'} />
                </svg>
              </button>
            </div>
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center neon-border">
              <div className="text-center">
                <div className="font-mono text-[8px] text-gray-500">TOTAL</div>
                <div className="font-display text-sm font-black neon-text">{discovered.length}</div>
              </div>
            </div>
          </div>
        </div>
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', 'legendary', 'epic', 'rare', 'common'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex-shrink-0 px-3 py-1 rounded-full font-mono text-[10px] font-bold transition-all duration-200"
              style={filter === f ? {
                background: f === 'all' ? '#00d4ff' : rarityColor[f],
                color: '#080b14',
                boxShadow: `0 0 10px ${f === 'all' ? '#00d4ff' : rarityColor[f]}`,
              } : {
                background: 'rgba(255,255,255,0.05)',
                color: '#6b7280',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {viewMode === 'grid' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {filtered.map(card => (
                <div key={card.id} onClick={() => onCardDetail(card)} className="cursor-pointer active:scale-95 transition-transform duration-150">
                  <CardFace card={card} compact />
                </div>
              ))}
            </div>
            {/* Undiscovered */}
            <div className="mt-4">
              <div className="font-mono text-[10px] text-gray-600 mb-2">UNDISCOVERED</div>
              <div className="grid grid-cols-2 gap-3">
                {PLAYER_CARDS.filter(c => !c.discovered).map(card => (
                  <div key={card.id} className="rounded-xl p-3 flex flex-col items-center justify-center gap-1" style={{ height: 120, background: 'rgba(15,21,32,0.6)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                    <div className="text-2xl opacity-20">❓</div>
                    <div className="font-mono text-[9px] text-gray-700">UNDISCOVERED</div>
                    <div className="font-mono text-[8px]" style={{ color: rarityColor[card.rarity] }}>{rarityLabel[card.rarity]}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              {filtered.map(card => (
                <CardListRow key={card.id} card={card} onPress={() => onCardDetail(card)} />
              ))}
            </div>
            {/* Undiscovered list */}
            <div className="mt-4 space-y-2">
              <div className="font-mono text-[10px] text-gray-600 mb-2">UNDISCOVERED</div>
              {PLAYER_CARDS.filter(c => !c.discovered).map(card => (
                <div key={card.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(15,21,32,0.6)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl opacity-20" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>❓</div>
                  <div>
                    <div className="font-display text-sm font-bold text-gray-700">UNDISCOVERED</div>
                    <div className="font-mono text-[9px] mt-0.5" style={{ color: rarityColor[card.rarity] }}>{rarityLabel[card.rarity]}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── TRADES SCREEN ─────────────────────────────────────────────────────────
function TradesScreen({ onNewTrade }: { onNewTrade: () => void }) {
  const [activeOffer, setActiveOffer] = useState<string | null>(null)

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-12 pb-4 glass-strong border-b border-cyan-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-black text-white">TRADES</h1>
            <p className="font-mono text-xs text-gray-500 mt-0.5">EXCHANGE CARDS WORLDWIDE</p>
          </div>
          <button
            onClick={onNewTrade}
            className="px-4 py-2 rounded-xl font-display font-bold text-xs neon-text neon-border hover:bg-cyan-400 hover:text-black transition-all duration-200"
          >
            + NEW
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <div className="font-mono text-[10px] text-gray-600 mb-2">INCOMING OFFERS ({TRADE_OFFERS.length})</div>
        {TRADE_OFFERS.map(offer => (
          <div key={offer.id} className="glass rounded-2xl p-4 cursor-pointer transition-all duration-200 active:scale-98" style={{ border: activeOffer === offer.id ? '1px solid rgba(0,212,255,0.4)' : undefined }} onClick={() => setActiveOffer(activeOffer === offer.id ? null : offer.id)}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full glass flex items-center justify-center text-sm neon-border">{offer.fromFlag}</div>
                <div>
                  <div className="font-display text-sm font-bold text-white">{offer.from}</div>
                  <div className="font-mono text-[9px] text-gray-600">OFFERING</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-[9px] text-orange-400">{offer.timeLeft}</div>
                <div className="font-mono text-[8px] text-gray-600">REMAINING</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl p-2 text-center" style={{ background: `linear-gradient(135deg, rgba(15,21,32,0.8), rgba(26,34,53,0.8))`, border: `1px solid ${rarityColor[offer.offering.rarity]}` }}>
                <div className="text-xl mb-1">{offer.offering.flag}</div>
                <div className="font-display text-xs font-bold text-white leading-tight">{offer.offering.name}</div>
                <div className="font-mono text-[9px] mt-0.5" style={{ color: rarityColor[offer.offering.rarity] }}>{offer.offering.position} · {offer.offering.rating}</div>
                <RarityBadge rarity={offer.offering.rarity} />
              </div>
              <div className="text-center"><div className="font-mono text-xs neon-text">⇌</div><div className="font-mono text-[8px] text-gray-600">FOR</div></div>
              <div className="flex-1 rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.12)' }}>
                <div className="text-xl mb-1">{offer.wantingFlag}</div>
                <div className="font-display text-xs font-bold text-gray-400 leading-tight">WANTED</div>
                <div className="font-mono text-[9px] text-gray-600 mt-0.5">{offer.wanting}</div>
              </div>
            </div>
            {activeOffer === offer.id && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                <button className="py-2.5 rounded-xl font-display font-bold text-xs text-gray-900 bg-[#22c55e]" style={{ boxShadow: '0 0 12px rgba(34,197,94,0.4)' }}>✓ ACCEPT</button>
                <button className="py-2.5 rounded-xl font-display font-bold text-xs text-gray-400 glass neon-border">✕ DECLINE</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── NEW TRADE SCREEN ──────────────────────────────────────────────────────
function NewTradeScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedOffer, setSelectedOffer] = useState<PlayerCard | null>(null)
  const [wantRarity, setWantRarity] = useState<string>('')
  const [wantPosition, setWantPosition] = useState<string>('')
  const [wantCountry, setWantCountry] = useState<string>('')
  const [duration, setDuration] = useState<string>('24h')
  const [submitted, setSubmitted] = useState(false)

  const myCards = PLAYER_CARDS.filter(c => c.discovered)

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => { onBack() }, 2000)
  }

  if (submitted) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{ background: '#040710' }}>
        <div className="text-5xl mb-4 animate-float">🤝</div>
        <div className="font-display text-2xl font-black text-white mb-2">TRADE POSTED!</div>
        <div className="font-mono text-xs text-gray-500">Waiting for offers from scouts worldwide…</div>
        <div className="mt-6 w-32 h-1 rounded-full bg-gray-800 overflow-hidden">
          <div className="h-full neon-border animate-bar-fill" style={{ width: '100%', background: '#00d4ff' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: '#040710' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4 glass-strong border-b border-cyan-900/20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center neon-border">
            <span className="font-mono text-sm neon-text">‹</span>
          </button>
          <div>
            <h1 className="font-display text-xl font-black text-white">NEW TRADE</h1>
            <div className="font-mono text-xs text-gray-500">STEP {step} OF 3</div>
          </div>
        </div>

        {/* Step progress */}
        <div className="flex gap-2 mt-3">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full overflow-hidden bg-gray-800">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: step >= s ? '100%' : '0%', background: '#00d4ff', boxShadow: '0 0 6px rgba(0,212,255,0.5)' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* ── Step 1: Pick card to offer ── */}
        {step === 1 && (
          <div>
            <div className="font-mono text-[10px] text-gray-500 mb-3">SELECT CARD TO OFFER</div>
            <div className="space-y-2">
              {myCards.map(card => (
                <button
                  key={card.id}
                  onClick={() => setSelectedOffer(card)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 active:scale-98 text-left"
                  style={{
                    background: selectedOffer?.id === card.id ? `rgba(0,212,255,0.1)` : 'rgba(15,21,32,0.8)',
                    border: selectedOffer?.id === card.id ? '1px solid rgba(0,212,255,0.5)' : `1px solid ${rarityColor[card.rarity]}30`,
                    boxShadow: selectedOffer?.id === card.id ? '0 0 16px rgba(0,212,255,0.2)' : 'none',
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 relative overflow-hidden" style={{ background: `linear-gradient(135deg, #1a2235, #0f1520)`, border: `1px solid ${rarityColor[card.rarity]}50` }}>
                    <div className="absolute inset-0 map-grid opacity-30" />
                    <span className="relative z-10">{card.flag}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-display text-sm font-bold text-white">{card.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-gray-500">{card.country}</span>
                      <RarityBadge rarity={card.rarity} />
                    </div>
                  </div>
                  <div className="font-display text-xl font-black" style={{ color: rarityColor[card.rarity] }}>{card.rating}</div>
                  {selectedOffer?.id === card.id && <div className="text-[#00d4ff] text-lg">✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: What do you want ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="font-mono text-[10px] text-gray-500 mb-1">WHAT ARE YOU LOOKING FOR?</div>

            {/* Preview of offered card */}
            {selectedOffer && (
              <div className="glass rounded-xl p-3 flex items-center gap-3 mb-4" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
                <span className="text-2xl">{selectedOffer.flag}</span>
                <div>
                  <div className="font-mono text-[9px] text-gray-500">YOU'RE OFFERING</div>
                  <div className="font-display text-sm font-bold text-white">{selectedOffer.name}</div>
                </div>
                <div className="ml-auto font-display text-xl font-black" style={{ color: rarityColor[selectedOffer.rarity] }}>{selectedOffer.rating}</div>
              </div>
            )}

            <div>
              <div className="font-mono text-[10px] text-gray-600 mb-2">RARITY</div>
              <div className="flex gap-2 flex-wrap">
                {(['common', 'rare', 'epic', 'legendary'] as const).map(r => (
                  <button key={r} onClick={() => setWantRarity(wantRarity === r ? '' : r)}
                    className="px-3 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all duration-200"
                    style={wantRarity === r ? { background: rarityColor[r], color: '#080b14', boxShadow: `0 0 10px ${rarityColor[r]}` } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {rarityLabel[r]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] text-gray-600 mb-2">POSITION</div>
              <div className="flex gap-2 flex-wrap">
                {['ST', 'CF', 'LW', 'RW', 'CM', 'CAM', 'CDM', 'CB', 'LB', 'RB', 'GK'].map(pos => (
                  <button key={pos} onClick={() => setWantPosition(wantPosition === pos ? '' : pos)}
                    className="px-3 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all duration-200"
                    style={wantPosition === pos ? { background: '#00d4ff', color: '#080b14' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] text-gray-600 mb-2">NATIONAL TEAM</div>
              <div className="flex gap-2 flex-wrap">
                {[['🇧🇷', 'Brazil'], ['🇩🇪', 'Germany'], ['🇪🇸', 'Spain'], ['🇫🇷', 'France'], ['🇯🇵', 'Japan'], ['🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'England'], ['ANY', 'Any']].map(([flag, country]) => (
                  <button key={country} onClick={() => setWantCountry(wantCountry === country ? '' : country)}
                    className="px-3 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all duration-200 flex items-center gap-1"
                    style={wantCountry === country ? { background: '#00d4ff', color: '#080b14' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span>{flag}</span>{country !== 'Any' && <span>{country}</span>}
                    {country === 'Any' && <span>Any Team</span>}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] text-gray-600 mb-2">OFFER DURATION</div>
              <div className="flex gap-2">
                {['6h', '12h', '24h', '48h', '7d'].map(d => (
                  <button key={d} onClick={() => setDuration(d)}
                    className="flex-1 py-2 rounded-xl font-mono text-[10px] font-bold transition-all duration-200"
                    style={duration === d ? { background: '#00d4ff', color: '#080b14' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Review & confirm ── */}
        {step === 3 && selectedOffer && (
          <div className="space-y-4">
            <div className="font-mono text-[10px] text-gray-500 mb-1">REVIEW YOUR TRADE</div>

            {/* Trade visual summary */}
            <div className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(0,212,255,0.2)' }}>
              <div className="flex items-center gap-4">
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: `linear-gradient(135deg, rgba(15,21,32,0.8), rgba(26,34,53,0.8))`, border: `1px solid ${rarityColor[selectedOffer.rarity]}` }}>
                  <div className="text-2xl mb-1">{selectedOffer.flag}</div>
                  <div className="font-display text-xs font-bold text-white">{selectedOffer.name}</div>
                  <div className="font-mono text-[9px] mt-0.5" style={{ color: rarityColor[selectedOffer.rarity] }}>{selectedOffer.position} · {selectedOffer.rating}</div>
                  <div className="mt-1"><RarityBadge rarity={selectedOffer.rarity} /></div>
                </div>
                <div className="text-center flex flex-col items-center gap-1">
                  <div className="font-mono text-lg neon-text">⇌</div>
                  <div className="font-mono text-[8px] text-gray-600">FOR</div>
                </div>
                <div className="flex-1 rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                  <div className="text-2xl mb-1">{wantRarity ? { common: '⚪', rare: '🔵', epic: '🟣', legendary: '⭐' }[wantRarity] : '🎯'}</div>
                  <div className="font-display text-xs font-bold text-gray-300">WANTED</div>
                  <div className="font-mono text-[9px] text-gray-500 mt-0.5">{wantPosition || 'Any pos'}</div>
                  {wantRarity && <div className="mt-1"><RarityBadge rarity={wantRarity} /></div>}
                </div>
              </div>
            </div>

            {/* Summary details */}
            <div className="glass rounded-2xl p-4 space-y-2">
              {[
                ['OFFERING', `${selectedOffer.name} (${rarityLabel[selectedOffer.rarity]})`],
                ['LOOKING FOR', `${wantPosition || 'Any'} · ${wantRarity ? rarityLabel[wantRarity] : 'Any rarity'}`],
                ['NATIONAL TEAM', wantCountry || 'Any'],
                ['DURATION', duration],
                ['VISIBILITY', 'Public — worldwide'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-start justify-between py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span className="font-mono text-[10px] text-gray-600">{k}</span>
                  <span className="font-body text-xs font-bold text-white text-right max-w-[55%]">{v}</span>
                </div>
              ))}
            </div>

            <div className="glass rounded-xl p-3 flex items-start gap-2" style={{ border: '1px solid rgba(255,107,0,0.2)' }}>
              <span className="text-sm">⚠️</span>
              <p className="font-mono text-[9px] text-gray-500">Your card will be locked during the trade window. You can cancel anytime before it's accepted.</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action */}
      <div className="px-4 pb-8 pt-3 glass-strong border-t border-cyan-900/20">
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              className="flex-1 py-4 rounded-2xl font-display font-bold text-sm glass neon-border neon-text"
            >
              ← BACK
            </button>
          )}
          <button
            disabled={step === 1 && !selectedOffer}
            onClick={() => {
              if (step < 3) setStep((s) => (s + 1) as 1 | 2 | 3)
              else handleSubmit()
            }}
            className="flex-1 py-4 rounded-2xl font-display font-bold text-sm transition-all duration-200 disabled:opacity-40"
            style={{ background: '#00d4ff', color: '#080b14', boxShadow: '0 0 20px rgba(0,212,255,0.4)' }}
          >
            {step === 3 ? '🚀 POST TRADE' : 'NEXT →'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ACHIEVEMENTS SCREEN ───────────────────────────────────────────────────
function AchievementsScreen() {
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-12 pb-4 glass-strong border-b border-cyan-900/20">
        <h1 className="font-display text-xl font-black text-white">ACHIEVEMENTS</h1>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-1.5 rounded-full bg-gray-800">
            <div className="progress-bar h-full rounded-full" style={{ width: '33%' }} />
          </div>
          <span className="font-mono text-xs neon-text">2/6</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {ACHIEVEMENTS.map(ach => (
          <div key={ach.id} className="glass rounded-2xl p-4" style={{ border: ach.unlocked ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)', opacity: ach.unlocked ? 1 : 0.7 }}>
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: ach.unlocked ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.04)', border: ach.unlocked ? '1px solid rgba(255,215,0,0.4)' : '1px solid rgba(255,255,255,0.08)', boxShadow: ach.unlocked ? '0 0 16px rgba(255,215,0,0.3)' : 'none' }}>
                {ach.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-display text-sm font-bold text-white">{ach.title}</div>
                  <div className="font-mono text-[10px]" style={{ color: ach.unlocked ? '#ffd700' : '#6b7280' }}>+{ach.xp} XP</div>
                </div>
                <div className="font-mono text-[10px] text-gray-500 mt-0.5 mb-2">{ach.desc}</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-800">
                    <div className="h-full rounded-full animate-bar-fill" style={{ width: `${(ach.progress / ach.total) * 100}%`, background: ach.unlocked ? '#ffd700' : '#00d4ff', boxShadow: ach.unlocked ? '0 0 6px rgba(255,215,0,0.5)' : '0 0 6px rgba(0,212,255,0.5)' }} />
                  </div>
                  <span className="font-mono text-[9px] text-gray-600">{ach.progress}/{ach.total}</span>
                  {ach.unlocked && <span className="text-xs">✅</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── EDIT PROFILE SCREEN ───────────────────────────────────────────────────
function EditProfileScreen({ profile, onSave, onBack }: { profile: UserProfile; onSave: (p: UserProfile) => void; onBack: () => void }) {
  const [form, setForm] = useState<UserProfile>({ ...profile })
  const [saved, setSaved] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  const set = (key: keyof UserProfile, val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  const handleSave = () => {
    setSaved(true)
    onSave(form)
    setTimeout(() => { setSaved(false); onBack() }, 1200)
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: '#040710' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-4 glass-strong border-b border-cyan-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 rounded-xl glass flex items-center justify-center neon-border">
              <span className="font-mono text-sm neon-text">‹</span>
            </button>
            <div>
              <h1 className="font-display text-xl font-black text-white">EDIT PROFILE</h1>
              <div className="font-mono text-xs text-gray-500">CUSTOMIZE YOUR IDENTITY</div>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl font-display font-bold text-xs text-gray-900 transition-all duration-200"
            style={{ background: saved ? '#22c55e' : '#00d4ff', boxShadow: `0 0 16px ${saved ? 'rgba(34,197,94,0.4)' : 'rgba(0,212,255,0.4)'}` }}
          >
            {saved ? '✓ SAVED' : 'SAVE'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {/* Avatar picker */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => setAvatarOpen(!avatarOpen)}
            className="w-20 h-20 rounded-full flex items-center justify-center text-4xl animate-pulse-glow relative"
            style={{ background: 'linear-gradient(135deg, #0f1520, #1a2235)', border: '2px solid rgba(0,212,255,0.5)' }}
          >
            {form.avatar}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-400 flex items-center justify-center text-[10px] font-bold text-black">✏</div>
          </button>
          <div className="font-mono text-[9px] text-gray-600">TAP TO CHANGE AVATAR</div>
          {avatarOpen && (
            <div className="grid grid-cols-5 gap-2 w-full">
              {AVATARS.map(av => (
                <button
                  key={av}
                  onClick={() => { set('avatar', av); setAvatarOpen(false) }}
                  className="h-12 rounded-xl flex items-center justify-center text-2xl transition-all duration-150 active:scale-90"
                  style={{
                    background: form.avatar === av ? 'rgba(0,212,255,0.2)' : 'rgba(255,255,255,0.04)',
                    border: form.avatar === av ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {av}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Username */}
        <div>
          <div className="font-mono text-[10px] text-gray-600 mb-2">USERNAME</div>
          <input
            value={form.username}
            onChange={e => set('username', e.target.value)}
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl font-display text-sm font-bold text-white outline-none transition-all duration-200"
            style={{
              background: 'rgba(15,21,32,0.9)',
              border: '1px solid rgba(0,212,255,0.25)',
              caretColor: '#00d4ff',
            }}
            placeholder="Your scout name…"
          />
          <div className="font-mono text-[9px] text-gray-700 mt-1 text-right">{form.username.length}/20</div>
        </div>

        {/* Bio */}
        <div>
          <div className="font-mono text-[10px] text-gray-600 mb-2">BIO</div>
          <textarea
            value={form.bio}
            onChange={e => set('bio', e.target.value)}
            maxLength={80}
            rows={3}
            className="w-full px-4 py-3 rounded-xl font-body text-sm text-white outline-none resize-none transition-all duration-200"
            style={{
              background: 'rgba(15,21,32,0.9)',
              border: '1px solid rgba(0,212,255,0.2)',
              caretColor: '#00d4ff',
            }}
            placeholder="Tell the world who you are…"
          />
          <div className="font-mono text-[9px] text-gray-700 mt-1 text-right">{form.bio.length}/80</div>
        </div>

        {/* Region */}
        <div>
          <div className="font-mono text-[10px] text-gray-600 mb-2">REGION</div>
          <div className="flex gap-2 flex-wrap">
            {REGIONS.map(r => (
              <button
                key={r}
                onClick={() => set('region', r)}
                className="px-3 py-1.5 rounded-full font-mono text-[10px] font-bold transition-all duration-200"
                style={form.region === r ? { background: '#00d4ff', color: '#080b14' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Game Mode */}
        <div>
          <div className="font-mono text-[10px] text-gray-600 mb-2">GAME MODE</div>
          <div className="grid grid-cols-2 gap-2">
            {GAME_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => set('gameMode', mode)}
                className="py-3 rounded-xl font-display text-xs font-bold transition-all duration-200"
                style={form.gameMode === mode ? {
                  background: 'rgba(0,212,255,0.15)',
                  border: '1px solid rgba(0,212,255,0.5)',
                  color: '#00d4ff',
                  boxShadow: '0 0 12px rgba(0,212,255,0.2)',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#6b7280',
                }}
              >
                {mode === 'Explorer' ? '🗺️' : mode === 'Collector' ? '🃏' : mode === 'Trader' ? '⇌' : '🏆'} {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div>
          <div className="font-mono text-[10px] text-gray-600 mb-2">PROFILE VISIBILITY</div>
          <div className="flex gap-2">
            {(['Public', 'Friends', 'Private'] as const).map(p => (
              <button
                key={p}
                onClick={() => set('privacy', p)}
                className="flex-1 py-2.5 rounded-xl font-mono text-[10px] font-bold transition-all duration-200"
                style={form.privacy === p ? { background: '#00d4ff', color: '#080b14' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {p === 'Public' ? '🌍' : p === 'Friends' ? '👥' : '🔒'} {p}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications toggle */}
        <div className="glass rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <div>
              <div className="font-display text-sm font-bold text-white">Notifications</div>
              <div className="font-mono text-[9px] text-gray-600">Trade offers, discoveries, signals</div>
            </div>
          </div>
          <button
            onClick={() => set('notifications', !form.notifications)}
            className="w-12 h-6 rounded-full transition-all duration-300 relative"
            style={{ background: form.notifications ? '#00d4ff' : 'rgba(255,255,255,0.1)', boxShadow: form.notifications ? '0 0 10px rgba(0,212,255,0.4)' : 'none' }}
          >
            <div
              className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300"
              style={{ left: form.notifications ? 'calc(100% - 20px)' : '4px' }}
            />
          </button>
        </div>

        {/* Danger zone */}
        <div className="glass rounded-2xl p-4 space-y-2" style={{ border: '1px solid rgba(255,107,0,0.2)' }}>
          <div className="font-mono text-[10px] text-orange-600 mb-2">DANGER ZONE</div>
          <button className="w-full py-3 rounded-xl font-display font-bold text-xs text-orange-400" style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}>
            RESET COLLECTION
          </button>
          <button className="w-full py-3 rounded-xl font-display font-bold text-xs text-red-400" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            DELETE ACCOUNT
          </button>
        </div>
        <div className="h-4" />
      </div>
    </div>
  )
}

// ── PROFILE SCREEN ────────────────────────────────────────────────────────
function ProfileScreen({ profile, onEditProfile }: { profile: UserProfile; onEditProfile: () => void }) {
  const nationalTeams = Array.from(new Set(PLAYER_CARDS.filter(c => c.discovered).map(c => c.country)))

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Hero */}
        <div className="relative px-4 pt-12 pb-6" style={{ background: 'linear-gradient(180deg, #0d1a2e 0%, #080b14 100%)' }}>
          <div className="absolute inset-0 map-grid opacity-30" />
          <div className="absolute top-0 left-0 right-0 h-32" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.12), transparent)' }} />

          {/* Edit button */}
          <button
            onClick={onEditProfile}
            className="absolute top-12 right-4 z-10 px-3 py-1.5 rounded-xl glass neon-border font-mono text-[10px] neon-text"
          >
            ✏ EDIT
          </button>

          <div className="relative flex flex-col items-center">
            <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center text-4xl animate-pulse-glow" style={{ background: 'linear-gradient(135deg, #0f1520, #1a2235)', border: '2px solid rgba(0,212,255,0.5)' }}>
              {profile.avatar}
            </div>
            <div className="font-display text-2xl font-black text-white">{profile.username}</div>
            <div className="font-mono text-xs text-gray-500 mt-0.5">JOINED SEPT 2024 · {profile.division.toUpperCase()}</div>
            {profile.bio && <div className="font-body text-sm text-gray-400 mt-2 text-center max-w-xs">{profile.bio}</div>}
            <div className="flex gap-4 mt-4">
              {[['RANK', '#847'], ['LEVEL', '23'], ['CARDS', `${PLAYER_CARDS.filter(c => c.discovered).length}`], ['TRADES', '12']].map(([label, value]) => (
                <div key={label} className="text-center">
                  <div className="font-display text-lg font-black neon-text">{value}</div>
                  <div className="font-mono text-[9px] text-gray-600">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* National teams */}
        <div className="px-4 py-4">
          <div className="font-mono text-[10px] text-gray-600 mb-3">NATIONAL TEAMS ({nationalTeams.length})</div>
          <div className="flex gap-2 flex-wrap">
            {nationalTeams.map(country => {
              const cards = PLAYER_CARDS.filter(c => c.country === country)
              return (
                <div key={country} className="glass rounded-xl px-3 py-2 flex items-center gap-2" style={{ border: '1px solid rgba(0,212,255,0.15)' }}>
                  <span className="text-base">{cards[0]?.flag}</span>
                  <div>
                    <div className="font-display text-xs font-bold text-white">{country}</div>
                    <div className="font-mono text-[9px] text-gray-600">{cards.filter(c => c.discovered).length} CARDS</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Featured card */}
        <div className="px-4 py-2">
          <div className="font-mono text-[10px] text-gray-600 mb-3">FEATURED CARD</div>
          <div className="w-48"><CardFace card={PLAYER_CARDS[0]} /></div>
        </div>

        {/* Settings quick links */}
        <div className="px-4 py-4 space-y-2 pb-32">
          <div className="font-mono text-[10px] text-gray-600 mb-2">SETTINGS</div>
          {[
            { icon: '🔔', label: 'Notifications', value: profile.notifications ? 'ON' : 'OFF' },
            { icon: '🌍', label: 'Region', value: profile.region },
            { icon: '🎮', label: 'Game Mode', value: profile.gameMode },
            { icon: '🔒', label: 'Privacy', value: profile.privacy },
          ].map(item => (
            <button key={item.label} onClick={onEditProfile} className="w-full glass rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="font-body text-sm text-white">{item.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs neon-text">{item.value}</span>
                <span className="text-gray-600 text-xs">›</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TAB BAR ───────────────────────────────────────────────────────────────
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'map', icon: '🗺️', label: 'MAP' },
  { id: 'collection', icon: '🃏', label: 'CARDS' },
  { id: 'trades', icon: '⇌', label: 'TRADES' },
  { id: 'achievements', icon: '🏆', label: 'ACHIEVE' },
  { id: 'profile', icon: '👤', label: 'PROFILE' },
]

// ── ROOT APP ──────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [screen, setScreen] = useState<Screen>({ id: 'main' })
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE)

  const isFullScreen = screen.id !== 'main'

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{ width: '100%', maxWidth: 390, height: '100dvh', minHeight: 700, background: '#080b14', fontFamily: "'Rajdhani', sans-serif" }}
    >
      {/* Main tab content */}
      <div className={`absolute inset-0 bottom-16 transition-opacity duration-200 ${isFullScreen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {activeTab === 'map' && <MapScreen />}
        {activeTab === 'collection' && (
          <CollectionScreen onCardDetail={card => setScreen({ id: 'cardDetail', card })} />
        )}
        {activeTab === 'trades' && (
          <TradesScreen onNewTrade={() => setScreen({ id: 'newTrade' })} />
        )}
        {activeTab === 'achievements' && <AchievementsScreen />}
        {activeTab === 'profile' && (
          <ProfileScreen
            profile={profile}
            onEditProfile={() => setScreen({ id: 'editProfile' })}
          />
        )}
      </div>

      {/* Full-screen overlays */}
      {screen.id === 'cardDetail' && screen.card && (
        <CardDetailScreen
          card={screen.card}
          onBack={() => setScreen({ id: 'main' })}
          onTrade={() => { setScreen({ id: 'newTrade' }); setActiveTab('trades') }}
        />
      )}
      {screen.id === 'newTrade' && (
        <NewTradeScreen onBack={() => setScreen({ id: 'main' })} />
      )}
      {screen.id === 'editProfile' && (
        <EditProfileScreen
          profile={profile}
          onSave={p => setProfile(p)}
          onBack={() => setScreen({ id: 'main' })}
        />
      )}

      {/* Tab bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 glass-strong flex items-stretch"
        style={{ borderTop: '1px solid rgba(0,212,255,0.12)', zIndex: isFullScreen ? 0 : 30 }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setScreen({ id: 'main' }) }}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 pt-1 ${activeTab === tab.id && !isFullScreen ? 'tab-active' : ''}`}
          >
            <span className="text-base leading-none">{tab.icon}</span>
            <span className="font-mono text-[8px] font-bold" style={{ color: (activeTab === tab.id && !isFullScreen) ? '#00d4ff' : '#4b5563' }}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

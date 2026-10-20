# Kartaz

Multiplayer mobile map exploration game with collectible football cards, built in React Native, with an authoritative real-time server (Colyseus + H3), MVVM architecture and game rules in pure functions.

[Português](README.md) · **English** · [How to play](How_To_Play.md)

![Expo](https://img.shields.io/badge/Expo-57-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Reanimated](https://img.shields.io/badge/Reanimated-4.5-001A72)
![Colyseus](https://img.shields.io/badge/Colyseus-0.17-F0503C)
![H3](https://img.shields.io/badge/H3-4.5-1F7A8C)

> ⚠️ **Educational, non-profit project.** The cards use names and images based on photos of **real people** (football players). That's why Kartaz exists only as a study and portfolio project: it isn't sold, has no ads or real purchases, makes no money and won't be published on app stores. Read the [Legal notice](#legal-notice).

## About the Project

Kartaz is a Pokémon GO-style game without augmented reality: the player "walks" by dragging the map, finds cards, coins, batteries and flags, builds a collection, picks a team of 5 starters and trades cards with other players in real time.

- **Unique cards:** each card is a numbered copy of a player (`669 / 1000`), with at most one owner. The catalog has 1,000 players.
- **A live, shared map:** the world is split into H3 cells. Each area has its own real-time room, with the other players, the items and a discovery flag.
- **Server-side economy:** energy, XP, level, pickups, cards and trades are decided by the backend. The app only sends intents.
- **Team chemistry:** bonuses for starters from the same national team and the same club, with an "Auto" button that finds the best lineup.
- **N × M trades** with acceptance in an atomic transaction and a local notification.
- **Three languages:** Portuguese, English and Spanish.

The full rules, from the player's point of view, are in [How to play](How_To_Play.md).

The project was a deliberate exercise in **authoritative multiplayer on mobile**. A map with items is simple while there's only one player. It gets hard when several people look at the same area at the same time: everyone must see the same cards, only one person can pick up each one, and whoever crosses from one area to another can't fall into a "gap" with no room. Almost every decision below comes from that problem.

## Stack

### App (`mobile/Kartazapp`)

| Technology | Version | Role in the project |
|------------|---------|---------------------|
| React Native | 0.86 | App foundation |
| Expo | ~57.0.26 | Platform and build (Continuous Native Generation) |
| Expo Router | ~57.0.24 | File-based routes, with typed routes |
| TypeScript | ~6.0 | Strict typing, including the View ↔ ViewModel contract |
| React Compiler | — | Automatic memoization |
| Reanimated | 4.5 | Animations on the UI thread |
| React Native Skia / SVG | 2.6 / 15 | Glows, gradients and card art |
| react-native-maps | 1.27 | Google map with a dark style |
| TanStack Query | 5 | REST API data, caching and pagination |
| @colyseus/sdk | 0.17 | Real-time room |
| h3-js | 4.5 | Hexagonal geographic grid |
| expo-sqlite | ~57.0 | Offline player catalog |
| i18next | 26 | Portuguese, English and Spanish |

### Backend (Rocketseat)

| Technology | Role in the project |
|------------|---------------------|
| Fastify | REST API (auth, user, players, trades, wallet, team) |
| Colyseus 0.17 | Real-time rooms, one per H3 cell |
| Prisma 7 + PostgreSQL | Persistence |
| h3-js | Rooms, collision and pickups |
| Custom JWT | Guest, Google and Apple, with refresh tokens |

## Technical Decisions

### One room per hexagon

The world is an H3 grid at three resolutions, each with its own job:

| Resolution | Role |
|---|---|
| **8** | Colyseus room (the game's "area") |
| **9** | Player cell and card visibility |
| **12** | Collision: picking up an item means being in the same res 12 cell |

The app connects **only to the current cell's room**. Nothing from other rooms reaches the phone, so traffic doesn't grow with the size of the world. Neighboring rooms (the k1 ring) stay on standby on the server, ready for the switch.

### Gap-free handoff between rooms

Crossing a hexagon's border means switching rooms. If the app left the old room before joining the new one, there would be a moment when the player exists nowhere. The order is reversed: the server sends `changeRoom`, the app joins the new room and **only then** confirms `switchedRoom` on the old one.

```ts
// mobile/Kartazapp/src/hooks/use-cell-room/use-cell-room.ts
const changeRoom = useCallback(async (room: Room, message: ChangeRoomMessage) => {
  if (switchingRef.current) return;
  switchingRef.current = true;
  try {
    const next = await joinRef.current({ fuel: message.fuel, xp: message.xp, level: message.level });
    // Só libera a sala antiga depois de estar na nova (o servidor então remove o jogador dela).
    if (next) room.send('switchedRoom', { handoffId: message.handoffId });
  } finally {
    switchingRef.current = false;
  }
}, []);
```

During the switch, both rooms are alive for a moment. That's why each subscription checks it's still the current room, so a late patch from the old room can't overwrite the new room's state:

```ts
room.onStateChange((state) => {
  if (roomRef.current !== room) return;
  applyState(state, room.sessionId, profileRef.current?.userId ?? '');
});
```

### Deterministic draws: everyone sees the same cards

Each area's cards are drawn in 15-minute windows. Instead of storing the result, the draw is **a function of the cell and the window**: a seed made of both always produces the same number, on any server instance.

```js
// backend/src/services/cellRoomCardService.js
function roomCardCountInWindow(roomCell, nowMs = Date.now()) {
  if (!roomCell) return 0;
  const roll = createSeededRng(`cardwindow:${String(roomCell)}:${currentCardWindow(nowMs)}`)();
  const tier = getCardSpawnConfig().roomCardCountChances.find(({ chance }) => roll < chance);
  return tier ? tier.count : 0;
}
```

The chances are cumulative (≥1 card 30%, ≥2 15%, ≥3 5%, 5 cards 1%), so 70% of windows are empty, which is what makes finding a card feel valuable.

### Atomic pickup: one owner per card

Two players can walk over the same card in the same frame. Pickup doesn't read and then write: it's a single `updateMany` conditioned on the expected state. If another transaction got there first, `count` comes back 0 and the second player gets `collectCardRejected`.

```js
// backend/src/colyseus/cards/cardRoomRuntime.js
const updated = await tx.instance.updateMany({
  where: {
    id: String(cardInstanceId),
    reservedByRoomId: String(room.roomId),
    ownerId: null,
    foundWhen: null,
  },
  data: {
    ownerId: String(user.id),
    reservedByRoomId: null,
    foundWhen: new Date(),
    foundWhereLat: Number(user.lat ?? 0),
    foundWhereLng: Number(user.lng ?? 0),
  },
});
```

The room's **reservation** of a card follows the same pattern. Before, several rooms drawing at the same time grabbed the same copies from the pool, and pickup failed later. On startup, the server also returns to the pool the reservations of rooms that no longer exist; otherwise those cards would be stuck forever.

### Level is derived, never stored

Level isn't a column: it's always computed from total XP, with a power curve configurable through environment variables.

```js
// backend/src/rules/levelRules.js
function xpToNextLevel(level) {
  const l = Math.max(1, Math.floor(Number(level) || 1));
  return Math.round((LEVEL_XP_BASE * l ** LEVEL_XP_EXPONENT) / 10) * 10;
}
```

With the defaults (100 and 1.5): 1→2 = 100 XP, 5→6 = 1,120, 10→11 = 3,160. Changing the curve rebalances every player at once, with no migration. The same goes for the game's other numbers: energy, radar, chances and prices have defaults in code and can be overridden in `.env`.

### Best lineup through a pruned exhaustive search

Team overall is `sum × (1 + bonus%)`, and the bonus stacks: each national team and each club with 2 or more starters adds its own. That makes "pick the top 5" wrong, because a weaker player can be worth more for chemistry. The "Auto" button tests every combination of 5, but over a pruned set: the top 25 overall plus the best from each national team and each club, capped at 45 cards.

```ts
// mobile/Kartazapp/src/lib/team/team-scoring.ts
/** Melhores no geral que entram na busca. */
const TOP_OVERALL = 25;
/** Por seleção e por clube, os melhores que entram (para achar combinações com bônus). */
const TOP_PER_GROUP = LINEUP_SIZE;
/** Teto da busca: C(45, 5) ≈ 1,2 milhão de combinações, rápido o bastante no aparelho. */
const MAX_POOL = 45;
```

The same `computeTeamScore` function exists on the backend, which saves the official value. In the app, it powers the preview while swapping starters.

### Offline catalog, online progress

The 1,000-player catalog ships as a `.json.gz` bundled in the app and is imported into SQLite on first launch. The collection opens instantly, with search and filters, without a network. The app syncs the catalog version every 6 hours and card progress (how many copies have been found) every minute.

### An accepted trade-off

The rules the app needs to know (max energy, radar cost, bonus tables) are **duplicated** in `lib/game/rules.ts`, mirroring the backend. It works because the server always decides, so the worst case of a mismatch is a wrong preview, never a broken rule. Even so, it's a silent source of bugs. The right fix is a `/config` route the app reads on startup, and it's on the next steps list.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) 20 or later
- [Docker](https://www.docker.com/) (for PostgreSQL)
- [Xcode](https://developer.apple.com/xcode/) (iOS, macOS only) or [Android Studio](https://developer.android.com/studio)
- A [Google Maps Platform](https://developers.google.com/maps) key

### 1. Backend

The backend is Rocketseat's [go-rocket-league-backend](https://github.com/rocketseat-education/go-rocket-league-backend) and is not part of this repository. It needs PostgreSQL and a `.env` with at least `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `JWT_SECRET` and `ADMIN_API_TOKEN`.

```bash
node --env-file=.env src/server.js
```

Colyseus owns port 3000 and forwards HTTP requests to Fastify.

### 2. Player database

**This repository doesn't include any player database or photos.** The app expects the file `mobile/Kartazapp/assets/data/players-initial.json.gz`, which is in `.gitignore`. To generate it:

1. Import the players into the backend through the admin route `POST /admin/players/import-csv`, using a CSV you have the right to use.
2. Generate the exported version: `POST /admin/players/generate-version`.
3. Copy it to the app, from `mobile/Kartazapp`: `npm run seed:copy`.

More details in [`mobile/Kartazapp/assets/data/README.md`](mobile/Kartazapp/assets/data/README.md).

### 3. App

```bash
cd mobile/Kartazapp
npm install
cp .env.example .env.local   # fill in the variables
npx expo run:ios --device    # or: npx expo run:android
```

| Variable | What it's for |
|---|---|
| `GOOGLE_MAPS_API_KEY` | Google Maps key |
| `EXPO_PUBLIC_API_BASE_URL` | Backend address. In development, `localhost` is automatically replaced with the computer's IP, so it works on a phone |
| `EXPO_PUBLIC_ADMIN_API_KEY` | Same as the backend's `ADMIN_API_TOKEN`. **Development only**: `EXPO_PUBLIC_*` variables are bundled into the app |
| `EXPO_PUBLIC_PLAYER_IMAGE_BASE_URL` | Optional. Photo server (`<base>/p<id>.webp`). Without it, cards show the default background. **Only use images you have the right to use** |
| `EXPO_PUBLIC_H3_RES_USER_CELL` / `EXPO_PUBLIC_H3_RES_ROOM_CELL` | H3 resolutions (default 9 and 8), same as the backend |

The project uses a native build (`expo run:*`), not Expo Go. The `ios/` and `android/` folders are generated: to apply `app.config.ts` changes, delete the folder and build again. The app was tested on an iPhone with a **free Apple account**, which is why it uses local notifications only (no remote push).

## Architecture in Detail

### MVVM on every screen

Routes in `src/app/` are one line each and re-export the screen:

```tsx
// src/app/(tabs)/map.tsx — the whole file
export { default } from '@/screens/map';
```

Each screen in `src/screens/<screen>/` is a trio:

- **`use-view-model.ts`:** state, queries, mutations, rules, navigation and handlers. No JSX.
- **`view.tsx`:** UI only. Gets everything through props; doesn't call the API, `router` or `toast`.
- **`index.tsx`:** `const vm = useXViewModel(); return <XView {...vm} />`.

Components with their own logic (pack modal, refuel modal, collection filters, trade proposal card, social login buttons) follow the same trio in a folder. Purely visual components stay in a single file. The map's view model, the biggest in the app, was split into smaller hooks.

### Real-time room as a hook

`hooks/use-cell-room/` holds everything Colyseus:

| File | Responsibility |
|---|---|
| `use-cell-room.ts` | Connection, room handoff, reconnection with backoff (1 s → 15 s) and leaving in the background |
| `use-room-state.ts` | The room's visible state, with subscriptions to avoid re-renders |
| `room-messages.ts` | Server messages (pack, pickup, trade accepted, move rejected) |

Pure functions live in `lib/colyseus/cell-state.ts`. Requests that expect a reply (radar, buying energy) go through `room-request.ts`: one at a time, bound to the room they were sent in, with a 10 s timeout.

### Explore Mode

Explore Mode turns on at zoom ≥ 18. Only then does the app connect to the room, and dragging the map becomes walking: the player's position is the center of the screen, and the distance walked uses energy and gives XP on the server. Zoomed out, the map is free, with no data and no energy cost. Out of energy, the server replies `moveRejected` and the map snaps back to the last accepted position.

### No loose colors or numbers

- **Colors** only from `src/theme/`. `base-colors.json` is read by the theme and by `app.config.ts` (splash and Android icon), so the background is the same from launch to every screen.
- **`game-colors.ts`:** colors by rarity, serial class, trade status and area difficulty.
- **`lib/game/rules.ts`:** rules mirrored from the backend.
- **`lib/query/config.ts`** and **`lib/storage/keys.ts`:** `staleTime`, page size, search debounce and SecureStore keys.

<details>
<summary><b>Rarity and serial class: two independent axes</b></summary>

**Rarity** comes from the player (overall): legendary ≥ 90, epic ≥ 87, rare ≥ 84, otherwise common. **Serial class** comes from the copy: #1 and the last one are **extreme** (gold), the first ones up to max(3, 1% of the print run) are **elite** (purple), and the rest are **standard** (blue).

So a common card `1 / 1000` is still special. The class is computed on the server and drives the border, badge and glow of `CardReveal`, the face-down card component with a 3D flip.

</details>

<details>
<summary><b>Atomic trades</b></summary>

A proposal is N of my cards for M of another player's cards, with no coins, and goes through the statuses `PENDING`, `ACCEPTED`, `DECLINED` and `CANCELLED`. Starters can't be offered.

Acceptance swaps every owner in a single transaction. The proposer is notified through the room (`tradeAccepted` via `sendToUser`) and, if the app was closed, it checks accepted trades when it comes back, with a "seen" marker in SecureStore so it doesn't notify twice.

</details>

<details>
<summary><b>Packs unlocked by movement</b></summary>

The welcome pack (5 cards, creates the team) and the daily pack (2 cards every 24 h) don't arrive when joining the room, but **after walking 10 meters**. That way the pack never lands on top of the map's entrance animation, and someone who just opens the app without playing gets nothing. The modal reveals the cards one by one.

</details>

<details>
<summary><b>Notifications without remote push</b></summary>

The `expo-notifications` plugin in `app.json` enables the `aps-environment` entitlement, which breaks the build on a free Apple account. `app.config.ts` has its own plugin, `withoutRemotePush`, that removes this permission when generating the iOS project. The app uses local notifications only.

</details>

<details>
<summary><b>Custom toast</b></summary>

The toast system has variants and gestures: swiping sideways or up dismisses, pulling down pins it. State lives in a minimal store in `lib/toast/`, called by view models and never by views.

</details>

## Project Structure

```
Kartaz/
├── mobile/Kartazapp/          # Expo app
│   └── src/
│       ├── app/               # Expo Router routes: (tabs), card/[id], trades/new...
│       ├── screens/           # MVVM screens (view model + view + index)
│       ├── components/        # By domain (cards, map, hud, team, trades...) and ui/
│       ├── hooks/             # queries/ (React Query), use-cell-room/ (Colyseus)
│       ├── lib/               # api, auth, colyseus, db (SQLite), game, h3, sync, team...
│       ├── theme/             # Colors, spacing, motion and map styles
│       └── i18n/              # pt, en, es
├── UI_REACT_para_referencia/  # UI prototype used as a visual reference
├── Como_jogar.md / How_To_Play.md
└── LICENSE
```

The backend (`backend/`) is Rocketseat's project and is in this repository's `.gitignore`.

## Features

- **Sign in** as a guest, with Google or with Apple, and link the account later
- **Onboarding** carousel on first launch
- **Multiplayer map** with rooms per hexagon, "Nearby" (players in the area and neighbors) and room handoff
- **Explore Mode**: walk by dragging the map, with energy and XP computed on the server
- **Cards on the map** with a deterministic draw per area every 15 minutes
- **Coins and batteries** picked up automatically by walking over them
- **Discovery flags**: the first to arrive becomes the area owner and earns XP
- **Radar** paid with energy, revealing every card in the area
- **Welcome and daily packs**, revealed card by card
- **Level curve** with level derived from XP
- **Offline collection** as a grid, list or by national team, and **My Collection** with filters
- **Card details** with animated stats, copy data and global discovery
- **Team of 5 starters** with national team and club bonuses and automatic lineup
- **N × M trades** with atomic acceptance and a local notification
- **Profile** with avatar, bio and stats
- **i18n** in Portuguese, English and Spanish

## Next Steps

Known gaps and ideas for the future:

- **PvP battles between players.** The backend already has the groundwork (`BattleChallenge`, the `/battles` and `/battle-tiers` routes, team battle settings), but the app has no screen yet. The idea is to challenge another player in the same area and compare teams, with overall and chemistry deciding the result and coins or XP as the reward.
- **Server-side speed validation.** Today the server charges energy for distance but doesn't limit speed between moves. A meters-per-second cap prevents crossing rooms too fast (with a script or a finger) to farm items, which is essential before opening the game to more people.
- **Tests.** The pure functions (`cell-state`, `room-request`, `team-scoring`, `player-row-mapper`) are ready for Jest with `jest-expo`.
- **`/config` route.** The backend sends the game rules to the app, removing the duplication in `lib/game/rules.ts`.
- **Real achievements and stats.** Some of the profile numbers and the Achievements tab are still mocked.
- **Daily missions**, as a source of energy and coins for players with no battery nearby, since time-based refill is turned off.
- **Team leaderboard** in the app. The backend already has `/teams/leaderboard`.
- **Business rules in `services/`** on the backend, moving the logic still inside `teamRoutes.js` and `userRoutes.js`.
- **Up-to-date, distributable Android build.**

## Legal notice

- **Non-profit, educational only.** Kartaz is a study and portfolio project. Because it uses names and images derived from photos of **real people**, it isn't sold, has no ads or real purchases, makes no money and won't be published on app stores. In-game "coins" are fictional.
- **Images.** Player photos are stylized with the AnimeGANv2 model, whose license is also non-commercial. No photo, original or stylized, is in this repository.
- **No affiliation.** This project is **not affiliated with, sponsored or endorsed** by Electronic Arts (EA), EA SPORTS FC, FIFA, FIFPRO, any league, club, national team or player.
- **Trademarks and names.** Names of players, clubs, national teams and competitions belong to their respective owners and appear here only to identify game elements, without implying any partnership.
- **Data is not distributed.** This repository **does not contain** the player database (names, ratings, attributes). Anyone running the project is responsible for using only data and images they have the right to use.
- **Content removal.** If you hold any rights and want something removed or changed, open an [issue](https://github.com/EnzoFelyx/Kartaz/issues) and I'll handle it promptly.

## Credits

**[Rocketseat](https://www.rocketseat.com.br)**, for the course and the **Go Rocket League** project this work is based on:

- The [go-rocket-league-backend](https://github.com/rocketseat-education/go-rocket-league-backend) backend, used by this app.
- Ported and adapted from the course's mobile project: the local SQLite database (`src/lib/db`) and the initial import (`src/lib/sync/seedFromBundle.ts`), server sync (`src/lib/sync/players-sync.ts`), the grid-mode card, the card art with the loading shimmer, the details screen entrance animation and the country-to-emoji-flag mapping (`src/utils/flags.ts`).
- Card background images: `assets/images/bg-card.png` and `assets/images/bg-card-details.png`.

**UI prototype:** created with [Figma Make](https://www.figma.com/make/) (the `UI_REACT_para_referencia` folder) and used as a visual reference.

**Map:** [Google Maps Platform](https://developers.google.com/maps), via `react-native-maps`, subject to the [Google Maps Terms of Service](https://cloud.google.com/maps-platform/terms).

**Geographic grid:** [H3](https://h3geo.org/), by Uber (Apache-2.0).

**Flags:** Unicode standard emojis, rendered with the system font.

The libraries used (Expo, React Native, TanStack Query, Reanimated, Gesture Handler, Skia, react-native-svg, react-native-maps, i18next, pako, Colyseus, Fastify) are MIT; Prisma and h3-js are Apache-2.0. Each remains under its own license. The `create-expo-app` starter files remain under Expo's MIT license, in [`mobile/Kartazapp/LICENSE-expo-template`](mobile/Kartazapp/LICENSE-expo-template).

## License

**© 2026 Enzo Felix.** Code licensed under the [MIT license](LICENSE): you may use, copy and modify it, **as long as you keep the copyright notice and the license text**. The license covers only the author's original work. Third-party content listed in [Credits](#credits) and the names, trademarks, data and images of players, clubs and competitions are not covered by it.

## Author

**Enzo Felix** — Mobile Developer

[GitHub](https://github.com/EnzoFelyx) · [LinkedIn](https://www.linkedin.com/in/enzofelyx/) · [enzofelyx@gmail.com](mailto:enzofelyx@gmail.com)

---

Built from Rocketseat's Go Rocket League project ([Rocketseat](https://www.rocketseat.com.br/)).

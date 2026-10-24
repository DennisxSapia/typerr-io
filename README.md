# typerr.io

An arcade typing game for the browser. Players type the characters of a level against a running timer; every correct key adds time, every mistake ends the run. Runs are recorded and can be replayed or raced against as a ghost.

**Live:** https://typerr.io

<!-- TODO: replace with a screenshot or GIF of a running level -->
![Screenshot](docs/screenshot.png)

## Features

- **Level modes:** classic levels with increasing speed, word-based levels, unlockable levels, a weekly event level and a marathon mode across all classic levels
- **Direction tokens:** `[LEFT]` / `[RIGHT]` tokens in the text require the arrow keys to dodge walls
- **Combos and time bonus:** each correct key extends the timer and raises the combo counter
- **Replays and ghosts:** every run is stored as keystroke timings; it can be watched as a replay or raced against as a ghost
- **Community levels:** players create levels from a seed, title, length and speed; others play them with their own leaderboard
- **Multiplayer:** online player list, challenges and 1-vs-1 races via Supabase Realtime
- **Accounts:** sign-up, XP and levels, daily quests, public profiles, account deletion
- **Leaderboards** per level, language (DE/EN) and device type (desktop/mobile)
- German and English interface, on-screen keyboard for mobile devices

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling / animation | Tailwind CSS v4, Motion |
| Backend | Supabase: PostgreSQL, Auth, Row Level Security, Realtime, Edge Functions (Deno) |
| Tests | Vitest |
| Hosting | Static build (`dist/`) on Hostinger |

## Architecture

```
Browser (React SPA)
 ├─ src/App.tsx               game state, input handling, timer, replay/ghost playback
 ├─ src/components/           menus, leaderboards, account, multiplayer UI
 └─ src/lib/
     ├─ supabase.ts           data access (leaderboards, level times, users, community levels)
     ├─ replay.ts             replay encoding
     ├─ communityLevels.ts    seeded level generator
     ├─ levels.ts             level definitions and weekly event
     ├─ quests.ts             daily quests
     └─ useMultiplayer.ts     Realtime channels for challenges and races
        │
        ▼
Supabase
 ├─ PostgreSQL + RLS          all tables are read/written directly by the client, guarded by RLS
 └─ Edge Function award-xp    the only way to change XP (validates the request server-side)
```

### Frontend

A single-page application without a router. Game state lives in `App.tsx`; the timer runs in a `requestAnimationFrame` loop that caps frame deltas so that a background tab does not drain the timer at once.

### Replay engine

A run is recorded as an array of integers, one per keystroke: the milliseconds since the previous keystroke. The sign encodes the result, positive for a correct key and negative for a mistake (`src/lib/replay.ts`). A run of 300 keystrokes is therefore 300 small integers, stored as `replay_data` next to the score.

Playback does not dispatch each event a fixed delay after the previous one, because timer inaccuracies would add up over a long run. Instead, it sums the deltas into an expected time since the start and schedules each event at `expected time - elapsed time` (measured with `performance.now()`). Late events are caught up, so the replay stays in sync with the original over its full length. Ghosts use the same mechanism and pause while the player has not started yet.

### Seeded level generator

Community levels are stored only as a seed string plus parameters, not as text. `cyrb128` hashes the seed to a 32-bit number, which initialises the `mulberry32` pseudo-random generator. The generator picks words and direction tokens from it. The same seed always produces the same level on every device, which keeps the database rows small and the leaderboards comparable. A snapshot test guards against accidental changes to the generator, since those would silently change every existing level.

## Security

The Supabase URL and publishable (anon) key are part of the browser bundle and therefore public. Access control is enforced in the database:

- **Row Level Security** is enabled on all tables. Leaderboards, level times, community levels and public profiles are readable by everyone. Rows can only be inserted, updated or deleted by their owner: policies compare `auth.uid()` (taken from the signed JWT) with the row's owner column, using `USING` for existing rows and `WITH CHECK` for the new state.
- **Private data:** daily quest progress (`user_quests`) is only readable by its owner.
- **Column privileges:** on `users`, clients may write only `id` and `username`. XP cannot be changed by the client.
- **XP** is changed only by the Edge Function `award-xp`. It identifies the user from the JWT, validates the amount and calls the `SECURITY DEFINER` function `increment_xp`, which only the `service_role` may execute.
- The `service_role` key is never used in the frontend.

See `supabase/migrations/` for the versioned changes.

## Local setup

Requirements: Node.js 20 or later and a Supabase project.

```bash
npm install
cp .env.example .env    # then fill in your Supabase URL and publishable key
npm run dev             # http://localhost:3000
```

Other scripts:

| Command | Purpose |
|---|---|
| `npm run build` | production build into `dist/` |
| `npm run lint` | type check (`tsc --noEmit`) |
| `npm run check-i18n` | list translation keys missing in DE or EN |

## Tests

```bash
npm test             # single run
npm run test:watch   # watch mode
```

- `src/lib/communityLevels.test.ts`: the same seed produces an identical level; different seeds and languages produce different levels; word count; a snapshot of a fixed seed
- `src/lib/replay.test.ts`: encoding and decoding returns the same deltas (fixed and random sequences); compatibility with the stored format; mistakes typed within the same millisecond

## Known limitations

- **Client-side scoring:** scores and times are computed in the browser. RLS ensures players can only write their own rows, but not that the values are plausible. A server-side check, for example by validating the replay data in an Edge Function, would close this gap.
- **`App.tsx` is large** (about 2,600 lines). The next step would be to split game timer, input handling, replay recording and ghost playback into separate hooks so they can be tested in isolation.
- **Database schema:** tables and the original policies were created in the Supabase dashboard; only later changes are versioned as migrations.

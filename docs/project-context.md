# Kids math game

## Goal

A small private web game so Zhongzhou’s daughters can practice single-digit multiplication. Each girl has her own Samsung tablet, and that tablet keeps her mastery record for each fact. The app works online and offline, and stays shared only with friends.

## Tech stack

- **Vite + React + TypeScript** — one static app, no server.
- **Tailwind CSS** — touch-first game screens.
- **PWA (`vite-plugin-pwa`)** — install to the tablet home screen; service worker caches the app for offline play.
- **IndexedDB (`idb`)** — that girl’s difficulty table, stored on her tablet.
- **No backend, accounts, or cloud database.**

## Why this stack

Mastery has to live on the Samsung tablet and survive with no network. A static installable web app does that in Chrome on Android. After one online open, the cached app and the local records both work offline.

Each multiplication fact is a tiny record (1×1 through 9×9). IndexedDB is the browser store that keeps her difficulty table across sessions. It does not need an account.

Friends get the same private app link. Each tablet keeps its own records, so nothing is uploaded.

## Data kept on the tablet

- One row per fact (1×1 through 9×9): difficulty (steps of 0.1), streak, status (unseen, learning, mastered), correct count, wrong count.
- The shared file is only the starting guess, copied once on first launch.
- During a fight, search difficulty moves by 0.1 using the rule in [Design](/cursor/stores/bc-376a0a9c-a8e7-4212-935d-b562a55c4969/docs/design.md).
- After a finished level, each fact’s own streak decides its difficulty change: streak 1 stays, streak 2 decreases by 0.2, streak 3 decreases by 0.3.
- No child picker. Each tablet is one girl’s.

## Sharing

The repo stays private. The built app is static files reached by a private or unlisted link. No app store listing.

## Not in this version

- Sync across tablets or a shared leaderboard (that would need a backend).
- Accounts or sign-in.
- Operations other than single-digit multiplication.

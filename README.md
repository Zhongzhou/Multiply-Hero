# Multiply Heroes

A private tablet game for practicing single-digit multiplication. The hero fights a pig, a whale, or a gorilla by answering facts from 1×1 through 9×9. There is no account and no server. Each browser keeps that player's fact table in IndexedDB, and the installed app can keep working offline.

## Run locally

```bash
npm install
npm run dev
```

The app is served at [http://127.0.0.1:43127](http://127.0.0.1:43127).

## Tests

```bash
npm test
```

## Production build

```bash
npm run build
npm run preview
```

The production build is a PWA. After it has been opened once online, the cached app and the saved facts keep working offline.

## Put it on a tablet

Anyone with the link can open the game. Scores stay on the tablet.

1. On GitHub, create a **public** repository named `multiply-heroes`. Leave **Add a README** unchecked.
2. Push this branch to that repository's `main` branch. Replace `YOUR-NAME` with your GitHub name.

```bash
git fetch origin
git checkout cursor/kids-multiplication-game-96bc
git remote add github https://github.com/YOUR-NAME/multiply-heroes.git
git push -u github HEAD:main
```

3. Open the repository on GitHub. Go to **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**. Open **Actions** and wait for the green check. **Settings → Pages** then shows a link like `https://YOUR-NAME.github.io/multiply-heroes/`.
4. On the Samsung tablet, connect to Wi-Fi and open that link in Chrome. Tap the three dots, then **Install app** or **Add to Home screen**. Open the **Multiply Heroes** icon once while the tablet is online. Use the same link on the other tablet. Each tablet keeps its own scores.

Later pushes to `main` update the website. Keep the same link. Do not clear this site's data in Chrome. That erases the scores.

## Tuning

Level starting difficulties, hit points, streak difficulty changes, and the first-launch difficulty guess live in `src/config/gameConfig.ts`.

The game copies that guess into IndexedDB the first time it opens on a device. Later play updates the saved table and does not change the config file. Clearing the site data for this app makes the next launch copy the guess again.

## How a fight works

Easy starts at difficulty 0, Medium at 0.3, and Hard at 0.5. Search moves in steps of 0.1. Two correct answers at the current difficulty raise the search, and two wrong answers lower it. A difficulty with only one fact moves after that single answer. Difficulty numbers stay frozen until the avatar or the boss reaches 0 HP. A wrong answer resets that fact's streak and does not raise its difficulty.

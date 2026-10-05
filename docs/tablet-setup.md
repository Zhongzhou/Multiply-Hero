# Put the game on the tablet

You will get a web link. On the Samsung tablet, save that link as an icon on the home screen.

The free website needs a **public** GitHub repository. Anyone with the link can open the game. Scores stay on the tablet.

## 1. Create the GitHub repository

1. Go to [github.com](https://github.com) and sign in. Create a free account if you need one.
2. Click **+**, then **New repository**.
3. Name it `multiply-heroes`.
4. Choose **Public**.
5. Leave **Add a README** unchecked.
6. Click **Create repository**.
7. Copy the repository address. It looks like `https://github.com/YOUR-NAME/multiply-heroes.git`.

## 2. Send the game to GitHub

Open **WSL**. If you do not have the project folder yet:

```bash
curl -fsSL https://downloads.cursor.com/origin/install.sh | sh
origin auth login
origin repo clone zhongzhou-chen/kids_math_game_development
cd kids_math_game_development
```

If `origin` is not found:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Then send the game code:

```bash
git fetch origin
git checkout cursor/kids-multiplication-game-96bc
git remote add github https://github.com/YOUR-NAME/multiply-heroes.git
git push -u github HEAD:main
```

Replace `YOUR-NAME` with your GitHub name. If a browser window opens, sign in there.

## 3. Turn on the website

1. Open the repository on GitHub.
2. Click **Settings**.
3. Click **Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Click **Actions** at the top and wait until the green check appears.
6. Go back to **Settings**, then **Pages**. GitHub shows a link like `https://YOUR-NAME.github.io/multiply-heroes/`.

Use the link GitHub shows you.

## 4. Add it to the Samsung tablet

1. Connect the tablet to Wi-Fi.
2. Open **Chrome**.
3. Go to the link.
4. Tap the three dots.
5. Tap **Install app** or **Add to Home screen**.
6. Open the new **Multiply Heroes** icon once while the tablet is online.

The icon then works without Wi-Fi. Do the same on the other tablet with the same link. Each tablet keeps its own scores.

## Later changes

Push to the GitHub repository again. The website updates. Keep the same link so the scores stay.

Do not clear this site’s data in Chrome. That erases the scores.

# Ours 💕

A pastel-themed website to discover and save **movies**, **TV shows**, **books**, and **YouTube videos** from around the world — built for you and your partner.

Interlocking hearts run through the logo, footer, and theme across every page.

---

## What's included

| Page | URL | What it does |
|------|-----|--------------|
| **Home** | `index.html` | Welcome, category cards, featured global picks |
| **Explore** | `search.html` | Search by category + recommendations |
| **Our Library** | `library.html` | Everything you've saved (stored on your device) |

### Search sources (free, no account needed for basic use)

- **Books** — Open Library + Google Books
- **Movies & TV** — iTunes Search (works immediately); optional TMDB key for richer results + better recommendations
- **YouTube** — Invidious public API (no key)

---

## Project structure

```text
ours/
├── index.html          ← Home page
├── search.html         ← Search + recommendations
├── library.html        ← Saved items
├── assets/
│   └── logo.svg        ← Interlocking hearts logo
├── css/
│   └── styles.css      ← Pastel theme (shared)
├── js/
│   ├── common.js       ← Navigation, library storage
│   ├── api.js          ← Search APIs + recommendations
│   ├── home.js         ← Home page logic
│   ├── search.js       ← Explore page logic
│   └── library.js      ← Library page logic
├── README.md           ← This file
└── .gitignore
```

---

## Run locally (before putting on GitHub)

1. Open the `ours` folder on your computer.
2. Double-click **`index.html`** to open it in your browser.

For search to work reliably, use a tiny local server (browsers sometimes block API calls from `file://`):

**Option A — Python (if installed):**

```powershell
cd C:\Users\adith\projects\ours
python -m http.server 8080
```

Then open: **http://localhost:8080**

**Option B — VS Code / Cursor:** Install the "Live Server" extension, right-click `index.html` → "Open with Live Server".

---

## Optional: better movie/TV results (TMDB)

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to **Settings → API** and request an API key (Developer / personal use is fine)
3. Open `js/api.js` and paste your key:

```javascript
TMDB_API_KEY: "your_key_here",
```

4. Save and refresh the site. You'll get posters, global catalogs, and smarter "You might also love" recommendations.

---

# How to host on GitHub for free (complete beginner guide)

GitHub can host static websites for free using **GitHub Pages**. You never pay for hosting on a public repo.

## Part 1 — Install Git (one time)

1. Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download and run the installer — default options are fine.
3. Open **PowerShell** or **Terminal** and check it works:

```powershell
git --version
```

You should see something like `git version 2.x.x`.

## Part 2 — Create a GitHub account (one time)

1. Go to [https://github.com/signup](https://github.com/signup)
2. Pick a username, email, and password.
3. Verify your email when GitHub asks.

## Part 3 — Create an empty repository on GitHub

1. Log in to GitHub.
2. Click the **+** (top right) → **New repository**.
3. **Repository name:** `ours` (or any name you like)
4. Leave it **Public** (required for free Pages on personal accounts).
5. **Do NOT** tick "Add a README" — we'll push our own files.
6. Click **Create repository**.

GitHub shows a page with commands — keep that tab open.

## Part 4 — Upload your site with Git (first time)

Open PowerShell and run these commands **one block at a time**. Replace `YOUR_USERNAME` with your GitHub username.

```powershell
cd C:\Users\adith\projects\ours
```

Tell Git who you are (use your real name and the email on your GitHub account):

```powershell
git config user.name "Your Name"
git config user.email "you@example.com"
```

Initialize the repo and make the first save ("commit"):

```powershell
git init
git add .
git commit -m "Initial Ours website"
git branch -M main
```

Connect to GitHub (copy the URL from your new repo page — it looks like `https://github.com/YOUR_USERNAME/ours.git`):

```powershell
git remote add origin https://github.com/YOUR_USERNAME/ours.git
git push -u origin main
```

**First push:** GitHub opens a browser window to sign in. Use your GitHub account. If it asks for a password, use a **Personal Access Token** instead:

- GitHub → Settings → Developer settings → Personal access tokens → Generate new token (classic)
- Tick **repo** scope, generate, copy the token, paste when Git asks for a password.

## Part 5 — Turn on GitHub Pages (free hosting)

1. On GitHub, open your `ours` repository.
2. Click **Settings** → **Pages** (left sidebar).
3. Under **Build and deployment**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` → folder **`/ (root)`** → **Save**
4. Wait 1–3 minutes. Refresh the Pages settings page.

Your site URL will be:

```text
https://YOUR_USERNAME.github.io/ours/
```

Share that link with your partner and friends.

## Part 6 — Update the site later

After you change files locally:

```powershell
cd C:\Users\adith\projects\ours
git add .
git commit -m "Describe what you changed"
git push
```

GitHub Pages rebuilds automatically in a minute or two.

---

## Git cheat sheet

| Goal | Command |
|------|---------|
| See what changed | `git status` |
| Save a snapshot | `git add .` then `git commit -m "message"` |
| Upload to GitHub | `git push` |
| Download latest | `git pull` |

---

## Questions to help shape the next version

Reply with your preferences and we can build v2:

1. **Accounts** — Should you and your partner each have login, or one shared account?
2. **Social** — Do you want a friends feed (like Letterboxd), comments, and star ratings?
3. **Partner features** — Shared "couple watchlist", date-night picks, or anniversary lists?
4. **Privacy** — Public profiles, or only visible to invited friends?
5. **Novels vs books** — Separate category, or keep books as one?
6. **Language** — English only, or Hindi/regional language support in search?
7. **Mobile app** — Web-only for now, or PWA "Add to Home Screen" later?

---

## License

Personal project — use and modify freely for you and your people.


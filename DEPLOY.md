# Deploy ours (Phase 1)

## 1. Rename repo to lowercase (optional URL)

GitHub → **Settings** → **General** → Repository name → `ours`  
New URL: `https://adisree2409.github.io/ours/`

## 2. Add API secrets (required for live search)

GitHub → your repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Name | Value |
|------|--------|
| `TMDB_API_KEY` | your TMDB key |
| `YOUTUBE_API_KEY` | your YouTube Data API key |

## 3. Enable GitHub Actions Pages

1. **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions** (not “Deploy from branch”)
3. Push to `main` — workflow `.github/workflows/deploy-pages.yml` runs automatically

## 4. Restrict YouTube key (recommended)

Google Cloud Console → APIs & Services → Credentials → your API key:

- **Application restrictions**: HTTP referrers  
- Add: `https://adisree2409.github.io/*` and `http://localhost:*`

## 5. Local development

```powershell
cd C:\Users\adith\projects\ours
copy js\config.example.js js\config.js
# Edit js\config.js with your keys
npx --yes serve -l 8765 .
```

Open `http://localhost:8765`

## Security

- Never commit `js/config.js` (it is gitignored).
- If keys were shared in chat, **rotate them** in TMDB and Google Cloud.

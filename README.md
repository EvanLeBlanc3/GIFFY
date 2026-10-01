# GIFFY 🎞️✨
Type words → pick a font → pick an effect → get a looping animated GIF. Works offline on iPhone.

## Install on your iPhone (baby steps)
1. Go to github.com → **+** (top right) → **New repository** → name it `giffy` → **Public** → **Create repository**.
2. Click **uploading an existing file** → drag in **all the files from inside this folder** (index.html, app.js, fx.js, gif.js, sw.js, manifest.webmanifest, the 3 icon PNGs, README.md). Upload the files themselves, not the folder. → **Commit changes**.
3. Repo **Settings** → **Pages** → Source: **Deploy from a branch** → Branch: **main**, folder **/(root)** → **Save**.
4. Wait 1–2 minutes. Your link will be: `https://YOUR-USERNAME.github.io/giffy/`
5. Open that link in **Safari** on your iPhone → tap **Share** → **Add to Home Screen** → **Add**.
6. Open GIFFY from the home screen once while online (this caches everything). Then visit ⚙️ → **Download all web fonts for offline**.

## Saving GIFs
- **📸 Save to Photos** → opens the share sheet → tap **Save Image**. It stays animated in Photos.
- **📋 Copy** → copies the GIF (or opens the share sheet → **Copy**).
- Or long-press the GIF preview → **Save to Photos** / **Copy**.

## Updating later
Upload the changed files to the repo, then bump `V='giffy-v1'` in `sw.js` to `giffy-v2` so phones grab the new version.

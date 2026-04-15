# Deploying Full Ride

## 1. Install and test locally

```bash
npm install
npm run dev
# Verify it runs at localhost:5173 with no console errors
```

## 2. Git init

```bash
git init
git add .
git commit -m "initial commit"
```

## 3. Push to GitHub

```bash
# Create a new public repo at github.com named: full-ride
git remote add origin https://github.com/YOUR_USERNAME/full-ride.git
git branch -M main
git push -u origin main
```

## 4. Deploy on Vercel (no CLI needed)

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. Click **"Add New Project"**
3. Import the `full-ride` repo
4. Vercel auto-detects Vite — accept all defaults
5. Click **Deploy**
6. Done — live URL in ~60 seconds

Total time from `git init` to live URL: **under 5 minutes**.

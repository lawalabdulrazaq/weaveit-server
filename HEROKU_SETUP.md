# Heroku Deployment Setup Guide

This guide walks through deploying the WeaveIt server to Heroku.

## Prerequisites

- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed and authenticated (`heroku login`)
- Git repository initialized with all changes committed
- Heroku app created (or use `heroku create` to create one)

## Quick Setup (5 minutes)

### 1. Ensure Git is ready
```bash
git status
git add -A
git commit -m "Heroku setup: Procfile and env config"
```

### 2. Add Heroku remote (if not already added)
```bash
# Option A: Use Heroku CLI to create and link
heroku create your-app-name
# or
heroku git:remote -a your-app-name

# Option B: Add manually (if app already exists)
git remote add heroku https://git.heroku.com/your-app-name.git
```

### 3. Set required environment variables on Heroku
```bash
# Set OpenAI API key
heroku config:set OPENAI_API_KEY=sk_... --app your-app-name

# Set Database URL (PostgreSQL connection string)
heroku config:set DATABASE_URL=postgresql://user:password@host:5432/db --app your-app-name

# Verify config
heroku config --app your-app-name
```

### 4. Deploy to Heroku
```bash
git push heroku main
```

### 5. Monitor deployment and logs
```bash
# Watch logs in real-time
heroku logs --tail --app your-app-name

# Or check build status
heroku releases --app your-app-name
```

### 6. Verify the app is running
```bash
# Hit the health endpoint
curl https://your-app-name.herokuapp.com/api/db/health
# Expected response: {"ok":true}
```

## Environment Variables Reference

All required and optional env vars are documented in `.env.example`. Copy and update for your setup:

```bash
# Copy template
cp .env.example .env

# Edit .env with your actual values
# Then set them on Heroku:
heroku config:set OPENAI_API_KEY=... DATABASE_URL=... --app your-app-name
```

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `OPENAI_API_KEY` | OpenAI API key for text-to-speech | `sk-...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Node environment | `production` |
| `PGSSLMODE` | PostgreSQL SSL mode (for production) | `require` |

## How the App Starts

1. **Procfile** tells Heroku to run: `npm run start`
2. `package.json` `start` script runs: `node dist/src/server.js`
3. TypeScript is compiled during build via `heroku-postbuild` hook (runs `npm run build`)
4. Server binds to `process.env.PORT` (Heroku-assigned) or falls back to `3001` locally

## Troubleshooting

### App crashes immediately (exit code 1)
- Check logs: `heroku logs --tail --app your-app-name`
- Look for `MODULE_NOT_FOUND`, `ERR_MODULE_NOT_FOUND`, or missing config vars
- Ensure `DATABASE_URL` and `OPENAI_API_KEY` are set

### App crashes with exit code 137
- Dyno ran out of memory (SIGKILL)
- Check memory usage: `heroku ps --app your-app-name`
- Solutions:
  - Move heavy video/ffmpeg work to a worker dyno or external service
  - Upgrade dyno type: `heroku ps:scale web=1:standard-1x --app your-app-name`

### Database connection errors
- Verify `DATABASE_URL` is correct: `heroku config:app your-app-name`
- Test DB connection via health endpoint: `curl https://your-app-name.herokuapp.com/api/db/health`
- Ensure database is accessible from Heroku (firewall rules, IP whitelisting)

### Port binding issues
- Heroku assigns a random `PORT` via env var — **do not hardcode port 3001 in production**
- The app already uses `process.env.PORT || 3001`, so it's correct

### Build failures
- Check build logs: `heroku logs --app your-app-name | grep "Build failed"`
- Ensure `tsconfig.json` includes source folders: `["src/**/*", "weaveit-generator/**/*"]`
- Verify all imports use `.js` extensions (ESM requirement)

## Local Development

To test locally before pushing to Heroku:

```bash
# Build and start with Heroku-like port
npm run build
PORT=3001 node dist/src/server.js

# In another terminal, test
curl http://localhost:3001/api/db/health
```

## Next Steps

- Set up a frontend to call your deployed API (update API base URL to `https://your-app-name.herokuapp.com`)
- Consider setting up a worker dyno for background video generation (to avoid OOM on web dyno)
- Enable auto-deploy from GitHub branch (optional): `heroku apps --all` → settings → deployment

## Resources

- [Heroku Node.js Support](https://devcenter.heroku.com/articles/nodejs-support)
- [Heroku PostgreSQL](https://devcenter.heroku.com/articles/heroku-postgresql)
- [Procfile Reference](https://devcenter.heroku.com/articles/procfile)

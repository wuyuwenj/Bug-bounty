# Greptile PR Bonus Dashboard

A web dashboard that automatically reviews GitHub PRs using Greptile and credits contributors via Stripe.

## Features

- 📋 Lists incoming PRs in a dashboard
- 🤖 Triggers Greptile code reviews automatically
- ✅ Computes pass/fail verdict based on review score
- 💰 Credits $5 to PR author's Stripe customer balance (test mode)
- 🔄 Auto-refresh every 4 seconds

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Stripe API** (Customer Balance)
- **Greptile API** (Code Review)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Stripe (get from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY=sk_test_your_key_here

# Greptile (get from https://app.greptile.com/settings)
GREPTILE_API_KEY=your_greptile_key_here

# GitHub (create a random secret)
GITHUB_WEBHOOK_SECRET=supersecret

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## GitHub Webhook Setup

### Option A: Using ngrok (recommended for local testing)

1. Install ngrok: `brew install ngrok` (or download from [ngrok.com](https://ngrok.com))
2. Start ngrok: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Go to your GitHub repo → **Settings** → **Webhooks** → **Add webhook**
5. Configure:
   - **Payload URL**: `https://abc123.ngrok.io/api/webhooks/github`
   - **Content type**: `application/json`
   - **Secret**: The value from `GITHUB_WEBHOOK_SECRET` in `.env.local`
   - **Events**: Select "Pull requests"
   - Click **Add webhook**

### Option B: Using curl (for testing without GitHub)

Simulate a PR webhook:

```bash
curl -X POST http://localhost:3000/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{
    "action": "opened",
    "repository": {
      "name": "test-repo",
      "owner": {"login": "yourname"}
    },
    "pull_request": {
      "number": 1,
      "title": "Test PR",
      "user": {"login": "contributor123"}
    }
  }'
```

## Demo Flow

1. **Open the dashboard** at http://localhost:3000
2. **Create a PR** on your connected GitHub repo (or use curl to simulate)
3. **Watch it appear** on the dashboard with status "reviewing"
4. **Click "Poll Greptile"** to fetch the review result
   - Status changes to "pass" (score ≥ 80, 0 issues) or "fail"
5. **Click "Credit $5.00"** (only enabled for "pass" status)
6. **Verify in Stripe Dashboard**:
   - Go to [Stripe Dashboard (Test Mode)](https://dashboard.stripe.com/test/customers)
   - Find customer with email `contributor123@example.dev`
   - Check the **Balance** tab to see the $5.00 credit

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/webhooks/github` | POST | Receives GitHub PR webhooks |
| `/api/greptile/poll` | POST | Polls Greptile review status |
| `/api/stripe/credit` | POST | Credits $5 to PR author |
| `/api/prs` | GET | Lists all PRs |

## How It Works

### 1. PR Webhook Arrives
```
GitHub → /api/webhooks/github
  ↓
Store PR as "reviewing"
  ↓
Call Greptile API to start review
```

### 2. Poll for Review
```
Click "Poll Greptile" → /api/greptile/poll
  ↓
Fetch review from Greptile
  ↓
Compute verdict: pass if score ≥ 80 && issues = 0
  ↓
Update status to "pass" or "fail"
```

### 3. Credit Stripe Balance
```
Click "Credit $5.00" → /api/stripe/credit
  ↓
Get or create Stripe customer (email: {handle}@example.dev)
  ↓
Create balance transaction: -500 cents (credit)
  ↓
Update status to "credited"
```

## Data Storage

- **In-memory store** (no database required)
- Data persists only while the server is running
- Restart clears all PRs

To add persistence, integrate a database like PostgreSQL or SQLite.

## Notes

- **Test Mode Only**: All Stripe operations use test mode
- **Mock Fallback**: If Greptile API is unavailable, mock data is returned (score: 85, no issues)
- **No Authentication**: This is a demo app with no user login
- **Webhook Signature**: Verified using `GITHUB_WEBHOOK_SECRET` (bypassed in development)

## Troubleshooting

### "Invalid signature" error
- Make sure `GITHUB_WEBHOOK_SECRET` matches between `.env.local` and GitHub webhook settings
- In development, signature verification is bypassed

### Greptile API errors
- Check your `GREPTILE_API_KEY` is valid
- The app falls back to mock data if API calls fail

### Stripe API errors
- Ensure `STRIPE_SECRET_KEY` starts with `sk_test_`
- Verify you're using test mode keys

### Dashboard shows no PRs
- Check GitHub webhook is configured correctly
- Look at server logs for webhook delivery
- Try the curl command to simulate a PR

## Future Enhancements

- ✅ Add Greptile webhook receiver (auto-update status)
- ✅ Persist data with PostgreSQL/Prisma
- ✅ Add leaderboard by author
- ✅ Send Slack/Discord notifications on pass
- ✅ Support multiple repos
- ✅ Add authentication

## License

MIT

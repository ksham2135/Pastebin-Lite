# Pastebin Lite

A production-ready, high-performance pastebin application built with Next.js, TypeScript, and Redis.

## Project Description

Pastebin Lite is a minimalist paste-sharing service that allows users to create, share, and view temporary text pastes. Each paste can have optional time-to-live (TTL) and view-count limits, making it ideal for sharing sensitive or temporary content.

### Key Features

- **URL-safe paste IDs**: Short, unique identifiers (12 characters) for easy sharing
- **TTL Support**: Automatically expire pastes after a specified duration
- **View Limits**: Restrict paste access to a maximum number of views
- **Dual Constraints**: Apply both TTL and view limits simultaneously
- **Atomic Operations**: View counting is atomic, preventing race conditions under concurrent load
- **Production-Ready**: Full Redis persistence, no in-memory storage
- **Test Mode**: Header-based time manipulation for automated testing

### Data Model

Each paste stores:

- `id`: Unique, URL-safe identifier
- `content`: The paste text content
- `created_at_ms`: Creation timestamp (milliseconds)
- `expires_at_ms`: Expiration timestamp (milliseconds), or null if no TTL
- `max_views`: Maximum allowed views, or null if unlimited
- `views_used`: Number of views consumed (incremented atomically)

## Local Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Redis (or Upstash Redis for cloud-hosted option)

### Installation

1. **Clone the repository** (if not already done):
   ```bash
   cd pastebin-lite
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and set your Upstash Redis REST API connection:
   ```
   UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
   TEST_MODE=0
   ```

   You can get these values from your Upstash Redis dashboard under the "REST API" section.

4. **Run the development server**:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

5. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## Persistence Layer

### Redis

Pastebin Lite uses **Redis** as its exclusive persistence layer:

- **No in-memory storage**: All pastes are stored in Redis immediately upon creation
- **Atomic view counting**: Uses Lua scripts to ensure thread-safe view increments
- **Atomic operations**: View count increments are atomic to prevent race conditions under concurrent load
- **Manual expiry enforcement**: While Redis TTL is set for safety, expiry is manually enforced in the application for precise control
- **No global mutable state**: Each request independently queries Redis

### Key Structure

Pastes are stored with keys: `paste:<id>`

Each value is the complete paste object serialized as JSON.

### Expiry & View Limits

- Pastes expire when `now >= expires_at_ms`
- View limit is exceeded when `views_used >= max_views`
- Both constraints are checked on every access
- A paste becomes unavailable when **either** constraint is met first

## API Routes

### `GET /api/healthz`

Health check endpoint that verifies Redis connectivity.

**Response**: `{ "ok": true }`

### `POST /api/pastes`

Create a new paste.

**Request**:
```json
{
  "content": "string (required, non-empty)",
  "ttl_seconds": 3600,
  "max_views": 10
}
```

**Response** (201):
```json
{
  "id": "xyz123abc456",
  "url": "https://example.com/p/xyz123abc456"
}
```

### `GET /api/pastes/:id`

Retrieve a paste by ID (increments view count).

**Response** (200):
```json
{
  "content": "paste text content",
  "remaining_views": 9,
  "expires_at": "2026-01-29T12:34:56.000Z"
}
```

**Error** (404):
```json
{
  "error": "Paste not found or expired"
}
```

## HTML Routes

### `GET /p/:id`

View a paste in the browser (increments view count).

- Displays paste content with proper HTML escaping (XSS protection)
- Shows remaining views and expiration time
- Returns 404 if paste is unavailable

### `GET /`

Home page with paste creation form.

## Testing

### Manual Testing

1. **Create a paste**:
   ```bash
   curl -X POST http://localhost:3000/api/pastes \
     -H "Content-Type: application/json" \
     -d '{"content":"Hello World"}'
   ```

2. **Retrieve a paste**:
   ```bash
   curl http://localhost:3000/api/pastes/<id>
   ```

3. **Test health check**:
   ```bash
   curl http://localhost:3000/api/healthz
   ```

### Test Mode

To use the time-manipulation feature for testing:

```bash
# Set TEST_MODE in .env.local
TEST_MODE=1

# Then in requests, use the x-test-now-ms header:
curl -X GET http://localhost:3000/api/pastes/<id> \
  -H "x-test-now-ms: 1704067200000"
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
   - `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST token
   - `TEST_MODE`: `1` (for automated testing) or `0` (for production)
4. Deploy

### Other Platforms

The application is Node.js-compatible and can be deployed to any platform that supports Next.js (AWS, Azure, Google Cloud, etc.).

## Project Structure

```
pastebin-lite/
├── app/
│   ├── api/
│   │   ├── healthz/route.ts
│   │   ├── pastes/
│   │   │   ├── route.ts (POST)
│   │   │   └── [id]/route.ts (GET)
│   ├── p/[id]/page.tsx (View paste)
│   ├── layout.tsx
│   ├── layout.css
│   └── page.tsx (Create paste)
├── components/
│   └── CreatePaste.tsx
├── lib/
│   ├── redis.ts (Redis client)
│   ├── time.ts (Time handling with test mode)
│   └── paste.ts (Paste model and operations)
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.local.example
├── .gitignore
└── README.md
```

## Requirements Met

- ✅ TypeScript with strict null checks
- ✅ Next.js App Router
- ✅ Node.js runtime (not Edge)
- ✅ Redis persistence (Upstash-compatible)
- ✅ Atomic view counting with Lua scripts
- ✅ Manual expiry enforcement
- ✅ Test mode with header-based time control
- ✅ XSS protection via HTML escaping
- ✅ JSON-only API responses
- ✅ No in-memory storage
- ✅ No global mutable state
- ✅ No hardcoded localhost URLs
- ✅ Minimal UI with proper error handling
- ✅ Production-ready error handling

## License

MIT

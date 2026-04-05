## Social Feed (Next.js + Express)

This repo contains a simple social feed application (frontend + backend) built from the provided HTML/CSS designs, with a focus on cookie-based JWT auth, protected routes, and a scalable feed API shape (cursor pagination).

### What’s Built

**Frontend** (`social-feed-frontend/`)
- Next.js (App Router) UI converted from the provided HTML/CSS.
- Auth flow (login/register/logout) using **HttpOnly cookies** (no localStorage tokens).
- Protected `/feed` route.
- Feed:
  - Infinite/cursor-based posts fetching via React Query.
  - Create post with optional image upload.
  - Public/Private visibility selector.
  - Like post + “who liked” modal.
  - Comments + replies, like comments + “who liked” modal (reuses the same modal component).
- Unit tests with Vitest for hooks/store.

**Backend** (`social-feed-backend/`)
- Express + MongoDB (Mongoose).
- JWT auth:
  - Access + Refresh tokens stored in **HttpOnly cookies**.
  - Refresh rotation and inactivity logout (default **15 minutes**).
- Posts:
  - `public` posts visible to everyone **who is authenticated**.
  - `private` posts visible only to the author.
  - Cursor-based pagination (by `createdAt`) and indexes for feed queries.
- Image upload support (multer + Cloudinary).
- Unit tests with Jest (controllers/middleware/utils) using mocks (no DB/Cloudinary required).

### Key Decisions (Security + UX + Performance)
- **HttpOnly cookies** for JWTs to reduce XSS token theft risk and keep UX smooth (silent refresh).
- **Cursor pagination** for the feed to avoid expensive `skip/limit` at scale.
- **Visibility enforcement in the backend** (not only frontend filtering) to prevent data leaks.
- **Component-scoped CSS Modules** where possible; shared legacy template utilities remain in global CSS.

### Running Locally

**1) Backend**
```bash
cd social-feed-backend
yarn
yarn dev
```

Environment: `social-feed-backend/.env.example` shows expected variables. At minimum you need:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (e.g. `15m`)
- `JWT_REFRESH_EXPIRES_IN` (e.g. `30d`)
- `INACTIVITY_TIMEOUT_MINUTES` (e.g. `15`)
- `CLIENT_URL` (e.g. `http://localhost:3000`)
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (required for image uploads)

**2) Frontend**
```bash
cd social-feed-frontend
yarn
yarn dev
```

Environment:
- `social-feed-frontend/.env` → `NEXT_PUBLIC_API_URL=http://localhost:8080/api`

### Tests

**Backend**
```bash
cd social-feed-backend
yarn test
```

**Frontend**
```bash
cd social-feed-frontend
yarn test
```

### Notes / Current Constraints
- “Public” currently means “visible to all authenticated users” because the feed endpoints are protected.
- For “millions scale”, the next upgrades would be denormalized counters (commentCount/likeCount) and moving likes to a separate collection to avoid unbounded array growth on the Post document.

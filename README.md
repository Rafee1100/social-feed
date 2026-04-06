## Social Feed (Next.js + Express)

This repository contains a social feed application built by converting the provided HTML/CSS designs into a component-based Next.js app, backed by an Express + MongoDB API. The main goals were: match the provided UI, keep auth secure and smooth, and shape the API in a way that can scale to large reads (cursor pagination + indexes).

## Live Demo
- Frontend (Vercel): `https://social-feed-theta-orpin.vercel.app`

## Repo Structure

- `social-feed-frontend/`: Next.js (App Router) frontend
- `social-feed-backend/`: Express API + MongoDB (Mongoose)

## What I Built

### Frontend (`social-feed-frontend/`)

- **Next.js App Router pages** for login, registration, and the feed.
- **Component-based UI conversion** from the provided HTML/CSS.
- **Auth flow**: login/register/logout with toast feedback.
- **Protected feed**: `/feed` is only accessible when the user has an auth session.
- **Feed features**:
  - Fetch posts using React Query with cursor pagination (infinite scrolling shape).
  - Create a post with optional image upload.
  - Post visibility selector: `public` or `private`.
  - Like posts and view “who liked” in a modal.
  - Comments and replies (nested), like comments, and view “who liked” in the same reusable modal.
- **Unit tests** using Vitest for hooks and store behavior.

### Backend (`social-feed-backend/`)

- **Express API** with a clean `src/app.js` and `src/server.js`.
- **MongoDB + Mongoose models** for users, posts, and comments.
- **Request validation** using Zod middleware (`src/middleware/validate.js`).
- **JWT cookie auth**:
  - Access token + refresh token stored as **HttpOnly cookies**.
  - Refresh rotation endpoint (`POST /api/auth/refresh`).
  - Inactivity logout: if inactive for `INACTIVITY_TIMEOUT_MINUTES` (default 15), the session is invalidated.
- **Posts API**:
  - Cursor-based feed endpoint (`GET /api/posts`) sorted by `createdAt`.
  - Visibility rules enforced server-side:
    - `public`: visible to all authenticated users.
    - `private`: visible only to the author.
  - Like/unlike toggles and “who liked” endpoints.
- **Comments API**:
  - Fetch comments for a post with replies nested.
  - Create top-level comments and replies (reply-to-reply is blocked).
  - Like/unlike comments and “who liked” endpoints.
- **Image uploads**:
  - Multer parses `multipart/form-data` (`image` field).
  - Uploaded to Cloudinary and stored as `imageUrl` + `imagePublicId` on the post.
- **Unit tests** using Jest (controllers/middleware/utils) with module mocks (no DB or Cloudinary required).

## Architecture & Data Flow

### Auth Architecture (Security-First)

- Tokens are **not stored in localStorage**. The backend sets HttpOnly cookies, which are:
  - inaccessible to JavaScript (reduces XSS token theft risk)
  - automatically sent by the browser on requests
- The frontend uses a single axios instance configured with `withCredentials: true`.
- When an API call returns `401`, the frontend attempts a silent refresh (`POST /auth/refresh`) and retries the original request.
- If refresh fails, the user is redirected to `/auth/login`.

### Deployment Architecture (Vercel + Render)

When frontend and backend are on different domains, cookies set by the backend would normally be stored on the backend’s domain and not be visible to the frontend domain. To keep cookie auth working cleanly, the frontend uses a **same-origin proxy**:

- Browser calls `https://<vercel-domain>/api/proxy/...`
- Next.js route handler forwards that request to `https://<render-domain>/api/...`
- `Set-Cookie` is forwarded back so cookies are stored for the Vercel domain

This keeps auth cookies consistent and allows server components (like the `(main)` layout) to read cookies reliably.

### Feed Architecture (Performance-First)

- The feed uses **cursor pagination** using `createdAt` (instead of offset/skip), which is significantly more stable and efficient at scale.
- MongoDB indexes are added to support the feed query pattern.
- Visibility rules are applied in the feed query itself to prevent private data leaks.

## Key Decisions

- **HttpOnly cookies for auth**: stronger security posture than localStorage; better UX with silent refresh.
- **Server-side visibility enforcement**: the backend is the source of truth; the UI cannot “accidentally” leak private posts.
- **Cursor pagination**: better than `skip/limit` for large datasets and avoids performance degradation as page number grows.
- **Reusable “Likes” modal**: one modal component used for post likes and comment likes.
- **Zod validation**: consistent request validation with clear errors.
- **Unit tests with mocks**: fast tests that validate business logic without requiring a database or external services.
- **Design fidelity over CSS frameworks**: UI intentionally avoids Tailwind/other UI libraries to stick to the provided HTML/CSS design as requested (no alternative design).

## Running Locally

### Backend
```bash
cd social-feed-backend
yarn
yarn dev
```

Backend env: see `social-feed-backend/.env.example`. Required variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (e.g. `15m`)
- `JWT_REFRESH_EXPIRES_IN` (e.g. `30d`)
- `INACTIVITY_TIMEOUT_MINUTES` (e.g. `15`)
- `CLIENT_URL` (e.g. `http://localhost:3000`)
- Cloudinary (required for image uploads): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Frontend
```bash
cd social-feed-frontend
yarn
yarn dev
```

Frontend env:
- Local: `social-feed-frontend/.env` uses `NEXT_PUBLIC_API_URL=http://localhost:8080/api`
- Production: set `BACKEND_URL=https://<your-render-service>.onrender.com` on Vercel (no `/api`)

## Tests

### Backend (Jest)
```bash
cd social-feed-backend
yarn test
```

### Frontend (Vitest)
```bash
cd social-feed-frontend
yarn test
```


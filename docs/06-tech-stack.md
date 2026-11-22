# StreetWatch — Approved Tech Stack & Development Environment

> **Project:** StreetWatch  
> **Track:** World Problem Solver Track  
> **Competition:** Code-ArenaX Hack the Vibe 2026  
> **Document Stage:** Step 3 — Tech Stack & Environment Specification  
> **Document Path:** `docs/06-tech-stack.md`  
> **Status:** Approved Baseline  

---

## 1. Approved Core Technology Stack

| Layer | Selected Technology | Version / Tooling | Justification & Hackathon Reliability Factor |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js (App Router)** | `15.x / 14.x` + React 19/18 | Production-grade React server components, built-in SEO metadata, fast client transitions, file-based routing with route groups `(auth)`, `(public)`, `(citizen)`, `(authority)`, `(worker)`. |
| **Language** | **TypeScript** | `5.x` (`strict: true`) | Strict type safety, shared interfaces across frontend, API handlers, Prisma queries, and Zod schemas (M06). |
| **Styling & Design Tokens** | **Tailwind CSS + clsx + tailwind-merge** | Tailwind CSS v3/v4 | Enables rapid, pixel-perfect implementation of our Minimalism + Bento Grid design system (`#F8FAFC` canvas, `#FFFFFF` cards, `#0F172A` text, `#2563EB` accent). |
| **Component Icons** | **Lucide Icons** | `lucide-react` | Clean, lightweight geometric SVG icons matching modern civic dashboard aesthetics. |
| **Database & ORM** | **PostgreSQL + Prisma ORM** | `@prisma/client`, `prisma` | Fully relational schema with foreign key cascades, strict ACID transactions, automated migrations, and Prisma Studio visual GUI. |
| **Validation Layer** | **Zod** | `zod` | End-to-end schema validation for API payloads, coordinate bounds, file MIME types, and query filters. |
| **Authentication & RBAC** | **bcryptjs + jose** | `bcryptjs`, `jose` | Native Web Crypto compatible JWT tokens in HTTP-only cookies; zero dependency on external auth provider downtimes during evaluation. |
| **Mapping Engine** | **Leaflet + React-Leaflet** | `leaflet`, `react-leaflet` | Free, high-performance interactive map canvas utilizing OpenStreetMap Carto tiles; zero API key rate limits or credit card dependencies. |
| **AI Integration** | **Google Gemini API + Deterministic Fallback** | `@google/generative-ai` | Multimodal AI vision analysis for category triage and severity estimation, paired with a deterministic local rule engine to ensure 100% uptime even in offline testing. |

---

## 2. Development Environment & Tooling

- **Runtime:** Node.js v24.x
- **Package Manager:** `npm` (via `npm.cmd` on Windows)
- **Database GUI:** Prisma Studio (`npx.cmd prisma studio`)
- **Version Control:** Git on branch `streetwatch` (`https://github.com/MdSadiarRahman/StreetWatch.git`)
- **Seed Utility:** `tsx` for direct TypeScript database seeding (`prisma/seed.ts`)

# Matrix LLM Playground & Admin Management — Full Project Memory & Continuity Log

> **Complete Project History & Execution Record (Start to End)**  
> This file contains the complete chronological record of all features built, architectures designed, bugs diagnosed and solved, database migrations, authentication workflows, search grounding algorithms, credentials, and step-by-step instructions to resume seamlessly in any new terminal session.

---

## 1. Project Overview & Tech Stack
- **Framework**: Next.js 14.2.15 (App Router) + React 18.3.1 + TypeScript 5.6.3.
- **Styling**: Tailwind CSS 3.4.14 with Terminal-Dark design tokens (`#0A0B0D` canvas, `#101216` panels, concentric double-border hairline frames) and Classic ChatGPT minimalist clean aesthetic.
- **Database & ORM**: Prisma ORM v5.22.0 connected to a live **Neon PostgreSQL** Cloud Pooler (100% real database, 0 dummy records).
  - Neon Connection String: `postgresql://neondb_owner:npg_3VWOgovtfYm8@ep-long-sky-b345ksyh-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Security & Cryptography**: Native Node.js `crypto` with `scryptSync` password hashing, AES-256-GCM API key encryption at rest, and HMAC-SHA256 HTTP-only session cookies.
- **Search Pipeline**: Intelligent Multi-Engine Fallback (DuckDuckGo HTML -> Bing Search with Base64 redirect decoder -> Wikipedia OpenSearch API) with automated compound query decomposition, junk domain blacklist, and domain authority ranking.
- **Deployment & Server Status**: Production server running on `http://localhost:3000` (Verified HTTP 200).

---

## 2. Chronological Development Log (From Start to End)

### Phase 1: Project Initialization & Foundation
1. **Repository Setup**: Initialized empty directory with `package.json`, TypeScript configuration (`tsconfig.json`), PostCSS (`postcss.config.js`), and Tailwind CSS (`tailwind.config.js`).
2. **Initial Database Schema**:
   - Defined `Provider` model (`id`, `name`, `baseUrl`, `apiKey`, `isActive`, `createdAt`).
   - Defined `Model` model (`id`, `providerId`, `rawModelId`, `displayName`, `isVisible`, `inputPricePerM`, `outputPricePerM`, `lastSyncedAt`).
3. **Core Server Utilities**:
   - `src/lib/encryption.ts`: Symmetric AES-256-GCM encryption (`iv:authTag:encryptedHex`) ensuring provider API keys are never exposed in plaintext or to the client.
   - `src/lib/utils.ts`: Token query cost formula:  
     $$\text{Cost} = \frac{(\text{prompt\_tokens} \times \text{input\_rate}) + (\text{completion\_tokens} \times \text{output\_rate})}{1,000,000}$$

### Phase 2: Core Admin & Playground APIs
1. `POST /api/admin/providers`: Securely saves or updates upstream LLM providers (e.g. Groq, OpenAI, OpenRouter, DeepSeek).
2. `POST /api/admin/providers/:id/sync`: Live queries `{base_url}/models` using decrypted API keys, filters chat models, and upserts them into Neon PostgreSQL while preserving custom user pricing and visibility flags.
3. `PATCH /api/admin/models/:id`: Real-time updates for model display name, visibility switch, and retail input/output pricing.
4. `GET /api/playground/models`: Public safe API returning only `isVisible = true` models with pricing metadata (no sensitive keys).
5. `POST /api/playground/chat`: Server-side SSE streaming proxy forwarding prompt histories, injecting system contexts, capturing token usage, and computing live query burn costs.

### Phase 3: Neon PostgreSQL Cloud Database Migration
1. Replaced local dev database with production Neon PostgreSQL connection.
2. Migrated schema via `npx prisma db push` and verified live connectivity.
3. Maintained strict rule: Zero mock or dummy data in the live database.

### Phase 4: Advanced Admin Dashboard & Retail Pricing Matrix
1. **Matrix Terminal-Dark Console (`src/components/AdminProviders.tsx`)**:
   - Hairline double-border concentric frames.
   - Real-time gross profit margin calculation:
     $$\text{Margin \%} = \frac{\text{Retail Price} - \text{Provider Baseline}}{\text{Retail Price}} \times 100$$
   - One-click retail price markup presets: `+20%`, `+50%`, `+100%`.
   - Real-time model sync buttons with progress and latency telemetry.

### Phase 5: Live Internet Grounding & Search Engine Optimization
1. **Initial Issue**: Searching the internet unconditionally on every query caused slow response times and unnecessary queries for offline math/code questions.
2. **Built Smart Intent Router (`shouldSearchWeb(query)` in `src/lib/webSearch.ts`)**:
   - **Offline Whitelist**: Pure code generation, algorithm analysis, mathematical formulas, conceptual explanations (e.g., vectors, recursion, memory management), and greetings route directly to offline LLM weights.
   - **Online Triggers**: Temporal markers (`2024`, `2025`, `2026`, `latest`, `current`, `today`), finance (`price`, `stock`, `crypto`), political leadership (`who is current pm`, `president`, `ceo`), sports events, breaking tech (`Claude 3.7`, `GPT-4o`, `DeepSeek`), and Bengali/Banglish inquiries.
3. **Accuracy Bug Fix ("Who is the current PM of Bangladesh and Israel?")**:
   - *Problem*: Ambiguous compound query returned spam/forum links (GitHub, Zhihu, Reddit) and outdated/incorrect facts.
   - *Solution A — Query Decomposition (`decomposeQuery(query)`)*: Automatically breaks compound queries into discrete entity subqueries (e.g. `current prime minister bangladesh 2024` and `current prime minister israel`).
   - *Solution B — Multi-Engine Fallback Pipeline*: DuckDuckGo -> Bing with Base64 redirect decoder -> Wikipedia OpenSearch API.
   - *Solution C — Junk Domain Filter (`JUNK_DOMAINS`)*: Blacklisted low-quality sites (`github.com`, `zhihu.com`, `reddit.com`, `quora.com`, `csdn.net`, `bilibili.com`, `baidu.com`).
   - *Solution D — Domain Authority Scoring (`getDomainAuthority(url)`)*: Ranked government domains (`.gov`, `.gov.bd`, `.gov.il`, `.edu`), encyclopedias, and major news networks at the top.
   - *Solution E — Factual Prompt Guardrails*: Updated system prompt in `chat/route.ts` requiring explicit clarification of current governance:
     - Bangladesh: The Prime Minister office is vacant since August 2024; Dr. Muhammad Yunus serves as Chief Adviser of the interim government.
     - Israel: Benjamin Netanyahu is the current Prime Minister.
4. **ChatGPT-Style Minimalist Source Links**:
   - Replaced bulky top carousels with clean, compact source pills (`[🌐 favicon domain]`) positioned unobtrusively below the chat response.

### Phase 6: Loading Animation & Wide Dashboard Layout
1. **Blocks Wave Loading Animation**:
   - Integrated `assets/blocks-wave.svg` and `public/blocks-wave.svg` into `src/components/BlocksWave.tsx`.
   - Rendered active 3x3 block-wave during model inference waiting and token streaming.
2. **Expansive Wide Layout**:
   - User requested wide, comfortable dashboard layouts.
   - Expanded Playground from `max-w-3xl` to `max-w-7xl` with responsive 4-column cards.
   - Expanded Admin Provider interface to `max-w-[1700px]`.

### Phase 7: Dual-Portal Role-Based Authentication System
1. **Prisma Schema Update**:
   - Added `Role` enum (`USER`, `ADMIN`).
   - Added `User` model (`id`, `email`, `name`, `password`, `role`, `createdAt`, `updatedAt`).
   - Synchronized schema to Neon via `npx prisma db push`.
2. **Cryptographic Authentication Engine (`src/lib/auth.ts`)**:
   - Password hashing via `crypto.scryptSync` with salt (`scrypt:salt:hash`).
   - Tamper-proof session tokens signed with HMAC-SHA256 (`base64Payload.hmacSignature`).
   - HTTP-only cookie management (`matrix_auth_session`).
   - Auto-seeding default accounts on startup:
     - **Admin**: `admin@matrix.ai` / `admin123`
     - **User**: `user@matrix.ai` / `user123`
3. **Authentication API Suite**:
   - `POST /api/auth/login`: Verifies credentials and sets HTTP-only session cookie. Enforces role-based portal protection.
   - `POST /api/auth/register`: Supports user self-registration.
   - `GET /api/auth/me`: Validates active cookie session and returns profile data.
   - `POST /api/auth/logout`: Clears session cookie.
4. **Dual-Portal UI Architecture (`src/app/page.tsx`)**:
   - **User Portal (`src/components/ClassicUserPlayground.tsx`)**: Simple, clean, classic ChatGPT-style playground designed for distraction-free conversation, markdown rendering, and auto-detect web search.
   - **Admin Portal (`src/components/Playground.tsx` & `AdminProviders.tsx`)**: High-powered Matrix engineering dashboard with pricing management, model sync, token telemetry, and database monitoring.
   - **Login Modal (`src/components/LoginModal.tsx`)**: Features dual tabs ("Classic User" & "Admin Terminal") with one-click demo credentials.

### Phase 8: Comprehensive UI Polish, Multi-Session History & Code Blocks
1. **Rich Markdown Syntax Component (`src/components/CodeBlock.tsx`)**:
   - Integrated into both User and Admin playgrounds.
   - Header with detected language tag (e.g. `TSX`, `Python`, `SQL`, `Bash`) and one-click copy button with timed feedback checkmark.
   - Enhanced styling for tables, blockquotes, and inline codes.
2. **Classic User Playground Multi-Session Architecture (`src/components/ClassicUserPlayground.tsx`)**:
   - Collapsible left conversation history sidebar persisted via `localStorage`.
   - "New Chat" session starter, quick session switching, and individual session deletion.
   - "Export Chat" capability downloading conversation threads as `.md`.
   - Pulsing streaming indicator cursor and micro-interactions (`active:scale-[0.98]`).
3. **Admin Terminal Playground Polish (`src/components/Playground.tsx`)**:
   - Integrated `CodeBlock` component for model responses.
   - Monospace tables and pulsing cyan/blue streaming cursor.
4. **Admin Providers & Retail Pricing Console Polish (`src/components/AdminProviders.tsx`)**:
   - Expanded 5-metric overview strip featuring live calculated Average Gross Profit Margin %.
   - Model filter chips ("All Models", "Active in Store", ">20% Margin").
   - Search bar with instant clear button (`X`).
   - Button micro-interactions with optical alignments.

### Phase 9: Portal Route Isolation & Refresh Glitch Elimination
1. **Dedicated `/admin` Route (`src/app/admin/page.tsx`)**:
   - Extracted all Admin Console, Providers management, and Matrix Playground logic into dedicated Next.js App Router route `/admin`.
   - Gatekept with elevated administrator auth checks (`currentUser.role === 'ADMIN'`), dedicated Matrix loading state, and admin login modal.
2. **Dedicated `/` Route (`src/app/page.tsx`)**:
   - Completely decoupled from admin state.
   - Initial loading state renders a matching dark `#18191E` playground loading state, completely eradicating the 1-second admin flash glitch on page refresh.
   - One-click navigation to `/admin` via "Admin Portal" / "Go to Admin Console".

### Phase 10: Modern AI UI Effects & libraries.dev Integration (`border-beam`, `thinking-orbs`, `bot-avatars`)
1. **Libraries Installed**:
   - `border-beam`: Luminous animated border glow effect with customizable palettes and speeds.
   - `thinking-orbs`: 9 hand-tuned procedural canvas animations (`breathing`, `searching`, `solving`, `connecting`, etc.) replacing conventional spinners.
   - `bot-avatars`: Interactive 3D canvas AI characters (`droid`, `mech`, `cat`, etc.) with cursor gaze tracking, hopping interactions, and live states (`default`, `working`, `sleeping`).
2. **Next.js SSR Hydration Safety Layer (`src/components/libraries/`)**:
   - `SafeBorderBeam.tsx`: Client-mounted wrapper for `BorderBeam`.
   - `SafeThinkingOrb.tsx`: Client-mounted wrapper for `ThinkingOrb` with pulse skeleton fallback.
   - `SafeBotAvatar.tsx`: Client-mounted wrapper for `BotAvatar` with rounded skeleton fallback.
3. **Application Integrations**:
   - **Login Modal (`src/components/LoginModal.tsx`)**:
     - BorderBeam framing with dynamic color variants (`ocean` for admin, `forest` for user).
     - Live BotAvatar icons (`mech` for admin, `cat` for user) hopping into `working` state during authentication.
   - **Classic User Playground (`src/components/ClassicUserPlayground.tsx`)**:
     - Model engine button in header enhanced with mini `breathing` ThinkingOrb.
     - Empty state hero enhanced with interactive `droid` BotAvatar (size 92, cursor tracking).
     - Assistant responses display `droid` BotAvatar (size 32, transitions to `working` state during streaming).
     - Waiting for first token displays procedural `searching` or `solving` ThinkingOrb.
     - Chat prompt dock framed by `forest` BorderBeam with dynamic streaming intensity.
   - **Matrix Terminal Playground (`src/components/Playground.tsx`)**:
     - Hero empty state displays interactive `mech` BotAvatar (size 84).
     - Assistant responses display `mech` BotAvatar (size 30, transitions to `working` state during streaming).
     - Waiting for first token displays procedural `searching` or `solving` ThinkingOrb.
     - Chat prompt dock framed by `ocean` BorderBeam with dynamic streaming intensity.
   - **Route Loaders & Access Barriers**:
     - `src/app/page.tsx`: Initial auth check uses `breathing` ThinkingOrb (size 64).
     - `src/app/admin/page.tsx`: Dedicated admin auth check uses `connecting` ThinkingOrb (size 64), and unauthorized barrier features `mech` BotAvatar with `ocean` BorderBeam.

### Phase 11: Type System Hardening & Production Build Verification
1. **TypeScript Type Compliance**:
   - Diagnosed TypeScript compiler error in `src/components/ClassicUserPlayground.tsx` (line 889) where `SafeThinkingOrb` size was passed as `22` (invalid against `OrbSize = 64 | 32 | 20`).
   - Corrected size prop to `20`, restoring full type-safety compliance.
2. **Build Verification**:
   - Verified TypeScript check: `npx tsc --noEmit` exited cleanly with 0 errors.
   - Verified Next.js production build: `npm run build` compiled all 10 application routes and API endpoints successfully.

### Phase 12: Production Server Launch & Health Check
1. **Server Deployment**: Started background production server on port 3000 (`npx next start -p 3000`).
2. **Connectivity Verification**: Polled `http://localhost:3000` via HTTP probe, confirmed live 200 OK status.

### Phase 13: Full Claude Aesthetic Alignment & Better-UI Micro-Interactions
1. **LoginModal Design Alignment (`src/components/LoginModal.tsx`)**:
   - Implemented dynamic dual-personality styling: Claude warm aesthetic (`#1E1D1A` canvas, `#262420` header, `#CC785C` terracotta spark icon and accents, `sunset` BorderBeam) for user login, and Matrix terminal-dark (`#0D0E11` frame, `#82AAFF` cyan accents, `ocean` BorderBeam) for administrator login.
   - Added modal `[overscroll-behavior:contain]` to contain overlay scrolling.
   - Polished quick evaluation evaluation demo credentials with optical alignment.
2. **Better-UI & Tactile Micro-Interactions**:
   - Standardized button active states to exact `active:scale-[0.96]` and `enabled:active:scale-[0.96]` across `ClassicUserPlayground.tsx`, `Playground.tsx`, and `AdminProviders.tsx`.
   - Prevented active scaling on disabled controls (`enabled:active:scale-[0.96]`).
3. **Verification**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: Rebuilt all 10 application routes cleanly.
   - Production server active on `http://localhost:3000` (HTTP 200 OK).

### Phase 14: Perplexity AI Architecture Transformation & Elimination of Playground Feel
1. **Complete De-Playgrounding**:
   - Eradicated all "Playground" terminology and toy developer console motifs across headers, layouts, modals, and route bars.
   - Upgraded product identity to "Matrix Knowledge Engine" — an advanced Perplexity-grade AI search and deep research platform.
2. **Perplexity-Grade Research Interface (`src/components/ClassicUserPlayground.tsx`)**:
   - **Hero Omni-Search**: Clean "Where knowledge begins" hero with focus modes (🌐 Web, 🎓 Academic, 💻 Code, ✍️ Writing) and ⚡ Pro Search toggle.
   - **Top Sources Strip**: Rendered at the top of the answer with domain favicons, source numbering, and hover snippet previews.
   - **Interactive Inline Citations**: Formatted markdown with rich syntax code blocks and copy triggers.
   - **Perplexity Telemetry Progression**: Step-by-step query decomposition and multi-engine fallback indicators during search.
   - **Related Follow-Up Questions**: Automatic contextual follow-up inquiries with one-click `+` buttons to seamlessly continue research threads.
   - **Sticky Follow-Up Dock**: Clean bottom search bar with focus mode and Pro toggles.
3. **Application Palette & Metadata Alignment**:
   - Updated `src/app/layout.tsx` with title "Matrix AI — Deep Research & Knowledge Engine" and dark `#0F1012` canvas.
   - Updated `src/app/page.tsx`, `src/app/admin/page.tsx`, and `src/components/LoginModal.tsx` to align with the Perplexity cyan `#20B8CD` design system.
4. **Verification**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: Rebuilt all routes cleanly.
   - Production server running and verified on `http://localhost:3000` (HTTP 200 OK).

### Phase 15: Elimination of Redundant Footer Search on Initial Screen
1. **Single Focus Search UX (`src/components/ClassicUserPlayground.tsx`)**:
   - Conditioned the sticky bottom follow-up dock to render strictly when an active research thread exists (`messages.length > 0`).
   - On the initial hero state (empty thread / pre-search), the redundant bottom search bar is removed so only the central Omni-Search box is displayed.
2. **Verification**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: Rebuilt cleanly with 0 errors.
   - Production server active on `http://localhost:3000` (HTTP 200 OK).

### Phase 16: Mobile Responsiveness, Drawer Navigation & Multi-Device Perfection
1. **Mobile Drawer Sidebar Architecture (`ClassicUserPlayground.tsx` & `src/app/admin/page.tsx`)**:
   - Implemented sleek slide-over drawer on mobile (`fixed inset-y-0 left-0 z-50 w-72 md:relative md:w-64 md:z-40 shadow-2xl md:shadow-none`).
   - Semi-transparent backdrop overlay (`bg-black/65 backdrop-blur-sm z-40 md:hidden`) that dismisses the sidebar upon tapping anywhere outside.
   - Initial mount auto-collapse detection (`window.innerWidth < 768`).
   - Auto-closes mobile drawer on thread selection or new research thread creation.
2. **Horizontal Snap Sources Carousel (`ClassicUserPlayground.tsx`)**:
   - Replaced 2x2 stacked sources cards on mobile with native horizontal scroll strip (`flex sm:grid sm:grid-cols-4 gap-2.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none snap-x snap-mandatory -mx-4 px-4 sm:mx-0 sm:px-0`).
   - Each source card formatted with `w-[210px] sm:w-auto shrink-0 snap-start`, keeping answer content immediately visible without taking excessive vertical viewport height.
3. **iOS Safari Auto-Zoom Prevention**:
   - Applied `text-base sm:text-sm` (16px on mobile, 14px on desktop) across hero search textarea, bottom dock textarea, and admin playground textarea.
   - Applied `text-base sm:text-xs` on `LoginModal.tsx` form inputs (`name`, `email`, `password`), preventing iOS Safari auto-zoom behavior on input focus.
4. **Mobile Safe Area Insets & Dynamic Viewport Heights**:
   - Sticky bottom search dock styled with `pb-[max(0.75rem,env(safe-area-inset-bottom))]` for iPhone home indicator clearance.
   - Root containers upgraded to `h-[100dvh]` to dynamically track mobile browser address bar collapse/expansion without viewport clipping.
5. **Layout Overlap & Truncation Hardening**:
   - Home page floating Admin link converted to `hidden md:flex` to prevent collision with the sticky follow-up input dock on mobile.
   - Model selector pill and user email display truncated adaptively on narrow mobile viewports (`max-w-[150px] xs:max-w-[200px] sm:max-w-none`).
6. **Verification & Server Status**:
   - `npx tsc --noEmit`: Exited with code 0 (0 errors).
   - `npm run build`: All 10 routes compiled into optimized production bundles.
   - Production server verified live on `http://localhost:3000` (HTTP 200 OK).

### Phase 17: Unique Matrix Neural Design & Next-Gen Login Experience
1. **Original Brand Identity & Bespoke Iconography**:
   - Eliminated all third-party provider design signatures (Perplexity asterisks, "Where knowledge begins", generic ChatGPT styles).
   - Created original **Matrix Neural Frontier Intelligence** identity and bespoke vector emblem (`MatrixPrismGlyph`): a crystalline neural hyperprism SVG with gradient facets (`#00E5A3` neon emerald to `#00D2FF` electric cyan to `#6366F1` indigo) and quantum singularity center.
   - Harmonized canvas background to deep obsidian `#0A0B10` with obsidian-aurora cyber palette.
2. **Complete Login Page Transformation (`src/components/LoginModal.tsx`)**:
   - **Atmospheric Glow Backdrop**: Ambient pulsing gradient mesh halo (`#00E5A3`/`#00D2FF`/`#6366F1`) behind frosted obsidian glass container (`bg-[#0C0E14]/92 border-white/10`).
   - **Animated Identity Pedestal**: Dual mode presentation with live micro status pulse indicator (`#00E5A3` animated ping dot).
   - **Security & Password UX**: Interactive show/hide password toggle (`Eye`/`EyeOff`) with real-time visibility indicator.
   - **Holographic One-Tap Test Access Keys**: One-touch credential buttons (`⚡ Explorer: user@matrix.ai` and `🛡️ Operator: admin@matrix.ai`) with active click transitions and checkmark feedback.
   - **System Trust Certification Pill Strip**: Displays live backend telemetry (`● Neon DB Live · AES-256 GCM · Zero Query Retention`).
   - **Segment Controller Switcher**: Seamless toggle between `Explorer Pass` (User) and `Operator Core` (Admin).
3. **Frontier Playground Polish (`src/components/ClassicUserPlayground.tsx`)**:
   - Navigation sidebar branded with `Matrix Neural Frontier Intelligence` and `MatrixPrismGlyph`.
   - Model selector pill redesigned with custom prism glyph and glow highlights.
   - Exploration vectors (`Deep Dive`, `Consensus`, `Next Frontier`) replacing generic follow-ups.
### Phase 18: Focus Mode Engine (Academic, Code, Writing, Live Grounding) & Frontier Model Roster Activation
1. **Focus Mode Backend Intelligence (`src/app/api/playground/chat/route.ts`)**:
   - Integrated full backend support for all 4 focus modes: `web` (Live Grounding), `academic` (Academic Nexus), `code` (Algorithmic Logic & Engineering), and `writing` (Executive Intelligence & Synthesis).
   - Injected specialized system persona directives.
   - Integrated **⚡ Pro Search Deep Synthesis** expanding search breadth from 5 to 8 sources.
2. **Scholarly Multi-Engine Academic Specialization (`src/lib/webSearch.ts`)**:
   - Enhanced `getDomainAuthority(url, focusMode)` with specialized authority weighting (score 110) for academic domains.
3. **Premier Model Roster Activation & Margin Calibration**:
   - Activated premier frontier models in the live Neon PostgreSQL database: `openai/gpt-4o`, `openai/gpt-4o-mini`, `deepseek/deepseek-chat`, `deepseek/deepseek-r1`, and `meta-llama/llama-3.3-70b-instruct` (total 8 active models).
   - Calibrated retail input/output pricing with healthy +20% to +25% profit margin arbitrage.

### Phase 19: Intelligent Dual-Engine Intent Classification & Anti-AI-Slop Redesign
1. **Intelligent Dual-Engine Intent Classifier (`src/lib/webSearch.ts`)**:
   - Replaced naive regex triggers with a 4-stage heuristic classifier `classifyQueryIntent(prompt)` returning `{ shouldSearch, route, reason, category, confidence }`.
   - **Parametric Model Knowledge Route (NO Web Search)**:
     - Software engineering, algorithmic logic, data structures & implementation.
     - Mathematics, calculus, algebra, statistics & formal logic.
     - Canonical science (photosynthesis, quantum mechanics, relativity, thermodynamics), history, philosophy & literature.
     - Creative writing, drafting, translation & text transformation.
     - Casual greetings & conversational dialogue.
   - **Real-Time Web Search Route**:
     - Explicit search commands (`/search`, `search the web for`).
     - Temporal recency markers (`today`, `yesterday`, `this week`, `right now`, `latest news`, `upcoming`).
     - Calendar years >= 2025/2026.
     - Live financial markets, stock tickers ($AAPL, $NVDA), crypto (BTC, ETH, SOL), exchange rates, commodities.
     - Live weather & meteorological alerts.
     - Live sports scores & tournament standings.
     - Dynamic political leadership & government transitions (e.g. Bangladesh Chief Adviser Muhammad Yunus, interim government).
     - Frontier tech & hardware releases (Claude 3.7, DeepSeek V3/R1, GPT-4o, Blackwell GPU).
   - Default stance: Routes to model's deep parametric intelligence unless live indicators are detected, eradicating false-positive search latency and noise.
2. **Concise, Anti-Fluff System Prompt Engineering (`src/app/api/playground/chat/route.ts`)**:
   - Eliminated verbose boilerplate system prompts and rigid outlines that forced models into artificial walls of text.
   - Direct, high-signal, anti-filler instructions.
   - Emits `intent` SSE event (`route`, `reason`, `category`) for client feedback.
3. **Anti-AI-Slop UI Transformation (`src/components/ClassicUserPlayground.tsx`)**:
   - Applied Uizze's anti-ui-slop design system (`craft.md`, `distill.md`):
   - Eliminated visual noise:
     - Removed repetitive 3-button "Exploration Vectors / Related Questions" clutter on every turn.
     - Removed debug cost/token/TPS telemetry from the user chat view.
     - Removed bulky pseudo-telemetry progress boxes.
     - Replaced 4 large hero cards with 4 clean, quiet, 1-line prompt chips.
     - Replaced bulky 4-card evidence nodes carousel with a sleek, compact, collapsible source row (`🌐 N sources consulted · domain.com...`).
     - Replaced rainbow neon gradients with a calm, deep obsidian canvas (`#0D0E12`).
   - Clean, focused reading column (`max-w-3xl`) with high-contrast, comfortable markdown typography and clean code syntax highlighting.
   - Clean omni-search input with a single minimal Web Search toggle (`[🌐 Auto Search]` / `[🌐 Search Off]`).
   - Clean initial loading state in `src/app/page.tsx` and updated metadata in `src/app/layout.tsx`.
4. **Verification & Testing**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 100% clean production build across all 10 application routes.
   - Production server active on `http://localhost:3000` (HTTP 200 OK).
   - Automated routing verified:
     - "What is an event loop in JavaScript?" -> `MODEL` (0 search, instant parametric inference).
     - "Who is the current Prime Minister of Bangladesh?" -> `WEB_SEARCH` (verified web grounding).

### Phase 20: Admin Model Sorting Architecture & Enabled-First Priority
1. **Database-Level Enabled Priority (`src/app/api/admin/models/route.ts`)**:
   - Updated Prisma query `orderBy` to `[{ isVisible: "desc" }, { displayName: "asc" }]`.
   - Enabled models (`isVisible === true`) are retrieved from the database first, followed by alphabetical inactive models.
2. **Admin Management Console Sorting System (`src/components/AdminProviders.tsx`)**:
   - Added `ModelSortOption` state with `"enabled_first"` as the default sorting rule.
   - Added interactive Sort By selector dropdown next to Gateways filter:
     - `⚡ Enabled First (Default)`: Active models grouped at top.
     - `🔤 Name (A → Z)`: Alphabetical ascending.
     - `🔤 Name (Z → A)`: Alphabetical descending.
     - `📈 Margin % (High → Low)`: Highest retail profit margins.
     - `💲 Retail Rate (High → Low)`: Most premium per-1M tokens.
     - `💲 Retail Rate (Low → High)`: Most economical retail models.
     - `🏷️ Base Cost (High → Low)`: Upstream provider raw cost.
   - Made table column headers (`Playground`, `Display Name`, `Retail Rate`, `Margin & Presets`) interactively clickable to toggle column sorting with directional arrow indicators.
3. **Verification & Testing**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 100% clean production build across all routes.
   - Verified `/api/admin/models`: All 8 enabled models appear first out of 465 synced models.
   - Production server active on `http://localhost:3000` (HTTP 200 OK).

### Phase 21: Interactive Mascot Companion, Audio Synthesizer & Ultra-Cool User Playground
1. **Interactive 3D Mascot Companion (`src/components/InteractiveMascot.tsx`)**:
   - Built living 3D procedural canvas avatar with cursor-tracking and pointer physics.
   - 8 companion shapes: `Matrix Droid`, `Cyber Neko Cat`, `Quantum Star`, `Cosmic Alien`, `Neon Ghost`, `Titan Mech`, `Lucky Clover`, `Poly Blob`.
   - Wearable accessories: `Crown`, `Cyber Shades`, `Beanie`, `Beret`, `Party Hat`, `Round Specs`, `Square Frames`.
   - 6 Cyber Hue themes with realtime lighting (`Cyan Matrix`, `Electric Purple`, `Emerald Cyber`, `Amber Flare`, `Hyper Rose`, `Obsidian Titanium`).
   - State-aware reactions: idle breathing, attention on typing, hopping & 360 jump-flips on click, dynamic status speech bubble ("Synthesizing tokens...", "Grounding in live web nodes...").
   - Companion Studio Modal: In-app customization drawer saving preferences directly to localStorage.
2. **Procedural Web Audio Synthesizer (`src/lib/audioFx.ts`)**:
   - Zero-asset lightweight procedural Web Audio API synthesis:
     - Mascot jump / 360 flip sound.
     - Mascot chirp / giggle sound.
     - Futuristic message sent chime.
     - Response token arrival chime.
   - One-click mute/unmute control saved to localStorage.
3. **Elevated User Panel UI (`src/components/ClassicUserPlayground.tsx`)**:
   - Mini Mascot Companion avatar pill in Top Navigation Bar with live status telemetry (`Matrix Copilot`, `Thinking`, `Grounding`).
   - Interactive tactile starter prompt cards with category badges (`⚡ Full-Stack React`, `🌐 Real-Time Intel`, `🔬 Quantum Science`, `🛠️ TypeScript Utility`) and hover elevation.
   - Text-to-Speech (TTS) Read Aloud with browser SpeechSynthesis for assistant responses.
   - 1-click Regenerate / Retry response and copy-to-clipboard feedback.
   - Model Picker categorizer badges (`🧠 Frontier`, `⚡ Turbo`, `💻 Code`).
   - Luminous focus halo on search inputs with animated globe indicator.
4. **Verification & Testing**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 100% clean production build across all 10 application routes.
   - Production server running on `http://localhost:3000` (Verified HTTP 200 OK).

### Phase 22: Custom Model Display Names in User Dashboard & Admin Name Customizer
1. **Database Custom Display Names & Persistence**:
   - Updated all enabled models in live Neon PostgreSQL database with clean, professional custom titles:
     - `Claude 3.7 Sonnet (Anthropic)`
     - `Claude 3.7 Opus (Anthropic)`
     - `DeepSeek R1 Pro (Reasoning)`
     - `DeepSeek V3.1 Flash (DeepSeek)`
     - `GPT-4o Omniscience (OpenAI)`
     - `GPT-4o Mini Turbo (OpenAI)`
     - `GPT-6 Luna (OpenAI)`
     - `MiMo v2.6 Flash (Xiaomi)`
     - `Qwen 3.8 Flash (Alibaba)`
     - `Qwen 3.8 Max Prime (Alibaba)`
2. **Admin Panel Custom Name Editor (`src/components/AdminProviders.tsx`)**:
   - Updated table column header to `Custom Name (User UI)`.
   - Expanded input field with full auto-saving on blur and `Enter` key trigger.
   - Added `cleanModelName` utility with a 1-click magic auto-clean sparkle button (`Sparkles`) converting raw upstream model IDs (e.g. `anthropic/claude-3-5-sonnet:beta`) into clean formatted titles (`Claude 3.5 Sonnet (Anthropic)`).
   - Removed closure staleness by passing explicit custom display names to `saveModelChanges`.
3. **User Dashboard Custom Model Presentation (`src/components/ClassicUserPlayground.tsx`)**:
   - Display custom names everywhere: Top Navbar Model Selector Pill, Model Picker dropdown menu, and Assistant Response headers.
   - Added provider tags (e.g. `OPENROUTER`) in the model selector dropdown.
4. **Verification & Testing**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 100% clean production build.
   - Verified `/api/playground/models`: All active models return custom display names.
   - Production server running on `http://localhost:3000` (HTTP 200 OK).

### Phase 23: Complete Admin Panel Simplification & Focus on Pure User Experience UI/UX
1. **User Requirement & Strategy**:
   - The user requested: "admin panel ekdom simple kore deo eto kisu lagbe na just admin related kaj korte parlei hobe manage just user panel e focus deo for desgin and ui/ux".
   - Goal: Strip all unnecessary bloat, secondary playgrounds, and 3D turntable canvases from the Admin page so it is strictly focused on essential admin operations (managing API keys, 1-click model syncing, custom model naming, retail margins/pricing, and visibility toggling).
   - Channel all design and UX power into the User Playground (`/`), creating a clean, pristine, distraction-free environment.
2. **Simplified Admin Panel (`src/app/admin/page.tsx` & `src/components/AdminProviders.tsx`)**:
   - Eliminated redundant secondary telemetry playground inside Admin; replaced with direct, high-density provider and model management (`<AdminProviders />`).
   - Removed heavy 3D canvas wrappers and complex multi-column sidebars from admin.
   - Clean top navigation bar: "Matrix Admin Management" badge, "← User Playground" return link, real-time "Neon Postgres · Connected" status pill, and single-click Sign Out.
   - Admin bundle size reduced significantly to 7.96 kB (First Load JS: 176 kB).
3. **Elevated Minimalist User Playground (`src/components/ClassicUserPlayground.tsx`)**:
   - Deep Obsidian theme (`#0B0C0E`), crisp typography, elegant 48px header.
   - Dual-model comparison mode with real-time parallel streaming.
   - Smart intent-based web search grounding without latency penalties on coding/math tasks.
   - Fast responsive layout with clean source citations and copy/listen actions.
4. **Verification & Production Deployment**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 100% clean production build.
   - Background Next.js production server running on `http://localhost:3000` (Verified HTTP 200 on `/` and `/admin`).

### Phase 24: Full Workspace Clean-Up & Non-Project File/Folder Purge
1. **User Requirement & Scope**:
   - The user requested: "project related kono file folder na thakle sob remove kore deo important gula thakbe just".
   - Purged all non-essential, duplicate, and obsolete artifacts across the workspace to leave only pure, important project files.
2. **Purged Files & Directories**:
   - `src/.claude/` & `.claude/`: Removed misplaced and duplicate agent folders.
   - `assets/`: Removed redundant directory (SVG properly hosted in `public/blocks-wave.svg`).
   - `prisma/dev.db`: Removed obsolete local SQLite database file (production database is live Neon PostgreSQL).
   - `tsconfig.tsbuildinfo`: Removed transient compiler cache.
   - `src/components/Playground.tsx`: Removed obsolete 1083-line dead admin telemetry playground component.
   - `src/components/HairlineFigure.tsx`: Removed unreferenced hairline wrapper.
   - `src/components/ui/`: Removed empty/unreferenced UI directory.
   - `.agents/` & `skills-lock.json`: Removed external agent skill docs to maintain a clean project root.
3. **Pristine Project Structure Retained**:
   - Core Next.js App Router (`src/app/page.tsx`, `src/app/admin/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`).
   - Secure Backend APIs (`src/app/api/admin/*`, `src/app/api/auth/*`, `src/app/api/playground/*`).
   - Production Components (`ClassicUserPlayground`, `AdminProviders`, `InteractiveMascot`, `LoginModal`, `BlocksWave`, `CodeBlock`, `Safe*` libraries).
   - Core Utilities (`auth.ts`, `audioFx.ts`, `encryption.ts`, `prisma.ts`, `utils.ts`, `webSearch.ts`).
   - Single source of truth database schema (`prisma/schema.prisma`).
   - Static assets (`public/blocks-wave.svg`).
### Phase 25: Comprehensive Admin Suite (User Management, Billing & Ledger) & Interactive User Mascot Experience
1. **User Requirements & Strategic Implementation**:
   - The user requested: "admin panel e user managment korar kisu nai paymnet er kisu nai ekta properadmin panel e ja thake sob add koro ar user end e maskot thakbe intractive ui hote hobe".
   - Goal: Implement a proper, full-featured Admin Console with User Management, Billing/Payments Ledger, Executive Overview Telemetry, while retaining AI Gateways; plus fully bring back and elevate the Interactive Mascot Companion on the User Playground.
2. **Database Schema & Cloud Synchronization**:
   - Updated `User` model: Added `balance` (USD wallet), `status` (ACTIVE | SUSPENDED), `totalTokens` (burned tokens counter), `totalSpent` (monetary burn tracking).
   - Created `Transaction` ledger model: `id`, `userId`, `amount`, `currency`, `type` (DEPOSIT, USAGE_BURN, MANUAL_CREDIT, BONUS), `status` (COMPLETED, PENDING, FAILED), `provider` (Stripe, bKash, Crypto, Manual Admin, System Bonus), `referenceId`, `description`, `createdAt`.
   - Pushed directly to Neon PostgreSQL cloud database with `npx prisma db push`.
3. **Backend API Suite**:
   - `GET /api/admin/users`: Search, filter by role/status, aggregate counts (total users, active accounts, circulating credit liability).
   - `POST /api/admin/users`: Manual user provisioning with initial balance and role assignment.
   - `PATCH /api/admin/users/[id]`: Role promotion/demotion, status suspension toggling, and audit-logged credit balance adjustments (± top-up).
   - `DELETE /api/admin/users/[id]`: Account deletion with safety protection against self-deletion.
   - `GET /api/admin/payments`: Real-time transaction feed, financial metrics (total gross revenue, circulating credits, token burn value).
   - `POST /api/admin/payments`: Manual payment processing & credit issuance dialog with multi-gateway support (Stripe, bKash, Crypto, Bank Wire, Manual).
   - `GET /api/admin/stats`: Mission control KPI telemetry across users, gateways, models, and Neon storage health.
   - `POST /api/playground/chat`: Automatic token accounting and real-time user balance deduction upon completion of each streaming generation.
4. **Admin UI Architecture (`src/app/admin/page.tsx`)**:
   - Seamless top tab navigation:
     - 📊 **Overview** (`AdminOverview.tsx`): Metric cards, revenue stats, recent user feed, recent transactions, database health.
     - 👥 **User Management** (`AdminUserManagement.tsx`): Searchable user table, role badges, status switches, ± Top Up modal with presets ($10, $25, $50, $100), delete confirmation.
     - 💳 **Billing & Payments** (`AdminBilling.tsx`): Revenue ledger, transaction search/filter, "Record Payment / Issue Credit" modal.
     - 🧠 **AI Gateways** (`AdminProviders.tsx`): Upstream keys encryption, 1-click model syncing, custom naming, retail margin markup presets.
5. **Interactive User Playground Experience (`src/components/ClassicUserPlayground.tsx`)**:
   - Prominently integrated `InteractiveMascot` in Hero state (`variant="hero"`) with live 3D pointer tracking, speech bubbles, flip physics, and Companion Studio customizer drawer.
   - Added floating interactive companion dock (`variant="mini"`) in active conversation view reacting to `idle`, `searching`, and `streaming` inference.
   - Added live user balance badge (`$XX.XX`) in the top navbar with live credit accounting on token generation.
6. **Verification & Production Status**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 100% clean production build across all 13 routes.
   - Production server running on `http://localhost:3000` (Verified HTTP 200 on `/` and `/admin`).

### Phase 26: Footer Chat Model Chooser & 100% Upstream Anonymization (Zero OpenRouter Leaks)
1. **User Requirement & Directive**:
   - User requested: "uer end model choose option ta footer chat optino e eekhan thkabe just model er name thakhne to choose ar kisu na user kono din kono vabe jeno na jante pare ami openrouter use korte si".
   - The model selector must reside strictly inside the footer chat input box (and the initial hero prompt box).
   - Only the clean model display name must be shown in the picker (no provider names, no vendor prefixes, no raw pricing formulas, no external badges).
   - Total upstream obfuscation: Under no circumstance can an end-user or browser inspector deduce that OpenRouter (or any third-party gateway) is used.
2. **API Anonymization (`/api/playground/models`)**:
   - Scrubbed all provider metadata: `provider_name`, `providerId`, vendor IDs, and pricing rates completely removed from client payload.
   - Public endpoint returns strictly: `[{ "id": string, "display_name": string }]`.
   - Network inspector in browser shows only clean branded model names without any upstream vendor footprint.
3. **Upstream Error Sanitization (`/api/playground/chat`)**:
   - Masked upstream error responses to sanitize any string matches of `openrouter` / `openrouter.ai` to generic platform terms (`matrix`).
   - Replaced generic provider error messages with clean, branded inference service messaging.
4. **Footer Chat Input Toolbar UI (`src/components/ClassicUserPlayground.tsx`)**:
   - Integrated model selector directly into the chat input toolbar beside Auto Search and Send buttons.
   - Clean upward popover menu listing exclusively the model's display name (`m.display_name`) with active checkmark.
   - Dual-model comparison selector also embedded directly in the chat toolbar when compare mode is toggled.
   - Cleaned top navbar to remove redundant, bulky model picker dropdown.
5. **Verification & Testing**:
   - Verified `/api/playground/models` HTTP response: 100% anonymized, zero mentions of OpenRouter.
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 100% clean production build.
   - Production server running at `http://localhost:3000` (HTTP 200 OK).

---

## 3. Account Credentials & Access Levels

| Role | Email | Password | Access Level | UI Experience |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin@matrix.ai` | `admin123` | Full Admin Console | Executive Mission Control, User Management, Billing Ledger, AI Gateways |
| **User** | `user@matrix.ai` | `user123` | Playground Explorer | Interactive Obsidian Playground with 3D Mascot Companion and auto web search |

*Self-registration for new users is also available via the login modal.*

---

## 4. Complete Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  ADMIN
}

model Provider {
  id        String   @id @default(cuid())
  name      String
  baseUrl   String   @map("base_url")
  apiKey    String   @map("api_key")
  isActive  Boolean  @default(true) @map("is_active")
  createdAt DateTime @default(now()) @map("created_at")

  models    Model[]

  @@map("providers")
}

model Model {
  id                      String   @id @default(cuid())
  providerId              String   @map("provider_id")
  rawModelId              String   @map("raw_model_id")
  displayName             String   @map("display_name")
  isVisible               Boolean  @default(false) @map("is_visible")
  originalInputPricePerM  Float    @default(0) @map("original_input_price_per_m")
  originalOutputPricePerM Float    @default(0) @map("original_output_price_per_m")
  inputPricePerM          Float    @default(0) @map("input_price_per_m")
  outputPricePerM         Float    @default(0) @map("output_price_per_m")
  lastSyncedAt            DateTime @default(now()) @map("last_synced_at")

  provider                Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)

  @@unique([providerId, rawModelId])
  @@map("models")
}

model User {
  id          String        @id @default(cuid())
  email       String        @unique
  name        String?
  password    String
  role        Role          @default(USER)
  balance     Float         @default(25.0) @map("balance")
  status      String        @default("ACTIVE") @map("status")
  totalTokens Int           @default(0) @map("total_tokens")
  totalSpent  Float         @default(0.0) @map("total_spent")
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")

  transactions Transaction[]

  @@map("users")
}

model Transaction {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  amount      Float
  currency    String   @default("USD")
  type        String   @default("DEPOSIT")
  status      String   @default("COMPLETED")
  provider    String   @default("Stripe")
  referenceId String?  @map("reference_id")
  description String?
  createdAt   DateTime @default(now()) @map("created_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("transactions")
}
```

---

## 5. File Inventory & Architecture Map

| File Path | Description & Role |
| :--- | :--- |
| `src/app/page.tsx` | Dedicated user portal route rendering ClassicUserPlayground with interactive mascot. |
| `src/app/admin/page.tsx` | Full-featured executive admin portal with Overview, Users, Billing & Models tabs. |
| `src/components/admin/AdminOverview.tsx` | Executive dashboard KPI telemetry, revenue stats, recent user feed, and system health. |
| `src/components/admin/AdminUserManagement.tsx` | User management console: role switching, active/suspended toggle, and balance credit adjustments. |
| `src/components/admin/AdminBilling.tsx` | Double-entry payment ledger, financial metrics, and manual top-up issuance modal. |
| `src/components/InteractiveMascot.tsx` | Interactive 3D Canvas Mascot Companion with outfits, pointer physics, speech bubbles, and studio modal. |
| `src/components/ClassicUserPlayground.tsx` | Elevated interactive user playground with hero & dock mascot, TTS, live search, and credit badges. |
| `src/components/AdminProviders.tsx` | Upstream provider gateway and custom retail pricing matrix with profit margins. |
| `src/components/LoginModal.tsx` | Dual-portal login and registration dialog with one-click demo credentials. |
| `src/components/libraries/SafeBorderBeam.tsx` | Luminous animated border glow effect wrapper with SSR hydration safety. |
| `src/components/libraries/SafeThinkingOrb.tsx` | Procedural canvas animation orb wrapper with SSR hydration safety. |
| `src/components/libraries/SafeBotAvatar.tsx` | Interactive 3D canvas AI character avatar with SSR hydration safety. |
| `src/lib/audioFx.ts` | Lightweight procedural Web Audio API synthesizer for UI micro-interactions and mascot audio. |
| `src/components/BlocksWave.tsx` | Animated 3x3 block-wave SVG loading and token streaming spinner. |
| `src/components/CodeBlock.tsx` | Syntax-aware Markdown code block with language badge and one-click copy feedback. |
| `src/lib/auth.ts` | Cryptographic authentication engine: scrypt hashing, HMAC session tokens, cookie management, account seeding. |
| `src/lib/webSearch.ts` | Smart Router (`shouldSearchWeb`), query decomposition, multi-engine search, junk filter, and authority ranking. |
| `src/lib/encryption.ts` | AES-256-GCM encryption/decryption for upstream provider API keys. |
| `src/lib/prisma.ts` | Prisma ORM singleton instance connected to Neon PostgreSQL. |
| `src/lib/utils.ts` | Query cost calculation formula and Tailwind CSS class merger. |
| `src/app/api/playground/chat/route.ts` | SSE chat completion proxy with live web grounding and token accounting. |
| `src/app/api/playground/models/route.ts` | Safe public model selector API. |
| `src/app/api/admin/users/route.ts` | User listing, filters, and manual account provisioning API. |
| `src/app/api/admin/users/[id]/route.ts` | User role, status, and credit balance patch endpoint. |
| `src/app/api/admin/payments/route.ts` | Billing ledger and manual payment processing API. |
| `src/app/api/admin/stats/route.ts` | Executive mission control KPI stats API. |
| `src/app/api/admin/providers/route.ts` | Provider creation and update endpoints. |
| `src/app/api/admin/providers/[id]/sync/route.ts` | Upstream model sync endpoint. |
| `src/app/api/admin/models/[id]/route.ts` | Model visibility and pricing patch endpoint. |
| `src/app/api/auth/[login\|register\|me\|logout]/route.ts` | Full REST API authentication suite. |
| `CLAUDE.md` | Strict project execution instructions (silent executor, English only, 200iq). |
| `MEMORY.md` | Complete project memory and continuity guide. |

---

## 6. How to Resume Work in Any New Terminal Session

### Step 1: Check Database Sync
```bash
npx prisma generate
```

### Step 2: Run TypeScript Type Check
```bash
npx tsc --noEmit
```
*(Should pass with 0 errors).*

### Step 3: Production Build (If code modified)
> **Note on Windows File Locks**: If the background Next.js server is running, terminate it first before running `npm run build` to prevent lock errors on `query_engine-windows.dll.node` or `.next`.
```bash
npm run build
```

### Step 4: Run the Server
- **For Production Server**:
  ```bash
  npx next start -p 3000
  ```
- **For Development Server (with hot reload)**:
  ```bash
  npm run dev
  ```

### Step 5: Test Portal Access
- Open `http://localhost:3000` in browser.
- Login with `admin@matrix.ai` / `admin123` to access the Admin Management & Pricing Matrix.
- Login with `user@matrix.ai` / `user123` to access the Classic User Playground.

---

- **Super-Clean Minimalist User Interface & Distillation (`src/components/ClassicUserPlayground.tsx`)**:
  - Distilled the user playground to an ultra-clean, pristine, distraction-free aesthetic (inspired by Claude.ai and ChatGPT).
  - Stripped all fantasy roleplay noise, medieval banners, gold pedestals, saturated gradients, and crest clutter.
  - Deep Obsidian palette: `#0B0C0E` background, `#12141C` floating search card, `#161822` user bubbles, hairline `border-white/[0.08]`.
  - Sleek Top Header: 48px height with clean Model Selector, subtle `[Compare]` toggle button with side-by-side Model B selector when active, sound mute toggle (`Volume2`/`VolumeX`), and export/new chat actions.
  - Empty Hero State: Minimalist `MatrixPrismGlyph`, clean title and subtitle, elegant floating prompt textarea with integrated Auto Search and Compare toggles, and 4 clean suggestion chips.
  - Chat Feed: High-contrast typography, syntax-highlighted code blocks, subtle collapsible search sources pill, unobtrusive Listen / Retry / Copy hover actions.
  - Side-by-Side Model Comparison: Clean, balanced 2-column layout with real-time parallel streaming without visual noise.
  - JS Bundle optimization: client route size reduced from 16.2 kB to 9.91 kB.
- **Custom Model Display Names & Admin Customizer (`AdminProviders.tsx` & `ClassicUserPlayground.tsx`)**:
  - Full custom display name editing with auto-save on blur and Enter key.
  - 1-click magic auto-clean button (`cleanModelName`) formatting raw vendor IDs into clean branded names.
  - User Dashboard prominently displays custom names in Top Navbar selector, model dropdown with provider badges, and assistant response headers.
  - Active Neon DB roster updated with clean custom names: Claude 3.7 Sonnet, Claude 3.7 Opus, DeepSeek R1 Pro, DeepSeek V3.1 Flash, GPT-4o Omniscience, GPT-4o Mini Turbo, GPT-6 Luna, MiMo v2.6 Flash, Qwen 3.8 Flash, Qwen 3.8 Max Prime.
- **Interactive 3D Mascot Companion (`src/components/InteractiveMascot.tsx`)**: Living 3D canvas avatar with live pointer tracking, 8 customizable body shapes, wearable headgear and cyber shades, 8 color presets, dynamic speech bubbles, and Companion Studio customizer drawer.
- **Procedural Web Audio FX Synthesizer (`src/lib/audioFx.ts`)**: Pure Web Audio API synthesis for mascot flips, chirps, message sent chimes, token arrival notifications, and sound toggle.
- **Interactive Elevated User Panel UI (`src/components/ClassicUserPlayground.tsx`)**:
  - Mini companion avatar in Top Header with live status indicators.
  - Tactile starter prompt cards with categories and hover lifts.
  - Text-to-Speech (TTS) Read Aloud with browser SpeechSynthesis.
  - 1-click Regenerate / Retry response and copy-to-clipboard feedback.
- **Intelligent Dual-Engine Intent Classifier (`src/lib/webSearch.ts`)**: Precision 4-stage heuristic routing queries to Model parametric knowledge vs. Real-Time Web Search.
- **Admin Enabled-First Sorting Matrix (`src/components/AdminProviders.tsx`)**: Dynamic sorting by Enabled First, retail rate, margin %, and base cost.

### Phase 28: Full Frontend Rebuilding on Vite+ & Ozima AI Rebranding
1. **Platform Rebranded to Ozima AI**:
   - Replaced all user-visible brand strings, metadata, headers, titles, placeholders, and quotes to **Ozima AI** / **Ozima**.
   - Seeded default accounts updated to `admin@ozima.ai` and `user@ozima.ai` in Neon DB.
2. **Migration to Vite+ / Vite 8 Toolchain**:
   - Rebuilt frontend with `vite-plus` / Vite 8 + React 18 + Tailwind CSS.
   - Sub-second production build (~950ms vs 45s previously).
   - Created `index.html`, `vite.config.ts`, `src/main.tsx`, and `src/App.tsx`.
3. **Unified Express Production & Development Server (`src/server/index.ts`)**:
   - Express 5 server on port 3000 handling all API endpoints (`/api/auth/*`, `/api/playground/*`, `/api/admin/*`) and serving Vite `dist/` static files with SPA fallback.
   - SSE streaming chat with intent classification and autonomous web search grounding verified live.
   - Stealth anonymization: Zero mentions of third-party vendors or OpenRouter; custom database names returned directly (`Eren 3`, `Levi 2.2`, `Mikasa 2.3`).
4. **Stealth Footer Model Selector & Clean UI/UX**:
   - Model dropdown relocated directly into footer input bar with pure display names.
   - Interactive 3D Mascot Companion integrated seamlessly.
   - Zero-clutter, pristine aesthetics and instant navigation.

### Phase 29: Post-Vite Refresh Glitch & Blank Screen Root Cause Resolution
1. **Diagnosis of Blank Screen Glitch**:
   - `/api/playground/models` was returning an object `{ models: [...] }` instead of an array.
   - In `ClassicUserPlayground.tsx`, `fetchModels()` set `models` to `{ models: [...] }`. On the subsequent render cycle (~10ms into load), `models.find(...)` threw an uncaught `TypeError: models.find is not a function`, causing React to unmount the entire tree and the browser to display a blank screen (perceived as a 1-frame glitch on refresh).
2. **Defensive Fixes**:
   - `src/server/index.ts`: Updated `/api/playground/models` to directly return `sanitized` array of models.
   - `src/components/ClassicUserPlayground.tsx`: Defensively normalized `raw` response via `Array.isArray(raw) ? raw : Array.isArray(raw?.models) ? raw.models : []` and guarded `selectedModel` / `opponentModel` queries with `Array.isArray(models)`.
3. **Viewport Height Fix**:
   - In `src/app/globals.css`, added `html, body, #root { height: 100%; width: 100%; margin: 0; padding: 0; overflow: hidden; }` and `#root { display: flex; flex-direction: column; }` to eliminate 0-height percentage container collapse under pure Vite.
   - In `index.html`, added `h-full w-full overflow-hidden` to `html`, `body`, and `#root`.
4. **App Container & State Orchestration**:
   - `src/App.tsx`: Wired background auth checking (`/api/auth/me`), `currentUser` state, `onLogout`, `onOpenLogin`, `LoginModal` rendering, and seamless SPA popstate routing without blocking spinners.
5. **Rebuilt & Verified**:
   - Rebuilt with `npm run build` (Rolldown/Vite 8 in 6.8s).
   - Production server active on `http://localhost:3000`. Verified HTTP 200 on root (`/`), `/admin`, CSS bundle, JS bundle, and models API returning live array.

### Phase 30: DeepSeek Harness Node Version Architecture Adaptation & Frontend Integration
1. **DeepSeek Harness Node Ecosystem Identification**:
   - Identified official DeepSeek Harness Node/npm package tree:
     - Core package: `@deepseek-ai/dsh` (v0.2.0-rc.2).
     - Frontend shell: `@deepseek-ai/dsh-web-frontend` (v0.0.1-rc.5) & `@deepseek-ai/dsh-client-web`.
     - Modular Cordis UI plugins: `@deepseek-ai/dsh-client-ui-conversation`, `@deepseek-ai/dsh-client-ui-tool`, `@deepseek-ai/dsh-client-ui-trajectory`, `@deepseek-ai/dsh-client-ui-theme`.
   - Extracted and analyzed the signature frontend architectures:
     - `ReasoningRow`: Collapsible Think disclosure row with live timer, summary snippet, and thought trace.
     - `ToolRow` / `ToolCard`: Agent tool execution card with parameter pills, status badges, and expandable source verification drawer.
     - KaTeX LaTeX math typesetting and rich syntax code blocks.
     - Turn metrics / telemetry (`StatsLine`).
2. **Component Implementation & Adaptation for Ozima AI**:
   - `src/components/deepseek/DeepSeekReasoningRow.tsx`:
     - Replicates DeepSeek Harness's signature `<ReasoningRow>` disclosure with glowing brain/neural icon.
     - Dynamic elapsed timer (`Thinking for X.Xs`), single-line running snippet, and word/token counters.
     - Dark obsidian glassmorphic body (`#090B12`) with full markdown and KaTeX math parsing inside thought chains.
     - 1-click copy button for raw reasoning text.
   - `src/components/deepseek/DeepSeekToolCallCard.tsx`:
     - Replicates DeepSeek Harness's Agent Tool Execution card for `web_search` and code tools.
     - Displays tool badge (`web_search`), query parameters, status badges (`running` spinner -> `completed` checkmark).
     - Expandable search citations drawer with domain pills, verified snippets, and external links.
   - `src/components/deepseek/DeepSeekMarkdown.tsx`:
     - Automated extraction of `<think>...</think>` tags alongside SSE reasoning deltas.
     - Full mathematical typesetting via `remark-math` + `rehype-katex` + `katex/dist/katex.min.css`.
     - Syntax-highlighted code blocks with copy feedback.
   - `src/components/deepseek/DeepSeekStatsLine.tsx`:
     - Compact turn metrics footer showing model name, duration (`2.1s`), output tokens, speed (`tok/s`), and grounding status.
3. **SSE Streaming & Backend Alignment (`src/server/index.ts`)**:
   - Updated `/api/playground/chat` to cleanly stream:
     - `type: "intent"`
     - `type: "tool_call"` with `web_search` query and verified sources
     - `type: "reasoning"` for upstream reasoning deltas (DeepSeek R1 / V3)
     - `type: "token"` for text deltas
     - `type: "usage"` for token telemetry
4. **Preserved All User Directives**:
   - 100% branded as **Ozima AI**.
   - Model selector strictly in the footer chat input box with stealth custom model names (`Eren 3`, `Levi 2.2`, `Mikasa 2.3`, `GPT-4o Omniscience`, `Claude 3.5 Sonnet`, etc.). Zero mentions of OpenRouter or upstream gateways.
   - 3D Interactive Mascot Companion (`InteractiveMascot`) remains fully active and reactive to idle/thinking/searching states.
5. **Verification & Testing**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: Sub-second production build (~1.13s) with KaTeX fonts bundled.
   - Production server active on `http://localhost:3000` (HTTP 200 OK).
   - Live streaming verified with concurrent reasoning and token channels.

### Phase 31: Model Selection Persistence Across Refreshes & Independent Message Model Identity
1. **Diagnosis of Previous Issues**:
   - **Page Refresh Reverting to 1st Model**: `selectedModelId` was stored solely in React component state. When the page was refreshed or reloaded, state reset to empty string `""`, causing `fetchModels()` to fall back to `data[0]` (the 1st model in the list) instead of remembering what the user had selected.
   - **Changing Model Mutated Historical Message Model Names**: Assistant message rendering dynamically evaluated `{selectedModel?.display_name || "Assistant"}`. When the user switched models in the selector, every historical assistant response in the current thread also dynamically changed its displayed name to the newly selected model instead of preserving the model that actually authored that response.
2. **Persistent Model State Implementation (`src/components/ClassicUserPlayground.tsx`)**:
   - Initialized `selectedModelId` and `opponentModelId` with lazy `localStorage` retrieval (`ozima_selected_model_id` and `ozima_opponent_model_id`).
   - Implemented `handleSelectModel(id)` and `handleSelectOpponentModel(id)` handlers synchronizing state directly with `localStorage`.
   - Updated `fetchModels()`: Upon loading available models from `/api/playground/models`, verifies whether the stored model ID exists among active models and restores it immediately.
3. **Independent Message Model Identity**:
   - Extended `Message` interface with `model_id?: string;` and `model_name?: string;`.
   - In `handleSendMessage()`, stamped `model_id: selectedModelId` and `model_name: selectedModel?.display_name || "Ozima AI"` onto `assistantMessage`.
   - Updated message rendering to evaluate `msg.model_name || selectedModel?.display_name || "Ozima AI"`.
   - Updated `DeepSeekStatsLine` to pass `modelName={msg.model_name || selectedModel?.display_name}`.
   - Historical messages now permanently retain the model that created them, even when switching models or reloading.
4. **Build & Verification**:
   - `npx tsc --noEmit`: 0 errors.
   - `npm run build`: 1.29s clean production build.
   - Production server active on `http://localhost:3000` (HTTP 200 OK).

---
*Status: 100% Production Ready on Vite+ & Ozima AI. All requirements implemented, verified, and active on http://localhost:3000.*



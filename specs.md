# Spec Driven Development

# Building KalaSetu — AI Virtual Business Manager for Artisans

> *(Working name — rename freely; "Kala" = art/craft, "Setu" = bridge, i.e. the bridge between artisans and the digital market. Swap this out for whatever you want to submit under.)*

## Project Overview

Build a cross-platform **mobile application** that acts as a virtual
business manager for marginalized micro-entrepreneurs, artisans, and
weavers who currently rely on periodic physical exhibitions (Shilp
Samagam, Surajkund Mela, Dilli Haat, etc.) for sales. The app must let
an artisan with low digital literacy — using only a camera and their
voice — turn a handmade product into a fully catalogued, professionally
priced, e-commerce-ready listing, and publish it to a personal
storefront and to larger B2B/government e-marketplace channels.

The three features below are **non-negotiable core deliverables**; the
rest of the spec exists to support them:

1. **AI Image Enhancer & Studio** — camera capture → automatic
   background removal, lighting correction, and e-commerce-standard
   formatting.
2. **Multilingual Auto-Cataloger** — voice note in a regional language
   → NLP pipeline → SEO-friendly product description in English and
   Hindi.
3. **Dynamic Pricing Assistant** — image + description + raw-material
   cost → an ML-informed, competitive price suggestion.

## Tech Stack

**Mobile Frontend:** React Native (Expo, TypeScript), React Navigation,
Zustand for state, NativeWind (Tailwind for RN), i18next for
localization, expo-camera, expo-image-picker, expo-av (voice
recording), expo-file-system (offline capture queue).

**Backend API:** Node.js, Express, MongoDB + Mongoose, JWT auth,
BullMQ on Redis (async AI job queue) with an in-memory fallback,
Multer + Cloudinary (image storage/CDN), helmet, express-validator,
bcryptjs.

**Pricing Microservice:** Python, FastAPI, scikit-learn — a small,
independently deployable service that owns the regression model and
the cost-plus fallback formula. Called by the Node backend over
internal REST; never called directly by the mobile app.

**AI Providers (each wrapped behind a common interface with an
explicit fallback chain — never a single hard dependency):**

| Capability | Primary | Fallback 1 | Fallback 2 (deterministic) |
|---|---|---|---|
| Background removal / photo enhancement | Cloudinary AI Background Removal | Remove.bg API | Self-hosted `rembg` (U²-Net) microservice |
| Speech-to-text (regional languages) | Google Cloud Speech-to-Text | OpenAI Whisper API | Manual text-entry field in-app |
| Translation + description generation | Google Gemini (multimodal: image + transcript) | OpenRouter (multilingual open-weight model) | Template-based description built from category + material + colour tags |
| Price suggestion | FastAPI pricing microservice (trained regression model) | — | Rule-based formula: `raw_material_cost × category_markup + labour_estimate` |

**Marketplace Integrations:** Government e-Marketplace (GeM) and B2B
buyer platforms (e.g. Amazon Karigar, Flipkart Samarth), each wrapped
behind a shared `baseMarketplaceIntegration` interface exposing
`connect`, `status`, and `publish`. Where a sandbox/API key isn't
available, ship a mock provider that implements the same interface so
the rest of the app is fully testable.

## Core Features

- **AI Image Enhancer & Studio** — capture or upload up to 5 photos
  per product; auto-remove background, correct lighting/white balance,
  crop to marketplace-standard aspect ratios; before/after preview
  with a manual "keep original" override.
- **Multilingual Auto-Cataloger** — record a voice note describing the
  product in a regional language; transcribe, translate, and generate
  an SEO-friendly title + description in English and Hindi; artisan
  can review and hand-edit before publishing.
- **Dynamic Pricing Assistant** — analyzes image tags, description,
  category, and entered raw-material cost against market comparables
  to suggest a price range with a plain-language breakdown (material
  cost, suggested margin, market benchmark); always editable, never
  auto-applied.
- **Inventory & Catalog Management** — list, edit, duplicate, archive
  products; stock count; category/material tagging.
- **Marketplace & Storefront Connect** — one-tap publish to a personal
  shareable storefront link, plus optional publish to GeM/B2B channels
  with per-channel status (connected / pending / error).
- **Voice-and-Icon-First UI** — every core action (add product, record
  description, check price, publish) reachable without reading dense
  text, with a persistent language switcher.
- **Orders & Sales Dashboard** — simple list of incoming orders/status
  per channel, and a lifetime/monthly earnings summary.
- **"Sahayak" Voice AI Assistant** — an in-app conversational assistant
  the artisan can talk to in their own language for help with the app,
  order status, and payments. See dedicated section below.

## AI Voice Assistant — "Sahayak"

A second, distinct use of the same speech/NLP pipeline already built
for the auto-cataloger — this is the feature to lead with when asked
to "add more AI," since it extends the accessibility story instead of
bolting on something unrelated.

- **What it does:** the artisan taps a persistent mic button and asks
  a question in their own language — "how do I add a photo", "has my
  order been paid", "why is my listing still pending" — and gets a
  short spoken + text answer in the same language.
- **Scope for the hackathon build:** a constrained intent set (app
  how-to, order/payment status lookup, listing status lookup) rather
  than open-ended chat — keeps it reliable and genuinely demo-able
  instead of an unpredictable open chatbot.
- **Pipeline reuse:** `speechProvider` (STT) → intent classification →
  either (a) a direct DB lookup for status-type questions, or (b)
  `nlpProvider` (Gemini/OpenRouter) for how-to questions, grounded in a
  short fixed FAQ context so it doesn't hallucinate steps → response
  translated back to the artisan's language and read aloud via
  on-device TTS (`expo-speech`).
- **Fallback:** if no LLM key is configured, fall back to matching the
  transcript against the fixed FAQ list and returning the closest
  canned answer — never a hard failure on a missing key.

## Authentication

Phone number + OTP is the primary login path (more accessible than
email/password for this user base); NGO/cluster-facilitator and admin
accounts use email/password. Both issue a JWT. Two roles:

- **artisan** — owns products, orders, and their own storefront.
- **facilitator/admin** — onboards artisans on their behalf, views
  aggregated (non-financial) cluster analytics, cannot see another
  artisan's raw-material cost or earnings unless explicitly shared.

OTP requests are rate-limited per phone number. Session state persists
on-device via Zustand + secure storage; `/auth/me` returns the current
profile and role.

## Frontend Screens

Built on React Navigation with a bottom-tab shell (Home, Catalog,
Orders, Profile) plus stacked flows for capture and publishing.

- **Language & Onboarding** — first-launch language selection (visual,
  not text-list), short voice-guided walkthrough.
- **Login / OTP Verify** — phone entry, OTP input, resend timer.
- **Home Dashboard** — large icon tiles (Add Product, My Catalog,
  Orders, Marketplace Status), recent activity feed.
- **Add Product → Capture** — camera/gallery picker, multi-photo
  capture, category + raw-material-cost quick-entry.
- **AI Studio Preview** — before/after enhanced photos, retry or
  accept per photo.
- **Voice Description Recorder** — record/re-record, live transcript
  preview, language indicator.
- **Product Review & Edit** — auto-generated English + Hindi
  description (editable), auto-suggested price with breakdown
  (editable), final "Publish" action.
- **My Catalog** — grid/list of products with status badges
  (Draft / Published / Out of Stock).
- **Pricing Assistant Detail** — full breakdown of a suggested price
  and how it compares to similar listings.
- **Marketplace Connect** — per-channel connection status, connect/
  reconnect actions, shareable storefront link + QR code.
- **Orders** — list with status, filter by channel.
- **Profile / Settings** — language, notification preferences, scheme/
  cluster info, logout.
- **Sahayak Assistant** — persistent floating mic button (available
  from Home and Catalog), tap-to-ask overlay, spoken + text response.

## Backend Architecture

- **Routes** — HTTP routing, request validation via
  express-validator, auth/error middleware.
- **Controllers** — request parsing and response shaping only; never
  talk to MongoDB or an AI provider directly.
- **Services** — business logic: `productService`, `catalogAIService`
  (orchestrates transcription → translation → description), `pricingService`
  (calls the Python microservice, applies the fallback formula),
  `imageEnhancementService`, `marketplaceService`, `orderService`,
  `assistantService` (Sahayak — intent routing between direct DB
  lookups and `nlpProvider`, reusing `speechProvider`/`nlpProvider`
  rather than adding a new AI dependency).
- **AI Provider Layer** — each capability in the fallback table above
  lives behind one interface file (`visionProvider.js`,
  `speechProvider.js`, `nlpProvider.js`) so swapping or adding a
  provider never touches a controller or route.
- **Marketplace Integrations Layer** — `baseMarketplaceIntegration.js`
  plus one file per channel (`gemIntegration.js`,
  `karigarIntegration.js`, `mockMarketplace.js`).
- **Queues Layer** — BullMQ wrapping Redis for image-enhancement,
  transcription, and pricing jobs (all slow, all async from the
  mobile app's point of view); in-memory queue fallback for local dev.
- **Config Layer** — env vars, MongoDB connection (in-memory fallback
  for local dev), Redis connection.
- **Pricing Microservice (separate deploy)** — FastAPI app exposing
  `POST /predict-price`, owning the scikit-learn model and its
  training data.

## Database Collections

- **Users** — phone (unique), name, role (`artisan` \| `facilitator` \|
  `admin`), preferredLanguage, clusterId, lastLogin.
- **Products** — owner, title (en/hi), description (en/hi), category,
  materials, rawMaterialCost, images (original + enhanced URLs),
  suggestedPrice, finalPrice, status (`draft` \| `published` \|
  `archived`), stockCount, tags.
- **VoiceNotes** — productId, audioUrl, detectedLanguage, transcript,
  translatedTranscript.
- **MarketplaceListings** — productId, provider (`gem` \| `karigar` \|
  `storefront` \| ...), status (`not_connected` \| `pending` \|
  `published` \| `error`), externalListingId, lastSyncedAt.
- **Orders** — productId, buyerInfo, channel, quantity, amount, status
  (`new` \| `processing` \| `shipped` \| `completed` \| `cancelled`).
- **PricingHistory** — productId, suggestedPrice, finalPrice, modelVersion,
  marketComparables, createdAt (used to retrain/evaluate the pricing
  model over time).
- **Notifications** — owner, type, title, message, isRead.
- **AssistantQueries** — owner, transcript, detectedLanguage, intent
  (`how_to` \| `order_status` \| `listing_status`), response, createdAt
  (log used to improve the fixed FAQ set over time).

## API Endpoints

**Auth**
- `POST /api/auth/register` — create artisan/facilitator account.
- `POST /api/auth/otp/request` — request OTP for a phone number.
- `POST /api/auth/otp/verify` — verify OTP, issue JWT.
- `GET /api/auth/me` — current profile.

**Products**
- `GET /api/products` — list current user's products.
- `POST /api/products` — create a draft product.
- `GET /api/products/:id` — fetch product detail.
- `PUT /api/products/:id` — update product fields.
- `DELETE /api/products/:id` — delete a product.
- `POST /api/products/:id/images` — upload raw photo(s).
- `POST /api/products/:id/enhance-image` — run the AI Image Studio
  pipeline on an uploaded photo.
- `POST /api/products/:id/voice-note` — upload a voice recording.
- `POST /api/products/:id/generate-description` — run the multilingual
  auto-cataloger pipeline on the voice note.
- `POST /api/products/:id/suggest-price` — run the dynamic pricing
  assistant.
- `POST /api/products/:id/publish` — mark ready and fan out to
  connected marketplace channels.

**Marketplace**
- `GET /api/marketplace` — list channel connections + status.
- `GET /api/marketplace/oauth/:provider/start` — begin connection flow.
- `GET /api/marketplace/oauth/:provider/callback` — handle callback.
- `POST /api/marketplace/:provider/publish` — publish a product to a
  specific channel.

**Orders & Notifications**
- `GET /api/orders` — list orders across channels.
- `GET /api/orders/:id` — order detail.
- `GET /api/notifications` — list notifications.

**Sahayak Assistant**
- `POST /api/assistant/query` — `{ audioUrl or transcript }` → detects
  intent, resolves via DB lookup or `nlpProvider`, returns
  `{ responseText, responseLanguage, audioReplyUrl }`.

**Pricing Microservice**
- `POST /predict-price` — `{ category, materials, rawMaterialCost, imageTags }`
  → `{ suggestedPrice, priceRange, breakdown }`.

## Folder Structure

**Mobile app**
```
mobile/
└── src/
    ├── components/
    │   ├── CameraCapture/
    │   ├── AIStudioPreview/
    │   ├── VoiceRecorder/
    │   ├── PriceBreakdown/
    │   └── LanguageSwitcher/
    ├── screens/
    │   ├── Onboarding/
    │   ├── Auth/
    │   ├── Home/
    │   ├── AddProduct/
    │   ├── Catalog/
    │   ├── Marketplace/
    │   ├── Orders/
    │   └── Profile/
    ├── navigation/
    ├── store/
    │   ├── authStore.ts
    │   └── productStore.ts
    ├── services/
    │   ├── api.ts
    │   └── offlineQueue.ts
    └── i18n/
```

**Backend**
```
server/
└── src/
    ├── config/
    │   ├── env.js
    │   ├── db.js
    │   └── redis.js
    ├── routes/
    │   ├── authRoutes.js
    │   ├── productRoutes.js
    │   ├── marketplaceRoutes.js
    │   └── orderRoutes.js
    ├── controllers/
    ├── services/
    │   ├── catalogAIService.js
    │   ├── imageEnhancementService.js
    │   ├── pricingService.js
    │   ├── marketplaceService.js
    │   └── assistantService.js
    ├── providers/
    │   ├── visionProvider.js
    │   ├── speechProvider.js
    │   └── nlpProvider.js
    ├── integrations/
    │   ├── baseMarketplaceIntegration.js
    │   ├── gemIntegration.js
    │   └── mockMarketplace.js
    ├── models/
    ├── queues/
    └── jobs/
```

**Pricing microservice**
```
pricing-service/
├── app/
│   ├── main.py
│   ├── model.py
│   └── fallback.py
└── data/
    └── seed_prices.csv
```

## Development Phases

- **Phase 1** — Project setup: Expo app shell, Express + MongoDB (with
  in-memory fallback), OTP authentication end-to-end, bottom-tab
  navigation, language selection.
- **Phase 2** — Product CRUD, camera capture, image upload to
  Cloudinary, catalog list/detail screens.
- **Phase 3** — AI Image Enhancer & Studio: background removal +
  correction pipeline with the fallback chain, before/after preview.
- **Phase 4** — Multilingual Auto-Cataloger: voice capture →
  transcription → translation → bilingual description generation,
  with review/edit screen.
- **Phase 5** — Dynamic Pricing Assistant: stand up the FastAPI
  pricing microservice, wire the Node backend to it, build the
  breakdown UI, implement the deterministic fallback formula.
- **Phase 6** — Marketplace Connect (GeM + mock provider), storefront
  link/QR sharing, orders list, notifications, BullMQ job queue for
  all async AI calls.
- **Phase 7 (Enhancement) — "Sahayak" Voice Assistant** — intent
  classification (how-to / order status / listing status), the fixed
  FAQ grounding context, DB-lookup path for status questions,
  `nlpProvider` path for how-to questions, on-device TTS playback, and
  the floating mic UI. Built last since it depends on auth, products,
  and orders already existing to answer against.

## Future Scope

Beyond the core build, these extend the AI feature set further —
listed here rather than built, since each needs data or a model the
hackathon timeline doesn't support, but they're worth naming in a
presentation to show a clear growth path:

- **AI Trend & Design Advisor** — suggests trending colors, patterns,
  or product variations based on what's currently selling well, so
  artisans can adapt designs instead of only listing what they already
  made. Needs real marketplace trend data to be credible.
- **AI Authenticity / "Handmade Verified" Badge** — computer vision
  flags visible product defects and issues a trust badge, tying into
  the government's push on authenticated/GI-tagged craft. Needs a
  trained defect-detection model, not a quick integration.
- **Demand Forecasting** — predicts seasonal/festival demand spikes so
  artisans can stock up ahead of time. Needs historical sales data the
  platform won't have until it's been running for a while.

## UI and UX Requirements

Minimalist, icon-and-voice-first design; large touch targets (min
48dp); every screen usable with the language set at onboarding; loading
and skeleton states for every AI call, since enhancement/description/
pricing are all async; offline-tolerant capture (photos and voice
notes queue locally and upload when connectivity returns); high-contrast,
accessible color palette; no screen should require more than a few
words of reading to complete its primary action.

## Security Requirements

Hash any password-based credentials with bcrypt at cost 12; sign/verify
JWTs with `JWT_SECRET`; rate-limit OTP requests per phone number;
encrypt marketplace OAuth tokens at rest with
`CREDENTIAL_ENCRYPTION_KEY`; validate every upload (file type, size
limit) before it reaches the AI pipeline; never expose an artisan's
raw-material cost or margin to another artisan or to the public
storefront view; apply CORS limited to the mobile app's known origin;
treat a missing/expired marketplace credential as an explicit
`MARKETPLACE_NOT_CONNECTED` / `AUTH_EXPIRED` error rather than a
generic failure.

## Final Expected Outcome

An artisan opens the app, picks their language, photographs a product,
records a short voice description, and within a few screens has an
AI-enhanced photo, a bilingual SEO-ready description, and a
transparent price suggestion — all editable — ready to publish to a
personal storefront and to any connected marketplace channel, with no
typing required beyond optional edits. The app should feel like a
"virtual business manager in your pocket," replacing dependence on
periodic physical fairs with a continuous digital sales channel.

## Codex & AI Agent Implementation Instructions

Build phase by phase and do not skip ahead. Follow the folder structure
strictly. Keep controllers thin; all business logic lives in services.
Every AI provider call goes through its provider/integration file —
never call an external AI API directly from a service or controller.
Implement every fallback in the table above; do not ship a feature that
hard-fails when one provider key is missing. Treat every secret as
`process.env`. Use in-memory Mongo/Redis fallbacks so local development
works without external services. Never expose `rawMaterialCost` or
`suggestedPrice` breakdowns outside the owning artisan's session. Emit
a job-status event (or poll-able status field) for every async AI
pipeline step so the mobile UI can show accurate loading states.
Report the list of files created or changed at the end of every phase.
For Sahayak specifically: it must reuse `speechProvider` and
`nlpProvider` rather than introducing a new AI dependency, and its
how-to answers must be grounded in the fixed FAQ context — do not let
it free-answer outside that scope.

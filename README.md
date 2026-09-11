# 🎨 KalaSetu (कला सेतु) — AI Virtual Business Manager for Artisans

> **Empowering traditional Indian artisans through voice-first multilingual AI, studio-grade computer vision, dynamic pricing intelligence, and seamless e-marketplace integration.**

---

## 🌟 Overview

**KalaSetu** (*Bridge of Art*) is an end-to-end AI-powered Virtual Business Manager built for rural and semi-urban artisans across India. It eliminates the digital and linguistic barriers preventing master craftsmen and self-help groups from scaling their busineses online and Marketplaces.

With a voice-first interface, resilient multi-tier fallback architecture, automated studio photography generation, intelligent pricing models, and 1-click marketplace catalog syndication, KalaSetu transforms how traditional crafts reach global buyers.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["📱 Client Layer (React Native / Expo SDK 57)"]
        Mobile["KalaSetu Mobile App\n(Expo Go / Android / iOS / Web)"]
        VoiceUI["Voice & Audio Recorders"]
        StudioUI["Before/After Studio Preview"]
        PriceUI["Interactive Pricing Breakdown"]
    end

    subgraph Backend ["🚀 Backend Services (Node.js & Express)"]
        Gateway["REST API Gateway & Auth (JWT/OTP)"]
        Queue["BullMQ Background Job Queues"]
        DevDB["In-Memory Mongo & Redis Fallback"]
        
        subgraph Providers ["AI & Cloud Provider Multi-Tier Chains"]
            VisionChain["Vision Provider\n(Cloudinary AI ➔ Remove.bg ➔ Local Rembg)"]
            SpeechChain["Speech-to-Text Provider\n(Google Speech ➔ Whisper ➔ Manual)"]
            NLPChain["Multilingual NLP Provider\n(Gemini ➔ OpenRouter ➔ Templates)"]
            MarketplaceSync["Marketplace Integrations\n(GeM API ➔ Mock Sandbox ➔ Storefront)"]
        end
    end

    subgraph Microservices ["🐍 Python FastAPI Intelligence"]
        PricingAPI["Pricing Microservice\n(Scikit-Learn Regression + Cost-Plus Formula)"]
    end

    Mobile -->|REST API| Gateway
    Gateway --> Queue
    Gateway --> VisionChain
    Gateway --> SpeechChain
    Gateway --> NLPChain
    Gateway --> MarketplaceSync
    Gateway -->|Internal REST| PricingAPI
    Gateway -.->|Dev Fallback| DevDB
```

---

## ✨ Key Features & Capabilities

### 1. 🎙️ Multilingual Voice-First Onboarding & Auth
- Passwordless phone number + OTP authentication.
- Seamless dialect and language switching (English, Hindi, and regional languages).
- Designed for low-literacy users with high-contrast tactile cards and audio feedback.

### 2. 📸 AI Studio & Image Enhancement Engine
- Studio-quality photo enhancement and transparent background generation.
- **Resilient 3-Tier Fallback Strategy**:
  1. *Primary*: Cloudinary AI Background Removal & Generative Fill.
  2. *Secondary*: Remove.bg API integration.
  3. *Deterministic Fallback*: Local / self-hosted `rembg` service.
- Interactive **Before / After** visual comparison slider.

### 3. 🗣️ Multilingual Auto-Cataloger
- One-touch voice recording in Hindi / English describing the craft.
- **Voice Transcription Pipeline**: Google Cloud Speech-to-Text $\rightarrow$ OpenAI Whisper $\rightarrow$ Manual transcript entry.
- **Multilingual NLP Synthesis**: Google Gemini $\rightarrow$ OpenRouter $\rightarrow$ Rule-based catalog templates.
- Automatically generates titles, story-driven cultural descriptions, artisan care instructions, and search tags in English and Hindi with full editability before publishing.

### 4. 🏷️ Dynamic Pricing Assistant
- Standalone Python FastAPI microservice with pre-trained regression modeling based on craft categories, materials, and artisan labor hours.
- Automatic **deterministic cost-plus formula fallback** ($Material + Labor \times Rate + Overhead + Margin + Tax$) when offline or disconnected.
- Transparent price breakdown visualizer explaining profit margins, craft complexity, and platform commission.

### 5. 🌐 Marketplace Connect & Instant Web Storefront
- 1-click catalog syndication to **Government e-Marketplace (GeM)** and marketplace sandbox channels.
- Instant public web storefront generation with downloadable buyer QR codes and shareable links for WhatsApp & social commerce.
- Live order status dashboard with revenue analytics and tracking.
- Background asynchronous processing with **BullMQ** so slow AI tasks never freeze the artisan's mobile interface.

---

## 📁 Repository Structure

```
KalaaSetu/
├── mobile/                   # React Native (Expo SDK 57, TypeScript, Zustand, i18n)
│   ├── assets/               # Branding icons, splashes, illustrations
│   ├── src/
│   │   ├── components/       # Reusable UI cards, sliders, inputs, banners
│   │   ├── navigation/       # React Navigation bottom tabs & auth stacks
│   │   ├── screens/          # Catalog, Studio, Pricing, Orders, Marketplace screens
│   │   ├── services/         # Axios API client with dynamic LAN IP auto-discovery
│   │   └── store/            # Zustand global state management
│   ├── app.json              # Expo application configuration & plugins
│   └── package.json          # Dependencies aligned to Expo SDK 57
│
├── server/                   # Node.js Express REST API & Orchestrator
│   ├── src/
│   │   ├── config/           # Database, Redis, Cloudinary, & JWT configs
│   │   ├── controllers/      # Thin controller layer
│   │   ├── middleware/       # JWT Auth, error handler, rate limiters
│   │   ├── models/           # Mongoose schemas (Artisan, Product, Order, Log)
│   │   ├── providers/        # Multi-tier AI vision, speech, and NLP fallback chains
│   │   ├── queues/           # BullMQ background workers
│   │   ├── routes/           # REST API endpoints (/api/v1/...)
│   │   └── services/         # Core business logic & pricing orchestrator
│   └── package.json
│
├── pricing-service/          # Python FastAPI Dynamic Pricing Microservice
│   ├── app/
│   │   ├── main.py           # FastAPI application endpoints
│   │   ├── model.py          # Scikit-learn regression pricing model
│   │   └── fallback.py       # Deterministic cost-plus rule-based engine
│   └── requirements.txt      # FastAPI, Uvicorn, Scikit-learn, Pydantic
│
├── .env.example              # Centralized environment variable template
├── .gitignore                # Production git exclusion rules
├── specs.md                  # Comprehensive engineering & phase specifications
└── README.md                 # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python](https://www.python.org/) (v3.10+ recommended)
- [Expo Go](https://expo.dev/go) app installed on your physical mobile device (or iOS / Android simulator / Web browser)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Kaustubhh-Deshmukh-Git/KalaSetu.git
cd KalaSetu
```

---

### Step 2: Configure Environment Variables
Copy the `.env.example` file to create your server `.env`:
```bash
cp .env.example server/.env
```
*(Note: KalaSetu is engineered to run seamlessly in local development out-of-the-box using in-memory MongoDB and Redis fallbacks even if external API keys are not supplied!)*

---

### Step 3: Start the Backend Server
```bash
cd server
npm install
npm start
```
> The server will start on `http://localhost:5000` (with in-memory MongoDB & Redis fallback initialized automatically).

---

### Step 4: Start the Dynamic Pricing Microservice
In a new terminal window:
```bash
cd pricing-service
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
> The pricing service will start on `http://localhost:8000`.

---

### Step 5: Start the Mobile Application
In a new terminal window:
```bash
cd mobile
npm install
npx expo start
```
- **Run on Physical Phone**: Scan the displayed QR code using the **Expo Go** app on your phone (ensure phone is on the same Wi-Fi network).
- **Run in Web Browser**: Press `w` in the terminal to launch the interactive web preview at `http://localhost:8081`.

---

## 📡 API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/request-otp` | Request phone login OTP |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP and obtain JWT session token |
| `GET` | `/api/v1/products` | Retrieve artisan's product catalog |
| `POST` | `/api/v1/products` | Create product with multilingual descriptions |
| `POST` | `/api/v1/vision/enhance` | Remove background & enhance photo with AI fallback |
| `POST` | `/api/v1/audio/transcribe` | Transcribe artisan voice note (Google / Whisper) |
| `POST` | `/api/v1/audio/catalog` | Generate bilingual catalog from voice / keywords |
| `POST` | `/api/v1/pricing/estimate` | Compute AI / rule-based price recommendation |
| `POST` | `/api/v1/marketplaces/sync` | 1-click sync catalog to GeM / online channels |
| `GET` | `/api/v1/marketplaces/storefront/:artisanId` | Fetch public artisan storefront details |
| `GET` | `/api/v1/orders` | Fetch incoming customer orders and stats |

---

## 🛡️ Reliability & Offline Principles

1. **Zero-Crash Design**: If third-party AI APIs (Cloudinary, Gemini, Google Speech) encounter rate limits or network dropouts, the system gracefully cascades down through deterministic fallbacks without failing the user request.
2. **Local Development Resilience**: Built-in in-memory MongoDB & Redis engines allow testing full end-to-end functionality without requiring local database daemons or external cloud accounts.
3. **Auto-Discovery**: Mobile client dynamically detects the host machine's LAN IP via `Constants.expoConfig?.hostUri`, allowing instant physical device testing on Expo Go without manual IP configuration.

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details. Built with ❤️ for the artisan communities of India.

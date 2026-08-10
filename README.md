# VanishChat — Private Messaging. Zero History.

[![100% Free](https://img.shields.io/badge/100%25%20Free-24%2F7%20Available-10B981?style=flat-square)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![AES-256-GCM](https://img.shields.io/badge/Encryption-AES--256--GCM-8B5CF6?style=flat-square&logo=letsencrypt)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
[![Zero Logs](https://img.shields.io/badge/Logs-Zero-EF4444?style=flat-square)](/)

> **100% Completely Free — 24/7 Available for Everyone.** No credit card, no sign-up, no restrictions.

---

## 🌟 What Is VanishChat?

VanishChat is a privacy-first, real-time encrypted web chat application where **conversations disintegrate after use**. 

There are no accounts, no persistent server logs, and no message history stored. You create a room, invite a partner, and chat securely. When the room timer expires, everything is deleted permanently using particle disintegration effects. Every message and file is encrypted on your device before touching the network — even the servers only see ciphertext.

---

## 🚀 Live Production URL

🌐 **[disappear-chat.vercel.app](https://disappear-chat.vercel.app)**

---

## ✨ Features & Architecture

### 💬 Core Chat
| Feature | Description |
|---|---|
| **Instant Rooms** | Create 2-person encrypted rooms with custom timers (1 min → 24 hrs). Zero signup required. |
| **End-to-End Encryption** | AES-256-GCM encryption with keys derived client-side via PBKDF2 from `roomCode`. |
| **Real-Time Delivery** | Instant message syncing using Supabase Realtime subscriptions. |
| **Burn After Read** | Send individual self-destructing messages that vanish right after reading. |
| **File & Media Sharing** | Encrypted image and document sharing (up to 12 MB). |
| **Accidental Exit Re-Entry Card** | 12-second single-use Re-Entry Card on the Dashboard with a smooth progress bar for accidental exits (works independently for both users and triggers automatically on mobile). |
| **Direct Chat Requests** | Search users by username and send direct encrypted room invitations with real-time toasts. |
| **Sound Notifications** | Audio notifications for incoming messages with header mute toggle. |
| **QR Code Invites** | Generate and scan scannable QR codes for instant room access. |
| **Screenshot Guard** | Deterrent warning overlay when a screenshot attempt is detected. |

---

### ⏱️ Room Lifecycle & Extension
| Feature | Description |
|---|---|
| **Live Countdown Timer** | Real-time countdown displaying remaining room lifetime. |
| **30-Second Warning** | Alert banner when room timer falls below 30 seconds. |
| **30-Second Grace Period** | For rooms 5 minutes or longer, a 30-second grace period triggers on expiry allowing a last-chance time extension before termination. |
| **Extend Time Voting** | Both participants can request/approve room extension (+15 mins) featuring a live 15-second progress bar & auto-cancel timer. |
| **Particle Disintegration** | When the room expires, messages disintegrate into particles via an animated Thanos snap effect. |

---

### 🔗 Secret Links
| Feature | Description |
|---|---|
| **One-Time Secret Links** | Send self-destructing text links that disappear after a single view. |
| **Dynamic Word-Count Timer** | Destruction timer scales proportionally to message length (1 word = 5s, 20 words = 25s). |
| **Zero-Knowledge Hash** | Decryption key resides exclusively in the URL `#hash` fragment and is never sent to any server. |

---

## 🔒 Security Architecture

### Client-Side E2E Encryption
Messages are encrypted in the browser using the **Web Crypto API** (AES-256-GCM + PBKDF2) before being stored or broadcast:

```
Sender Text → AES-256-GCM Encrypt (PBKDF2 Room Key) → Supabase (Stores Ciphertext + IV only)
                                                                 ↓
Recipient Text ← AES-256-GCM Decrypt (Same PBKDF2 Key) ← Supabase Realtime Sync
```

### The 7 Advanced Security Features
1. **Forward Secrecy**: Per-session ephemeral key rotation every 5 minutes.
2. **Encrypted Typing Signals**: Encrypts typing indicators over the wire.
3. **Device Fingerprint Warning**: Detects mid-session device changes to prevent session hijacking.
4. **Dead Man Switch**: Automatically destroys inactive rooms after 7 minutes of total inactivity (with a 90-second lock screen).
5. **Clipboard Auto-Clear**: Automatically clears copied chat text from clipboard after 10 seconds.
6. **Access Lock**: Frosted glass blur screen overlay after inactivity to protect open screens.
7. **Multi-Tab Session Protection**: Prevents duplicate tab sessions per room using `BroadcastChannel`.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + Vite 8 |
| **Router** | React Router DOM v7 |
| **Backend & Realtime** | Supabase (PostgreSQL + Realtime Presence & Broadcast) |
| **Storage** | Supabase Storage (`room-files` bucket for encrypted media) |
| **Encryption** | Web Crypto API (AES-256-GCM + PBKDF2) |
| **Icons & UI** | Lucide React + Vanilla CSS Tokens |
| **Deployment** | Vercel (Production) |

---

## 💻 Local Development Setup

### 1. Clone Repository
```bash
git clone https://github.com/Nithin1614/Disappear-Chat.git
cd Disappear-Chat/vanish-chat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure `.env`
Create `.env` inside `vanish-chat/`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run Local Server
```bash
npm run dev
```
Open `http://localhost:5173`

---

## 📄 License

MIT — Created by **[Nithin](https://github.com/Nithin1614)**.

*Private Messaging. Zero History.*

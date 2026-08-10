# VanishChat — Private Messaging. Zero History.

> Self-destructing encrypted rooms & secret links. Nothing stays.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vite.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Realtime-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![AES-256-GCM](https://img.shields.io/badge/Encryption-AES--256--GCM-8B5CF6?style=flat-square&logo=letsencrypt)](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto)
[![Zero Logs](https://img.shields.io/badge/Logs-Zero-EF4444?style=flat-square)](/)

---

## What Is VanishChat?

VanishChat is a real-time encrypted messaging app where **every conversation is designed to disappear**. There are no accounts, no message history, no persistent storage. You create a room, you chat, and when the timer runs out — it's gone. Every message is encrypted in your browser before it ever touches the network. The server sees only ciphertext. Nobody else can read your messages, including us.

Built for people who want to communicate privately without installing apps, creating accounts, or leaving a paper trail.

---

## Live Demo

**[vanishchat.vercel.app](https://vanishchat.vercel.app)** *(replace with your actual Vercel URL)*

---

## Features

### Core Chat
| Feature | Description |
|---|---|
| **Instant Rooms** | Create a room with a custom timer (5 min → 24 hrs). No signup needed. |
| **Real-time Messaging** | Messages appear instantly via Supabase Realtime subscriptions. |
| **File & Image Sharing** | Send encrypted files and images (up to 12 MB). All stored encrypted. |
| **Burn After Read** | Send individual messages that self-destruct after the recipient reads them. |
| **Typing Indicators** | See when the other person is typing in real time. |
| **Online Presence** | Live member list showing who's currently in the room. |
| **Sound Notifications** | Notification sound for new messages when the tab is not focused. |
| **QR Code Sharing** | Share room invite link instantly with a scannable QR code. |
| **Screenshot Guard** | Visual warning overlay when the user attempts to screenshot the chat. |
| **Drag & Drop Files** | Drag files directly into the chat to send them. |

### Room Lifecycle
| Feature | Description |
|---|---|
| **Countdown Timer** | Every room has a live countdown. When it hits zero, the room and all messages are deleted. |
| **30-Second Warning** | Red alert banner appears at < 30 seconds remaining. |
| **30-Second Grace Period** | On expiry, a grace period kicks in before final destruction (for rooms > 4 minutes). |
| **Extend Time Voting** | Both users can vote to extend the room timer. Requires consensus. |
| **Particle Disintegration** | When the room expires, messages visually disintegrate into particles (Thanos snap effect using html2canvas pixel slicing). |
| **Room Polling** | Background poll every 4 seconds keeps room state in sync across clients. |

### Secret Links
| Feature | Description |
|---|---|
| **One-Time Secret Links** | Generate a link that shows a message once, then destroys itself forever. |
| **Word-Count Based Timer** | Destruction timer is dynamically based on message length: 1 word → 5s, 2 words → 6s, 3 words → 7s, 10 words → 13s, 20 words → 25s, scaling proportionally. |
| **AES-256-GCM Encrypted** | The message is encrypted in the browser; only the recipient with the link can decrypt it. |
| **Zero-Knowledge** | The decryption key lives in the URL `#fragment` — never sent to the server. |

### Direct Messaging
| Feature | Description |
|---|---|
| **User Search** | Search for other users by username to send a chat request. |
| **Chat Request Flow** | Send and receive direct chat requests with real-time notifications. |
| **Auto-redirect** | When both users accept, they're redirected into a shared encrypted room automatically. |

---

## 🔒 Security Architecture

### Encryption — AES-256-GCM End-to-End

Every message is encrypted **client-side** using the Web Crypto API before it is sent to Supabase. The server stores only encrypted ciphertext and a random IV. The decryption key is derived from the room code using PBKDF2 and is **never transmitted to the server**.

```
Your message → TextEncoder → AES-256-GCM encrypt (key from PBKDF2) → Supabase (stores ciphertext + IV only)
                                                                           ↓
Recipient ← TextDecoder ← AES-256-GCM decrypt (same PBKDF2 key, derived locally) ←
```

For Secret Links, the key lives exclusively in the URL `#hash` fragment — which browsers never send to servers.

---

### The 7 Advanced Security Features

#### 1. Forward Secrecy
Every time you enter a room, a **fresh random AES-256-GCM session key** is generated and shared (encrypted under the base room key) with all participants via Supabase Realtime broadcast. The key rotates every 5 minutes. Old keys are discarded from memory after 2 rotation cycles.

- If a key is ever obtained later, it cannot decrypt past messages.
- Each message stores its `key_epoch` so recipients always know which key to use.
- A `🔄 Session key rotated` toast appears on each rotation.

#### 2. Ephemeral Typing Encryption
Typing indicator signals (`user is typing`) are encrypted with the same AES-256-GCM session key before being broadcast. Even the metadata of "who is typing" never appears in plaintext on the wire.

- Falls back gracefully to plaintext signals if session key hasn't been established yet.
- Completely transparent to the user experience.

#### 3. Device Fingerprint Warning
On join, each participant's browser is passively fingerprinted (screen resolution, timezone, language, platform — no invasive tracking). The fingerprint is included in Supabase Presence metadata. If a participant's fingerprint changes mid-session, an `⚠️ [Name] appears to be on a different device` warning banner appears, indicating a potential impersonation or session hijack attempt.

- Non-invasive — no persistent storage, no cookies, no cross-site tracking.
- Fires only on change, not on first join.

#### 4. Dead Man Switch
If **no activity** is detected in a room for **2 minutes**, the room auto-destroys itself — deleting all messages and marking the room inactive. The timeline:

| Time | Event |
|---|---|
| 0:00 | Inactivity timer starts |
| 1:30 | ⚠️ Yellow toast: "Room closes in 30 seconds. Send a message to keep it alive." |
| 1:50 | 🔴 Live red countdown banner (10 → 0) with "Keep Alive" button |
| 2:00 | Room destroyed, messages deleted, redirect to dashboard |

Activity signals that reset the timer: sending a message, typing, scrolling, mouse movement, or clicking "Keep Alive."

#### 5. Clipboard Auto-Clear
When you copy any text from the chat (Ctrl+C or copy button), the clipboard is automatically **cleared after 10 seconds** to prevent accidental paste of sensitive messages into other apps.

- Only clears if the clipboard still contains what you copied (won't overwrite something you copied elsewhere).
- Shows a `📋 Clipboard cleared for security` toast.
- Fails silently on browsers that restrict clipboard access.

#### 6. Access Lock (Inactivity Lock)
After **60 seconds of inactivity** (no mouse movement, keypress, click, touch, or scroll), the chat content is hidden behind a **frosted glass blur overlay**. Messages cannot be read without clicking to unlock.

- Does not require re-authentication — one click restores the session.
- Designed for cases where you step away from your device.
- Does not lock on tab switch (intentional — too disruptive for normal multi-tab workflows).

#### 7. Multi-Tab Protection
The same user cannot open the same chat room in two browser tabs simultaneously. If a second tab is detected, it is **blocked immediately** with a clear explanation screen. This prevents:
- Duplicate Supabase Realtime subscriptions causing state desync.
- Message echoing or double-delivery.
- Confusion about which tab is the "active" session.

Uses `BroadcastChannel` API on Chrome/Firefox/Edge, with a `localStorage` heartbeat fallback for Safari.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + Vite 8 |
| **Routing** | React Router DOM v7 |
| **Backend / Database** | Supabase (PostgreSQL) |
| **Realtime** | Supabase Realtime (Presence + Broadcast + Postgres Changes) |
| **File Storage** | Supabase Storage (`room-files` bucket) |
| **Encryption** | Web Crypto API — AES-256-GCM + PBKDF2 |
| **UI Icons** | Lucide React |
| **QR Codes** | qrcode.react |
| **DOM Capture** | html2canvas (Thanos snap effect) |
| **Styling** | Vanilla CSS with CSS custom properties (dark theme) |
| **Deployment** | Vercel (SPA rewrites via `vercel.json`) |

---

## Project Structure

```
vanish-chat/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── ChatRequestsNotifier.jsx   # Real-time incoming chat request notifications
│   │   │   ├── CreateSecretLink.jsx       # Secret link generator with word-count timer
│   │   │   ├── UserSearch.jsx             # Search users by username for direct chat
│   │   │   └── UserSetup.jsx              # Username setup on first visit
│   │   ├── chat/
│   │   │   ├── DragDropZone.jsx           # Drag-and-drop file upload overlay
│   │   │   ├── MemberList.jsx             # Online members sidebar
│   │   │   ├── MessageBubble.jsx          # Individual message with decrypt, burn, file support
│   │   │   ├── MessageInput.jsx           # Chat input with burn-after-read toggle
│   │   │   └── TypingIndicator.jsx        # Animated typing indicator
│   │   ├── effects/
│   │   │   └── ThanosSnap.jsx             # html2canvas pixel-slicing disintegration effect
│   │   ├── room/
│   │   │   ├── CreateRoom.jsx             # Room creation form with timer picker
│   │   │   ├── JoinRoom.jsx               # Room join by code
│   │   │   └── QRCodeModal.jsx            # QR invite code modal
│   │   ├── timer/
│   │   │   ├── CountdownBadge.jsx         # Live countdown display
│   │   │   ├── ExtendTimeVote.jsx         # Time extension voting UI
│   │   │   └── ExtendVoteBanner.jsx       # Active vote status banner
│   │   └── ui/
│   │       ├── AccessLockOverlay.jsx      # Frosted glass blur overlay for inactivity lock
│   │       ├── ErrorBoundary.jsx          # Top-level React error boundary
│   │       ├── Header.jsx                 # App header with room controls
│   │       ├── LoadingSpinner.jsx         # Reusable loading spinner
│   │       ├── MultiTabBlockScreen.jsx    # Full-screen block for duplicate tab sessions
│   │       ├── ScreenshotGuard.jsx        # Screenshot attempt detector overlay
│   │       ├── ThemeToggle.jsx            # Dark/light theme toggle
│   │       └── Toast.jsx                  # Toast notification system
│   ├── context/
│   │   ├── ToastContext.jsx               # Global toast state and addToast() provider
│   │   └── UserContext.jsx                # User identity, auth state, display name
│   ├── hooks/
│   │   ├── useAccessLock.js               # 60s inactivity → blur overlay lock
│   │   ├── useClipboardAutoClear.js       # Auto-clear clipboard 10s after copy
│   │   ├── useCountdown.js                # Room expiry countdown with grace period
│   │   ├── useDeadManSwitch.js            # 2-min inactivity → room auto-destroy
│   │   ├── useDeviceFingerprint.js        # Non-invasive browser fingerprinting
│   │   ├── useEncryption.js               # AES-256-GCM encrypt/decrypt via PBKDF2 room key
│   │   ├── useFileUpload.js               # Encrypted file upload/download via Supabase Storage
│   │   ├── useForwardSecrecy.js           # Per-session ephemeral key generation & rotation
│   │   ├── useMultiTabProtection.js       # BroadcastChannel-based duplicate tab blocking
│   │   ├── useNotificationSound.js        # Tab focus awareness + notification sound
│   │   ├── usePresence.js                 # Supabase Presence + encrypted typing signals
│   │   ├── useRealtimeMessages.js         # Supabase Realtime message subscription + send
│   │   └── useThanosSnap.js               # Orchestrates html2canvas pixel disintegration
│   ├── lib/
│   │   ├── constants.js                   # App-wide constants (file size limit, timer thresholds)
│   │   ├── crypto.js                      # Low-level Web Crypto API wrappers
│   │   ├── supabase.js                    # Supabase client initialisation
│   │   └── userIdGenerator.js             # Anonymous persistent user ID (localStorage)
│   ├── pages/
│   │   ├── ChatPage.jsx                   # Main chat room (God component, all features wired)
│   │   ├── Dashboard.jsx                  # User dashboard — create/join rooms, search users
│   │   ├── LandingPage.jsx                # Marketing landing page
│   │   └── SecretLinkPage.jsx             # Secret link reveal & self-destruct page
│   ├── App.jsx                            # Router setup
│   ├── index.css                          # Global CSS, design tokens, dark theme
│   └── main.jsx                           # React entry point
├── vercel.json                            # SPA route rewrite rules for Vercel
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project

### 1. Clone the repo

```bash
git clone https://github.com/Nithin1614/Disappear-Chat.git
cd Disappear-Chat/vanish-chat
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in `vanish-chat/`:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up Supabase

Run the following in your Supabase SQL editor:

```sql
-- Rooms
create table rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  created_at timestamptz default now(),
  expires_at timestamptz,
  duration_minutes integer default 30,
  is_active boolean default true,
  max_members integer default 10
);

-- Messages
create table messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  sender_id text not null,
  encrypted_content text,
  iv text,
  type text default 'text',
  file_url text,
  file_name text,
  file_size bigint,
  file_iv text,
  burn_after_read boolean default false,
  is_read boolean default false,
  key_epoch bigint,
  created_at timestamptz default now()
);

-- Room members
create table room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id) on delete cascade,
  user_id text not null,
  display_name text,
  is_online boolean default true,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

-- Users
create table users (
  id text primary key,
  display_name text,
  created_at timestamptz default now()
);

-- Chat requests
create table chat_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id text not null,
  to_user_id text not null,
  status text default 'pending',
  room_id uuid references rooms(id),
  created_at timestamptz default now()
);

-- Secret links
create table secret_links (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  encrypted_content text not null,
  iv text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Enable Realtime on all tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table room_members;
alter publication supabase_realtime add table chat_requests;
```

Enable Supabase Storage bucket named `room-files` with public read access for encrypted blobs.

### 5. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`

### 6. Deploy to Vercel

```bash
npm run build
```

Or connect your GitHub repo to Vercel for automatic deployments. The included `vercel.json` handles SPA routing rewrites automatically.

---

## How It Works — End to End

```
1. User opens VanishChat → gets an anonymous persistent user ID (localStorage)
2. User creates a room → room saved in Supabase with a countdown timer
3. Room URL is shared → second user joins, both derive the AES-256-GCM key from the room code via PBKDF2
4. useForwardSecrecy generates a fresh random session key → encrypted under base key → broadcast to peers
5. All messages are encrypted in-browser with the session key → only ciphertext hits Supabase
6. When the timer hits 0 → grace period → Thanos snap particle disintegration → room + messages deleted
7. If 2 minutes of inactivity → Dead Man Switch destroys the room silently
8. Tab closed / user leaves → marked offline in Supabase Presence
```

---

## Security Properties

| Property | Status |
|---|---|
| End-to-end encryption (AES-256-GCM) | ✅ |
| Zero-knowledge server | ✅ Server stores only ciphertext |
| Forward secrecy (per-session ephemeral keys) | ✅ |
| Encrypted typing metadata | ✅ |
| Device fingerprint change detection | ✅ |
| Inactivity auto-destroy (Dead Man Switch) | ✅ 2 min |
| Clipboard auto-clear | ✅ 10 sec |
| Inactivity screen lock | ✅ 60 sec |
| Multi-tab session protection | ✅ |
| No accounts / no sign-up | ✅ |
| No message logs after room expiry | ✅ |
| Secret link zero-knowledge (key in URL fragment) | ✅ |
| Screenshot guard | ✅ |

---

## Known Limitations

- **Not a replacement for Signal or Wire** — VanishChat runs on Supabase infrastructure. While all message content is E2E encrypted, metadata (who connected to which room IP, timestamps) is visible to Supabase.
- **Key exchange via room code** — The base key is derived from the room code using PBKDF2. Anyone who knows the room code can derive the key. Use the forward secrecy session key rotation for stronger guarantees.
- **Supabase Realtime** — Real-time delivery is managed by Supabase's infrastructure. Availability depends on Supabase uptime.
- **No Perfect Forward Secrecy on Secret Links** — Secret links use a static key embedded in the URL. This is by design for simplicity.
- **Clipboard API** — Auto-clear requires the browser to grant clipboard read permission. Falls back silently when denied.

---

## License

MIT — use it, fork it, improve it.

---

## Author

Built by **Nithin** — [@Nithin1614](https://github.com/Nithin1614)

---

*Private Messaging. Zero History.*

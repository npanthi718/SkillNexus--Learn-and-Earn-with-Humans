# 🎯 SkillNexus Frontend

<p>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Router-6-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" />
  <img src="https://img.shields.io/badge/Axios-HTTP-5A29E4?style=for-the-badge&logo=axios&logoColor=white" />
</p>

Modern React frontend for SkillNexus — a learning marketplace connecting learners and teachers with transparent multi-currency payments, group sessions, and rich messaging.

<p>
  <img src="../docs/assets/ui-overview.svg" alt="UI Overview" />
</p>

## 🚀 Stack
- React 18 + Vite 5
- TailwindCSS 3
- React Router 6
- Axios for API calls
- Framer Motion (animations)

## 📂 Key Screens
- Dashboard: personal hub, requests, offers, wallet, messages
- Request Board: browse learners’ requests
- Teach Board: teachers post offers; learner-side payment preview
- Group Chat: session-based group messaging (after acceptance)
- Wallet: payments as learner and teacher
- Admin: rates, transactions, payouts, bank/QR details

## 🔄 Currency Preview (UI)
- Learner-side preview before accepting a teacher offer (Teach Board and Dashboard)
- Shows:
  - You pay: learner currency
  - Platform fee: NPR
  - Net in NPR
  - Teacher receives: teacher currency
- Pipeline: offer currency → USD → NPR (fee) → teacher currency

## 🧭 Dev Setup
1) Node.js 18+ installed
2) Backend running (default 5000)
3) Install and start:

```bash
npm install
npm run dev
```

🔗 Vite dev: http://localhost:5173/

Proxy to backend:
- Configured in vite.config.js
- Set VITE_API_PORT in your environment if backend port is not 5000

```bash
# Example
$env:VITE_API_PORT=5000   # PowerShell
```

## 🧱 Build & Preview
```bash
npm run build
npm run preview
```

## 🗺️ Notable Files
- src/pages/DashboardPage.jsx
- src/pages/RequestBoardPage.jsx
- src/pages/TeachOffersPage.jsx
- src/pages/GroupChatPage.jsx
- src/pages/AdminPage.jsx
- src/contexts/ThemeContext.jsx
- src/components/Toast.jsx
- src/utils/currency.js

## ✅ UX Notes
- Group chat becomes available only after a session is accepted
- “Pay now” shows per group split and payment status
- Admin modal shows NPR-centric conversion and teacher payout

---

## 🧭 Getting Started (UI)
```bash
npm install
npm run dev    # http://localhost:5173
```

Configure backend proxy:
```bash
# PowerShell
$env:VITE_API_PORT=5000
```

## 🧱 Build & Preview
```bash
npm run build
npm run preview
```

## 🎨 Design Principles
- Clean, glassmorphism-inspired UI
- Clear currency labels (NPR-first) with dual display on admin cards
- Minimal friction for “Pay now” and wallet review
- Accessible components and responsive layout

## 🔎 Notable Paths
- src/pages/DashboardPage.jsx
- src/pages/RequestBoardPage.jsx
- src/pages/TeachOffersPage.jsx
- src/pages/GroupChatPage.jsx
- src/pages/AdminPage.jsx
- src/utils/currency.js

## 👤 Owner · Contact
**Sushil Panthi**

<p>
  <a href="tel:+919359029905"><img src="https://img.shields.io/badge/📞%20Call-+91%2093590%2029905-2E7D32?style=for-the-badge" /></a>
  <a href="https://wa.me/9779823009467"><img src="https://img.shields.io/badge/💬%20WhatsApp-+977%2098230%2009467-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
  <a href="https://www.linkedin.com/in/sushilpanthi/"><img src="https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://github.com/npanthi718"><img src="https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
  <a href="https://www.sushilpanthi.com/"><img src="https://img.shields.io/badge/🌐%20Portfolio-Visit-0A66C2?style=for-the-badge" /></a>
</p>


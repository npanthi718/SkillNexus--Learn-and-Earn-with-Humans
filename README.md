# 🌐 SkillNexus — Learn, Teach, Earn

<p>
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Backend-Node%20%2B%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Uploads-Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
</p>

SkillNexus connects learners and teachers worldwide with transparent payments, group learning, and real-time messaging — built with an NPR-centric accounting pipeline for clarity and fairness.

## 💡 Why SkillNexus?
- Make learning accessible across countries and currencies
- Ensure platform fees are transparent (deducted from NPR)
- Automate teacher payouts in their local currency
- Support solo and group sessions with messaging

## ✨ Core Features
- Requests & Offers: learners post needs; teachers post offers
- Acceptance Flow: teachers accept requests; learners accept offers
- Group Sessions: invite friends; split payments equally or single payer
- Messaging: group chat opens after acceptance
- Wallet: track payments as learner and teacher
- Admin Console: manage currency rates, transactions, bank/QR details, payouts, complaints

## 🧱 Architecture
- Frontend: React 18, Vite 5, Tailwind, Router, Axios
- Backend: Node.js, Express, MongoDB/Mongoose, JWT, Cloudinary uploads
- Currency: buy/sell to USD rates; country→currency mapping in PlatformConfig

## 💱 Currency Pipeline (NPR-Centric)
1) Offer currency → USD using buy rate
2) USD → NPR using sell rate
3) Deduct platform fee from NPR
4) NPR → teacher currency using buy(NPR)/sell(teacher)

Stored on Transaction:
- amountPaid (payer currency)
- amountPaidNPR
- platformFeeAmountNPR
- teacherAmountNPR
- nprToPayoutRate
- payoutAmount

Admin payout:
- Defaults to teacherAmountNPR × [buy(NPR)/sell(payout)]
- Fee override recalculates NPR fee and net NPR

## 🛠️ Getting Started
Prereqs:
- Node.js 18+
- MongoDB (Atlas or local)
- Cloudinary account

Setup:
```bash
# Backend
cd backend
npm install
copy .env.example to .env  # create your env with secrets
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

🔗 Frontend: http://localhost:5173/  
🔗 Backend: http://localhost:5000/

Proxy:
- Vite proxies /api to backend
- Set VITE_API_PORT if backend is not 5000

## 🔐 Environment (Backend)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secure-secret
ADMIN_EMAIL=admin@skillnexus.com
ADMIN_PASSWORD=change-this
ADMIN_NAME=Platform Admin
CLOUD_NAME=your-cloudinary-name
CLOUD_API_KEY=your-cloudinary-key
CLOUD_API_SECRET=your-cloudinary-secret
PORT=5000
```

## 🧭 Workflows
- Learner pays → amount converts to NPR → platform fee deducted → teacher net NPR auto-converts to their currency
- Group equal split → per-member shares; dashboard indicates unpaid participants; reminders available
- Admin marks payout → rate defaults to buy(NPR)/sell(teacher); history tracked

## 📚 Useful Paths
- Frontend: frontend/src/pages (Dashboard, TeachOffers, RequestBoard, GroupChat, Admin)
- Backend Routes: /api/auth, /api/sessions, /api/group-chats, /api/transactions, /api/admin, /api/platform, /api/upload, /api/complaints, /api/notifications, /api/reviews

## 🧪 Tips
- Configure buy/sell rates and country→currency mapping in Admin → Platform
- Upload QR/bank details for payouts
- Keep secrets out of source control (use .env)

## 👤 Owner · Contact
**Sushil Panthi**

<p>
  <a href="tel:+919359029905"><img src="https://img.shields.io/badge/📞%20Call-+91%2093590%2029905-2E7D32?style=for-the-badge" /></a>
  <a href="https://wa.me/9779823009467"><img src="https://img.shields.io/badge/💬%20WhatsApp-+977%2098230%2009467-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
  <a href="https://www.linkedin.com/in/sushilpanthi/"><img src="https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://github.com/npanthi718"><img src="https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
  <a href="https://www.sushilpanthi.com/"><img src="https://img.shields.io/badge/🌐%20Portfolio-Visit-0A66C2?style=for-the-badge" /></a>
</p>

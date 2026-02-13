# 🛠️ SkillNexus Backend

<p>
  <img src="https://img.shields.io/badge/Node.js-18-339933?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" />
  <img src="https://img.shields.io/badge/Cloudinary-Uploads-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" />
</p>

Node.js + Express API powering SkillNexus: authentication, sessions, group chat, payments, and an NPR-centric currency pipeline for transparent payouts.

## ⚙️ Stack
- Express 4, Node.js 18+
- MongoDB + Mongoose
- JWT auth
- Multer + Cloudinary uploads
- Nodemon for dev

## 📡 API Modules
- /api/auth — signup/login/me/toggle-teacher-mode
- /api/users — profiles, friends
- /api/sessions — requests, offers, acceptance, payment-done, completion
- /api/group-chats — group creation, list/send/edit/delete messages
- /api/transactions — wallet views
- /api/admin — transactions, payouts, complaints
- /api/platform — payment details, currencies (buy/sell rates, country→currency map)
- /api/reviews — session feedback
- /api/complaints — payment disputes
- /api/notifications — system notifications
- /api/upload — profile/video/verification/qr/logo uploads

## 💱 Currency Pipeline (NPR-Centric)
For every paid session:
1) Offer currency → USD using buy rate
2) USD → NPR using sell rate
3) Deduct platform fee from NPR
4) NPR → teacher currency using buy(NPR)/sell(teacher)

Stored on each Transaction:
- amountPaid (payer currency)
- amountPaidNPR
- platformFeeAmountNPR
- teacherAmountNPR
- nprToPayoutRate
- payoutAmount (auto from teacherAmountNPR × NPR→payout rate)

Admin payout defaults:
- Rate: buy(NPR)/sell(payoutCurrency)
- Amount: teacherAmountNPR × rate
- Override fee % recomputes NPR fee and net NPR before payout

## 🔐 Environment
Create backend/.env:
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

Notes:
- Admin user is auto-created if missing (change credentials in production)
- Never commit secrets

## 🧭 Dev Run
```bash
npm install
npm run dev
```
Server: http://localhost:5000/

## 📦 Production
```bash
npm run start
```
Ensure environment variables and MongoDB are set.

## 👤 Owner · Contact
**Sushil Panthi**

<p>
  <a href="tel:+919359029905"><img src="https://img.shields.io/badge/📞%20Call-+91%2093590%2029905-2E7D32?style=for-the-badge" /></a>
  <a href="https://wa.me/9779823009467"><img src="https://img.shields.io/badge/💬%20WhatsApp-+977%2098230%2009467-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" /></a>
  <a href="https://www.linkedin.com/in/sushilpanthi/"><img src="https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" /></a>
  <a href="https://github.com/npanthi718"><img src="https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white" /></a>
  <a href="https://www.sushilpanthi.com/"><img src="https://img.shields.io/badge/🌐%20Portfolio-Visit-0A66C2?style=for-the-badge" /></a>
</p>

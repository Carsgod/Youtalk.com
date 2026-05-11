# YOUTALK - Complete Payment Integration

Full-stack web application with real Stripe payment processing for booking counseling sessions.

## 🚀 Features

**Frontend (HTML/CSS/JS):**
- ✅ Responsive single-page website
- ✅ 4-step booking wizard with progress bar
- ✅ Live counselor availability indicators
- ✅ Real-time form validation
- ✅ Stripe Elements for secure card payments
- ✅ Mobile Money support (MTN, Vodafone, AirtelTigo)
- ✅ Session calendar export (.ics file)
- ✅ Confirmation emails
- ✅ Dark/light theme toggle

**Backend (Node.js/Express):**
- ✅ RESTful API with Express
- ✅ Stripe Payment Intents integration
- ✅ SQLite database for bookings
- ✅ Email confirmations via Nodemailer
- ✅ CORS-enabled for frontend communication
- ✅ Input validation with express-validator
- ✅ Security middleware (Helmet, Compression)

## 📁 Project Structure

```
NEW WEBSITE/
├── index.html              # Main webpage
├── styles.css              # All styles including wizard
├── script.js               # Frontend logic + Stripe integration
├── backend/                # Node.js API server
│   ├── server.js           # Express app entry point
│   ├── package.json        # Dependencies
│   ├── .env.example        # Environment template
│   ├── .gitignore
│   ├── config/
│   │   └── database.js     # SQLite setup
│   ├── models/
│   │   ├── Booking.js      # Booking model
│   │   └── initDb.js       # DB initializer
│   ├── routes/
│   │   ├── payments.js     # Stripe payment endpoints
│   │   ├── payments-mobile.js # Mobile Money endpoints
│   │   └── bookings.js     # Booking CRUD endpoints
│   └── utils/
│       ├── stripe.js       # Stripe SDK wrapper
│       └── email.js        # Nodemailer service
└── storage/                # SQLite database (created automatically)
```

## ⚡ Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:

**For Stripe (cards):**
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

Get keys from: https://dashboard.stripe.com/apikeys

**For Email (Gmail example):**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-digit-app-password
SMTP_FROM=YOUTALK <your-email@gmail.com>
```

**Generate Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Factor Authentication
3. Generate App Password → select "Mail"
4. Use the 16-character password

### 3. Run Backend Server

```bash
cd backend
npm start
```

Server runs on: http://localhost:5000

API health check: http://localhost:5000/api/health

### 4. Open Website

Open `index.html` directly in a browser, or serve it:

**Option A:** Double-click `index.html`

**Option B:** Use a local server (recommended):
```bash
# Python 3
python -m http.server 3000

# Node.js
npx serve -p 3000
```

Then visit: http://localhost:3000

**Note:** The website includes Stripe.js from CDN automatically.

## 🔧 Stipe Setup (Ghana Mobile Money & Cards)

### Enable Mobile Money in Stripe Dashboard

1. Log into Stripe Dashboard
2. Go to Settings → Payment Methods
3. Enable "Mobile Money (M-Pesa, Airtel, MTN)"
4. Enable "Cards"
5. Set currency to GHS for Ghana transactions

### Test Mode vs Live Mode

**Test Mode (default):**
- Use test cards from Stripe docs
- No real charges
- Test phone numbers for mobile money

**Test Card Numbers:**
```
4242 4242 4242 4242  – Visa
4000 0000 0000 9995  – Insufficient funds
4000 0000 0000 3220  – Requires 3D Secure
```

**To go live:**
1. Complete Stripe onboarding
2. Replace test keys with live keys in `.env`
3. Update `STRIPE_WEBHOOK_SECRET` for production webhook
4. Set `NODE_ENV=production`

## 📧 Email Setup Options

**Option 1: Gmail (free, limited)**
- Use SMTP settings above
- Daily limit: ~100 emails

**Option 2: SendGrid (free tier: 100/day)**
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Option 3: Mailgun (free tier: 5,000/month)**
```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@yourdomain.com
SMTP_PASS=your-mailgun-password
```

**Option 4: AWS SES (pay-as-you-go)**
```
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## 🧪 Testing

### Test Card Payments
1. Fill booking wizard → select "Credit/Debit Card"
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry (e.g., `12/30`)
4. Any 3-digit CVV

### Test Mobile Money
- Select "Mobile Money" → choose provider
- Enter any phone number (e.g., `+233 24 123 4567`)
- Submit → "Payment confirmed" (simulated)

### Test Failures
- Use card `4000 0000 0000 9995` → insufficient funds error
- Leave required fields empty → validation errors
- Submit without selecting counselor/time → step validation

### View Bookings
```bash
# Check database
sqlite3 backend/storage/youtalk.db "SELECT * FROM bookings;"

# API endpoint (while server running)
curl http://localhost:5000/api/bookings
```

## 🔐 Security Features

- **CORS restricted** to your frontend domain
- **Helmet.js** HTTP security headers
- **Input validation** on all endpoints
- **SQLite parameterized queries** (no SQL injection)
- **Stripe.js Elements** (card data never touches your server)
- **Environment variables** for secrets
- **Rate limiting** recommended for production

## 📱 Production Deployment

### Option 1: Vercel + Railway (easiest)
- Frontend → Vercel (static hosting)
- Backend → Railway (Node.js)
- Set environment variables in dashboard
- Update `CORS` origin in `server.js`

### Option 2: DigitalOcean / AWS / GCP
```bash
# Clone repo to server
git clone <your-repo>
cd backend
npm install --production

# Set environment
export NODE_ENV=production
export STRIPE_SECRET_KEY=sk_live_...
export SMTP_HOST=...

# Run with PM2
npm install -g pm2
pm2 start server.js --name youtalk-api
```

### Required for Production:
- ✅ SSL certificate (HTTPS)
- ✅ Domain name with DNS
- ✅ Stripe live keys
- ✅ Email service provider
- ✅ Database backup strategy
- ✅ Environment variables secured

## 📊 Database Schema

**bookings** table:
```sql
CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stripe_payment_intent_id TEXT,
    booking_reference TEXT UNIQUE,
    service TEXT NOT NULL,
    counselor_id INTEGER,
    counselor_name TEXT,
    date TEXT,
    time TEXT,
    user_name TEXT,
    user_email TEXT,
    user_phone TEXT,
    user_message TEXT,
    payment_method TEXT,
    payment_status TEXT,
    amount REAL,
    currency TEXT,
    status TEXT,         -- pending/confirmed/failed/cancelled
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/payments/create` | Create Stripe PaymentIntent |
| POST | `/api/payments/confirm` | Confirm payment |
| POST | `/api/payments/capture` | Capture authorized payment |
| POST | `/api/payments/refund` | Create refund |
| GET | `/api/payments/status/:id` | Get payment status |
| POST | `/api/payments/mobile-money` | Process mobile money |
| POST | `/api/bookings` | Create booking (legacy) |
| GET | `/api/bookings/:reference` | Get booking by reference |
| GET | `/api/bookings` | List all bookings (admin) |
| PATCH | `/api/bookings/:reference` | Update booking status |

## 🐛 Troubleshooting

**"Stripe not configured" warning:**
- Add your Stripe publishable key to `script.js` line 201
- Or set `STRIPE_PUBLISHABLE_KEY` constant

**CORS errors:**
- Update `cors.origin` in `server.js` to include your frontend URL
- For local dev: `['http://localhost:3000', 'http://127.0.0.1:5500']`

**Email not sending:**
- Check SMTP credentials in `.env`
- Gmail: Use App Password, not regular password
- Verify 2-Factor Auth is enabled

**Port already in use:**
```bash
# Kill process on port 5000
# Linux/Mac: lsof -ti:5000 | xargs kill -9
# Windows: netstat -ano | findstr :5000
```

**Database errors:**
```bash
# Delete and recreate
rm backend/storage/youtalk.db
cd backend
npm run init-db
```

**Payment fails in test mode:**
- Use Stripe test cards (listed above)
- Ensure STRIPE_SECRET_KEY is a test key (starts with `sk_test_`)
- Check console for error details

## 📚 Resources

- Stripe Docs: https://stripe.com/docs
- Stripe Mobile Money: https://stripe.com/docs/payments/mobile-money
- Nodemailer: https://nodemailer.com/
- Express.js: https://expressjs.com/
- SQLite: https://www.sqlite.org/docs.html

## 📄 License

MIT License - See repository for details.

---

**Built with ❤️ for YOUTALK Ghana**

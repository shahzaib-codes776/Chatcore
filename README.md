# ChatCore

An AI-powered chat widget that any business can embed on their website. It answers visitor questions using the business's own information, captures leads automatically, and gives business owners a full dashboard to manage conversations, branding, and analytics.

Built by [DelVoxe](https://github.com/shahzaib-codes776/delvoxe).

## What it does

- A business owner signs up and adds their business info three ways: typing it directly, uploading a PDF, or importing it straight from their website URL
- They get a one-line embed script to add to their website, with their own brand color and welcome message
- Visitors chat with an AI assistant that answers using only that business's information
- Every conversation is saved with full message history and visible on the dashboard
- If the AI isn't confident in its answer, the business owner is emailed instantly and can reply directly from the dashboard — the visitor sees the reply live in the widget
- Analytics show conversation volume over time
- The chat endpoint is rate-limited to protect against spam and abuse

## Tech stack

| Layer               | Technology                                          |
| ------------------- | --------------------------------------------------- |
| Backend             | Node.js, Express                                    |
| Database            | PostgreSQL                                          |
| Authentication      | JWT, bcrypt password hashing                        |
| AI                  | Google Gemini API                                   |
| Email notifications | Nodemailer (Gmail SMTP)                             |
| Document parsing    | pdf-parse                                           |
| Website import      | axios + cheerio (same-domain crawl, up to 10 pages) |
| Rate limiting       | express-rate-limit                                  |
| Dashboard           | React (Vite), Recharts                              |
| Embeddable widget   | Vanilla JavaScript                                  |

## Project structure

```
chatcore/
├── code/
│   ├── backend/      → API server, database, authentication, AI integration, email, scraping
│   ├── dashboard/     → React dashboard for business owners
│   └── widget/        → Embeddable chat widget (plain JS)
├── planning/          → Requirements and architecture docs
├── design/            → Design references
└── notes/             → Development notes
```

## Security

- Passwords are hashed with bcrypt, never stored in plain text
- Authentication uses JWT tokens
- Each business's data (info, conversations, leads) is isolated — no business can access another's data
- API keys and secrets are kept in environment variables, never committed to the repository
- The public chat endpoint is rate-limited (10 requests/minute per IP) to prevent abuse and protect API quota

## Status: v2.1 (Tier 1 + Tier 2 complete)

### Tier 1 — Foundation

- [x] Secure signup/login
- [x] Business dashboard (add/update business info)
- [x] Embeddable AI chat widget
- [x] Lead capture
- [x] Real AI responses grounded in business data

### Tier 2 — Growth

- [x] PDF document upload (auto-extracts and adds to the knowledge base)
- [x] Website URL import (crawls up to 10 same-domain pages automatically)
- [x] Custom widget branding (color, welcome message)
- [x] Analytics (conversation volume over time)
- [x] Human handoff — AI uncertainty detection, instant email alert, dashboard reply, live widget update
- [x] Rate limiting on the public chat endpoint

### Roadmap (Tier 3)

- [ ] Multi-channel support (WhatsApp, Instagram)
- [ ] CRM integrations
- [ ] Team accounts with roles/permissions
- [ ] Compliance tooling (audit logs, data export/delete)

## Getting started (development)

**Backend:**

```bash
cd code/backend
npm install
# add a .env file with DATABASE_URL, JWT_SECRET, PORT, GEMINI_API_KEY, EMAIL_USER, EMAIL_PASS
node index.js
```

**Dashboard:**

```bash
cd code/dashboard
npm install
npm run dev
```

**Widget:** open `code/widget/test.html` in a browser to test locally.

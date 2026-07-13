# ChatCore

An AI-powered chat widget that any business can embed on their website. It answers visitor questions using the business's own information, captures leads automatically, and gives business owners a simple dashboard to manage it all.

Built by [DelVoxe](https://github.com/shahzaib-codes776/delvoxe).

## What it does

- A business owner signs up and describes their business (services, FAQs, pricing) in a simple dashboard
- They get a one-line embed script to add to their website
- Visitors chat with an AI assistant that answers using only that business's information
- Every conversation is saved as a lead (name, email, message) and visible on the dashboard
- If the AI doesn't have an answer, it says so honestly instead of making one up

## Tech stack

| Layer             | Technology                   |
| ----------------- | ---------------------------- |
| Backend           | Node.js, Express             |
| Database          | PostgreSQL                   |
| Authentication    | JWT, bcrypt password hashing |
| AI                | Google Gemini API            |
| Dashboard         | React (Vite)                 |
| Embeddable widget | Vanilla JavaScript           |

## Project structure

```
chatcore/
├── code/
│   ├── backend/      → API server, database, authentication, AI integration
│   ├── dashboard/     → React dashboard for business owners
│   └── widget/        → Embeddable chat widget (plain JS)
├── planning/          → Requirements and architecture docs
├── design/            → Design references
└── notes/             → Development notes
```

## Security

- Passwords are hashed with bcrypt, never stored in plain text
- Authentication uses JWT tokens
- Each business's data (info, leads) is isolated — no business can access another's data
- API keys and secrets are kept in environment variables, never committed to the repository

## Status: v1.0 (Tier 1 — Foundation)

Core features are complete and working:

- [x] Secure signup/login
- [x] Business dashboard (add/update business info)
- [x] Embeddable AI chat widget
- [x] Lead capture
- [x] Leads visible on dashboard
- [x] Real AI responses grounded in business data

### Roadmap (Tier 2+)

- [ ] Automatic website content import (no manual data entry)
- [ ] Multiple knowledge sources (PDF uploads, multiple pages)
- [ ] Custom widget branding per client
- [ ] Human handoff for unresolved conversations
- [ ] Multi-channel support (WhatsApp, Instagram)

## Getting started (development)

**Backend:**

```bash
cd code/backend
npm install
# add a .env file with DATABASE_URL, JWT_SECRET, PORT, and GEMINI_API_KEY
node index.js
```

**Dashboard:**

```bash
cd code/dashboard
npm install
npm run dev
```

**Widget:** open `code/widget/test.html` in a browser to test locally.

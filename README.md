# Fluxity Document Platform

AI-powered document processing platform with multi-client email routing and serverless architecture.

## Features

- 🤖 **AI Document Extraction** - OpenAI-powered PDF and image processing
- 📧 **Multi-Client Email Routing** - client1@fluxity.ai → Client 1's dashboard  
- ☁️ **Serverless Architecture** - AWS Lambda + SQS processing
- 🔒 **Enterprise Security** - HMAC verification, rate limiting, access controls
- 📊 **Accounting Integration** - Field mapping and confidence scoring

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Documentation

Detailed documentation is available in the [`docs/`](./docs/) folder:

- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Production deployment steps
- **[Development Workflow](./docs/DEVELOPMENT_WORKFLOW.md)** - Development setup and workflow
- **[Step-by-Step Deployment](./docs/STEP_BY_STEP_DEPLOYMENT.md)** - Detailed deployment instructions
- **[Mailgun Security](./docs/mailgun-webhook-security-summary.md)** - Webhook security implementation
- **[Stage Completion Summaries](./docs/)** - Feature implementation summaries

## Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with RLS
- **File Storage**: Supabase Storage
- **Processing**: AWS Lambda + SQS
- **AI**: OpenAI GPT-4o (Assistants API + Vision API)
- **Email**: Mailgun webhooks with HMAC verification

## Security Features

- HMAC webhook verification
- Rate limiting and DDoS protection  
- UUID validation (prevents enumeration)
- File URL validation (prevents SSRF)
- Row Level Security (RLS)
- Environment variable validation

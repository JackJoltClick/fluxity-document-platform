# Development Workflow - Stage 11 Queue System

## Overview
This document outlines the complete development workflow for running the Stage 11 document processing queue system with proper authentication and UI integration.

## Prerequisites
- Redis server running locally
- Node.js and npm installed
- Environment variables configured in `.env.local`

## Required Environment Variables
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Extraction Services
OPENAI_API_KEY=your_openai_key
MINDEE_API_KEY=your_mindee_key
EXTRACTION_SERVICE=mindee
EXTRACTION_CONFIDENCE_THRESHOLD=0.8

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Development Startup Process

### 1. Start Redis Server
```bash
redis-server --daemonize yes
# Verify with: redis-cli ping (should return PONG)
```

### 2. Start Next.js Development Server
```bash
npm run dev
# Should start on http://localhost:3000 or next available port
```

### 3. Start Document Worker (Required for Queue Processing)
```bash
# In a new terminal window:
NEXT_PUBLIC_SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f 2) \
NEXT_PUBLIC_SUPABASE_ANON_KEY=$(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d '=' -f 2) \
SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY .env.local | cut -d '=' -f 2) \
OPENAI_API_KEY=$(grep OPENAI_API_KEY .env.local | cut -d '=' -f 2) \
MINDEE_API_KEY=$(grep MINDEE_API_KEY .env.local | cut -d '=' -f 2) \
EXTRACTION_SERVICE=$(grep EXTRACTION_SERVICE .env.local | cut -d '=' -f 2) \
EXTRACTION_CONFIDENCE_THRESHOLD=$(grep EXTRACTION_CONFIDENCE_THRESHOLD .env.local | cut -d '=' -f 2) \
npx tsx scripts/worker.ts

# Worker should show: 🚀 Document worker process started
```

## Authentication Architecture

### Service-Level Authentication (Worker & Admin Operations)
- Uses `supabaseAdmin` with `SUPABASE_SERVICE_KEY`
- Bypasses RLS (Row Level Security) for system operations
- Used in: Worker processes, health checks, file uploads

### User-Level Authentication (API Endpoints)
- Uses `getAuthenticatedSupabase()` with Bearer tokens
- Enforces RLS and user-scoped operations  
- Used in: Status API, user-facing endpoints

### Client-Side Authentication (UI)
- Uses `supabase.auth.getSession()` for token retrieval
- Automatically handled by React Query hooks
- Polling endpoints use Bearer token from session

## Testing the Complete Flow

### Health Check Verification
```bash
curl -s http://localhost:3001/api/health | grep "redis.*connected"
# Should return: "redis":"connected"
```

### Manual API Testing (For Development)
```bash
# Get a valid token by logging in through the UI first, then:
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/documents/DOCUMENT_ID/status
```

## UI Testing Checklist

### Prerequisites
1. ✅ Redis running (`redis-cli ping` returns PONG)
2. ✅ Next.js dev server running (`npm run dev`)
3. ✅ Worker process running (`npx tsx scripts/worker.ts`)
4. ✅ Health check passes (Redis connected)

### Complete User Journey Testing
1. **Login Flow**: Navigate to app, complete authentication
2. **Upload Test**: Upload document through UI, verify immediate "pending" status
3. **Real-time Updates**: Watch status change without page refresh (3-sec polling)
4. **Progress Indicators**: Verify progress bars and status badges update
5. **Multiple Documents**: Upload several files simultaneously
6. **Error Handling**: Test with invalid file types
7. **Authentication**: Ensure no 401 errors throughout flow
8. **Data Persistence**: Verify extracted data saves and displays correctly
9. **Processing Counter**: Check header shows active processing count

## Architecture Components

### Queue System
- **Queue**: BullMQ with Redis backend
- **Worker**: Async document processing with extraction router
- **Jobs**: Document processing with progress tracking and error handling

### API Endpoints
- `POST /api/upload` - Queues documents for processing  
- `GET /api/documents/[id]/status` - Real-time status checking
- `GET /api/health` - System health including queue status

### UI Components
- **Documents List**: Real-time polling and status updates
- **Progress Bars**: Animated indicators for active documents
- **Status Badges**: Color-coded with emojis (pending/processing/completed/failed)
- **Processing Counter**: Header summary of active documents

## Common Issues & Solutions

### Worker Won't Start
- Check environment variables are loaded correctly
- Verify Redis is running (`redis-cli ping`)
- Ensure TypeScript compilation succeeds

### Authentication Errors
- Verify user is logged in through UI
- Check token expiration
- Ensure consistent auth patterns across endpoints

### Queue Not Processing
- Verify worker process is running
- Check Redis connection in health endpoint
- Review worker logs for errors

### UI Not Updating
- Check browser network tab for polling requests
- Verify 3-second polling is active for pending documents
- Ensure React Query is configured correctly

## Success Criteria
- All components start without errors
- Health check shows all services connected
- Complete user flow works without 401 errors
- Real-time status updates function correctly
- Documents process from pending → processing → completed
- Progress bars and UI indicators work as expected

## Troubleshooting
- **Worker Logs**: Check `worker.log` for processing errors
- **Server Logs**: Monitor Next.js console for API errors  
- **Browser DevTools**: Network tab for failed requests
- **Redis**: Use `redis-cli monitor` to watch queue activity
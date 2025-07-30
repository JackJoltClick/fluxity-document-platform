import { NextRequest } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: (req) => {
        // Default: use IP address or user ID
        const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        return `ratelimit:${ip}`
      },
      ...config
    }
  }

  async checkLimit(req: NextRequest, userId?: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const key = userId ? `ratelimit:user:${userId}` : this.config.keyGenerator!(req)
    const now = Date.now()
    
    const entry = rateLimitStore.get(key)
    
    if (!entry || entry.resetTime < now) {
      // Create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs
      })
      return { allowed: true }
    }
    
    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
      return { allowed: false, retryAfter }
    }
    
    // Increment count
    entry.count++
    rateLimitStore.set(key, entry)
    
    return { allowed: true }
  }
}

// Pre-configured rate limiters for different endpoints
export const vendorRulesRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: parseInt(process.env.RATE_LIMIT_RULES_PER_MINUTE || '5')
})

export const generalApiRateLimiter = new RateLimiter({
  windowMs: 60 * 1000, // 1 minute  
  maxRequests: 60       // 60 requests per minute
})
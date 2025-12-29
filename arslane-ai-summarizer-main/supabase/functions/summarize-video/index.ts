import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Environment variables for secure configuration
const N8N_WEBHOOK_URL = Deno.env.get("N8N_WEBHOOK_URL")
const N8N_API_KEY = Deno.env.get("N8N_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

// Configuration
const REQUEST_TIMEOUT_MS = 120000 // 2 minutes timeout for n8n
const RATE_LIMIT_WINDOW_MS = 60000 // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10 // Max 10 requests per minute per IP
const CACHE_TTL_MS = 3600000 // 1 hour cache TTL

// In-memory rate limiting (per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// In-memory cache (per instance) - for quick responses
const memoryCache = new Map<string, { data: unknown; expiry: number }>()

// YouTube URL validation regex
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Valid modes
const validModes = ['quick', 'detailed'] as const

// Structured logging
function log(level: 'info' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta
  }
  if (level === 'error') {
    console.error(JSON.stringify(logEntry))
  } else if (level === 'warn') {
    console.warn(JSON.stringify(logEntry))
  } else {
    console.log(JSON.stringify(logEntry))
  }
}

// Rate limiting check
function checkRateLimit(clientIp: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitMap.get(clientIp)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetIn: RATE_LIMIT_WINDOW_MS }
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now }
  }

  record.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - record.count, resetIn: record.resetTime - now }
}

// Get from memory cache
function getFromMemoryCache(key: string): unknown | null {
  const cached = memoryCache.get(key)
  if (cached && Date.now() < cached.expiry) {
    return cached.data
  }
  if (cached) {
    memoryCache.delete(key)
  }
  return null
}

// Set to memory cache
function setToMemoryCache(key: string, data: unknown) {
  memoryCache.set(key, { data, expiry: Date.now() + CACHE_TTL_MS })
}

// Get Supabase client for database operations
function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

// Check database cache
async function getFromDatabaseCache(videoId: string, mode: string): Promise<unknown | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  try {
    const { data, error } = await supabase
      .from('video_summaries')
      .select('summary, created_at')
      .eq('video_id', videoId)
      .eq('mode', mode)
      .single()

    if (error || !data) return null

    // Check if cache is still valid (24 hours)
    const cacheAge = Date.now() - new Date(data.created_at).getTime()
    if (cacheAge > 86400000) return null // 24 hours

    return data.summary
  } catch {
    return null
  }
}

// Save to database cache (and user history if userId provided)
async function saveToDatabaseCache(videoId: string, url: string, mode: string, summary: string, userId?: string | null) {
  const supabase = getSupabaseClient()
  if (!supabase) return

  try {
    // Always save to anonymous cache (for faster responses)
    await supabase
      .from('video_summaries')
      .upsert({
        video_id: videoId,
        url,
        mode,
        summary,
        user_id: null, // Anonymous cache entry
        created_at: new Date().toISOString()
      }, {
        onConflict: 'video_id,mode',
        ignoreDuplicates: true
      })

    // If user is logged in, also save to their personal history
    if (userId) {
      await supabase
        .from('video_summaries')
        .upsert({
          video_id: videoId,
          url,
          mode,
          summary,
          user_id: userId,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id,mode'
        })
    }
  } catch (error) {
    log('warn', 'Failed to save to database cache', { error: String(error) })
  }
}

// Validate input
function validateInput(body: unknown): { valid: true; url: string; mode: string } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' }
  }

  const { url, mode } = body as Record<string, unknown>

  // Validate URL
  if (typeof url !== 'string' || url.length === 0) {
    return { valid: false, error: 'URL is required' }
  }

  if (url.length > 500) {
    return { valid: false, error: 'URL is too long' }
  }

  if (!youtubeRegex.test(url)) {
    return { valid: false, error: 'Invalid YouTube URL' }
  }

  // Validate mode
  if (typeof mode !== 'string' || !validModes.includes(mode as typeof validModes[number])) {
    return { valid: false, error: 'Mode must be either "quick" or "detailed"' }
  }

  return { valid: true, url, mode }
}

// Check if origin is allowed
const isAllowedOrigin = (origin: string | null): boolean => {
  if (!origin) return false
  if (origin.endsWith('.lovableproject.com')) return true
  if (origin.endsWith('.lovable.app')) return true
  if (origin === 'https://arslaneai.lovable.app') return true
  if (origin.startsWith('http://localhost:')) return true
  return false
}

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = isAllowedOrigin(origin) ? origin : 'https://lovableproject.com'
  return {
    'Access-Control-Allow-Origin': allowedOrigin!,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true'
  }
}

// Fetch with timeout
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   req.headers.get('cf-connecting-ip') ||
                   'unknown'

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const requestId = crypto.randomUUID()
  log('info', 'Request received', { requestId, clientIp })

  try {
    // Check rate limit
    const rateLimit = checkRateLimit(clientIp)
    if (!rateLimit.allowed) {
      log('warn', 'Rate limit exceeded', { requestId, clientIp, resetIn: rateLimit.resetIn })
      return new Response(JSON.stringify({
        success: false,
        error: `Too many requests. Please try again in ${Math.ceil(rateLimit.resetIn / 1000)} seconds.`
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetIn / 1000))
        },
        status: 429,
      })
    }

    const body = await req.json()

    // Validate input
    const validation = validateInput(body)
    if (!validation.valid) {
      log('warn', 'Validation failed', { requestId, error: validation.error })
      return new Response(JSON.stringify({
        success: false,
        error: validation.error
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { url, mode } = validation
    const userId = (body as Record<string, unknown>).userId as string | undefined
    const videoId = extractVideoId(url)

    if (!videoId) {
      log('warn', 'Could not extract video ID', { requestId, url })
      return new Response(JSON.stringify({
        success: false,
        error: 'Could not extract video ID from URL'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const cacheKey = `${videoId}:${mode}`

    // Check memory cache first
    const memoryCached = getFromMemoryCache(cacheKey)
    if (memoryCached) {
      log('info', 'Cache hit (memory)', { requestId, videoId, mode })
      return new Response(JSON.stringify({
        success: true,
        summary: memoryCached,
        videoId,
        mode,
        cached: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        },
        status: 200,
      })
    }

    // Check database cache
    const dbCached = await getFromDatabaseCache(videoId, mode)
    if (dbCached) {
      log('info', 'Cache hit (database)', { requestId, videoId, mode })
      setToMemoryCache(cacheKey, dbCached) // Warm memory cache
      return new Response(JSON.stringify({
        success: true,
        summary: dbCached,
        videoId,
        mode,
        cached: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT'
        },
        status: 200,
      })
    }

    // Verify environment variables are configured
    if (!N8N_WEBHOOK_URL || !N8N_API_KEY) {
      log('error', 'Missing required environment variables', { requestId })
      return new Response(JSON.stringify({
        success: false,
        error: "Service configuration error. Please contact support."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    log('info', 'Processing video summary', { requestId, videoId, mode })

    const response = await fetchWithTimeout(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": N8N_API_KEY,
        "X-Request-ID": requestId
      },
      body: JSON.stringify({ url, mode, videoId }),
    }, REQUEST_TIMEOUT_MS)

    if (!response.ok) {
      log('error', 'External service error', { requestId, status: response.status })
      return new Response(JSON.stringify({
        success: false,
        error: "Unable to process video summary. Please try again later."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const data = await response.json()

    // Cache the result
    if (data.success && data.summary) {
      setToMemoryCache(cacheKey, data.summary)
      saveToDatabaseCache(videoId, url, mode, data.summary, userId) // Non-blocking
      log('info', 'Summary cached', { requestId, videoId, mode, userId: userId || 'anonymous' })
    }

    // Sanitize response
    const sanitizedResponse = {
      success: data.success ?? false,
      summary: data.summary ?? null,
      videoId: videoId,
      mode: mode,
      cached: false
    }

    log('info', 'Request completed successfully', { requestId, videoId })

    return new Response(JSON.stringify(sanitizedResponse), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'X-RateLimit-Remaining': String(rateLimit.remaining)
      },
      status: 200,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isTimeout = errorMessage.includes('aborted')

    log('error', 'Edge function error', {
      requestId,
      error: errorMessage,
      isTimeout
    })

    return new Response(JSON.stringify({
      success: false,
      error: isTimeout
        ? "Request timeout. The video may be too long. Please try again."
        : "Unable to process video summary. Please try again later."
    }), {
      headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
      status: isTimeout ? 504 : 500,
    })
  }
})

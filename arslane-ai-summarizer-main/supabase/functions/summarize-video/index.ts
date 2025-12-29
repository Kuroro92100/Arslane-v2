import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// YouTube URL validation regex
const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/

// Valid modes
const validModes = ['quick', 'detailed'] as const

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
  // Allow all lovableproject.com and lovable.app subdomains and localhost
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

serve(async (req) => {
  const origin = req.headers.get('Origin')
  const corsHeaders = getCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    // Validate input
    const validation = validateInput(body)
    if (!validation.valid) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: validation.error 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { url, mode } = validation

    console.log(`Processing video summary request`)

    const response = await fetch("https://n8n.srv1207531.hstgr.cloud/webhook/arslane-youtube", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, mode }),
    })

    if (!response.ok) {
      console.error(`External service returned status: ${response.status}`)
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Unable to process video summary. Please try again later." 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const data = await response.json()

    // Sanitize response - only return expected fields
    const sanitizedResponse = {
      success: data.success ?? false,
      summary: data.summary ?? null,
      videoId: data.videoId ?? null,
      mode: data.mode ?? null
    }

    return new Response(JSON.stringify(sanitizedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: "Unable to process video summary. Please try again later." 
    }), {
      headers: { ...getCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
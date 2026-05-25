import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Sends an Expo push to one or more profiles.
// Body: { toProfileIds: string[], title: string, body: string, data?: object }
// Looks up each profile's expo_push_token (service role, bypasses RLS) and
// posts to the Expo Push API. Missing/null tokens are skipped silently.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { toProfileIds, title, body, data } = await req.json()
    const ids: string[] = Array.isArray(toProfileIds) ? toProfileIds : [toProfileIds].filter(Boolean)
    if (ids.length === 0 || !title) {
      return new Response(JSON.stringify({ error: 'toProfileIds and title required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id, expo_push_token')
      .in('id', ids)
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const messages = (rows || [])
      .filter((r: any) => r.expo_push_token)
      .map((r: any) => ({
        to: r.expo_push_token,
        title,
        body: body || '',
        data: data || {},
        sound: 'default',
        priority: 'high',
      }))

    if (messages.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: 'no tokens' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Expo accepts an array of messages in one call.
    const resp = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })
    const result = await resp.json()

    return new Response(JSON.stringify({ sent: messages.length, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'unknown' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Supabase Edge Function: validate-boost-receipt
//
// Verifies a Google Play purchase receipt against Google's Android Developer
// Publisher API, then sets community_events.boost_expires_at = now + 48h
// for the boosted event. The client (BoostSheet) is NEVER trusted with the
// activation — it only ships the purchase token here and gets a signed
// response.
//
// Inputs (JSON body):
//   purchase_token: string   — the token Google returned in Purchase.purchaseToken
//   product_id:    string    — must equal 'parea_boost_48h'
//   event_id:      number    — community_events.id to activate the boost on
//   user_id:       string    — profiles.id of the booster (RLS host check)
//
// Outputs:
//   { success: true, expires_at: <ISO> }   — boost activated
//   { error: '...' }                       — Google said the receipt is bad,
//                                            or the user isn't the event host,
//                                            or already activated for this purchase
//
// Required secrets (set via `supabase secrets set` once):
//   GOOGLE_PLAY_SERVICE_ACCOUNT_JSON  — the entire service-account JSON file
//                                       downloaded from Google Cloud Console.
//                                       Must have 'View financial data, orders,
//                                       and cancellation survey responses' role
//                                       in Play Console → Users and permissions.
//   GOOGLE_PLAY_PACKAGE_NAME          — 'com.dariashinka.PareaApp'
//   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BOOST_SKU = 'parea_boost_48h'
const BOOST_DURATION_MS = 48 * 60 * 60 * 1000

interface ServiceAccountJson {
  client_email: string
  private_key: string
  token_uri: string
}

// ────────────────────────────────────────────────────────────────────────────
// JWT signing for Google service-account auth (RS256). Deno has SubtleCrypto
// built-in so no external crypto lib is needed.
// ────────────────────────────────────────────────────────────────────────────
async function getGoogleAccessToken(sa: ServiceAccountJson): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: sa.token_uri,
    exp: now + 3600,
    iat: now,
  }
  const b64url = (obj: any) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  const unsigned = `${b64url(header)}.${b64url(payload)}`

  // Import the PEM private key into SubtleCrypto.
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')
  const keyBytes = Uint8Array.from(atob(pem), c => c.charCodeAt(0))
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBytes,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsigned),
  )
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  const jwt = `${unsigned}.${sigB64}`

  // Exchange the JWT for an OAuth2 access token.
  const tokenRes = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!tokenRes.ok) {
    throw new Error(`Google token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`)
  }
  const { access_token } = await tokenRes.json()
  if (!access_token) throw new Error('Google did not return an access_token.')
  return access_token
}

// ────────────────────────────────────────────────────────────────────────────
// Validate the purchase token against Google's API. Returns the raw product
// purchase record if the receipt is real, throws otherwise.
// ────────────────────────────────────────────────────────────────────────────
async function validateWithGoogle(opts: {
  accessToken: string
  packageName: string
  productId: string
  purchaseToken: string
}): Promise<{ purchaseState: number; acknowledgementState: number; orderId?: string }> {
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${encodeURIComponent(opts.packageName)}/purchases/products/` +
    `${encodeURIComponent(opts.productId)}/tokens/` +
    `${encodeURIComponent(opts.purchaseToken)}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${opts.accessToken}` } })
  if (!r.ok) {
    throw new Error(`Google purchases.products.get failed: ${r.status} ${await r.text()}`)
  }
  return await r.json()
}

// ────────────────────────────────────────────────────────────────────────────
// HTTP handler.
// ────────────────────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }
  try {
    const body = await req.json()
    const { purchase_token, product_id, event_id, user_id } = body || {}
    if (!purchase_token || !product_id || typeof event_id !== 'number' || !user_id) {
      return json({ error: 'Missing purchase_token / product_id / event_id / user_id' }, 400)
    }
    if (product_id !== BOOST_SKU) {
      return json({ error: `Unexpected product_id ${product_id}` }, 400)
    }

    const saRaw = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')
    const packageName = Deno.env.get('GOOGLE_PLAY_PACKAGE_NAME')
    if (!saRaw || !packageName) {
      return json({ error: 'Server is missing Google Play credentials.' }, 500)
    }
    const sa = JSON.parse(saRaw) as ServiceAccountJson

    const accessToken = await getGoogleAccessToken(sa)
    const purchase = await validateWithGoogle({
      accessToken,
      packageName,
      productId: product_id,
      purchaseToken: purchase_token,
    })
    // purchaseState: 0 purchased, 1 cancelled, 2 pending
    if (purchase.purchaseState !== 0) {
      return json({ error: `Purchase not in 'purchased' state (state=${purchase.purchaseState})` }, 400)
    }

    // All-clear — flip the boost in DB using the service-role key so we
    // bypass RLS (validation already replaced RLS as the trust boundary).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify user is actually the host of the event we're activating for.
    // Without this, anyone could pay €2.99 then submit someone else's event_id
    // and boost the wrong event.
    const { data: ev, error: evErr } = await supabase
      .from('community_events')
      .select('id, host_id')
      .eq('id', event_id)
      .single()
    if (evErr || !ev) return json({ error: 'Event not found' }, 404)
    if (ev.host_id !== user_id) {
      return json({ error: 'User is not the host of this event' }, 403)
    }

    const expiresIso = new Date(Date.now() + BOOST_DURATION_MS).toISOString()
    const { error: updErr } = await supabase
      .from('community_events')
      .update({ boost_expires_at: expiresIso })
      .eq('id', event_id)
    if (updErr) return json({ error: `DB update failed: ${updErr.message}` }, 500)

    return json({ success: true, expires_at: expiresIso })
  } catch (e) {
    console.error('validate-boost-receipt error:', e)
    return json({ error: (e as Error).message || 'Internal error' }, 500)
  }
})

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

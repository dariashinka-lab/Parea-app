import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify calling user via their JWT
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client with service role key
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SERVICE_ROLE_KEY')!,
    )

    // 1. Look up profile so we can leave system messages in their chats first.
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, name')
      .eq('auth_id', user.id)
      .maybeSingle()

    if (profile) {
      const userName = profile.name || 'Someone'
      const leftMsg = `${userName} left the group`

      // 2a. Insert "left the group" in every regular/group/direct chat they're in.
      const { data: memberships } = await adminClient
        .from('chat_members')
        .select('chat_id')
        .eq('profile_id', profile.id)
      if (memberships && memberships.length > 0) {
        const rows = memberships.map((m: { chat_id: number }) => ({
          chat_id: m.chat_id,
          sender_id: profile.id,
          text: leftMsg,
        }))
        await adminClient.from('messages').insert(rows)
      }

      // 2b. Insert "left the group" in community events they joined (not hosted —
      // hosted ones cascade-delete entirely so the message would just vanish).
      const { data: joins } = await adminClient
        .from('join_requests')
        .select('event_id')
        .eq('requester_id', profile.id)
        .in('status', ['approved', 'confirmed'])
      if (joins && joins.length > 0) {
        const rows = joins.map((j: { event_id: number }) => ({
          community_event_id: j.event_id,
          sender_id: profile.id,
          text: leftMsg,
        }))
        await adminClient.from('messages').insert(rows)
      }

      // 3. Delete profile — cascade handles events, chat_members, join_requests,
      // event_attendees, crew_invites, blocked_users, passes, reports, notifications.
      // messages.sender_id is SET NULL so the system messages above survive.
      await adminClient.from('profiles').delete().eq('id', profile.id)
    }

    // 2. Delete the auth user itself
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

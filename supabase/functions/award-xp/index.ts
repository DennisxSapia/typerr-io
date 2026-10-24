import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS Preflight Request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Initialisiere den Supabase Client mit dem Token des anfragenden Nutzers
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 2. Verifiziere den Nutzer (Sicherheitscheck: Nur eingeloggte User kommen hier vorbei)
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { amount } = await req.json()

    // 3. --- SECURITY CHECK: Manipulation verhindern ---
    if (typeof amount !== 'number' || amount <= 0 || amount > 2000) {
       return new Response(JSON.stringify({ error: 'Invalid or unreasonably high XP amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Hole den sicheren Usernamen aus den Auth-Daten des Nutzers
    const username = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Unknown';

    // 4. Admin-Client (Service Role) initialisieren, um RLS zu umgehen/Daten sicher zu schreiben
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 5. XP hochzählen 
    // Wir übergeben nun auch den username, damit die Datenbank-Spalte gefüllt wird.
    const { error } = await supabaseAdmin.rpc('increment_xp', {
       user_id: user.id,
       xp_amount: amount,
       user_name: username
    })

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, new_xp_awarded: amount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

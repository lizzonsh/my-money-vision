import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const today = new Date()
    const dayOfMonth = today.getDate()
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const todayStr = `${currentMonth}-${String(dayOfMonth).padStart(2, '0')}`

    console.log(`Running sync for day ${dayOfMonth} of month ${currentMonth}`)

    const results = {
      incomes: { added: 0, skipped: 0 },
      expenses: { added: 0, skipped: 0 },
      savings: { added: 0, skipped: 0 },
    }

    // 1. Sync Recurring Incomes
    const { data: recurringIncomes } = await supabase
      .from('recurring_incomes')
      .select('*')
      .eq('is_active', true)
      .eq('day_of_month', dayOfMonth)
      .or(`end_date.is.null,end_date.gte.${todayStr}`)

    for (const ri of recurringIncomes || []) {
      // Check if income already exists for this month
      const { data: existing } = await supabase
        .from('incomes')
        .select('id')
        .eq('user_id', ri.user_id)
        .eq('month', currentMonth)
        .ilike('name', ri.name)
        .limit(1)

      if (existing && existing.length > 0) {
        results.incomes.skipped++
        continue
      }

      await supabase.from('incomes').insert({
        user_id: ri.user_id,
        month: currentMonth,
        name: ri.name,
        amount: ri.default_amount,
        income_date: todayStr,
        description: `Auto-synced from recurring: ${ri.name}`,
        recurring_type: 'monthly',
        recurring_day_of_month: ri.day_of_month,
      })
      results.incomes.added++
    }

    // 2. Sync Recurring Payments (Expenses)
    const { data: recurringPayments } = await supabase
      .from('recurring_payments')
      .select('*')
      .eq('is_active', true)
      .eq('day_of_month', dayOfMonth)
      .or(`end_date.is.null,end_date.gte.${todayStr}`)

    for (const rp of recurringPayments || []) {
      // Check if expense already exists for this month
      const { data: existing } = await supabase
        .from('expenses')
        .select('id')
        .eq('user_id', rp.user_id)
        .eq('month', currentMonth)
        .ilike('description', rp.name)
        .limit(1)

      if (existing && existing.length > 0) {
        results.expenses.skipped++
        continue
      }

      await supabase.from('expenses').insert({
        user_id: rp.user_id,
        month: currentMonth,
        description: rp.name,
        amount: rp.default_amount,
        category: rp.category,
        payment_method: rp.payment_method,
        card_id: rp.card_id,
        expense_date: todayStr,
        kind: 'planned',
        recurring_type: 'monthly',
        recurring_day_of_month: rp.day_of_month,
      })
      results.expenses.added++
    }

    // 3. Sync Recurring Savings
    const { data: recurringSavings } = await supabase
      .from('recurring_savings')
      .select('*')
      .eq('is_active', true)
      .eq('day_of_month', dayOfMonth)
      .or(`end_date.is.null,end_date.gte.${todayStr}`)

    for (const rs of recurringSavings || []) {
      // Get the latest savings record for this account
      const { data: latestSaving } = await supabase
        .from('savings')
        .select('*')
        .eq('user_id', rs.user_id)
        .ilike('name', rs.name)
        .order('updated_at', { ascending: false })
        .limit(1)

      // Check if already synced this month
      const { data: existingThisMonth } = await supabase
        .from('savings')
        .select('id')
        .eq('user_id', rs.user_id)
        .eq('month', currentMonth)
        .ilike('name', rs.name)
        .eq('action', rs.action_type)
        .limit(1)

      if (existingThisMonth && existingThisMonth.length > 0) {
        results.savings.skipped++
        continue
      }

      const previousAmount = latestSaving?.[0]?.amount || 0
      const newAmount = rs.action_type === 'deposit' 
        ? Number(previousAmount) + Number(rs.default_amount)
        : Number(previousAmount) - Number(rs.default_amount)

      await supabase.from('savings').insert({
        user_id: rs.user_id,
        month: currentMonth,
        name: rs.name,
        amount: newAmount,
        action: rs.action_type,
        action_amount: rs.default_amount,
        transfer_method: rs.transfer_method,
        card_id: rs.card_id,
        currency: rs.currency || 'ILS',
        recurring_type: 'monthly',
        recurring_day_of_month: rs.day_of_month,
        monthly_deposit: rs.action_type === 'deposit' ? rs.default_amount : null,
      })
      results.savings.added++
    }

    console.log('Sync completed:', results)

    return new Response(JSON.stringify({ success: true, results, date: todayStr }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error syncing recurring transactions:', error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

/*
  Script to find pending stock_checks and apply them.
  Use as a cron job or run manually.

  Usage:
    SUPABASE_SERVICE_KEY=<service_key> NEXT_PUBLIC_SUPABASE_URL=<url> node supabase/process_pending_checks.js
*/

const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  // Fetch checks not completed yet
  const { data: checks, error } = await supabase
    .from('stock_checks')
    .select('id')
    .neq('status', 'completed')
    .limit(200);

  if (error) {
    console.error('Error fetching pending checks:', error);
    process.exit(1);
  }

  for (const c of checks) {
    console.log('Processing', c.id);
    const { error: rpcErr } = await supabase.rpc('apply_stock_check', { p_check_id: c.id });
    if (rpcErr) {
      console.error('Error processing', c.id, rpcErr);
    } else {
      console.log('Processed', c.id);
    }
  }

  console.log('Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

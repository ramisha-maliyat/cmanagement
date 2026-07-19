/*
  Example: create a stock check with items and auto-complete (apply immediately)
  Usage:
    SUPABASE_SERVICE_KEY=<service_key> NEXT_PUBLIC_SUPABASE_URL=<url> node supabase/create_stock_check_example.js
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

  // Example payload: replace item_id with real menu_items.id from your DB
  const items = [
    { item_id: '00000000-0000-0000-0000-000000000000', counted_quantity: 10 },
    // { item_id: '...uuid...', counted_quantity: 5 }
  ];

  const { data, error } = await supabase.rpc('create_stock_check_with_items', {
    p_title: 'Example stock check',
    p_checked_by: null,
    p_items: items,
    p_auto_complete: true,
  });

  if (error) {
    console.error('RPC error:', error);
    process.exit(1);
  }

  console.log('Created stock_check id:', data);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export async function POST(request: Request) {
  const body = await request.json();
  const { title, checked_by, items, auto_complete } = body;

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY!,
  );

  const { data, error } = await supabase.rpc('create_stock_check_with_items', {
    p_title: title,
    p_checked_by: checked_by,
    p_items: items,
    p_auto_complete: auto_complete ?? false,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ id: data });
}

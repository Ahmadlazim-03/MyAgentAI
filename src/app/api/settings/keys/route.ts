import { NextRequest, NextResponse } from 'next/server';
import { getAllKeys, addKey, deleteKey, maskKey } from '@/lib/key-manager';

export async function GET() {
  const keys = getAllKeys(true);
  return NextResponse.json({
    count: keys.length,
    keys: keys.map((k, i) => ({ index: i, masked: maskKey(k) }))
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body?.key as string;
    if (!key) return NextResponse.json({ ok: false, error: 'Key diperlukan.' }, { status: 400 });
    const res = addKey(key);
    if (!res.added) return NextResponse.json({ ok: false, error: res.reason }, { status: 400 });
    const keys = getAllKeys(true);
    return NextResponse.json({ ok: true, count: keys.length });
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body?.key as string | undefined;
    const index = body?.index as number | undefined;
    if (typeof index !== 'number' && !key) {
      return NextResponse.json({ ok: false, error: 'Key atau index diperlukan.' }, { status: 400 });
    }
    const res = deleteKey(typeof index === 'number' ? index : (key as string));
    if (!res.deleted) return NextResponse.json({ ok: false, error: res.reason }, { status: 400 });
    const keys = getAllKeys(true);
    return NextResponse.json({ ok: true, count: keys.length });
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request' }, { status: 400 });
  }
}

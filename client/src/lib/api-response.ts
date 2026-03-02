import { NextResponse } from 'next/server';

/**
 * Helpers pour standardiser les réponses API.
 * Usage: return ok({ data }) ou return err('Message', 400)
 */
export function ok(data: Record<string, unknown> = {}, status = 200) {
    return NextResponse.json({ success: true, ...data }, { status });
}

export function err(message: string, status = 500) {
    return NextResponse.json({ success: false, error: message }, { status });
}

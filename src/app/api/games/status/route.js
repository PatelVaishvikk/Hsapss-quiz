import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import GameSession from '@/models/GameSession';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Lightweight status endpoint — returns ~100 bytes instead of ~5KB.
 * Players poll this every few seconds instead of fetching the full session.
 *
 * Response shape:
 * {
 *   success: true,
 *   status: "waiting" | "active" | "finished",
 *   currentQuestion: 0,
 *   playerCount: 12,
 *   version: 1739658000000   // session updatedAt timestamp for change detection
 * }
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const gamePin = searchParams.get('pin');

    if (!gamePin) {
      return NextResponse.json(
        { success: false, error: 'Game pin is required' },
        { status: 400 }
      );
    }

    // Only fetch the fields we need — no populate, no quiz data
    const session = await GameSession.findOne(
      { gamePin },
      { status: 1, currentQuestion: 1, 'players.name': 1, updatedAt: 1 }
    ).lean();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      success: true,
      status: session.status,
      currentQuestion: session.currentQuestion,
      playerCount: session.players?.length ?? 0,
      version: new Date(session.updatedAt).getTime(),
    });

    // Allow Vercel edge to cache for 2 seconds — all 500 players
    // hitting within 2s get the same cached response instead of
    // each one triggering a new serverless function invocation.
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=2, stale-while-revalidate=5'
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

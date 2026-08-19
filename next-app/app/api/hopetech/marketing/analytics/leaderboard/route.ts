// Leaderboard API Routes
// Handles performance leaderboard generation and ranking

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/marketing-auth';
import * as performanceCalc from '@/lib/performance-calculation';

// ============================================================================
// GET /api/hopetech/marketing/analytics/leaderboard - Get leaderboard
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get('period_type') || 'monthly';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;

    // Calculate period boundaries
    let periodStart: string;
    let periodEnd: string;

    if (startDate && endDate) {
      periodStart = startDate;
      periodEnd = endDate;
    } else {
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      periodStart = currentMonthStart.toISOString().split('T')[0];
      periodEnd = currentMonthEnd.toISOString().split('T')[0];
    }

    // Generate leaderboard
    const leaderboard = await performanceCalc.generateLeaderboard(
      periodType as 'daily' | 'weekly' | 'monthly',
      periodStart,
      periodEnd
    );

    // Apply limit if specified
    const limitedLeaderboard = limit ? leaderboard.slice(0, limit) : leaderboard;

    // Get summary statistics
    const summary = await performanceCalc.getLeaderboardSummary(periodStart, periodEnd);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: limitedLeaderboard,
        summary: {
          period_start: periodStart,
          period_end: periodEnd,
          total_executives: leaderboard.length,
          top_performer: leaderboard.length > 0 ? leaderboard[0].executive_name : 'N/A',
          average_score: summary.average_score
        }
      }
    });

  } catch (error: any) {
    console.error('Error generating leaderboard:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate leaderboard'
    }, { status: 500 });
  }
}
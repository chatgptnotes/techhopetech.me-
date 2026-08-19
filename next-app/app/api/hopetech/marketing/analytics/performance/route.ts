// Performance Analytics API Routes
// Handles performance scoring, analytics, and calculations

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/marketing-auth';
import * as performanceCalc from '@/lib/performance-calculation';

// ============================================================================
// GET /api/hopetech/marketing/analytics/performance - Get performance analytics
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateUser(request);

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const executiveId = searchParams.get('executive_id') || undefined;
    const periodType = searchParams.get('period_type') || 'monthly';
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

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

    // Get performance analytics
    if (executiveId) {
      // Single executive analytics
      const score = await performanceCalc.calculatePerformanceScore(
        executiveId,
        periodStart,
        periodEnd
      );

      return NextResponse.json({
        success: true,
        data: {
          executive_performance: [score],
          team_aggregates: {
            total_executives: 1,
            average_performance_score: score.total_performance_score,
            top_performer_score: score.total_performance_score,
            lowest_performer_score: score.total_performance_score
          }
        }
      });
    } else {
      // Team analytics
      const scores = await performanceCalc.calculateAllExecutiveScores(periodStart, periodEnd);

      // Calculate team aggregates
      const totalExecutives = scores.length;
      const averageScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s.total_performance_score, 0) / scores.length
        : 0;
      const topScore = scores.length > 0 ? Math.max(...scores.map(s => s.total_performance_score)) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores.map(s => s.total_performance_score)) : 0;

      return NextResponse.json({
        success: true,
        data: {
          executive_performance: scores,
          team_aggregates: {
            total_executives: totalExecutives,
            average_performance_score: averageScore,
            top_performer_score: topScore,
            lowest_performer_score: lowestScore
          }
        }
      });
    }

  } catch (error: any) {
    console.error('Error calculating performance analytics:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to calculate performance analytics'
    }, { status: 500 });
  }
}
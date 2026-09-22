import { NextRequest, NextResponse } from 'next/server';
import { getCaregiverDashboardData } from '@/lib/caregiver-dashboard';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId') || undefined;

    const data = await getCaregiverDashboardData({ patientId });

    return NextResponse.json({
      success: true,
      data: {
        patients: data.patients,
        selectedPatient: data.selectedPatient,
        overview: data.overview,
        attentionItems: data.attentionItems,
        recentActivities: data.recentActivities,
        upcomingReminders: data.reminderStats,
        dailyPerformance: data.dailyPerformance,
        gamePerformance: data.gamePerformance,
        aiObservations: data.aiObservations,
        aiRecommendations: data.aiRecommendations,
      },
    });
  } catch (err: any) {
    console.error('Caregiver Dashboard API error:', err);
    return NextResponse.json(
      {
        success: false,
        error: "We couldn't load the latest patient information. Please try again.",
      },
      { status: err.message === 'Unauthorized caregiver' ? 401 : 500 }
    );
  }
}

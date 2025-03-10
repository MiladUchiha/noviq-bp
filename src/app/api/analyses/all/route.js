import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    console.log('GET /api/analyses/all - Request received');
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    console.log('User ID from query:', userId);
    
    if (!userId) {
      console.log('No user ID provided, returning empty array');
      return NextResponse.json({
        success: true,
        analyses: []
      });
    }

    console.log('Connecting to database...');
    const { db } = await connectToDatabase();
    
    console.log('Fetching analyses for user:', userId);
    // Get all analyses for this user, sorted by creation date (newest first)
    const analyses = await db.collection('analyses')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
    
    console.log(`Found ${analyses.length} analyses for user ${userId}`);
    
    // Add a debug field to each analysis
    const analysesWithDebug = analyses.map(analysis => ({
      ...analysis,
      _debug: {
        hasAnalysis: !!analysis.analysis,
        hasOfflineAnalysis: !!analysis.analysis?.offline_analysis,
        hasSummary: !!analysis.analysis?.offline_analysis?.executive_summary
      }
    }));
    
    return NextResponse.json({
      success: true,
      analyses: analysesWithDebug
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    // Return an empty array instead of an error
    return NextResponse.json({
      success: true,
      analyses: [],
      error: error.message
    });
  }
} 
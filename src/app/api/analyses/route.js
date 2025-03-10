import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'No analysis found'
      });
    }

    const { db } = await connectToDatabase();
    
    // Get the most recent analysis for this user
    const analysis = await db.collection('analyses')
      .findOne(
        { userId },
        { sort: { createdAt: -1 } }
      );
    
    if (!analysis) {
      return NextResponse.json({
        success: false,
        message: 'No analysis found'
      });
    }

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return NextResponse.json({
      success: false,
      message: 'Error fetching analysis'
    });
  }
} 
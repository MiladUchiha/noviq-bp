import { connectToDatabase } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    console.log('Testing database connection...');
    const { db } = await connectToDatabase();
    
    // Get the list of collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get the count of documents in the analyses collection
    let analysesCount = 0;
    if (collectionNames.includes('analyses')) {
      analysesCount = await db.collection('analyses').countDocuments();
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      collections: collectionNames,
      analysesCount
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 
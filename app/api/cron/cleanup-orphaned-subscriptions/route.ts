import { NextResponse } from 'next/server';
import { cleanupOrphanedSubscriptions } from '@/utils/subscription-cleanup';

export async function GET() {
  try {
    console.log('Starting orphaned subscriptions cleanup...');
    
    const result = await cleanupOrphanedSubscriptions();
    
    console.log(`Cleanup completed. Cleaned ${result.cleaned} orphaned subscriptions.`);
    
    return NextResponse.json({
      success: true,
      cleaned: result.cleaned,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error during orphaned subscriptions cleanup:', error);
    
    return NextResponse.json(
      { 
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
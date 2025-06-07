import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test connection to backend
    const response = await fetch('http://localhost:3001/health');

    if (response.ok) {
      const data = await response.json(); return NextResponse.json({
        status: 'success',
        message: 'Backend connected successfully',
        backend: data,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        message: 'Backend connection failed',
        status: response.status
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      message: 'Backend connection error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

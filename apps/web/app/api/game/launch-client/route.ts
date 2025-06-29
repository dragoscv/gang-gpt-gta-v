import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = 'http://localhost:4828';

export async function POST() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/game/launch-client`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (response.ok) {
            return NextResponse.json(data);
        } else {
            return NextResponse.json(data, { status: response.status });
        }
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'Backend connection failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

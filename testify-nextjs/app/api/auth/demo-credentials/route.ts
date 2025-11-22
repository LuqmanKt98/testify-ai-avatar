import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    credentials: [
      {
        email: 'demo@testify.com',
        password: 'password123',
        uniqueCode: 'DEMO01',
        name: 'Demo User',
      },
      {
        email: 'user1@lawfirm.com',
        password: 'password123',
        uniqueCode: 'USER01',
        name: 'User One',
      },
      {
        email: 'user2@lawfirm.com',
        password: 'password123',
        uniqueCode: 'USER02',
        name: 'User Two',
      },
      {
        email: 'test@testify.com',
        password: 'password123',
        uniqueCode: 'TEST01',
        name: 'Test User',
      },
    ],
  });
}


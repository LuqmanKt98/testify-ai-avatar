import { NextRequest, NextResponse } from 'next/server';
import { User, LoginCredentials, AuthResponse } from '@/types';

// Mock user database (same as backend)
const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'demo@testify.com',
    name: 'Demo User',
    lawFirm: 'Demo Law Firm',
    uniqueCode: 'DEMO01',
  },
  {
    id: '2',
    email: 'user1@lawfirm.com',
    name: 'User One',
    lawFirm: 'Law Firm Associates',
    uniqueCode: 'USER01',
  },
  {
    id: '3',
    email: 'user2@lawfirm.com',
    name: 'User Two',
    lawFirm: 'Legal Group',
    uniqueCode: 'USER02',
  },
  {
    id: '4',
    email: 'test@testify.com',
    name: 'Test User',
    lawFirm: 'Test Law Firm',
    uniqueCode: 'TEST01',
  },
];

// Mock password (in production, use proper password hashing)
const MOCK_PASSWORD = 'password123';

export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json();
    const { email, password, uniqueCode } = credentials;

    // Validate input
    if (!email || !password || !uniqueCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Email, password, and unique code are required',
        } as AuthResponse,
        { status: 400 }
      );
    }

    // Find user
    const user = MOCK_USERS.find(
      (u) => u.email === email && u.uniqueCode === uniqueCode
    );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Verify password (in production, use bcrypt)
    if (password !== MOCK_PASSWORD) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid credentials',
        } as AuthResponse,
        { status: 401 }
      );
    }

    // Generate token (in production, use JWT)
    const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user,
      token,
    } as AuthResponse);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
      } as AuthResponse,
      { status: 500 }
    );
  }
}


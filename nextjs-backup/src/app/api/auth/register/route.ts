// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const emailClean = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: emailClean },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    // If it's the very first user in the system, make them ADMIN for simple setup,
    // otherwise default role is CUSTOMER.
    const userCount = await prisma.user.count();
    const role = userCount === 0 ? 'ADMIN' : 'CUSTOMER';

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: emailClean,
        passwordHash,
        role,
      },
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const response = NextResponse.json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
    });

    // Set cookie
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth';
import { registerSchema } from '@/lib/validators/prediction';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { username, firstName, lastName, password } = parsed.data;
    
    // Check if username exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return Response.json({ error: 'Bu kullanıcı adı zaten alınmış' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username, firstName, lastName, passwordHash },
    });

    const token = await createToken(user.id);
    await setAuthCookie(token);

    return Response.json({ user: { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json({ error: 'Kayıt işlemi başarısız' }, { status: 500 });
  }
}

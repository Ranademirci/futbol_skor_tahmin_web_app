import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validators/prediction';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }
    const { username, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return Response.json({ error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return Response.json({ error: 'Kullanıcı adı veya şifre hatalı' }, { status: 401 });
    }

    const token = await createToken(user.id);
    await setAuthCookie(token);

    return Response.json({ user: { id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json({ error: 'Giriş başarısız' }, { status: 500 });
  }
}

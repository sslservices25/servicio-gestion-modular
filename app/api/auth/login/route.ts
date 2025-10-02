import { NextRequest, NextResponse } from 'next/server';
import { db, usuario } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPassword, generateJWT } from '@/lib/utils/auth';
import { validateData, loginSchema } from '@/lib/utils/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = validateData(loginSchema, body);
    
    // Buscar usuario por email
    const [user] = await db
      .select()
      .from(usuario)
      .where(eq(usuario.email, validatedData.email))
      .limit(1);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // ⬇️ INSERTE LAS LÍNEAS DE DEPURACIÓN AQUÍ ⬇️
    console.log('DEBUG 1 (Usuario Completo):', user);
    console.log('DEBUG 2 (Campo Hash):', user.passwordHash);
    // ⬆️ DEPURACIÓN AÑADIDA ⬆️

    // Verificar si el usuario está activo
    if (!user.activo) {
      return NextResponse.json(
        { error: 'Usuario desactivado' },
        { status: 401 }
      );
    }
    
    // Verificar contraseña
    const isPasswordValid = await verifyPassword(validatedData.password, user.passwordHash);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }
    
    // Generar JWT token
    const token = generateJWT({
      userId: user.usuarioId,
      email: user.email,
      rol: user.rol,
    });
    
    // Crear respuesta con cookie httpOnly
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.usuarioId,
        email: user.email,
        rol: user.rol,
        nombreCompleto: user.nombreCompleto,
      },
    });
    
    // Configurar cookie httpOnly para el token
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 horas
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error && error.message.includes('Validation error')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

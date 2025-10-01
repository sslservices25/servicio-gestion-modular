import { NextRequest, NextResponse } from 'next/server';
import { db, usuario } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, isAdmin } from '@/lib/utils/auth';
import { validateData, createUsuarioSchema } from '@/lib/utils/validation';
import { hashPassword } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden acceder a esta información' },
        { status: 403 }
      );
    }

    // Obtener todos los usuarios
    const usuarios = await db
      .select({
        usuarioId: usuario.usuarioId,
        email: usuario.email,
        rol: usuario.rol,
        nombreCompleto: usuario.nombreCompleto,
        activo: usuario.activo,
        fechaRegistro: usuario.fechaRegistro,
      })
      .from(usuario)
      .orderBy(usuario.fechaRegistro);

    return NextResponse.json({
      success: true,
      usuarios,
    });

  } catch (error) {
    console.error('Error getting usuarios:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que es admin
    if (!isAdmin(user)) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden crear usuarios' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = validateData(createUsuarioSchema, body);

    // Verificar que el email no existe
    const [existingUser] = await db
      .select()
      .from(usuario)
      .where(eq(usuario.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 409 }
      );
    }

    // Hashear contraseña
    const passwordHash = await hashPassword(validatedData.password);

    // Crear usuario
    const [newUser] = await db
      .insert(usuario)
      .values({
        email: validatedData.email,
        passwordHash,
        rol: validatedData.rol,
        nombreCompleto: validatedData.nombreCompleto,
        activo: true,
      })
      .returning({
        usuarioId: usuario.usuarioId,
        email: usuario.email,
        rol: usuario.rol,
        nombreCompleto: usuario.nombreCompleto,
        activo: usuario.activo,
        fechaRegistro: usuario.fechaRegistro,
      });

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      usuario: newUser,
    });

  } catch (error) {
    console.error('Error creating usuario:', error);
    
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


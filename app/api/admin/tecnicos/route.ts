import { NextRequest, NextResponse } from 'next/server';
import { db, usuario } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, isAdmin } from '@/lib/utils/auth';

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

    // Obtener todos los técnicos activos
    const tecnicos = await db
      .select({
        usuarioId: usuario.usuarioId,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        activo: usuario.activo,
      })
      .from(usuario)
      .where(eq(usuario.rol, 'tecnico'))
      .orderBy(usuario.nombreCompleto);

    return NextResponse.json({
      success: true,
      tecnicos,
    });

  } catch (error) {
    console.error('Error getting tecnicos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



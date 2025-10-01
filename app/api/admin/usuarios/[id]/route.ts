import { NextRequest, NextResponse } from 'next/server';
import { db, usuario } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getAuthenticatedUser, isAdmin } from '@/lib/utils/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        { error: 'Acceso denegado. Solo administradores pueden actualizar usuarios' },
        { status: 403 }
      );
    }

    const { id: usuarioId } = await params;
    const body = await request.json();
    const { activo } = body;

    if (typeof activo !== 'boolean') {
      return NextResponse.json(
        { error: 'El campo activo debe ser un booleano' },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe
    const [existingUser] = await db
      .select()
      .from(usuario)
      .where(eq(usuario.usuarioId, usuarioId))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Actualizar estado del usuario
    await db
      .update(usuario)
      .set({ activo })
      .where(eq(usuario.usuarioId, usuarioId));

    return NextResponse.json({
      success: true,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
    });

  } catch (error) {
    console.error('Error updating usuario:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


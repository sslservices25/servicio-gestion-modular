import { NextRequest, NextResponse } from 'next/server';
import { db, diagnostico, logNotificacion } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser, isAdmin } from '@/lib/utils/auth';

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
        { error: 'Acceso denegado. Solo administradores pueden asignar diagnósticos' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { diagnosticoId, tecnicoId } = body;

    if (!diagnosticoId || !tecnicoId) {
      return NextResponse.json(
        { error: 'Diagnóstico ID y técnico ID son requeridos' },
        { status: 400 }
      );
    }

    // Verificar que el diagnóstico existe y está pendiente
    const [diagnosticoData] = await db
      .select()
      .from(diagnostico)
      .where(
        and(
          eq(diagnostico.diagnosticoId, diagnosticoId),
          eq(diagnostico.estado, 'pendiente')
        )
      )
      .limit(1);

    if (!diagnosticoData) {
      return NextResponse.json(
        { error: 'Diagnóstico no encontrado o no está pendiente' },
        { status: 404 }
      );
    }

    // Asignar diagnóstico al técnico
    await db
      .update(diagnostico)
      .set({
        tecnicoAsignadoId: tecnicoId,
        estado: 'asignado',
        fechaActualizacion: new Date(),
      })
      .where(eq(diagnostico.diagnosticoId, diagnosticoId));

    // Crear log de notificación
    await db.insert(logNotificacion).values({
      diagnosticoId,
      tipo: 'admin_alert',
      destinatario: 'admin@sistema.com',
      mensaje: `Diagnóstico ${diagnosticoId} asignado al técnico ${tecnicoId}`,
      exitoso: true,
    });

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico asignado exitosamente',
    });

  } catch (error) {
    console.error('Error assigning diagnostico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



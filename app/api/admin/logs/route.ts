import { NextRequest, NextResponse } from 'next/server';
import { db, logNotificacion } from '@/lib/db';
import { eq, and, gte, lte } from 'drizzle-orm';
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

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const exitoso = searchParams.get('exitoso');
    const fechaDesde = searchParams.get('fechaDesde');
    const fechaHasta = searchParams.get('fechaHasta');

    // Construir condiciones de filtro
    const conditions = [];

    if (tipo && tipo !== 'todos') {
      conditions.push(eq(logNotificacion.tipo, tipo as 'whatsapp' | 'email' | 'admin_alert'));
    }

    if (exitoso && exitoso !== 'todos') {
      conditions.push(eq(logNotificacion.exitoso, exitoso === 'true'));
    }

    if (fechaDesde) {
      conditions.push(gte(logNotificacion.fechaEnvio, new Date(fechaDesde)));
    }

    if (fechaHasta) {
      const fechaHastaEnd = new Date(fechaHasta);
      fechaHastaEnd.setHours(23, 59, 59, 999);
      conditions.push(lte(logNotificacion.fechaEnvio, fechaHastaEnd));
    }

    // Obtener logs con filtros
    const logs = await db
      .select({
        logId: logNotificacion.logId,
        diagnosticoId: logNotificacion.diagnosticoId,
        tipo: logNotificacion.tipo,
        destinatario: logNotificacion.destinatario,
        mensaje: logNotificacion.mensaje,
        exitoso: logNotificacion.exitoso,
        fechaEnvio: logNotificacion.fechaEnvio,
      })
      .from(logNotificacion)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(logNotificacion.fechaEnvio);

    return NextResponse.json({
      success: true,
      logs,
    });

  } catch (error) {
    console.error('Error getting logs:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}



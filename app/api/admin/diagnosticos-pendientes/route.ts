import { NextRequest, NextResponse } from 'next/server';
import { db, diagnostico, equipo, cliente } from '@/lib/db';
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

    // Buscar diagnósticos pendientes de asignación
    const diagnosticos = await db
      .select({
        diagnosticoId: diagnostico.diagnosticoId,
        estado: diagnostico.estado,
        prioridad: diagnostico.prioridad,
        descripcionFalla: diagnostico.descripcionFalla,
        fechaCreacion: diagnostico.fechaCreacion,
        equipo: {
          tipo: equipo.tipo,
          marca: equipo.marca,
          modelo: equipo.modelo,
        },
        cliente: {
          nombreContacto: cliente.nombreContacto,
        },
      })
      .from(diagnostico)
      .innerJoin(equipo, eq(diagnostico.equipoId, equipo.equipoId))
      .innerJoin(cliente, eq(equipo.clienteId, cliente.clienteId))
      .where(eq(diagnostico.estado, 'pendiente'))
      .orderBy(diagnostico.prioridad, diagnostico.fechaCreacion);

    return NextResponse.json({
      success: true,
      diagnosticos,
    });

  } catch (error) {
    console.error('Error getting diagnosticos pendientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { db, diagnostico, equipo, cliente } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/utils/auth';

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

    // Verificar que es técnico
    if (user.rol !== 'tecnico') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo técnicos pueden acceder a esta información' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId || userId !== user.userId) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    // Buscar diagnósticos asignados al técnico
    const diagnosticos = await db
      .select({
        diagnosticoId: diagnostico.diagnosticoId,
        estado: diagnostico.estado,
        prioridad: diagnostico.prioridad,
        descripcionFalla: diagnostico.descripcionFalla,
        prediagnosticoIa: diagnostico.prediagnosticoIa,
        diagnosticoTecnico: diagnostico.diagnosticoTecnico,
        presupuestoEstimado: diagnostico.presupuestoEstimado,
        aprobacionCliente: diagnostico.aprobacionCliente,
        fechaCreacion: diagnostico.fechaCreacion,
        fechaActualizacion: diagnostico.fechaActualizacion,
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
      .where(
        and(
          eq(diagnostico.tecnicoAsignadoId, userId),
          eq(diagnostico.estado, 'asignado') // Solo diagnósticos asignados
        )
      )
      .orderBy(diagnostico.prioridad, diagnostico.fechaCreacion);

    return NextResponse.json({
      success: true,
      diagnosticos,
    });

  } catch (error) {
    console.error('Error getting diagnosticos:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

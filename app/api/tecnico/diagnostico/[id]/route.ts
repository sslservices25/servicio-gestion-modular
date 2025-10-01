import { NextRequest, NextResponse } from 'next/server';
import { db, diagnostico, equipo, cliente, archivoAdjunto } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/utils/auth';

export async function GET(
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

    // Verificar que es técnico
    if (user.rol !== 'tecnico') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo técnicos pueden acceder a esta información' },
        { status: 403 }
      );
    }

    const { id: diagnosticoId } = await params;

    // Buscar diagnóstico con información relacionada
    const [diagnosticoData] = await db
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
        tecnicoAsignadoId: diagnostico.tecnicoAsignadoId,
        equipo: {
          equipoId: equipo.equipoId,
          tipo: equipo.tipo,
          marca: equipo.marca,
          modelo: equipo.modelo,
          numeroSerie: equipo.numeroSerie,
          anioFabricacion: equipo.anioFabricacion,
        },
        cliente: {
          clienteId: cliente.clienteId,
          nombreContacto: cliente.nombreContacto,
          emailCifrado: cliente.emailCifrado,
          telefonoCifrado: cliente.telefonoCifrado,
          direccion: cliente.direccion,
        },
      })
      .from(diagnostico)
      .innerJoin(equipo, eq(diagnostico.equipoId, equipo.equipoId))
      .innerJoin(cliente, eq(equipo.clienteId, cliente.clienteId))
      .where(
        and(
          eq(diagnostico.diagnosticoId, diagnosticoId),
          eq(diagnostico.tecnicoAsignadoId, user.userId)
        )
      )
      .limit(1);

    if (!diagnosticoData) {
      return NextResponse.json(
        { error: 'Diagnóstico no encontrado o no asignado a este técnico' },
        { status: 404 }
      );
    }

    // Buscar archivos adjuntos
    const archivos = await db
      .select({
        archivoId: archivoAdjunto.archivoId,
        urlStorage: archivoAdjunto.urlStorage,
        nombreOriginal: archivoAdjunto.nombreOriginal,
        tipoMime: archivoAdjunto.tipoMime,
        tipoArchivo: archivoAdjunto.tipoArchivo,
        fechaSubida: archivoAdjunto.fechaSubida,
      })
      .from(archivoAdjunto)
      .where(eq(archivoAdjunto.diagnosticoId, diagnosticoId));

    return NextResponse.json({
      success: true,
      ...diagnosticoData,
      archivos,
    });

  } catch (error) {
    console.error('Error getting diagnostico:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

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

    // Verificar que es técnico
    if (user.rol !== 'tecnico') {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo técnicos pueden acceder a esta información' },
        { status: 403 }
      );
    }

    const { id: diagnosticoId } = await params;
    const body = await request.json();

    // Validar datos de entrada
    const { validateData, updateDiagnosticoSchema } = await import('@/lib/utils/validation');
    const validatedData = validateData(updateDiagnosticoSchema, body);

    // Verificar que el diagnóstico está asignado al técnico
    const [diagnosticoData] = await db
      .select()
      .from(diagnostico)
      .where(
        and(
          eq(diagnostico.diagnosticoId, diagnosticoId),
          eq(diagnostico.tecnicoAsignadoId, user.userId)
        )
      )
      .limit(1);

    if (!diagnosticoData) {
      return NextResponse.json(
        { error: 'Diagnóstico no encontrado o no asignado a este técnico' },
        { status: 404 }
      );
    }

    // Actualizar diagnóstico
    await db
      .update(diagnostico)
      .set({
        diagnosticoTecnico: validatedData.diagnosticoTecnico,
        presupuestoEstimado: validatedData.presupuestoEstimado?.toString() || null,
        estado: 'aprobacion', // Cambiar estado a aprobación
        fechaActualizacion: new Date(),
      })
      .where(eq(diagnostico.diagnosticoId, diagnosticoId));

    return NextResponse.json({
      success: true,
      message: 'Diagnóstico actualizado exitosamente',
    });

  } catch (error) {
    console.error('Error updating diagnostico:', error);
    
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

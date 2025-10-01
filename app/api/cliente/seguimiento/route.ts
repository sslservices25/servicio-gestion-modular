import { NextRequest, NextResponse } from 'next/server';
import { db, cliente, equipo, diagnostico, archivoAdjunto } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de acceso requerido' },
        { status: 400 }
      );
    }

    // Buscar cliente por token de acceso
    const [clienteData] = await db
      .select()
      .from(cliente)
      .where(eq(cliente.tokenAcceso, token))
      .limit(1);

    if (!clienteData) {
      return NextResponse.json(
        { error: 'Token de acceso inválido' },
        { status: 404 }
      );
    }

    // Buscar equipos del cliente
    const equipos = await db
      .select()
      .from(equipo)
      .where(eq(equipo.clienteId, clienteData.clienteId));

    if (equipos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron equipos para este cliente' },
        { status: 404 }
      );
    }

    // Buscar diagnósticos de los equipos
    const diagnosticos = await db
      .select()
      .from(diagnostico)
      .where(eq(diagnostico.equipoId, equipos[0].equipoId))
      .orderBy(diagnostico.fechaCreacion);

    if (diagnosticos.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron diagnósticos para este cliente' },
        { status: 404 }
      );
    }

    // Obtener el diagnóstico más reciente
    const diagnosticoData = diagnosticos[diagnosticos.length - 1];

    // Buscar archivos adjuntos del diagnóstico
    const archivos = await db
      .select()
      .from(archivoAdjunto)
      .where(eq(archivoAdjunto.diagnosticoId, diagnosticoData.diagnosticoId));

    return NextResponse.json({
      success: true,
      diagnostico: {
        diagnosticoId: diagnosticoData.diagnosticoId,
        estado: diagnosticoData.estado,
        prioridad: diagnosticoData.prioridad,
        descripcionFalla: diagnosticoData.descripcionFalla,
        prediagnosticoIa: diagnosticoData.prediagnosticoIa,
        diagnosticoTecnico: diagnosticoData.diagnosticoTecnico,
        presupuestoEstimado: diagnosticoData.presupuestoEstimado,
        aprobacionCliente: diagnosticoData.aprobacionCliente,
        fechaCreacion: diagnosticoData.fechaCreacion,
        fechaActualizacion: diagnosticoData.fechaActualizacion,
        equipo: {
          tipo: equipos[0].tipo,
          marca: equipos[0].marca,
          modelo: equipos[0].modelo,
          numeroSerie: equipos[0].numeroSerie,
          anioFabricacion: equipos[0].anioFabricacion,
        },
        cliente: {
          nombreContacto: clienteData.nombreContacto,
          emailCifrado: clienteData.emailCifrado.toString('base64'),
          telefonoCifrado: clienteData.telefonoCifrado ? clienteData.telefonoCifrado.toString('base64') : null,
          direccion: clienteData.direccion,
        },
        archivos: archivos.map(archivo => ({
          archivoId: archivo.archivoId,
          urlStorage: archivo.urlStorage,
          nombreOriginal: archivo.nombreOriginal,
          tipoMime: archivo.tipoMime,
          tipoArchivo: archivo.tipoArchivo,
          fechaSubida: archivo.fechaSubida,
        })),
      },
    });

  } catch (error) {
    console.error('Error getting seguimiento:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}


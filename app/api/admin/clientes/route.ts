import { NextRequest, NextResponse } from 'next/server';
import { db, cliente, equipo } from '@/lib/db';
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

    // Obtener todos los clientes con sus equipos
    const clientes = await db
      .select({
        clienteId: cliente.clienteId,
        nombreContacto: cliente.nombreContacto,
        emailCifrado: cliente.emailCifrado,
        telefonoCifrado: cliente.telefonoCifrado,
        direccion: cliente.direccion,
        fechaRegistro: cliente.fechaRegistro,
        equipos: {
          equipoId: equipo.equipoId,
          tipo: equipo.tipo,
          marca: equipo.marca,
          modelo: equipo.modelo,
        },
      })
      .from(cliente)
      .leftJoin(equipo, eq(cliente.clienteId, equipo.clienteId))
      .orderBy(cliente.fechaRegistro);

    // Agrupar equipos por cliente
    const clientesAgrupados = clientes.reduce((acc: Record<string, {
      clienteId: string;
      nombreContacto: string;
      emailCifrado: string;
      telefonoCifrado: string | null;
      direccion: string | null;
      fechaRegistro: Date | null;
      equipos: Array<{
        equipoId: string;
        tipo: string;
        marca: string | null;
        modelo: string | null;
      }>;
    }>, row) => {
      const clienteId = row.clienteId;
      
      if (!acc[clienteId]) {
        acc[clienteId] = {
          clienteId: row.clienteId,
          nombreContacto: row.nombreContacto,
          emailCifrado: row.emailCifrado.toString('base64'),
          telefonoCifrado: row.telefonoCifrado ? row.telefonoCifrado.toString('base64') : null,
          direccion: row.direccion,
          fechaRegistro: row.fechaRegistro,
          equipos: [],
        };
      }
      
      if (row.equipos && row.equipos.equipoId) {
        acc[clienteId].equipos.push(row.equipos);
      }
      
      return acc;
    }, {});

    const clientesArray = Object.values(clientesAgrupados);

    return NextResponse.json({
      success: true,
      clientes: clientesArray,
    });

  } catch (error) {
    console.error('Error getting clientes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

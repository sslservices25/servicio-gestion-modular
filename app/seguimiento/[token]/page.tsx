'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { decrypt } from '@/lib/utils/encryption';

interface DiagnosticoData {
  diagnosticoId: string;
  estado: string;
  prioridad: string;
  descripcionFalla: string;
  prediagnosticoIa: string | null;
  diagnosticoTecnico: string | null;
  presupuestoEstimado: string | null;
  aprobacionCliente: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
  equipo: {
    tipo: string;
    marca: string | null;
    modelo: string | null;
    numeroSerie: string | null;
    anioFabricacion: string | null;
  };
  cliente: {
    nombreContacto: string;
    email: string;
    telefono: string | null;
    direccion: string | null;
  };
  archivos: Array<{
    archivoId: string;
    urlStorage: string;
    nombreOriginal: string;
    tipoMime: string | null;
    tipoArchivo: string;
    fechaSubida: string;
  }>;
}

export default function SeguimientoPage() {
  const params = useParams();
  const token = params.token as string;
  
  const [diagnostico, setDiagnostico] = useState<DiagnosticoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDiagnostico = async () => {
      try {
        const response = await fetch(`/api/cliente/seguimiento?token=${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al obtener el diagnóstico');
        }

        // Descifrar datos sensibles del cliente
        const clienteData = {
          ...data.cliente,
          email: decrypt(Buffer.from(data.cliente.emailCifrado, 'base64')),
          telefono: data.cliente.telefonoCifrado ? decrypt(Buffer.from(data.cliente.telefonoCifrado, 'base64')) : null,
        };

        setDiagnostico({
          ...data,
          cliente: clienteData,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchDiagnostico();
    }
  }, [token]);

  const handleAprobarPresupuesto = async () => {
    try {
      const response = await fetch('/api/diagnostico/aprobar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          diagnosticoId: diagnostico?.diagnosticoId,
          token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al aprobar el presupuesto');
      }

      // Actualizar el estado local
      if (diagnostico) {
        setDiagnostico({
          ...diagnostico,
          aprobacionCliente: true,
          estado: 'reparacion',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar el presupuesto');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'prediagnostico':
        return 'bg-blue-100 text-blue-800';
      case 'asignado':
        return 'bg-purple-100 text-purple-800';
      case 'visita':
        return 'bg-orange-100 text-orange-800';
      case 'aprobacion':
        return 'bg-indigo-100 text-indigo-800';
      case 'reparacion':
        return 'bg-green-100 text-green-800';
      case 'facturacion':
        return 'bg-gray-100 text-gray-800';
      case 'finalizado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'baja':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'critica':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">Error</div>
          <div className="text-gray-600">{error}</div>
        </div>
      </div>
    );
  }

  if (!diagnostico) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg">No se encontró el diagnóstico</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Seguimiento de Servicio</h1>
            <p className="text-indigo-200">Token: {token}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Estado y Prioridad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Estado</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(diagnostico.estado)}`}>
                  {diagnostico.estado.charAt(0).toUpperCase() + diagnostico.estado.slice(1)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridad</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadColor(diagnostico.prioridad)}`}>
                  {diagnostico.prioridad.charAt(0).toUpperCase() + diagnostico.prioridad.slice(1)}
                </span>
              </div>
            </div>

            {/* Información del Cliente */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <p className="text-gray-900">{diagnostico.cliente.nombreContacto}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{diagnostico.cliente.email}</p>
                </div>
                {diagnostico.cliente.telefono && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <p className="text-gray-900">{diagnostico.cliente.telefono}</p>
                  </div>
                )}
                {diagnostico.cliente.direccion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dirección</label>
                    <p className="text-gray-900">{diagnostico.cliente.direccion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Información del Equipo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Equipo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <p className="text-gray-900">{diagnostico.equipo.tipo}</p>
                </div>
                {diagnostico.equipo.marca && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Marca</label>
                    <p className="text-gray-900">{diagnostico.equipo.marca}</p>
                  </div>
                )}
                {diagnostico.equipo.modelo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Modelo</label>
                    <p className="text-gray-900">{diagnostico.equipo.modelo}</p>
                  </div>
                )}
                {diagnostico.equipo.numeroSerie && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Serie</label>
                    <p className="text-gray-900">{diagnostico.equipo.numeroSerie}</p>
                  </div>
                )}
                {diagnostico.equipo.anioFabricacion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Año de Fabricación</label>
                    <p className="text-gray-900">{diagnostico.equipo.anioFabricacion}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Descripción de la Falla */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Descripción de la Falla</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{diagnostico.descripcionFalla}</p>
            </div>

            {/* Prediagnóstico IA */}
            {diagnostico.prediagnosticoIa && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Prediagnóstico IA</h3>
                <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{diagnostico.prediagnosticoIa}</p>
              </div>
            )}

            {/* Diagnóstico Técnico */}
            {diagnostico.diagnosticoTecnico && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Diagnóstico Técnico</h3>
                <p className="text-gray-700 bg-green-50 p-4 rounded-lg">{diagnostico.diagnosticoTecnico}</p>
              </div>
            )}

            {/* Presupuesto */}
            {diagnostico.presupuestoEstimado && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Presupuesto Estimado</h3>
                <p className="text-2xl font-bold text-green-600">${diagnostico.presupuestoEstimado}</p>
              </div>
            )}

            {/* Aprobación de Presupuesto */}
            {diagnostico.estado === 'aprobacion' && !diagnostico.aprobacionCliente && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-3">Aprobación de Presupuesto</h3>
                <p className="text-yellow-700 mb-4">
                  Por favor, revise el presupuesto estimado y apruebe para continuar con la reparación.
                </p>
                <button
                  onClick={handleAprobarPresupuesto}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  Aprobar Presupuesto
                </button>
              </div>
            )}

            {/* Archivos Adjuntos */}
            {diagnostico.archivos.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Archivos Adjuntos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diagnostico.archivos.map((archivo) => (
                    <div key={archivo.archivoId} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{archivo.nombreOriginal}</p>
                          <p className="text-sm text-gray-500">{archivo.tipoArchivo}</p>
                        </div>
                        <a
                          href={archivo.urlStorage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500 font-medium"
                        >
                          Ver
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <label className="block font-medium text-gray-700">Fecha de Creación</label>
                <p>{new Date(diagnostico.fechaCreacion).toLocaleString()}</p>
              </div>
              <div>
                <label className="block font-medium text-gray-700">Última Actualización</label>
                <p>{new Date(diagnostico.fechaActualizacion).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


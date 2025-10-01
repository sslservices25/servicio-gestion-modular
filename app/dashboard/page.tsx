'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  rol: 'admin' | 'tecnico';
}

interface Diagnostico {
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
  };
  cliente: {
    nombreContacto: string;
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok) {
          setUser(data.user);
          // Si es técnico, cargar sus diagnósticos
          if (data.user.rol === 'tecnico') {
            await fetchDiagnosticos(data.user.id);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const fetchDiagnosticos = async (userId: string) => {
    try {
      const response = await fetch(`/api/tecnico/diagnosticos?userId=${userId}`);
      const data = await response.json();
      
      if (response.ok) {
        setDiagnosticos(data.diagnosticos);
      }
    } catch (error) {
      console.error('Error fetching diagnosticos:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
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

  const diagnosticosFiltrados = diagnosticos.filter(diagnostico => {
    const estadoMatch = filtroEstado === 'todos' || diagnostico.estado === filtroEstado;
    const prioridadMatch = filtroPrioridad === 'todos' || diagnostico.prioridad === filtroPrioridad;
    return estadoMatch && prioridadMatch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Sistema de Gestión de Servicios
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.email} ({user.rol})
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {user.rol === 'tecnico' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Mis Servicios Asignados
                </h2>
                
                {/* Filtros */}
                <div className="flex space-x-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="todos">Todos</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="prediagnostico">Prediagnóstico</option>
                      <option value="asignado">Asignado</option>
                      <option value="visita">Visita</option>
                      <option value="aprobacion">Aprobación</option>
                      <option value="reparacion">Reparación</option>
                      <option value="facturacion">Facturación</option>
                      <option value="finalizado">Finalizado</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridad
                    </label>
                    <select
                      value={filtroPrioridad}
                      onChange={(e) => setFiltroPrioridad(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="todos">Todas</option>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                      <option value="critica">Crítica</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de diagnósticos */}
              {diagnosticosFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-lg">
                    No hay servicios asignados
                  </div>
                </div>
              ) : (
                <div className="grid gap-6">
                  {diagnosticosFiltrados.map((diagnostico) => (
                    <div key={diagnostico.diagnosticoId} className="bg-white shadow rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {diagnostico.equipo.tipo}
                            {diagnostico.equipo.marca && ` - ${diagnostico.equipo.marca}`}
                            {diagnostico.equipo.modelo && ` ${diagnostico.equipo.modelo}`}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Cliente: {diagnostico.cliente.nombreContacto}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(diagnostico.estado)}`}>
                            {diagnostico.estado.charAt(0).toUpperCase() + diagnostico.estado.slice(1)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPrioridadColor(diagnostico.prioridad)}`}>
                            {diagnostico.prioridad.charAt(0).toUpperCase() + diagnostico.prioridad.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-2">
                        {diagnostico.descripcionFalla}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          Creado: {new Date(diagnostico.fechaCreacion).toLocaleDateString()}
                        </div>
                        <Link
                          href={`/diagnostico/${diagnostico.diagnosticoId}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Ver Detalles
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Panel de Administración
                </h2>
                <p className="text-gray-600">
                  Gestión completa del sistema de servicios técnicos
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                  href="/dashboard/admin/usuarios"
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-indigo-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
                      <p className="text-gray-600">Gestionar técnicos y administradores</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/asignaciones"
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Asignaciones</h3>
                      <p className="text-gray-600">Asignar servicios a técnicos</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/clientes"
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Clientes</h3>
                      <p className="text-gray-600">Gestionar información de clientes</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/admin/auditoria"
                  className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">Auditoría</h3>
                      <p className="text-gray-600">Ver logs y actividades del sistema</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

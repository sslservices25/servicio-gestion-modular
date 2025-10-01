'use client';

import { useState } from 'react';
import Link from 'next/link';
import { validateData, createClienteSchema, type CreateClienteInput } from '@/lib/utils/validation';

export default function HomePage() {
  const [formData, setFormData] = useState<CreateClienteInput>({
    nombreContacto: '',
    email: '',
    telefono: '',
    direccion: '',
    tipoEquipo: '',
    marca: '',
    modelo: '',
    numeroSerie: '',
    anioFabricacion: '',
    descripcionFalla: '',
  });
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validar datos del formulario
      const validatedData = validateData(createClienteSchema, formData);

      // Validar archivos
      if (!archivos || archivos.length === 0) {
        throw new Error('Debe subir al menos un archivo');
      }

      if (archivos.length > 5) {
        throw new Error('Máximo 5 archivos permitidos');
      }

      // Crear FormData para enviar archivos
      const formDataToSend = new FormData();
      formDataToSend.append('data', JSON.stringify(validatedData));
      
      // Agregar archivos
      for (let i = 0; i < archivos.length; i++) {
        formDataToSend.append('archivos', archivos[i]);
      }

      const response = await fetch('/api/cliente/create', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la solicitud');
      }

      setSuccess(`Solicitud creada exitosamente. Token de seguimiento: ${data.token}`);
      setFormData({
        nombreContacto: '',
        email: '',
        telefono: '',
        direccion: '',
        tipoEquipo: '',
        marca: '',
        modelo: '',
        numeroSerie: '',
        anioFabricacion: '',
        descripcionFalla: '',
      });
      setArchivos(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setArchivos(e.target.files);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Sistema de Gestión de Servicios
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Plataforma integral para la gestión de servicios técnicos, diagnósticos y seguimiento de equipos.
            </p>
          </div>

          {/* Formulario de Solicitud de Servicio */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white shadow-lg rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Solicitar Servicio Técnico
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Información de Contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="nombreContacto" className="block text-sm font-medium text-gray-700">
                      Nombre de Contacto *
                    </label>
                    <input
                      type="text"
                      id="nombreContacto"
                      name="nombreContacto"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.nombreContacto}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.telefono}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">
                      Dirección
                    </label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.direccion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Información del Equipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="tipoEquipo" className="block text-sm font-medium text-gray-700">
                      Tipo de Equipo *
                    </label>
                    <input
                      type="text"
                      id="tipoEquipo"
                      name="tipoEquipo"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.tipoEquipo}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="marca" className="block text-sm font-medium text-gray-700">
                      Marca
                    </label>
                    <input
                      type="text"
                      id="marca"
                      name="marca"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.marca}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="modelo" className="block text-sm font-medium text-gray-700">
                      Modelo
                    </label>
                    <input
                      type="text"
                      id="modelo"
                      name="modelo"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.modelo}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="numeroSerie" className="block text-sm font-medium text-gray-700">
                      Número de Serie
                    </label>
                    <input
                      type="text"
                      id="numeroSerie"
                      name="numeroSerie"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.numeroSerie}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="anioFabricacion" className="block text-sm font-medium text-gray-700">
                      Año de Fabricación
                    </label>
                    <input
                      type="text"
                      id="anioFabricacion"
                      name="anioFabricacion"
                      maxLength={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.anioFabricacion}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Descripción de la Falla */}
                <div>
                  <label htmlFor="descripcionFalla" className="block text-sm font-medium text-gray-700">
                    Descripción de la Falla *
                  </label>
                  <textarea
                    id="descripcionFalla"
                    name="descripcionFalla"
                    rows={4}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={formData.descripcionFalla}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Archivos */}
                <div>
                  <label htmlFor="archivos" className="block text-sm font-medium text-gray-700">
                    Archivos Adjuntos * (Máximo 5 archivos)
                  </label>
                  <input
                    type="file"
                    id="archivos"
                    name="archivos"
                    multiple
                    accept="image/*,video/*,.pdf"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    onChange={handleFileChange}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Formatos permitidos: imágenes, videos, PDF. Máximo 5 archivos.
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                {success && (
                  <div className="rounded-md bg-green-50 p-4">
                    <div className="text-sm text-green-700">{success}</div>
                  </div>
                )}

                <div className="flex justify-center">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                </div>
              </form>
            </div>

            {/* Enlace al Login */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                ¿Eres técnico o administrador?{' '}
                <Link
                  href="/login"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Iniciar sesión
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
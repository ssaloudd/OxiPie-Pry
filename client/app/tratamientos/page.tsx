'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Tratamiento } from '@/types';

export default function TratamientosPage() {
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTratamientos = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTratamientos(data);
      }
    } catch (error) {
      console.error("Error cargando tratamientos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTratamientos();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este tratamiento del catálogo?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos/${id}`, { method: 'DELETE' });
      
      if (res.status === 204) {
        setTratamientos(tratamientos.filter(t => t.id_tra !== id));
      } else if (res.status === 409) {
        alert('No se puede eliminar: El tratamiento ya está asociado a citas existentes.');
      } else {
        alert('Error al eliminar.');
      }
    } catch (error) {
      alert('Error de conexión');
    }
  };

  if (loading) return <div className="text-center mt-10 text-oxi-blue font-bold">Cargando catálogo...</div>;

  return (
    <div className="px-4 sm:px-0 mt-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-oxi-dark">Catálogo de Tratamientos</h1>
          <p className="mt-2 text-sm text-gray-700">Gestión de servicios y precios base.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/tratamientos/nuevo"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-pie-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pie-dark"
          >
            + Nuevo Tratamiento
          </Link>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 pl-3.5 pr-3 text-left text-sm font-bold text-gray-900">Nombre del Tratamiento</th>
                    <th className="px-3.5 py-3.5 text-left text-sm font-bold text-gray-900 sm:pl-6">Descripción del Tratamiento</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Precio Base</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-bold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {tratamientos.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-4 text-gray-500">No hay tratamientos registrados.</td></tr>
                  ) : (
                    tratamientos.map((t) => (
                      <tr key={t.id_tra} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-oxi-dark sm:pl-6">
                          {t.nombres_tra}
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-600 max-w-sm">
                            <p className="line-clamp-2">
                                {t.descripcion_tra}
                            </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                          ${t.precioBase_tra.toFixed(2)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 space-x-4">
                          <Link href={`/tratamientos/${t.id_tra}`} className="text-oxi-blue hover:text-oxi-dark font-semibold">Editar</Link>
                          <button onClick={() => handleDelete(t.id_tra)} className="text-red-500 hover:text-red-700 font-semibold">Eliminar</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
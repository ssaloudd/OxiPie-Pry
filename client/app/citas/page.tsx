'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cita, Paciente } from '@/types';
import Pagination from '@/components/Pagination';

export default function CitasPage() {
  const router = useRouter();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado Modal
  const [citaSeleccionada, setCitaSeleccionada] = useState<Cita | null>(null);
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
      try {
        const [resCit, resPac] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas`, { cache: 'no-store' }),
          fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`, { cache: 'no-store' })
        ]);

        if (resCit.ok && resPac.ok) {
          const dataCit = await resCit.json();
          const dataPac = await resPac.json();
          
          const citasOrdenadas = dataCit.sort((a: Cita, b: Cita) => 
            new Date(b.fechaHora_cit).getTime() - new Date(a.fechaHora_cit).getTime()
          );

          setCitas(citasOrdenadas);
          setPacientes(dataPac);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = citas.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (n: number) => setCurrentPage(n);

  const getNombrePaciente = (id: number) => {
    const p = pacientes.find(pac => pac.id_pac === id);
    return p ? `${p.nombres_pac} ${p.apellidos_pac}` : `ID: ${id}`;
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-EC', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const handleDelete = async (id: number) => {
      if(!confirm("¿Seguro que deseas eliminar esta cita?")) return;
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas/${id}`, { method: 'DELETE' });
          if(res.ok) {
              setCitas(citas.filter(c => c.id_cit !== id));
              if(citaSeleccionada?.id_cit === id) setCitaSeleccionada(null);
          } else { alert("Error al eliminar"); }
      } catch(e) { alert("Error de conexión"); }
  };

  if (loading) return <div className="p-10 text-center text-oxi-blue">Cargando citas...</div>;

  return (
    <div className="px-4 sm:px-0 mt-6">
        <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
                <h1 className="text-2xl font-bold text-oxi-dark">Gestión de Citas para Tratamientos</h1>
                <p className="mt-2 text-sm text-gray-700">Historial de citas programadas para tratamientos médicos.</p>
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <Link href="/agenda/nueva" className="inline-flex items-center justify-center rounded-md border border-transparent bg-pie-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-pie-dark">
                    + Nueva Cita
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
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Fecha</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Paciente</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Tratamiento</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Estado</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((cita) => (
                    <tr key={cita.id_cit} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(cita.fechaHora_cit)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getNombrePaciente(cita.id_pac)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cita.tratamiento?.nombres_tra}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${cita.estado_cit === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 
                            cita.estado_cit === 'completada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {cita.estado_cit}
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => setCitaSeleccionada(cita)} className="text-gray-600 hover:text-gray-900 font-bold">Ver</button>
                        <Link href={`/citas/${cita.id_cit}`} className="text-oxi-blue hover:text-oxi-dark font-semibold">Editar</Link>
                        <button onClick={() => handleDelete(cita.id_cit)} className="text-red-500 hover:text-red-700 font-semibold">Eliminar</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
              </table>
              <Pagination 
                itemsPerPage={itemsPerPage} 
                totalItems={citas.length} 
                paginate={paginate} 
                currentPage={currentPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DETALLE CITA --- */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-6 relative animate-fade-in-up">
                <button onClick={() => setCitaSeleccionada(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                <h2 className="text-xl font-bold text-pie-dark mb-4 border-b pb-2 flex justify-between">
                    <span>Detalle de Cita #{citaSeleccionada.id_cit}</span>
                </h2>
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">Información General</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Paciente</label><p className="font-medium">{getNombrePaciente(citaSeleccionada.id_pac)}</p></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Especialista</label><p className="font-medium">{citaSeleccionada.podologa?.nombres_pod || 'N'} {citaSeleccionada.podologa?.apellidos_pod || 'A'}</p></div>
                        <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha</label><p className="font-medium">{formatDateTime(citaSeleccionada.fechaHora_cit)}</p></div>
                    </div>
                    <div className="p-3 rounded border">
                        <div className="mb-2"><label className="text-xs font-bold text-gray-500 uppercase">Tratamiento</label><p className="font-sm">{citaSeleccionada.tratamiento?.nombres_tra}</p></div>
                        <div className="mb-2"><label className="text-xs font-bold text-gray-500 uppercase">Notas Adicionales</label><p className="font-sm text-gray-600 italic">{citaSeleccionada.notasAdicionales_cit || 'Sin notas registradas.'}</p></div>
                    </div>
                    <div className="border-t pt-4">
                        <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">Información Financiera</h3>
                        <div className="grid grid-cols-3 gap-4 bg-green-50 p-3 rounded border border-green-200">
                            <div><label className="text-xs font-bold text-gray-500 uppercase block">Precio Acordado</label><span className="text-lg font-bold text-gray-800">${Number(citaSeleccionada.precioAcordado_cit || 0).toFixed(2)}</span></div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase block">Estado</label>
                                <span className={`font-bold text-sm ${citaSeleccionada.pagado_cit ? 'text-green-600' : 'text-red-500'}`}>{citaSeleccionada.pagado_cit ? 'PAGADO' : 'NO PAGADO'}</span>
                            </div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase block">Total Pagado</label><span className="text-lg font-bold text-green-700">${Number(citaSeleccionada.cantidadPagada_cit || 0).toFixed(2)}</span></div>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={() => router.push(`/citas/${citaSeleccionada.id_cit}`)} className="bg-pie-green text-white px-4 py-2 rounded hover:bg-pie-dark">Editar Información</button>
                    <button onClick={() => setCitaSeleccionada(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">Cerrar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
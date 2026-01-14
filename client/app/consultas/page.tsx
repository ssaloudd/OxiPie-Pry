'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Consulta, Paciente } from '@/types';

export default function ConsultasPage() {
  const router = useRouter();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para el Modal
  const [consultaSeleccionada, setConsultaSeleccionada] = useState<Consulta | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
        const [resCon, resPac] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas`, { cache: 'no-store' }),
          fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`, { cache: 'no-store' })
        ]);

        if (resCon.ok && resPac.ok) {
          const dataCon = await resCon.json();
          const dataPac = await resPac.json();
          
          const consultasOrdenadas = dataCon.sort((a: Consulta, b: Consulta) => 
            new Date(b.fechaHora_con).getTime() - new Date(a.fechaHora_con).getTime()
          );

          setConsultas(consultasOrdenadas);
          setPacientes(dataPac);
        }
      } catch (error) { console.error(error); } finally { setLoading(false); }
  };

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
    if(!confirm("¿Eliminar esta consulta y su registro clínico?")) return;
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas/${id}`, { method: 'DELETE' });
        if(res.ok) {
            setConsultas(consultas.filter(c => c.id_con !== id));
            if(consultaSeleccionada?.id_con === id) setConsultaSeleccionada(null);
        } else {
            alert("Error al eliminar");
        }
    } catch(e) { alert("Error de conexión"); }
  };

  const getStatusColor = (estado: string) => {
    switch(estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'completada': return 'bg-green-100 text-green-800';
      case 'cancelada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="text-center mt-10 text-oxi-blue font-bold">Cargando historial...</div>;

  return (
    <div className="px-4 sm:px-0 mt-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-oxi-dark">Gestión de Consultas y Diagnósticos</h1>
          <p className="mt-2 text-sm text-gray-700">Historial de evaluaciones iniciales y diagnósticos realizados.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/consultas/nueva"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-oxi-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-oxi-dark"
          >
            + Nueva Consulta
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
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-bold text-gray-900 sm:pl-6">Fecha y Hora</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Paciente</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Motivo</th>
                    <th className="px-3 py-3.5 text-left text-sm font-bold text-gray-900">Estado</th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right text-sm font-bold text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultas.map((con) => (
                    <tr key={con.id_con} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDateTime(con.fechaHora_con)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{getNombrePaciente(con.id_pac)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{con.motivoConsulta_con}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(con.estado_con)}`}>
                          {con.estado_con}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onClick={() => setConsultaSeleccionada(con)} className="text-gray-600 hover:text-gray-900 font-bold">Ver</button>
                        <Link href={`/consultas/${con.id_con}`} className="text-oxi-blue hover:text-oxi-dark font-semibold">Editar</Link>
                        <button onClick={() => handleDelete(con.id_con)} className="text-red-500 hover:text-red-700 font-semibold">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODAL DE DETALLES --- */}
      {consultaSeleccionada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 relative animate-fade-in-up overflow-y-auto max-h-[90vh]">
                <button onClick={() => setConsultaSeleccionada(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                
                <h2 className="text-xl font-bold text-oxi-blue mb-4 border-b pb-2 flex justify-between">
                    <span>Detalle de Consulta #{consultaSeleccionada.id_con}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${getStatusColor(consultaSeleccionada.estado_con)}`}>
                        {consultaSeleccionada.estado_con}
                    </span>
                </h2>

                <div className="space-y-4">
                    {/* Info Básica */}
                    <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">Información General</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Paciente</label>
                            <p className="font-medium">{getNombrePaciente(consultaSeleccionada.id_pac)}</p>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase">Especialista</label>
                          <p className="font-medium">{consultaSeleccionada.podologa?.nombres_pod || 'N'} {consultaSeleccionada.podologa?.apellidos_pod || 'A'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Fecha</label>
                            <p className="font-medium">{formatDateTime(consultaSeleccionada.fechaHora_con)}</p>
                        </div>
                    </div>

                    {/* Diagnóstico */}
                    <div className="bg-blue-50 p-3 rounded border border-blue-100">
                        <label className="text-xs font-bold text-gray-500 uppercase">Motivo de Consulta</label>
                        <p className="font-medium mb-2">{consultaSeleccionada.motivoConsulta_con}</p>
                        
                        <label className="text-xs font-bold text-gray-500 uppercase text-oxi-blue">Diagnóstico</label>
                        <p className="font-medium mb-2">{consultaSeleccionada.diagnostico_con || 'Sin diagnóstico registrado'}</p>
                    </div>

                    {/* Tratamiento y Notas */}
                    <div className="p-3 rounded border">
                        <div className="mb-2">
                             <label className="text-xs font-bold text-gray-500 uppercase">Tratamiento Recomendado</label>
                             <p className="font-sm">{consultaSeleccionada.tratamientoSugerido?.nombres_tra || 'Ninguno'}</p>
                        </div>
                        <div className="mb-2">
                             <label className="text-xs font-bold text-gray-500 uppercase">Notas Adicionales</label>
                             <p className="font-sm text-gray-600 italic">{consultaSeleccionada.notasAdicionales_con || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Finanzas */}
                    <div className="border-t pt-4">
                      <h3 className="text-sm font-bold text-gray-700 mb-3 text-center">Información Financiera</h3>
                      <div className="bg-green-50 p-3 rounded border border-green-200 flex justify-between items-center">
                        <div>
                            <label className="text-xs font-bold text-green-700 uppercase">Estado de Pago</label>
                            <p className={`font-bold ${consultaSeleccionada.pagado_con ? 'text-green-600' : 'text-red-500'}`}>
                                {consultaSeleccionada.pagado_con ? 'PAGADO' : 'PENDIENTE DE PAGO'}
                            </p>
                        </div>
                        <div className="text-right">
                             <label className="text-xs font-bold text-gray-500 uppercase">Monto Pagado</label>
                             <p className="text-xl font-bold text-gray-800">${Number(consultaSeleccionada.cantidadPagada_con || 0).toFixed(2)}</p>
                        </div>
                    </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={() => router.push(`/consultas/${consultaSeleccionada.id_con}`)} className="bg-oxi-blue text-white px-4 py-2 rounded hover:bg-oxi-dark">
                        Editar Información
                    </button>
                    <button onClick={() => setConsultaSeleccionada(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
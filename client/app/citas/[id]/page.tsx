'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Cita, Podologa } from '@/types';

const getHora = (isoDate: string) => isoDate ? new Date(isoDate).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit', hour12: false}) : '';
const getDate = (isoDate: string) => {
    if(!isoDate) return '';
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function EditarCitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [nombrePaciente, setNombrePaciente] = useState("Cargando...");
  
  const [formData, setFormData] = useState({
      id_pac: 0,
      id_pod: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      estado_cit: '',
      precioAcordado_cit: 0,
      notasAdicionales_cit: '',
      pagado_cit: false, 
      cantidadPagada_cit: 0
  });

  useEffect(() => {
    const init = async () => {
        try {
            const [resCit, resPod] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas/${id}`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`)
            ]);
            
            if(!resCit.ok) throw new Error("Cita no encontrada");

            const dataCit: Cita = await resCit.json();
            const dataPod = await resPod.json();
            setPodologas(dataPod);

            const resPac = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes/${dataCit.id_pac}`);
            const dataPac = await resPac.json();
            setNombrePaciente(`${dataPac.nombres_pac} ${dataPac.apellidos_pac}`);

            setFormData({
                id_pac: dataCit.id_pac,
                id_pod: dataCit.id_pod?.toString() || '',
                fecha: getDate(dataCit.fechaHora_cit),
                horaInicio: getHora(dataCit.horaInicio_cit),
                horaFin: getHora(dataCit.horaFin_cit),
                estado_cit: dataCit.estado_cit,
                precioAcordado_cit: dataCit.precioAcordado_cit,
                notasAdicionales_cit: dataCit.notasAdicionales_cit || '',
                // Aquí cargamos los datos reales del backend
                pagado_cit: dataCit.pagado_cit || false, 
                cantidadPagada_cit: dataCit.cantidadPagada_cit || 0
            });

        } catch(e) { console.error(e); } finally { setLoading(false); }
    };
    if(id) init();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
     const { name, value, type } = e.target;
     const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

     setFormData(prev => {
        const newState = { ...prev, [name]: val };
        
        // Lógica de Pago Automática
        if (name === 'pagado_cit') {
            if (val === true) {
                // Si marca pagado, sugerimos el precio acordado como monto pagado
                newState.cantidadPagada_cit = prev.precioAcordado_cit;
            } else {
                // Si desmarca, el monto pagado vuelve a 0
                newState.cantidadPagada_cit = 0;
            }
        }
        return newState;
     });
  };

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas/${id}`, {
              method: 'PUT',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(formData)
          });

          if(res.ok) {
              alert("Cita actualizada correctamente");
              router.push('/citas');
          } else {
            const err = await res.json();
            alert(`Error: ${err.error}`);
          }
      } catch(e) { alert("Error de conexión"); }
  };

  if(loading) return <div className="p-10 text-center">Cargando detalles...</div>;

  return (
    <div className="max-w-2xl mx-auto mt-6 bg-white shadow-lg rounded-lg border-t-4 border-pie-green p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-2xl font-bold text-gray-800">Editar Cita #{id}</h2>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">Paciente: <b>{nombrePaciente}</b></span>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
            {/* AGENDA Y ASIGNACIÓN */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Fecha</label>
                    <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full border p-2 rounded" />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Especialista</label>
                    <select name="id_pod" value={formData.id_pod} onChange={handleChange} className="w-full border p-2 rounded">
                        <option value="">-- Sin Asignar --</option>
                        {podologas.map(p => <option key={p.id_pod} value={p.id_pod}>{p.nombres_pod} {p.apellidos_pod}</option>)}
                    </select>
                 </div>
                 <div className="flex gap-2">
                    <div className="w-1/2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Inicio</label>
                        <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Fin</label>
                        <input type="time" name="horaFin" value={formData.horaFin} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase">Estado</label>
                    <select name="estado_cit" value={formData.estado_cit} onChange={handleChange} className="w-full border p-2 rounded">
                        <option value="pendiente">Pendiente</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                        <option value="noAsistio">No Asistió</option>
                    </select>
                 </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
                <textarea name="notasAdicionales_cit" rows={3} value={formData.notasAdicionales_cit} onChange={handleChange} className="w-full border p-2 rounded mt-1"></textarea>
            </div>

            {/* SECCIÓN FINANCIERA (HU 5) */}
            <div className="bg-green-50 p-4 rounded border border-green-200">
                <h3 className="text-sm font-bold text-green-800 mb-3 border-b border-green-200 pb-1">Gestión Financiera</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Precio Acordado ($)</label>
                        <input 
                            type="number" step="0.01" name="precioAcordado_cit" 
                            value={formData.precioAcordado_cit} onChange={handleChange} 
                            className="mt-1 w-full border p-2 rounded bg-white" 
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Valor pactado con paciente</p>
                    </div>

                    <div className="flex items-center h-10">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="pagado_cit" checked={formData.pagado_cit} onChange={handleChange} className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            <span className="ms-3 text-sm font-bold text-gray-700">¿Ya Pagó?</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Monto Recibido ($)</label>
                        <input 
                            type="number" step="0.01" name="cantidadPagada_cit" 
                            value={formData.cantidadPagada_cit} onChange={handleChange} 
                            disabled={!formData.pagado_cit}
                            className={`mt-1 w-full border p-2 rounded ${formData.pagado_cit ? 'bg-white font-bold text-green-700 border-green-500' : 'bg-gray-100 text-gray-400'}`} 
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-pie-green text-white rounded hover:bg-pie-dark font-medium">Guardar Cambios</button>
            </div>
        </form>
    </div>
  );
}
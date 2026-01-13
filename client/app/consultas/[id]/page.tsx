'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Consulta, Podologa, Tratamiento } from '@/types';

// Helpers de fecha
const getHora = (isoDate: string) => isoDate ? new Date(isoDate).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit', hour12: false}) : '';
const getDate = (isoDate: string) => {
    if(!isoDate) return '';
    const d = new Date(isoDate);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DetalleConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [consulta, setConsulta] = useState<Consulta | null>(null);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombrePaciente, setNombrePaciente] = useState("Cargando...");

  // Form unificado
  const [formData, setFormData] = useState({
      id_pod: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      estado_con: '',
      
      // Clínico
      motivoConsulta_con: '',
      diagnostico_con: '',
      id_tra_recomendado: '',
      notasAdicionales_con: '',
      
      // Financiero
      precioSugerido_con: 0,
      pagado_con: false,
      cantidadPagada_con: 0
  });

  useEffect(() => {
    const init = async () => {
        try {
            const [resCon, resPod, resTra] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas/${id}`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos`)
            ]);

            if(!resCon.ok) throw new Error("Consulta no encontrada");
            
            const dataCon: Consulta = await resCon.json();
            setConsulta(dataCon);
            setPodologas(await resPod.json());
            setTratamientos(await resTra.json());

            // Cargar nombre paciente
            const resPac = await fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes/${dataCon.id_pac}`);
            const dataPac = await resPac.json();
            setNombrePaciente(`${dataPac.nombres_pac} ${dataPac.apellidos_pac}`);

            // Llenar Formulario
            setFormData({
                id_pod: dataCon.id_pod?.toString() || '',
                fecha: getDate(dataCon.fechaHora_con),
                horaInicio: getHora(dataCon.horaInicio_con),
                horaFin: getHora(dataCon.horaFin_con),
                estado_con: dataCon.estado_con,
                
                motivoConsulta_con: dataCon.motivoConsulta_con || '',
                diagnostico_con: dataCon.diagnostico_con || '',
                id_tra_recomendado: dataCon.id_tra_recomendado?.toString() || '',
                notasAdicionales_con: dataCon.notasAdicionales_con || '',
                
                precioSugerido_con: Number(dataCon.precioSugerido_con || 0),
                pagado_con: dataCon.pagado_con || false,
                cantidadPagada_con: Number(dataCon.cantidadPagada_con || 0)
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
        // Lógica automática de pago (opcional, ayuda al usuario)
        if (name === 'pagado_con') {
            if (val === true && prev.cantidadPagada_con === 0) {
                 newState.cantidadPagada_con = prev.precioSugerido_con;
            } else if (val === false) {
                 newState.cantidadPagada_con = 0;
            }
        }
        return newState;
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(formData)
        });

        if(res.ok) {
            alert("Consulta actualizada correctamente");
            router.push('/consultas');
        } else {
             const err = await res.json();
             alert("Error: " + err.error);
        }
    } catch(e) { alert("Error al guardar"); }
  };

  const irACitaDeTratamiento = () => {
    if(!consulta) return;
    const query = new URLSearchParams({
        origen: consulta.id_con.toString(),
        paciente: consulta.id_pac.toString(),
        tratamiento: formData.id_tra_recomendado || ""
    }).toString();
    router.push(`/agenda/nueva?${query}`);
  };

  if(loading) return <div className="p-10 text-center">Cargando...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg border-t-4 border-oxi-blue mt-6">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6 border-b pb-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Editar Consulta #{id}</h1>
                <p className="text-sm text-gray-600">Paciente: <span className="font-bold text-oxi-blue">{nombrePaciente}</span></p>
            </div>
            {/* Botón Derivación */}
            <button 
                type="button"
                onClick={irACitaDeTratamiento}
                className="flex items-center gap-2 bg-pie-green hover:bg-pie-dark text-white px-4 py-2 rounded-md font-bold shadow-sm transition-all text-sm"
            >
                <span>➔ Agendar Tratamiento</span>
            </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* 1. AGENDA */}
            <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Datos de Agenda</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold">Fecha</label>
                        <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold">Inicio</label>
                        <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold">Fin</label>
                        <input type="time" name="horaFin" value={formData.horaFin} onChange={handleChange} className="w-full border p-2 rounded" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold">Especialista</label>
                        <select name="id_pod" value={formData.id_pod} onChange={handleChange} className="w-full border p-2 rounded">
                            <option value="">-- Sin Asignar --</option>
                            {podologas.map(p => <option key={p.id_pod} value={p.id_pod}>{p.nombres_pod} {p.apellidos_pod}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* 2. REGISTRO CLÍNICO */}
            <div>
                <div className="flex justify-between items-center mb-2">
                     <h3 className="text-sm font-bold text-gray-700 uppercase">Información Clínica</h3>
                     <select name="estado_con" value={formData.estado_con} onChange={handleChange} className="border p-1 rounded text-sm bg-gray-50 font-medium">
                         <option value="pendiente">Pendiente</option>
                         <option value="completada">Completada</option>
                         <option value="cancelada">Cancelada</option>
                     </select>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Motivo</label>
                        <textarea name="motivoConsulta_con" rows={2} value={formData.motivoConsulta_con} onChange={handleChange} className="w-full border p-2 rounded"></textarea>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-oxi-blue">Diagnóstico</label>
                        <textarea name="diagnostico_con" rows={3} value={formData.diagnostico_con} onChange={handleChange} className="w-full border-2 border-blue-100 p-2 rounded focus:border-oxi-blue"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Tratamiento Recomendado</label>
                             <select name="id_tra_recomendado" value={formData.id_tra_recomendado} onChange={handleChange} className="w-full border p-2 rounded bg-white">
                                <option value="">-- Ninguno --</option>
                                {tratamientos.map(t => <option key={t.id_tra} value={t.id_tra}>{t.nombres_tra}</option>)}
                             </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">Notas Adicionales</label>
                             <textarea name="notasAdicionales_con" rows={1} value={formData.notasAdicionales_con} onChange={handleChange} className="w-full border p-2 rounded"></textarea>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. FINANZAS */}
            <div className="bg-green-50 p-4 rounded border border-green-200">
                <h3 className="text-xs font-bold text-green-800 uppercase mb-3">Finanzas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Costo ($)</label>
                        <input type="number" step="0.01" name="precioSugerido_con" value={formData.precioSugerido_con} onChange={handleChange} className="w-full border p-2 rounded bg-white" />
                    </div>

                    <div className="flex items-center h-10">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="pagado_con" checked={formData.pagado_con} onChange={handleChange} className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            <span className="ms-3 text-sm font-bold text-gray-700">¿Pagado?</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Monto Recibido ($)</label>
                        <input 
                            type="number" step="0.01" name="cantidadPagada_con" 
                            value={formData.cantidadPagada_con} onChange={handleChange} 
                            disabled={!formData.pagado_con}
                            className={`w-full border p-2 rounded font-bold ${formData.pagado_con ? 'bg-white text-green-700 border-green-500' : 'bg-gray-100 text-gray-400'}`} 
                        />
                    </div>
                </div>
            </div>

            {/* BOTONES */}
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-oxi-blue text-white rounded hover:bg-oxi-dark font-medium shadow">Guardar Cambios</button>
            </div>
        </form>
    </div>
  );
}
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Cita, Paciente, Podologa, Tratamiento } from '@/types';
import SearchableSelect from '@/components/SearchableSelect';

// Helpers
const getHora = (isoDate: string) => isoDate ? new Date(isoDate).toLocaleTimeString('es-EC', {hour: '2-digit', minute:'2-digit', hour12: false}) : '';
const getDate = (isoDate: string) => isoDate ? new Date(isoDate).toISOString().split('T')[0] : '';

export default function EditarCitaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  
  // Catálogos
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  
  const [formData, setFormData] = useState({
      id_pac: '',
      id_pod: '',
      id_tra: '', // Ahora editable con buscador
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
            const [resCit, resPac, resPod, resTra] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/citas/${id}`),
                fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos`)
            ]);
            
            if(!resCit.ok) throw new Error("Cita no encontrada");

            const dataCit: Cita = await resCit.json();
            
            setPacientes(await resPac.json());
            setPodologas(await resPod.json());
            setTratamientos(await resTra.json());

            setFormData({
                id_pac: dataCit.id_pac.toString(),
                id_pod: dataCit.id_pod?.toString() || '',
                id_tra: dataCit.id_tra.toString(),
                fecha: getDate(dataCit.fechaHora_cit),
                horaInicio: getHora(dataCit.horaInicio_cit),
                horaFin: getHora(dataCit.horaFin_cit),
                estado_cit: dataCit.estado_cit,
                precioAcordado_cit: Number(dataCit.precioAcordado_cit || 0),
                notasAdicionales_cit: dataCit.notasAdicionales_cit || '',
                pagado_cit: dataCit.pagado_cit || false, 
                cantidadPagada_cit: Number(dataCit.cantidadPagada_cit || 0)
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
        
        if (name === 'pagado_cit') {
            if (val === true && prev.cantidadPagada_cit === 0) {
                 newState.cantidadPagada_cit = prev.precioAcordado_cit;
            } else if (val === false) {
                 newState.cantidadPagada_cit = 0;
            }
        }
        return newState;
     });
  };

  const handleSelectChange = (field: string, val: string | number) => {
    setFormData(prev => {
        const newState = { ...prev, [field]: val };
        
        // Si cambia el tratamiento, actualizamos el precio automáticamente
        if (field === 'id_tra') {
            const tra = tratamientos.find(t => t.id_tra.toString() === val.toString());
            if (tra) {
                newState.precioAcordado_cit = tra.precioBase_tra;
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

  // Preparar Opciones
  const opcionesPacientes = pacientes.map(p => ({
      value: p.id_pac,
      label: `${p.nombres_pac} ${p.apellidos_pac} - CI: ${p.cedula_pac}`
  }));
  const opcionesPodologas = podologas.map(p => ({
      value: p.id_pod,
      label: `${p.nombres_pod} ${p.apellidos_pod}`
  }));
  const opcionesTratamientos = tratamientos.map(t => ({
      value: t.id_tra,
      label: t.nombres_tra
  }));


  if(loading) return <div className="p-10 text-center">Cargando detalles...</div>;

  return (
    <div className="max-w-4xl mx-auto mt-6 bg-white shadow-lg rounded-lg border-t-4 border-pie-green p-6">
        <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-2xl font-bold text-gray-800">Editar Cita #{id}</h2>
            <span className="text-sm text-gray-500">Gestión de tratamiento</span>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS CLÍNICOS Y PERSONAL */}
            <div className="space-y-4">
                <div>
                    <SearchableSelect 
                        label="Paciente"
                        options={opcionesPacientes}
                        value={formData.id_pac}
                        onChange={(val) => handleSelectChange('id_pac', val)}
                        placeholder="Buscar paciente..."
                        required
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <SearchableSelect 
                            label="Tratamiento / Procedimiento"
                            options={opcionesTratamientos}
                            value={formData.id_tra}
                            onChange={(val) => handleSelectChange('id_tra', val)}
                            placeholder="Buscar tratamiento..."
                        />
                    </div>
                    <div>
                        <SearchableSelect 
                            label="Especialista"
                            options={opcionesPodologas}
                            value={formData.id_pod}
                            onChange={(val) => handleSelectChange('id_pod', val)}
                            placeholder="Buscar especialista..."
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: AGENDA (AZUL) */}
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h3 className="text-sm font-bold text-oxi-blue mb-3 uppercase">Datos de Agenda</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Fecha</label>
                        <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} className="w-full border p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Inicio</label>
                        <input type="time" name="horaInicio" value={formData.horaInicio} onChange={handleChange} className="w-full border p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Fin</label>
                        <input type="time" name="horaFin" value={formData.horaFin} onChange={handleChange} className="w-full border p-2 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600">Estado</label>
                        <select name="estado_cit" value={formData.estado_cit} onChange={handleChange} className="w-full border p-2 rounded-md bg-white">
                            <option value="pendiente">Pendiente</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                            <option value="noAsistio">No Asistió</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* SECCIÓN 3: NOTAS */}
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Notas Adicionales</label>
                <textarea name="notasAdicionales_cit" rows={2} value={formData.notasAdicionales_cit} onChange={handleChange} className="w-full border-gray-300 border p-2 rounded-md"></textarea>
            </div>

            {/* SECCIÓN 4: FINANZAS (VERDE) */}
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
                 <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2 uppercase">
                    <span>Finanzas</span>
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Precio Acordado ($)</label>
                        <input type="number" step="0.01" name="precioAcordado_cit" value={formData.precioAcordado_cit} onChange={handleChange} className="mt-1 block w-full border p-2 rounded-md bg-white" />
                    </div>

                    <div className="flex items-center h-12">
                        <label className="inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="pagado_cit" checked={formData.pagado_cit} onChange={handleChange} className="sr-only peer" />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                            <span className="ms-3 text-sm font-bold text-gray-700">¿Ya Pagó?</span>
                        </label>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Monto Recibido ($)</label>
                        <input 
                            type="number" step="0.01" name="cantidadPagada_cit" 
                            value={formData.cantidadPagada_cit} onChange={handleChange} 
                            disabled={!formData.pagado_cit}
                            className={`mt-1 block w-full border p-2 rounded-md font-bold ${formData.pagado_cit ? 'bg-white text-green-700 border-green-500' : 'bg-gray-100 text-gray-400'}`} 
                        />
                    </div>
                 </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => router.back()} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-pie-green text-white rounded hover:bg-pie-dark font-medium shadow">Guardar Cambios</button>
            </div>
        </form>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Paciente, Podologa, Tratamiento } from '@/types';
import SearchableSelect from '@/components/SearchableSelect'; // <--- IMPORTANTE

export default function NuevaConsultaPage() {
  const router = useRouter();
  
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  const [tratamientos, setTratamientos] = useState<Tratamiento[]>([]);
  
  const [formData, setFormData] = useState({
    id_pac: '',
    id_pod: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '09:00',
    horaFin: '09:30',
    estado_con: 'pendiente',
    motivoConsulta_con: '',
    diagnostico_con: '',       
    id_tra_recomendado: '',    
    notasAdicionales_con: '',
    precioSugerido_con: '20.00',
    cantidadPagada_con: '0.00',
    pagado_con: false
  });

  useEffect(() => {
    const fetchCatalogos = async () => {
        try {
            const [resPac, resPod, resTra] = await Promise.all([
                fetch(`${process.env.NEXT_PUBLIC_API_PATIENTS}/pacientes`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`),
                fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos`)
            ]);
            setPacientes(await resPac.json());
            setPodologas(await resPod.json());
            setTratamientos(await resTra.json());
        } catch(e) { console.error(e); }
    };
    fetchCatalogos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/consultas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Consulta registrada exitosamente');
        router.push('/consultas'); 
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (error) { alert('Error de conexión'); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => {
        const newState = { ...prev, [name]: val };
        if (name === 'pagado_con') {
            newState.cantidadPagada_con = val ? prev.precioSugerido_con : '0.00';
        }
        return newState;
    });
  };

  // Wrapper para el componente SearchableSelect
  const handleSelectChange = (field: string, val: string | number) => {
      setFormData(prev => ({ ...prev, [field]: val }));
  };

  // PREPARAR OPCIONES PARA EL BUSCADOR
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


  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6 border-t-4 border-oxi-blue mt-6">
      <div className="flex justify-between border-b pb-2 mb-6">
        <h2 className="text-2xl font-bold text-oxi-dark">Nueva Consulta</h2>
        <span className="text-sm text-gray-500 italic">Registro completo</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECCIÓN 1: DATOS ADMINISTRATIVOS (CON BUSCADOR) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <SearchableSelect 
                    label="Paciente"
                    options={opcionesPacientes}
                    value={formData.id_pac}
                    onChange={(val) => handleSelectChange('id_pac', val)}
                    placeholder="Buscar por nombre o cédula..."
                    required
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

        {/* SECCIÓN 2: AGENDA */}
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="text-sm font-bold text-oxi-blue mb-3 uppercase">Datos de Agenda</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Fecha</label>
                    <input type="date" name="fecha" value={formData.fecha} required onChange={handleChange} className="w-full border p-2 rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Inicio</label>
                    <input type="time" name="horaInicio" value={formData.horaInicio} required onChange={handleChange} className="w-full border p-2 rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Fin</label>
                    <input type="time" name="horaFin" value={formData.horaFin} required onChange={handleChange} className="w-full border p-2 rounded-md" />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-600">Estado</label>
                    <select name="estado_con" value={formData.estado_con} onChange={handleChange} className="w-full border p-2 rounded-md bg-white">
                        <option value="pendiente">Pendiente</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                </div>
            </div>
        </div>

        {/* SECCIÓN 3: REGISTRO CLÍNICO */}
        <div className="bg-white p-4 rounded-md border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase border-b pb-1">Registro Clínico</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Motivo de Consulta *</label>
                    <textarea name="motivoConsulta_con" required rows={2} onChange={handleChange} className="mt-1 block w-full border-gray-300 border p-2 rounded-md focus:ring-oxi-blue focus:border-oxi-blue"></textarea>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 text-oxi-blue">Diagnóstico</label>
                    <textarea name="diagnostico_con" rows={3} onChange={handleChange} placeholder="Detalle el diagnóstico..." className="mt-1 block w-full border-blue-200 border-2 p-2 rounded-md focus:ring-oxi-blue focus:border-oxi-blue"></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        {/* Usamos el buscador también para tratamientos si son muchos */}
                        <SearchableSelect 
                            label="Tratamiento Sugerido"
                            options={opcionesTratamientos}
                            value={formData.id_tra_recomendado}
                            onChange={(val) => handleSelectChange('id_tra_recomendado', val)}
                            placeholder="Buscar tratamiento..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Notas Adicionales</label>
                        <textarea name="notasAdicionales_con" rows={1} onChange={handleChange} className="mt-0 block w-full border-gray-300 border p-2 rounded-md h-[42px]"></textarea>
                    </div>
                </div>
            </div>
        </div>

        {/* SECCIÓN 4: PAGO (FINANZAS) */}
        <div className="bg-green-50 p-4 rounded-md border border-green-200">
             <h3 className="text-sm font-bold text-green-800 mb-3 flex items-center gap-2 uppercase">
                <span>Finanzas</span>
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Costo Consulta ($)</label>
                    <input type="number" step="0.01" name="precioSugerido_con" value={formData.precioSugerido_con} onChange={handleChange} className="mt-1 block w-full border p-2 rounded-md bg-white" />
                </div>

                <div className="flex items-center h-12">
                    <label className="inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="pagado_con" checked={formData.pagado_con} onChange={handleChange} className="sr-only peer" />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="ms-3 text-sm font-bold text-gray-700">¿Ya pagó?</span>
                    </label>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Monto Recibido ($)</label>
                    <input 
                        type="number" step="0.01" name="cantidadPagada_con" 
                        value={formData.cantidadPagada_con} 
                        onChange={handleChange} 
                        disabled={!formData.pagado_con}
                        className={`mt-1 block w-full border p-2 rounded-md font-bold ${formData.pagado_con ? 'bg-white text-green-700 border-green-500' : 'bg-gray-100 text-gray-400'}`} 
                    />
                </div>
             </div>
        </div>

        <div className="pt-5 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-oxi-blue py-2 px-4 text-sm font-medium text-white hover:bg-oxi-dark shadow-md">Guardar Consulta</button>
        </div>
      </form>
    </div>
  );
}
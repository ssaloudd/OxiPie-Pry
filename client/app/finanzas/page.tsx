'use client';

import { useState, useEffect } from 'react';
import { Podologa } from '@/types';
import SearchableSelect from '@/components/SearchableSelect';

interface Egreso {
    id_egr: number;
    monto_egr: number | string; // Permitimos string por si viene del backend así
    fecha_egr: string;
    motivo_egr: string;
    id_pod: number;
    podologa?: Podologa;
}

export default function FinanzasPage() {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

  const [rango, setRango] = useState({ inicio: firstDay, fin: lastDay });
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [podologas, setPodologas] = useState<Podologa[]>([]);
  
  // Formulario
  const [newEgreso, setNewEgreso] = useState({
      monto_egr: '',
      motivo_egr: '',
      fecha_egr: new Date().toISOString().split('T')[0],
      id_pod: ''
  });

  useEffect(() => {
     cargarDatos();
  }, [rango]); 

  const cargarDatos = async () => {
      try {
          const [resEgr, resPod] = await Promise.all([
              fetch(`${process.env.NEXT_PUBLIC_API_FINANCE}/finanzas/egresos?inicio=${rango.inicio}&fin=${rango.fin}`),
              fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/podologas`)
          ]);
          setEgresos(await resEgr.json());
          setPodologas(await resPod.json());
      } catch(e) { console.error(e); }
  };

  const handleCrear = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_FINANCE}/finanzas/egresos`, {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify(newEgreso)
          });
          if(res.ok) {
              alert("Gasto registrado");
              setNewEgreso({ ...newEgreso, monto_egr: '', motivo_egr: '' });
              cargarDatos();
          }
      } catch(e) { alert("Error de conexión"); }
  };

  const handleEliminar = async (id: number) => {
      if(!confirm("¿Eliminar este registro?")) return;
      await fetch(`${process.env.NEXT_PUBLIC_API_FINANCE}/finanzas/egresos/${id}`, { method: 'DELETE' });
      cargarDatos();
  };

  const opcionesPodologas = podologas.map(p => ({ value: p.id_pod, label: `${p.nombres_pod} ${p.apellidos_pod}` }));

  return (
    <div className="px-4 mt-6 max-w-6xl mx-auto pb-10">
        <h1 className="text-2xl font-bold text-oxi-dark mb-6">Gestión de Gastos (Egresos)</h1>

        {/* Filtro */}
        <div className="bg-white p-4 rounded shadow mb-6 flex gap-4 items-center">
            <span className="font-bold">Filtrar:</span>
            <input type="date" value={rango.inicio} onChange={e => setRango({...rango, inicio: e.target.value})} className="border p-1 rounded"/>
            <span>a</span>
            <input type="date" value={rango.fin} onChange={e => setRango({...rango, fin: e.target.value})} className="border p-1 rounded"/>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* FORMULARIO */}
            <div className="bg-white p-6 rounded shadow border-t-4 border-red-500 h-fit">
                <h2 className="font-bold text-lg mb-4 text-red-700">Registrar Nuevo Gasto</h2>
                <form onSubmit={handleCrear} className="space-y-4">
                    <SearchableSelect 
                        label="Responsable" options={opcionesPodologas}
                        value={newEgreso.id_pod} onChange={(val) => setNewEgreso({...newEgreso, id_pod: val.toString()})}
                        placeholder="Quién reporta el gasto..." required
                    />
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase">Motivo</label>
                        <input type="text" required value={newEgreso.motivo_egr} onChange={e => setNewEgreso({...newEgreso, motivo_egr: e.target.value})} className="w-full border p-2 rounded"/>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Monto ($)</label>
                            <input type="number" step="0.01" required value={newEgreso.monto_egr} onChange={e => setNewEgreso({...newEgreso, monto_egr: e.target.value})} className="w-full border p-2 rounded"/>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase">Fecha</label>
                            <input type="date" required value={newEgreso.fecha_egr} onChange={e => setNewEgreso({...newEgreso, fecha_egr: e.target.value})} className="w-full border p-2 rounded"/>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold">Guardar Egreso</button>
                </form>
            </div>

            {/* TABLA */}
            <div className="lg:col-span-2 bg-white shadow rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Motivo</th>
                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Monto</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {egresos.map(egr => (
                            <tr key={egr.id_egr}>
                                <td className="px-6 py-4 text-sm text-gray-600">{new Date(egr.fecha_egr).toLocaleDateString('es-EC', {timeZone: 'UTC'})}</td>
                                <td className="px-6 py-4 text-sm text-gray-800">
                                    <p className="font-medium">{egr.motivo_egr}</p>
                                    <p className="text-xs text-gray-500">{egr.podologa?.nombres_pod}</p>
                                </td>
                                {/* AQUI ESTABA EL ERROR: AGREGAMOS Number(...) */}
                                <td className="px-6 py-4 text-right text-sm font-bold text-red-600">-${Number(egr.monto_egr).toFixed(2)}</td>
                                <td className="px-6 py-4 text-right"><button onClick={() => handleEliminar(egr.id_egr)} className="text-red-400 hover:text-red-700 font-bold">X</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
}
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Tratamiento } from '@/types';

export default function EditarTratamientoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Partial<Tratamiento>>({});

  useEffect(() => {
    const fetchTratamiento = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos/${id}`);
        if (!res.ok) throw new Error("No encontrado");
        const data = await res.json();
        setFormData(data);
      } catch (error) { router.push('/tratamientos'); } 
      finally { setLoading(false); }
    };
    if (id) fetchTratamiento();
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Extraer id para no enviarlo en el body
      const { id_tra, ...datos } = formData as Tratamiento;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (res.ok) { router.push('/tratamientos'); router.refresh(); } 
      else { alert('Error actualizando'); }
    } catch (err) { alert('Error de conexión'); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) return <div className="p-10 text-oxi-blue">Cargando...</div>;

  return (
    <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6 border-t-4 border-oxi-blue mt-6">
      <h2 className="text-2xl font-bold mb-6 text-oxi-dark border-b pb-2">Editar Servicio</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Tratamiento</label>
            <input type="text" name="nombres_tra" value={formData.nombres_tra || ''} onChange={handleChange} required 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-oxi-blue focus:border-oxi-blue" 
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Descripción del Tratamiento</label>
            <textarea name="descripcion_tra" value={formData.descripcion_tra || ''} onChange={handleChange} required 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-oxi-blue focus:border-oxi-blue" rows={6}
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700">Precio Base ($)</label>
            <input type="number" step="0.01" name="precioBase_tra" value={formData.precioBase_tra || ''} onChange={handleChange} required 
               className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-oxi-blue focus:border-oxi-blue"
            />
        </div>

        <div className="pt-5 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-oxi-blue py-2 px-4 text-sm font-medium text-white hover:bg-oxi-dark">Actualizar</button>
        </div>
      </form>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NuevoTratamientoPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombres_tra: '',
    descripcion_tra: '',
    precioBase_tra: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_SCHEDULING}/tratamientos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push('/tratamientos');
        router.refresh();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) { alert('Error de conexión'); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6 border-t-4 border-pie-green mt-6">
      <h2 className="text-2xl font-bold mb-6 text-oxi-dark border-b pb-2">Crear Servicio</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Nombre */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Tratamiento</label>
            <input type="text" name="nombres_tra" required onChange={handleChange} 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-oxi-blue focus:border-oxi-blue" 
              placeholder="Ej. Corte de uñas, Tratamiento micosis..."
            />
        </div>

        {/* Descripción */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Descripción del Tratamiento</label>
            <textarea name="descripcion_tra" required onChange={handleChange} 
              className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-oxi-blue focus:border-oxi-blue" 
              placeholder="Descripción del tratamiento..."
              rows={6}
            />
        </div>

        {/* Precio */}
        <div>
            <label className="block text-sm font-medium text-gray-700">Precio Base ($)</label>
            <input type="number" step="0.01" name="precioBase_tra" required onChange={handleChange} 
               className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:ring-oxi-blue focus:border-oxi-blue"
               placeholder="0.00"
            />
        </div>

        <div className="pt-5 flex justify-end gap-3">
            <button type="button" onClick={() => router.back()} className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
            <button type="submit" className="rounded-md bg-pie-green py-2 px-4 text-sm font-medium text-white hover:bg-pie-dark">Guardar</button>
        </div>
      </form>
    </div>
  );
}
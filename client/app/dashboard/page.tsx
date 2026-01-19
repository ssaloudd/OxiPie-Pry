'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function DashboardPage() {
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

  const [fechas, setFechas] = useState({ inicio: firstDay, fin: lastDay });
  const [data, setData] = useState({
      ingresos: { total: 0, consultas: 0, citas: 0 },
      egresos: 0,
      utilidad: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_FINANCE}/finanzas/balance?inicio=${fechas.inicio}&fin=${fechas.fin}`);
            if (res.ok) {
                const resultado = await res.json();
                setData(resultado);
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };
    fetchData();
  }, [fechas]);

  // --- CONFIGURACIÓN DE LOS DOS GRÁFICOS ---

  // GRÁFICO 1: Fuentes de Ingreso (Consultas vs Citas)
  const dataFuentes = [
    { name: 'Consultas', monto: data.ingresos.consultas, color: '#185A9D' }, // Azul
    { name: 'Citas', monto: data.ingresos.citas, color: '#43CB83' }          // Verde Pie
  ];

  // GRÁFICO 2: Balance General (Ingresos vs Egresos)
  const dataBalance = [
    { name: 'Ingresos', monto: data.ingresos.total, color: '#10B981' }, // Verde Esmeralda
    { name: 'Egresos', monto: data.egresos, color: '#EF4444' }          // Rojo
  ];

  const formatMoney = (value: any) => `$${Number(value).toFixed(2)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8 pb-10">
      
      {/* CABECERA Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-oxi-dark">Dashboard Financiero</h1>
          
          <div className="flex items-center gap-2 bg-white p-2 rounded shadow-sm border mt-4 md:mt-0">
              <span className="text-sm font-semibold">Desde:</span>
              <input type="date" value={fechas.inicio} onChange={e => setFechas({...fechas, inicio: e.target.value})} className="border rounded p-1 text-sm"/>
              <span className="text-sm font-semibold">Hasta:</span>
              <input type="date" value={fechas.fin} onChange={e => setFechas({...fechas, fin: e.target.value})} className="border rounded p-1 text-sm"/>
          </div>
      </div>

      {loading ? <div className="text-center py-20 text-gray-500">Calculando indicadores...</div> : (
          <div className="space-y-8">
              
              {/* 1. TARJETAS DE RESUMEN (KPIs) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Ingresos Consultas */}
                  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-600">
                      <p className="text-xs font-bold text-gray-400 uppercase">Ingresos Consultas</p>
                      <h3 className="text-2xl font-extrabold text-gray-800 mt-1">${data.ingresos.consultas.toFixed(2)}</h3>
                  </div>
                  
                  {/* Ingresos Citas */}
                  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
                      <p className="text-xs font-bold text-gray-400 uppercase">Ingresos Citas</p>
                      <h3 className="text-2xl font-extrabold text-gray-800 mt-1">${data.ingresos.citas.toFixed(2)}</h3>
                  </div>

                  {/* Total Egresos */}
                  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
                      <p className="text-xs font-bold text-gray-400 uppercase">Total Gastos</p>
                      <h3 className="text-2xl font-extrabold text-gray-800 mt-1">${data.egresos.toFixed(2)}</h3>
                  </div>

                  {/* Utilidad Neta (Resaltada) */}
                  <div className="bg-gray-800 p-4 rounded-xl shadow border-l-4 border-white">
                      <p className="text-xs font-bold text-gray-400 uppercase">Utilidad Neta</p>
                      <h3 className={`text-2xl font-extrabold mt-1 ${data.utilidad >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${data.utilidad.toFixed(2)}
                      </h3>
                  </div>
              </div>

              {/* 2. ZONA DE GRÁFICOS (DOS COLUMNAS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* GRÁFICO 1: Desglose de Ingresos */}
                  <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-700 mb-6 text-center border-b pb-2">
                          1. Desglose de Ingresos
                      </h3>
                      <div className="h-72 w-full">
                          <ResponsiveContainer>
                              <BarChart data={dataFuentes} margin={{top: 10, right: 30, left: 0, bottom: 0}} barSize={60}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" tick={{fill: '#4B5563', fontWeight: 'bold'}} axisLine={false} tickLine={false}/>
                                  <YAxis tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false}/>
                                  <Tooltip formatter={(val: any) => [formatMoney(val), 'Monto']} cursor={{fill: '#F3F4F6'}}/>
                                  <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                                    {dataFuentes.map((e, i) => <Cell key={i} fill={e.color} />)}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-4">Comparativa: ¿Qué genera más ingresos?</p>
                  </div>

                  {/* GRÁFICO 2: Balance General */}
                  <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
                      <h3 className="text-lg font-bold text-gray-700 mb-6 text-center border-b pb-2">
                          2. Balance General
                      </h3>
                      <div className="h-72 w-full">
                          <ResponsiveContainer>
                              <BarChart data={dataBalance} margin={{top: 10, right: 30, left: 0, bottom: 0}} barSize={60}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                  <XAxis dataKey="name" tick={{fill: '#4B5563', fontWeight: 'bold'}} axisLine={false} tickLine={false}/>
                                  <YAxis tickFormatter={(val) => `$${val}`} axisLine={false} tickLine={false}/>
                                  <Tooltip formatter={(val: any) => [formatMoney(val), 'Monto']} cursor={{fill: '#F3F4F6'}}/>
                                  <Bar dataKey="monto" radius={[6, 6, 0, 0]}>
                                    {dataBalance.map((e, i) => <Cell key={i} fill={e.color} />)}
                                  </Bar>
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-4">Comparativa: Entradas vs Salidas</p>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
}
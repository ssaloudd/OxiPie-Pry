import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OxiPie - Gestión",
  description: "Sistema de gestión podológica",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-gray-50 text-gray-800`}>
        {/* Navbar */}
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  {/* Logo Texto Simulado */}
                  <span className="text-2xl font-bold text-oxi-blue">Oxi</span>
                  <span className="text-2xl font-bold text-pie-green">Pie</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  
                  {/* 1. Dashboard (Gráficos de Ingresos) */}
                  <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Dashboard
                  </Link>

                  {/* 2. Personal (Podólogas) */}
                  <Link href="/podologas" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Personal
                  </Link>

                  {/* 3. Servicios (Tratamientos) */}
                  <Link href="/tratamientos" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Servicios
                  </Link>

                  {/* 4. Pacientes */}
                  <Link href="/pacientes" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Pacientes
                  </Link>

                  {/* 5. Consultas (Historial) */}
                  <Link href="/consultas" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Consultas
                  </Link>

                  {/* 6. Citas (Lista) */}
                  <Link href="/citas" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Citas
                  </Link>

                  {/* 7. Agenda (Visualizador) */}
                  <Link href="/agenda" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Agenda
                  </Link>

                  {/* 8. Finanzas (Egresos y Gastos) - NUEVO AGREGADO */}
                  <Link href="/finanzas" className="border-transparent text-gray-500 hover:border-pie-green hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                    Finanzas
                  </Link>

                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
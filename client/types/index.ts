export interface Paciente {
  id_pac: number;
  nombres_pac: string;
  apellidos_pac: string;
  cedula_pac: string;
  genero_pac: 'masculino' | 'femenino' | 'otro';
  telefono_pac?: string;
  direccion_pac?: string;
  email_pac?: string;
  fechaNac_pac: string; // Viene como string ISO del backend
}

export interface Podologa {
  id_pod: number;
  nombres_pod: string;
  apellidos_pod: string;
  cedula_pod: string;
  genero_pod: 'masculino' | 'femenino' | 'otro';
  telefono_pod?: string;
  direccion_pod?: string;
  email_pod?: string;
  fechaNac_pod: string;
}

export interface Tratamiento {
  id_tra: number;
  nombres_tra: string;
  descripcion_tra: string;
  precioBase_tra: number;
}

export interface Cita {
  id_cit: number;
  id_pac: number;
  id_pod?: number; // Opcional
  id_tra: number;
  //id_con_origen?: number; // Opcional, si viene de una consulta
  fechaHora_cit: string;
  horaInicio_cit: string;
  horaFin_cit: string;
  notasAdicionales_cit?: string;
  precioAcordado_cit: number;
  estado_cit: 'pendiente' | 'completada' | 'cancelada' | 'noAsistio';
  pagado_cit: boolean;
  cantidadPagada_cit: number;
  
  // Relaciones expandidas (vienen del include de prisma)
  tratamiento?: Tratamiento;
  podologa?: Podologa;
  //consultaOrigen?: Consulta;
  // El paciente no viene anidado directamente desde scheduling, hay que cruzarlo
}

export interface Consulta {
  id_con: number;
  id_pac: number;
  id_pod?: number;
  fechaHora_con: string;
  horaInicio_con: string;
  horaFin_con: string;
  motivoConsulta_con: string;
  diagnostico_con?: string;
  notasAdicionales_con?: string;
  estado_con: 'pendiente' | 'completada' | 'cancelada' | 'noAsistio';
  pagado_con: boolean;
  cantidadPagada_con: number;
  id_tra_recomendado?: number;
  precioSugerido_con?: number;

  // Relaciones
  podologa?: Podologa;
  tratamientoSugerido?: Tratamiento;
  // Paciente se cruza manualmente
}
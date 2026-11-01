import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCoursesForInstitution, resolveTenantKey } from '../utils/multiTenantStore';
import * as XLSX from 'xlsx';
import {
  Clock,
  Calendar,
  Coffee,
  Printer,
  BookOpen,
  Building2,
  CheckCircle,
  Filter,
  Plus,
  Edit2,
  X,
  FileSpreadsheet,
  Award,
  Sparkles,
  User,
  School,
  ArrowRight,
} from 'lucide-react';

interface SlotDetail {
  subject: string;
  grade: string;
  room: string;
  teacher: string;
  isMine: boolean; // Denota si es dictada por el maestro logueado
  color: string;
}

interface ScheduleSlot {
  period: number;
  timeRange: string;
  isRecess?: boolean;
  days: {
    lunes?: SlotDetail;
    martes?: SlotDetail;
    miercoles?: SlotDetail;
    jueves?: SlotDetail;
    viernes?: SlotDetail;
  };
}

const CURSOS_SCHEDULE = [
  { id: 'SEC_1A', nombre: '1º de Secundaria - Paralelo "A"', turno: 'Mañana', aula: 'Aula 101' },
  { id: 'SEC_1B', nombre: '1º de Secundaria - Paralelo "B"', turno: 'Tarde', aula: 'Aula 102' },
  { id: 'SEC_2A', nombre: '2º de Secundaria - Paralelo "A"', turno: 'Mañana', aula: 'Aula 103' },
  { id: 'PRIM_1A', nombre: '1º de Primaria - Paralelo "A"', turno: 'Mañana', aula: 'Aula 201' },
  { id: 'PRIM_2A', nombre: '2º de Primaria - Paralelo "A"', turno: 'Mañana', aula: 'Aula 202' },
];

// Horario específico de 1° Secundaria A (Con clases destacadas de Carlos Mamani)
const SCHEDULE_SEC_1A: ScheduleSlot[] = [
  {
    period: 1,
    timeRange: '08:00 - 08:45',
    days: {
      lunes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Ciencias Naturales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Marleny Torrez', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      miercoles: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Ciencias Sociales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Roberto Quispe', isMine: false, color: 'bg-amber-50 border-amber-200 text-amber-900' },
    },
  },
  {
    period: 2,
    timeRange: '08:45 - 09:30',
    days: {
      lunes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Ciencias Naturales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Marleny Torrez', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      miercoles: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      jueves: { subject: 'Lengua Originaria (Guaraní)', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Sonia Choque', isMine: false, color: 'bg-purple-50 border-purple-200 text-purple-900' },
      viernes: { subject: 'Ciencias Sociales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Roberto Quispe', isMine: false, color: 'bg-amber-50 border-amber-200 text-amber-900' },
    },
  },
  {
    period: 3,
    timeRange: '09:30 - 10:15',
    days: {
      lunes: { subject: 'Artes Plásticas y Visuales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Javier Gomez', isMine: false, color: 'bg-rose-50 border-rose-200 text-rose-900' },
      martes: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      miercoles: { subject: 'Educación Física y Deportes', grade: '1º Sec "A"', room: 'Canchas', teacher: 'Prof. Hugo Morales', isMine: false, color: 'bg-teal-50 border-teal-200 text-teal-900' },
      jueves: { subject: 'Taller de Lectura Crítica', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Educación Musical', grade: '1º Sec "A"', room: 'Aula Música', teacher: 'Prof. David Alanoca', isMine: false, color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
    },
  },
  {
    period: 0,
    timeRange: '10:15 - 10:45',
    isRecess: true,
    days: {},
  },
  {
    period: 4,
    timeRange: '10:45 - 11:30',
    days: {
      lunes: { subject: 'Artes Plásticas y Visuales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Javier Gomez', isMine: false, color: 'bg-rose-50 border-rose-200 text-rose-900' },
      martes: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      miercoles: { subject: 'Educación Física y Deportes', grade: '1º Sec "A"', room: 'Canchas', teacher: 'Prof. Hugo Morales', isMine: false, color: 'bg-teal-50 border-teal-200 text-teal-900' },
      jueves: { subject: 'Técnica Tecnológica', grade: '1º Sec "A"', room: 'Laboratorio', teacher: 'Prof. Walter Flores', isMine: false, color: 'bg-slate-100 border-slate-300 text-slate-800' },
      viernes: { subject: 'Reforzamiento Pedagógico', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
  {
    period: 5,
    timeRange: '11:30 - 12:15',
    days: {
      lunes: { subject: 'Valores, Espiritualidad y Religiones', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Miriam Cruz', isMine: false, color: 'bg-orange-50 border-orange-200 text-orange-900' },
      martes: { subject: 'Lengua Extranjera (Inglés)', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Gary Nina', isMine: false, color: 'bg-sky-50 border-sky-200 text-sky-900' },
      miercoles: { subject: 'Técnica Tecnológica', grade: '1º Sec "A"', room: 'Laboratorio', teacher: 'Prof. Walter Flores', isMine: false, color: 'bg-slate-100 border-slate-300 text-slate-800' },
      jueves: { subject: 'Ciencias Naturales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Marleny Torrez', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      viernes: { subject: 'Consejo y Tutoría', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
  {
    period: 6,
    timeRange: '12:15 - 13:00',
    days: {
      lunes: { subject: 'Lengua Extranjera (Inglés)', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Gary Nina', isMine: false, color: 'bg-sky-50 border-sky-200 text-sky-900' },
      martes: { subject: 'Lengua Extranjera (Inglés)', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Gary Nina', isMine: false, color: 'bg-sky-50 border-sky-200 text-sky-900' },
      miercoles: { subject: 'Física y Química Inicial', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Alberto Simon', isMine: false, color: 'bg-cyan-50 border-cyan-200 text-cyan-900' },
      jueves: { subject: 'Ciencias Naturales', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Marleny Torrez', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      viernes: { subject: 'Limpieza y Orden del Aula', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
];

// Horario específico de 1° Secundaria B
const SCHEDULE_SEC_1B: ScheduleSlot[] = [
  {
    period: 1,
    timeRange: '13:30 - 14:15',
    days: {
      lunes: { subject: 'Matemática', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      miercoles: { subject: 'Ciencias Sociales', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Roberto Quispe', isMine: false, color: 'bg-amber-50 border-amber-200 text-amber-900' },
      jueves: { subject: 'Ciencias Naturales', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Marleny Torrez', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      viernes: { subject: 'Matemática', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
  {
    period: 2,
    timeRange: '14:15 - 15:00',
    days: {
      lunes: { subject: 'Matemática', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      miercoles: { subject: 'Ciencias Sociales', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Roberto Quispe', isMine: false, color: 'bg-amber-50 border-amber-200 text-amber-900' },
      jueves: { subject: 'Ciencias Naturales', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Marleny Torrez', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      viernes: { subject: 'Matemática', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
  {
    period: 0,
    timeRange: '15:45 - 16:15',
    isRecess: true,
    days: {},
  },
  {
    period: 3,
    timeRange: '15:00 - 15:45',
    days: {
      lunes: { subject: 'Lengua Extranjera', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Gary Nina', isMine: false, color: 'bg-sky-50 border-sky-200 text-sky-900' },
      martes: { subject: 'Artes Plásticas', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Javier Gomez', isMine: false, color: 'bg-rose-50 border-rose-200 text-rose-900' },
      miercoles: { subject: 'Educación Física', grade: '1º Sec "B"', room: 'Canchas', teacher: 'Prof. Hugo Morales', isMine: false, color: 'bg-teal-50 border-teal-200 text-teal-900' },
      jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Lengua Originaria Guaraní', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Sonia Choque', isMine: false, color: 'bg-purple-50 border-purple-200 text-purple-900' },
    },
  },
  {
    period: 4,
    timeRange: '16:15 - 17:00',
    days: {
      lunes: { subject: 'Lengua Extranjera', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Gary Nina', isMine: false, color: 'bg-sky-50 border-sky-200 text-sky-900' },
      martes: { subject: 'Artes Plásticas', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Javier Gomez', isMine: false, color: 'bg-rose-50 border-rose-200 text-rose-900' },
      miercoles: { subject: 'Educación Física', grade: '1º Sec "B"', room: 'Canchas', teacher: 'Prof. Hugo Morales', isMine: false, color: 'bg-teal-50 border-teal-200 text-teal-900' },
      jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Técnica Tecnológica', grade: '1º Sec "B"', room: 'Laboratorio', teacher: 'Prof. Walter Flores', isMine: false, color: 'bg-slate-100 border-slate-300 text-slate-800' },
    },
  },
];

// Horario específico de 2° Secundaria A
const SCHEDULE_SEC_2A: ScheduleSlot[] = [
  {
    period: 1,
    timeRange: '08:00 - 08:45',
    days: {
      lunes: { subject: 'Matemática (Álgebra)', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Física y Química', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Alberto Simon', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      miercoles: { subject: 'Comunicación y Lenguajes', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Laura Mendoza', isMine: false, color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
      jueves: { subject: 'Matemática (Álgebra)', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Ciencias Sociales', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Roberto Quispe', isMine: false, color: 'bg-amber-50 border-amber-200 text-amber-900' },
    },
  },
  {
    period: 2,
    timeRange: '08:45 - 09:30',
    days: {
      lunes: { subject: 'Matemática (Álgebra)', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Física y Química', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Alberto Simon', isMine: false, color: 'bg-blue-50 border-blue-200 text-blue-900' },
      miercoles: { subject: 'Comunicación y Lenguajes', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Laura Mendoza', isMine: false, color: 'bg-indigo-50 border-indigo-200 text-indigo-900' },
      jueves: { subject: 'Matemática (Álgebra)', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Ciencias Sociales', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Roberto Quispe', isMine: false, color: 'bg-amber-50 border-amber-200 text-amber-900' },
    },
  },
];

// Horario específico del Maestro (Carlos Mamani: 16 hrs semanales consolidadas)
const SCHEDULE_MAESTRO_PERSONAL: ScheduleSlot[] = [
  {
    period: 1,
    timeRange: '08:00 - 08:45',
    days: {
      lunes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      miercoles: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Matemática (Álgebra)', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
  {
    period: 2,
    timeRange: '08:45 - 09:30',
    days: {
      lunes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      martes: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      miercoles: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      jueves: { subject: 'Matemática (Álgebra)', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Matemática (Álgebra)', grade: '2º Sec "A"', room: 'Aula 103', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
  {
    period: 3,
    timeRange: '09:30 - 10:15',
    days: {
      lunes: { subject: 'Atención a Padres (Kardex)', grade: '1º Sec "A"', room: 'Gabinete', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-amber-50 border-amber-300 text-amber-900' },
      martes: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      miercoles: { subject: 'Taller de Lectura Crítica', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Consejo y Tutoría de Curso', grade: 'Docentes', room: 'Sala Maestros', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-slate-100 border-slate-300 text-slate-800' },
    },
  },
  {
    period: 0,
    timeRange: '10:15 - 10:45',
    isRecess: true,
    days: {},
  },
  {
    period: 4,
    timeRange: '10:45 - 11:30',
    days: {
      martes: { subject: 'Matemática', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      jueves: { subject: 'Comunicación y Lenguajes', grade: '1º Sec "B"', room: 'Aula 102', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
      viernes: { subject: 'Reforzamiento Pedagógico', grade: '1º Sec "A"', room: 'Aula 101', teacher: 'Prof. Carlos Mamani C.', isMine: true, color: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
    },
  },
];

const EMPTY_SCHEDULE: ScheduleSlot[] = [
  { period: 1, timeRange: '08:00 - 08:45', days: {} },
  { period: 2, timeRange: '08:45 - 09:30', days: {} },
  { period: 3, timeRange: '09:30 - 10:15', days: {} },
  { period: 0, timeRange: '10:15 - 10:45', isRecess: true, days: {} },
  { period: 4, timeRange: '10:45 - 11:30', days: {} },
  { period: 5, timeRange: '11:30 - 12:15', days: {} },
  { period: 6, timeRange: '12:15 - 13:00', days: {} },
];

export const SchedulePage: React.FC = () => {
  const { isMaestro, isDirector, isSuperAdmin, currentInstitutionId, user } = useAuth();
  const activeSie = resolveTenantKey(currentInstitutionId);
  const currentInst = user?.institutions?.find(i => (i.id || i.institutionId || i.sie) === currentInstitutionId) || user?.institutions?.[0];
  const institutionName = currentInst?.nombre || 'Unidad Educativa';

  const rawCourses = getCoursesForInstitution(activeSie);
  const cursosDisponibles = rawCourses.map((c) => ({
    id: c.id,
    nombre: `${c.cursoNombre} - Paralelo "${c.letra}"`,
    turno: c.turno,
    aula: `Aula ${c.grado}0${c.letra.charCodeAt(0) - 64}`,
  }));

  // Vista: 'my_schedule' (Mi Horario Docente) vs 'course' (Horario por Curso y Paralelo)
  const [viewMode, setViewMode] = useState<'my_schedule' | 'course'>(
    isMaestro ? 'my_schedule' : 'course'
  );
  const [selectedCursoId, setSelectedCursoId] = useState<string>('');

  useEffect(() => {
    if (cursosDisponibles.length > 0) {
      if (!selectedCursoId || !cursosDisponibles.some((c) => c.id === selectedCursoId)) {
        setSelectedCursoId(cursosDisponibles[0].id);
      }
    } else {
      setSelectedCursoId('');
    }
  }, [cursosDisponibles, selectedCursoId]);

  // Selección de horario según la vista y el curso seleccionado
  const activeSlots: ScheduleSlot[] =
    activeSie === '80730045'
      ? viewMode === 'my_schedule'
        ? SCHEDULE_MAESTRO_PERSONAL
        : selectedCursoId === 'SEC_1B'
          ? SCHEDULE_SEC_1B
          : selectedCursoId === 'SEC_2A'
            ? SCHEDULE_SEC_2A
            : SCHEDULE_SEC_1A
      : EMPTY_SCHEDULE;

  const currentCurso = cursosDisponibles.find((c) => c.id === selectedCursoId);

  // Exportar Horario a Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    const titulo =
      viewMode === 'my_schedule'
        ? `HORARIO DOCENTE SEMANAL - ${user?.persona?.nombres || 'PROFESOR'} ${user?.persona?.primerApellido || ''}`
        : `HORARIO SEMANAL OFICIAL - ${(currentCurso?.nombre || selectedCursoId).toUpperCase()}`;

    const wsData: any[][] = [
      ['ESTADO PLURINACIONAL DE BOLIVIA - MINISTERIO DE EDUCACIÓN'],
      [`${institutionName.toUpperCase()} (SIE: ${activeSie})`],
      [titulo],
      [''],
      ['Período / Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
    ];

    activeSlots.forEach((slot) => {
      if (slot.isRecess) {
        wsData.push([slot.timeRange, 'DESCANSO', 'PEDAGÓGICO', 'RECREO', 'ESCOLAR', '']);
      } else {
        wsData.push([
          `Período ${slot.period} (${slot.timeRange})`,
          slot.days.lunes ? `${slot.days.lunes.subject} (${slot.days.lunes.teacher})` : '-',
          slot.days.martes ? `${slot.days.martes.subject} (${slot.days.martes.teacher})` : '-',
          slot.days.miercoles ? `${slot.days.miercoles.subject} (${slot.days.miercoles.teacher})` : '-',
          slot.days.jueves ? `${slot.days.jueves.subject} (${slot.days.jueves.teacher})` : '-',
          slot.days.viernes ? `${slot.days.viernes.subject} (${slot.days.viernes.teacher})` : '-',
        ]);
      }
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
      { wch: 22 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
      { wch: 32 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Horario');
    XLSX.writeFile(wb, `Horario_${viewMode === 'my_schedule' ? 'Docente' : selectedCursoId}_2026.xlsx`);
  };

  if (cursosDisponibles.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestión de Horarios Escolares y Distribución de Aulas
              </h1>
              <p className="text-xs text-slate-500">
                {institutionName} • Gestión 2026
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <School className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Espacio en blanco: Aún no hay cursos creados
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Para organizar los horarios semanales y asignación de aulas de <span className="font-semibold text-slate-700">{institutionName}</span>, primero debes registrar los cursos y paralelos.
            </p>
            <div className="pt-2">
              <Link
                to="/academic"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <span>Habilitar Cursos y Paralelos</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {viewMode === 'my_schedule'
                ? 'Mi Horario Docente y Carga Horaria'
                : 'Distribución de Horarios por Curso y Aula'}
            </h1>
            <p className="text-xs text-slate-500">
              {viewMode === 'my_schedule'
                ? `${user?.persona?.nombres || 'Docente'} ${user?.persona?.primerApellido || ''} • Horas Pedagógicas Semanales Asignadas (${institutionName})`
                : `${currentCurso?.nombre || 'Seleccione un curso'} • ${institutionName} (SIE ${activeSie})`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
        </div>
      </div>

      {/* View Mode & Course Selector Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Toggle Mode */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
            Modalidad de Visualización:
          </label>
          <div className="flex space-x-1.5">
            <button
              onClick={() => setViewMode('my_schedule')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${viewMode === 'my_schedule'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mi Horario Docente</span>
            </button>
            <button
              onClick={() => setViewMode('course')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${viewMode === 'course'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Por Curso y Paralelo</span>
            </button>
          </div>
        </div>

        {/* Course Selector (Active when 'course' view is selected) */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            <span>Seleccionar Curso y Paralelo:</span>
          </label>
          <select
            disabled={viewMode === 'my_schedule'}
            value={selectedCursoId}
            onChange={(e) => setSelectedCursoId(e.target.value)}
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 disabled:opacity-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {cursosDisponibles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.aula})
              </option>
            ))}
          </select>
        </div>

        {/* Legend for Teacher Highlights */}
        <div className="flex flex-col justify-end text-xs text-slate-500 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" />
            <span className="font-bold text-slate-800">★ Dictado por mí (Prof. Carlos Mamani)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
            <span className="text-slate-500">Dictado por otros Docentes de Área</span>
          </div>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>
              {viewMode === 'my_schedule'
                ? 'Malla Semanal Consolidada de Clases (Lunes a Viernes)'
                : `Malla Semanal • ${currentCurso?.nombre} (${currentCurso?.aula})`}
            </span>
          </span>
          <span className="text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            {viewMode === 'my_schedule' ? '16 Horas / Semana' : `Turno ${currentCurso?.turno}`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-center">
                <th className="py-3 px-3 w-28 border-r border-slate-200">Período / Hora</th>
                <th className="py-3 px-3 w-1/5 border-r border-slate-200">Lunes</th>
                <th className="py-3 px-3 w-1/5 border-r border-slate-200">Martes</th>
                <th className="py-3 px-3 w-1/5 border-r border-slate-200">Miércoles</th>
                <th className="py-3 px-3 w-1/5 border-r border-slate-200">Jueves</th>
                <th className="py-3 px-3 w-1/5">Viernes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeSlots.map((slot, index) => {
                if (slot.isRecess) {
                  return (
                    <tr key={`recess-${index}`} className="bg-amber-50/60 border-y border-amber-200">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-800 border-r border-amber-200">
                        {slot.timeRange}
                      </td>
                      <td colSpan={5} className="py-2.5 text-center font-bold text-amber-800 tracking-wider">
                        <div className="flex items-center justify-center space-x-2">
                          <Coffee className="w-4 h-4 text-amber-600" />
                          <span>DESCANSO PEDAGÓGICO • RECREO ESCOLAR</span>
                        </div>
                      </td>
                    </tr>
                  );
                }

                const daysOrder: Array<'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'> = [
                  'lunes',
                  'martes',
                  'miercoles',
                  'jueves',
                  'viernes',
                ];

                return (
                  <tr key={`slot-${slot.period}`} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center border-r border-slate-200 bg-slate-50/50">
                      <div className="font-bold text-slate-800">{slot.period}º Período</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{slot.timeRange}</div>
                    </td>

                    {daysOrder.map((day) => {
                      const detail = slot.days[day];
                      if (!detail) {
                        return (
                          <td key={day} className="py-3 px-2 border-r border-slate-200 text-center">
                            <span className="text-[11px] text-slate-300 italic">Libre / Sin Carga</span>
                          </td>
                        );
                      }

                      return (
                        <td key={day} className="py-2 px-2 border-r border-slate-200 align-top">
                          <div
                            className={`p-2.5 rounded-xl border transition shadow-xs ${detail.isMine
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/20'
                                : detail.color
                              }`}
                          >
                            <div className="flex items-start justify-between">
                              <span className="font-extrabold text-xs block leading-tight">
                                {detail.subject}
                              </span>
                              {detail.isMine && (
                                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                                  ★ MI CLASE
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] text-slate-600 mt-1 font-medium flex items-center justify-between">
                              <span className="font-bold text-slate-800">{detail.grade}</span>
                              <span className="font-mono bg-white/70 px-1 rounded">{detail.room}</span>
                            </div>

                            <div className="text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-200/50">
                              {detail.teacher}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getCoursesForInstitution,
  saveCoursesForInstitution,
  getTeachersForInstitution,
  getMateriasForInstitution,
  getSchedulesForInstitution,
  saveSchedulesForInstitution,
  resolveTenantKey,
  type TenantParalelo,
  type TenantTeacher,
  type TenantMateria,
  type TenantScheduleSlot,
} from '../utils/multiTenantStore';
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
  Trash2,
  AlertTriangle,
  CheckCircle2,
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

  const [coursesList, setCoursesList] = useState<TenantParalelo[]>(() => getCoursesForInstitution(activeSie));
  const [teachersList, setTeachersList] = useState<TenantTeacher[]>(() => getTeachersForInstitution(activeSie));
  const [materiasList, setMateriasList] = useState<TenantMateria[]>(() => getMateriasForInstitution(activeSie));
  const [storedSlots, setStoredSlots] = useState<TenantScheduleSlot[]>(() => getSchedulesForInstitution(activeSie));
  const [feedback, setFeedback] = useState<string | null>(null);

  // Modal para asignar/editar slot en el horario
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotFormData, setSlotFormData] = useState<{
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';
    periodo: number;
    materiaNombre: string;
    docenteNombre: string;
    aula: string;
  }>({
    dia: 'lunes',
    periodo: 1,
    materiaNombre: '',
    docenteNombre: '',
    aula: 'Aula 101',
  });
  const [collisionWarning, setCollisionWarning] = useState<string | null>(null);

  useEffect(() => {
    setCoursesList(getCoursesForInstitution(activeSie));
    setTeachersList(getTeachersForInstitution(activeSie));
    setMateriasList(getMateriasForInstitution(activeSie));
    setStoredSlots(getSchedulesForInstitution(activeSie));
  }, [activeSie]);

  useEffect(() => {
    const handleCourses = () => setCoursesList(getCoursesForInstitution(activeSie));
    const handleTeachers = () => setTeachersList(getTeachersForInstitution(activeSie));
    const handleMaterias = () => setMateriasList(getMateriasForInstitution(activeSie));
    const handleSchedules = () => setStoredSlots(getSchedulesForInstitution(activeSie));

    window.addEventListener('sigma_courses_updated', handleCourses);
    window.addEventListener('sigma_teachers_updated', handleTeachers);
    window.addEventListener('sigma_materias_updated', handleMaterias);
    window.addEventListener('sigma_schedules_updated', handleSchedules);

    return () => {
      window.removeEventListener('sigma_courses_updated', handleCourses);
      window.removeEventListener('sigma_teachers_updated', handleTeachers);
      window.removeEventListener('sigma_materias_updated', handleMaterias);
      window.removeEventListener('sigma_schedules_updated', handleSchedules);
    };
  }, [activeSie]);

  const handleQuickInitStandardCourses = () => {
    const defaultCourses: TenantParalelo[] = [
      { id: `c-${Date.now()}-1`, cursoNombre: '1° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 1, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-2`, cursoNombre: '2° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 2, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-3`, cursoNombre: '3° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 3, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-4`, cursoNombre: '4° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 4, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-5`, cursoNombre: '5° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 5, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
      { id: `c-${Date.now()}-6`, cursoNombre: '6° de Secundaria Comunitaria Productiva', nivel: 'SECUNDARIA', grado: 6, letra: 'A', turno: 'Mañana', cupo: 35, inscritos: 0 },
    ];
    saveCoursesForInstitution(activeSie, defaultCourses);
    setCoursesList(defaultCourses);
    setSelectedCursoId(defaultCourses[0].id);
  };

  const cursosDisponibles = coursesList.map((c) => ({
    id: c.id,
    nombre: `${c.cursoNombre} - Paralelo "${c.letra}"`,
    turno: c.turno,
    aula: `Aula ${c.grado}0${c.letra.charCodeAt(0) - 64}`,
    nivel: c.nivel,
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

  const currentCurso = cursosDisponibles.find((c) => c.id === selectedCursoId);
  const isCursoPrimaria = currentCurso?.nivel === 'PRIMARIA' || currentCurso?.nombre?.toLowerCase().includes('primaria');

  const filteredMateriasForCurso = materiasList.filter((m) =>
    isCursoPrimaria
      ? m.nivel === 'PRIMARIA' || m.nivel === 'AMBOS'
      : m.nivel === 'SECUNDARIA' || m.nivel === 'AMBOS'
  );

  const courseCustomSlots = storedSlots.filter((s) => s.cursoId === selectedCursoId);

  // Selección de horario según la vista y el curso seleccionado
  const activeSlots: ScheduleSlot[] = React.useMemo(() => {
    if (viewMode === 'my_schedule') {
      return SCHEDULE_MAESTRO_PERSONAL;
    }

    if (courseCustomSlots.length > 0) {
      const daysOrder: Array<'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'> = [
        'lunes', 'martes', 'miercoles', 'jueves', 'viernes'
      ];

      return [
        { period: 1, timeRange: '08:00 - 08:45', days: {} },
        { period: 2, timeRange: '08:45 - 09:30', days: {} },
        { period: 3, timeRange: '09:30 - 10:15', days: {} },
        { period: 0, timeRange: '10:15 - 10:45', isRecess: true, days: {} },
        { period: 4, timeRange: '10:45 - 11:30', days: {} },
        { period: 5, timeRange: '11:30 - 12:15', days: {} },
        { period: 6, timeRange: '12:15 - 13:00', days: {} },
      ].map((slot) => {
        if (slot.isRecess) return slot;
        const daysObj: Record<string, SlotDetail> = {};
        daysOrder.forEach((day) => {
          const match = courseCustomSlots.find((s) => s.dia === day && s.periodo === slot.period);
          if (match) {
            daysObj[day] = {
              subject: match.materiaNombre,
              grade: currentCurso ? currentCurso.nombre : '',
              room: match.aula,
              teacher: match.docenteNombre,
              isMine: match.docenteNombre.toLowerCase().includes((user?.persona?.nombres || 'Mamani').toLowerCase()),
              color: match.color || 'bg-emerald-50 border-emerald-300 text-emerald-900',
            };
          }
        });
        return {
          ...slot,
          days: daysObj,
        };
      });
    }

    if (activeSie === '80730045') {
      if (selectedCursoId === 'SEC_1B') return SCHEDULE_SEC_1B;
      if (selectedCursoId === 'SEC_2A') return SCHEDULE_SEC_2A;
      return SCHEDULE_SEC_1A;
    }

    return EMPTY_SCHEDULE;
  }, [viewMode, courseCustomSlots, selectedCursoId, activeSie, currentCurso, user]);

  // Handlers para Asignación Interactiva de Horarios
  const handleOpenSlotModal = (
    dia: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes',
    periodo: number,
    existingDetail?: SlotDetail
  ) => {
    const defaultMat = filteredMateriasForCurso[0]?.nombre || (isCursoPrimaria ? 'Comunicación y Lenguajes' : 'Matemática');
    const defaultDoc = teachersList[0] ? `${teachersList[0].nombres} ${teachersList[0].primerApellido}` : 'Prof. Asignado SEP';

    setSlotFormData({
      dia,
      periodo,
      materiaNombre: existingDetail?.subject || defaultMat,
      docenteNombre: existingDetail?.teacher || defaultDoc,
      aula: existingDetail?.room || (currentCurso?.aula || 'Aula 101'),
    });
    setCollisionWarning(null);
    setShowSlotModal(true);
  };

  const handleDocenteChange = (newDocente: string) => {
    setSlotFormData((prev) => ({ ...prev, docenteNombre: newDocente }));
    const collision = storedSlots.find(
      (s) =>
        s.dia === slotFormData.dia &&
        s.periodo === slotFormData.periodo &&
        s.cursoId !== selectedCursoId &&
        s.docenteNombre.toLowerCase().trim() === newDocente.toLowerCase().trim()
    );

    if (collision) {
      const collidingCourse = coursesList.find((c) => c.id === collision.cursoId)?.cursoNombre || 'otro curso';
      setCollisionWarning(`⚠️ Alerta: ${newDocente} ya tiene asignada la materia "${collision.materiaNombre}" en ${collidingCourse} en este período.`);
    } else {
      setCollisionWarning(null);
    }
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCursoId) return;

    const matchedMateria = materiasList.find((m) => m.nombre === slotFormData.materiaNombre);
    const assignedColor = matchedMateria?.color || 'bg-emerald-50 border-emerald-300 text-emerald-900';

    const filtered = storedSlots.filter(
      (s) => !(s.cursoId === selectedCursoId && s.dia === slotFormData.dia && s.periodo === slotFormData.periodo)
    );

    const newSlot: TenantScheduleSlot = {
      id: `slot-${selectedCursoId}-${slotFormData.dia}-${slotFormData.periodo}`,
      cursoId: selectedCursoId,
      dia: slotFormData.dia,
      periodo: slotFormData.periodo,
      materiaId: matchedMateria?.id || `m-${Date.now()}`,
      materiaNombre: slotFormData.materiaNombre,
      materiaCodigo: matchedMateria?.codigo || 'ASIG',
      docenteId: `d-${Date.now()}`,
      docenteNombre: slotFormData.docenteNombre,
      aula: slotFormData.aula,
      color: assignedColor,
    };

    const updated = [...filtered, newSlot];
    setStoredSlots(updated);
    saveSchedulesForInstitution(activeSie, updated);
    setShowSlotModal(false);
    setFeedback(`✅ Horario asignado: ${slotFormData.materiaNombre} con ${slotFormData.docenteNombre} (${slotFormData.dia.toUpperCase()} ${slotFormData.periodo}º Período).`);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDeleteSlot = (cursoId: string, dia: string, periodo: number) => {
    const updated = storedSlots.filter(
      (s) => !(s.cursoId === cursoId && s.dia === dia && s.periodo === periodo)
    );
    setStoredSlots(updated);
    saveSchedulesForInstitution(activeSie, updated);
    setFeedback(`Clase eliminada del horario.`);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAutoGenerateSchedule = () => {
    if (!currentCurso) return;
    const poolMaterias = filteredMateriasForCurso.length > 0 ? filteredMateriasForCurso : materiasList;
    const poolTeachers = teachersList.length > 0 ? teachersList : [{ nombres: 'Prof. Asignado', primerApellido: 'SEP', id: 'def-1' } as TenantTeacher];

    const days: Array<'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'> = [
      'lunes', 'martes', 'miercoles', 'jueves', 'viernes'
    ];
    const newSlotsForCourse: TenantScheduleSlot[] = [];

    let mIdx = 0;
    days.forEach((day, dIdx) => {
      [1, 2, 3, 4, 5, 6].forEach((p) => {
        const mat = poolMaterias[mIdx % poolMaterias.length];
        const tea = poolTeachers[(mIdx + dIdx) % poolTeachers.length];
        newSlotsForCourse.push({
          id: `slot-${selectedCursoId}-${day}-${p}`,
          cursoId: selectedCursoId,
          dia: day,
          periodo: p,
          materiaId: mat.id,
          materiaNombre: mat.nombre,
          materiaCodigo: mat.codigo,
          docenteId: tea.id,
          docenteNombre: `${tea.nombres} ${tea.primerApellido}`,
          aula: currentCurso.aula || `Aula ${currentCurso.nombre}`,
          color: mat.color || 'bg-emerald-50 border-emerald-300 text-emerald-900',
        });
        mIdx++;
      });
    });

    const remaining = storedSlots.filter((s) => s.cursoId !== selectedCursoId);
    const updated = [...remaining, ...newSlotsForCourse];
    setStoredSlots(updated);
    saveSchedulesForInstitution(activeSie, updated);
    setFeedback(`⚡ Horario semanal completo generado automáticamente para ${currentCurso.nombre} (30 períodos pedagógicos).`);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleClearSchedule = () => {
    if (!window.confirm(`¿Deseas restablecer en blanco el horario de ${currentCurso?.nombre}?`)) return;
    const updated = storedSlots.filter((s) => s.cursoId !== selectedCursoId);
    setStoredSlots(updated);
    saveSchedulesForInstitution(activeSie, updated);
    setFeedback(`Horario de ${currentCurso?.nombre} restablecido.`);
    setTimeout(() => setFeedback(null), 3000);
  };

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
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleQuickInitStandardCourses}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>⚡ Habilitar 1° a 6° Secundaria Ahora</span>
              </button>

              <Link
                to="/academic?create=curso"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
              >
                <span>Gestión de Cursos & Docentes</span>
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
      {/* Toast de Feedback */}
      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-emerald-700 hover:text-emerald-950 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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

        <div className="flex flex-wrap items-center gap-2">
          {viewMode === 'course' && !isMaestro && (
            <>
              <button
                type="button"
                onClick={() => handleOpenSlotModal('lunes', 1)}
                className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Asignar Período</span>
              </button>
              <button
                type="button"
                onClick={handleAutoGenerateSchedule}
                title="Genera automáticamente la distribución curricular de 30 períodos semanales con los docentes y materias disponibles"
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Auto-Generar</span>
              </button>
              <button
                type="button"
                onClick={handleClearSchedule}
                title="Limpiar horario del curso actual"
                className="flex items-center space-x-1.5 px-2.5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Limpiar</span>
              </button>
            </>
          )}

          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
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
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                viewMode === 'my_schedule'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Mi Horario Docente</span>
            </button>
            <button
              onClick={() => setViewMode('course')}
              className={`flex-1 py-2 px-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center space-x-1 ${
                viewMode === 'course'
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
            <span className="font-bold text-slate-800">
              {isMaestro ? '★ Dictado por mí' : '★ Asignación de Materia'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-slate-300 inline-block" />
            <span className="text-slate-500">Mallas y Horarios Oficiales SEP</span>
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
            {viewMode === 'my_schedule' ? '16 Horas / Semana' : `Turno ${currentCurso?.turno || 'Mañana'}`}
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
                  <tr key={`slot-${slot.period}`} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 text-center border-r border-slate-200 bg-slate-50/50">
                      <div className="font-bold text-slate-800">{slot.period}º Período</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{slot.timeRange}</div>
                    </td>

                    {daysOrder.map((day) => {
                      const detail = slot.days[day];
                      if (!detail) {
                        return (
                          <td key={day} className="py-3 px-2 border-r border-slate-200 text-center align-middle">
                            {viewMode === 'course' && !isMaestro ? (
                              <button
                                type="button"
                                onClick={() => handleOpenSlotModal(day, slot.period)}
                                className="w-full py-2.5 border border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-xl text-slate-400 hover:text-emerald-700 text-[11px] font-semibold transition flex items-center justify-center space-x-1 cursor-pointer group"
                              >
                                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                <span>Asignar</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-300 italic">Libre / Sin Carga</span>
                            )}
                          </td>
                        );
                      }

                      return (
                        <td key={day} className="py-2 px-2 border-r border-slate-200 align-top">
                          <div
                            className={`group/card relative p-2.5 rounded-xl border transition shadow-xs ${
                              detail.isMine
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-500/20'
                                : detail.color
                            }`}
                          >
                            {/* Acciones flotantes en la celda */}
                            {viewMode === 'course' && !isMaestro && (
                              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover/card:opacity-100 transition flex items-center space-x-1 bg-white/95 backdrop-blur-xs p-0.5 rounded-lg border border-slate-200 shadow-xs z-10">
                                <button
                                  type="button"
                                  title="Editar período"
                                  onClick={() => handleOpenSlotModal(day, slot.period, detail)}
                                  className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition cursor-pointer"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  title="Quitar asignación"
                                  onClick={() => handleDeleteSlot(selectedCursoId, day, slot.period)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}

                            <div className="flex items-start justify-between pr-4">
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
                              <span className="font-mono bg-white/80 border border-slate-200/50 px-1 rounded text-[9px]">
                                {detail.room}
                              </span>
                            </div>

                            <div className="text-[10px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-200/50 flex items-center space-x-1">
                              <User className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{detail.teacher}</span>
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

      {/* MODAL: Asignar / Editar Período de Horario */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Asignar Materia y Docente al Horario
                  </h3>
                  <p className="text-xs text-slate-500">
                    {currentCurso?.nombre} • {slotFormData.dia.toUpperCase()} (Período {slotFormData.periodo})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSlotModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="mt-4 space-y-4">
              {/* Día y Período */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Día de la Semana
                  </label>
                  <select
                    value={slotFormData.dia}
                    onChange={(e) => {
                      const newDia = e.target.value as any;
                      setSlotFormData({ ...slotFormData, dia: newDia });
                      // Revalidar colisión con el nuevo día
                      if (slotFormData.docenteNombre) {
                        const collision = storedSlots.find(
                          (s) =>
                            s.dia === newDia &&
                            s.periodo === slotFormData.periodo &&
                            s.docenteNombre.toLowerCase().trim() === slotFormData.docenteNombre.toLowerCase().trim() &&
                            s.cursoId !== selectedCursoId
                        );
                        if (collision) {
                          const colCurso = cursosDisponibles.find((c) => c.id === collision.cursoId)?.nombre || collision.cursoId;
                          setCollisionWarning(`⚠️ Conflicto: ${slotFormData.docenteNombre} ya tiene clase asignada en ${colCurso} el ${newDia.toUpperCase()} (${slotFormData.periodo}º Período).`);
                        } else {
                          setCollisionWarning(null);
                        }
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="lunes">Lunes</option>
                    <option value="martes">Martes</option>
                    <option value="miercoles">Miércoles</option>
                    <option value="jueves">Jueves</option>
                    <option value="viernes">Viernes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Período Pedagógico
                  </label>
                  <select
                    value={slotFormData.periodo}
                    onChange={(e) => {
                      const newP = Number(e.target.value);
                      setSlotFormData({ ...slotFormData, periodo: newP });
                      // Revalidar colisión
                      if (slotFormData.docenteNombre) {
                        const collision = storedSlots.find(
                          (s) =>
                            s.dia === slotFormData.dia &&
                            s.periodo === newP &&
                            s.docenteNombre.toLowerCase().trim() === slotFormData.docenteNombre.toLowerCase().trim() &&
                            s.cursoId !== selectedCursoId
                        );
                        if (collision) {
                          const colCurso = cursosDisponibles.find((c) => c.id === collision.cursoId)?.nombre || collision.cursoId;
                          setCollisionWarning(`⚠️ Conflicto: ${slotFormData.docenteNombre} ya tiene clase asignada en ${colCurso} el ${slotFormData.dia.toUpperCase()} (${newP}º Período).`);
                        } else {
                          setCollisionWarning(null);
                        }
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={1}>1º Período (08:00 - 08:45)</option>
                    <option value={2}>2º Período (08:45 - 09:30)</option>
                    <option value={3}>3º Período (09:45 - 10:30)</option>
                    <option value={4}>4º Período (10:30 - 11:15)</option>
                    <option value={5}>5º Período (11:30 - 12:15)</option>
                    <option value={6}>6º Período (12:15 - 13:00)</option>
                  </select>
                </div>
              </div>

              {/* Materia / Área Curricular */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Asignatura / Área de Aprendizaje</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    {isCursoPrimaria ? 'Malla Oficial Primaria' : 'Malla Oficial Secundaria'}
                  </span>
                </label>
                <select
                  required
                  value={slotFormData.materiaNombre}
                  onChange={(e) => setSlotFormData({ ...slotFormData, materiaNombre: e.target.value })}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seleccionar Materia --</option>
                  {filteredMateriasForCurso.map((m) => (
                    <option key={m.id} value={m.nombre}>
                      [{m.codigo}] {m.nombre} ({m.campo})
                    </option>
                  ))}
                </select>
              </div>

              {/* Docente Asignado */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Docente Titular Asignado</span>
                  <span className="text-[10px] text-slate-400">Validación de choque en tiempo real</span>
                </label>
                <select
                  required
                  value={slotFormData.docenteNombre}
                  onChange={(e) => handleDocenteChange(e.target.value)}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seleccionar Docente --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={`${t.nombres} ${t.primerApellido}`}>
                      {t.nombres} {t.primerApellido} {t.especialidad ? `(${t.especialidad})` : ''}
                    </option>
                  ))}
                  {teachersList.length === 0 && (
                    <option value="Prof. Docente Titular">Prof. Docente Titular</option>
                  )}
                </select>
              </div>

              {/* Alerta de Conflicto de Choque Horario */}
              {collisionWarning && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start space-x-2 text-xs text-amber-900 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-tight font-medium">
                    {collisionWarning}
                    <div className="text-[10px] text-amber-700 mt-1">
                      Puedes guardar la asignación igualmente si el docente atiende simultáneamente o ajustar el horario.
                    </div>
                  </div>
                </div>
              )}

              {/* Aula o Espacio Pedagógico */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Aula / Espacio Pedagógico
                </label>
                <input
                  type="text"
                  required
                  value={slotFormData.aula}
                  onChange={(e) => setSlotFormData({ ...slotFormData, aula: e.target.value })}
                  placeholder="Ej: Aula 3-B, Laboratorio de Computación, Cancha"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {/* Sugerencias rápidas */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    currentCurso?.aula || 'Aula Principal',
                    'Laboratorio de Computación',
                    'Laboratorio de Física-Química',
                    'Cancha Polifuncional',
                    'Taller Técnico',
                  ].map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSlotFormData({ ...slotFormData, aula: sug })}
                      className="text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 rounded-lg border border-slate-200 transition cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSlotModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Guardar Asignación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

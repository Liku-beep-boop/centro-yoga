import { getCollection } from 'astro:content';

export const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
export const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Fecha de hoy en Argentina como "AAAA-MM-DD". */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** Las fechas de contenido son "solo día" (medianoche UTC), por eso se leen en UTC. */
export function isoDia(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fmtFecha(d: Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  return new Intl.DateTimeFormat('es-AR', { ...opts, timeZone: 'UTC' }).format(d);
}

export function waLink(numero: string | undefined, texto?: string): string | null {
  const n = (numero ?? '').replace(/\D/g, '');
  if (!n) return null;
  return `https://wa.me/${n}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;
}

/** Eventos de hoy en adelante, ordenados por fecha. Los pasados desaparecen solos. */
export async function eventosFuturos(limite?: number) {
  const hoy = hoyISO();
  const lista = (await getCollection('eventos'))
    .filter((e) => isoDia(e.data.fecha) >= hoy)
    .sort((a, b) => a.data.fecha.getTime() - b.data.fecha.getTime());
  return limite ? lista.slice(0, limite) : lista;
}

/** Entradas del blog publicadas (no borrador), de la más nueva a la más vieja. */
export async function entradasPublicadas(limite?: number) {
  const lista = (await getCollection('blog', ({ data }) => !data.borrador)).sort(
    (a, b) => b.data.fecha.getTime() - a.data.fecha.getTime(),
  );
  return limite ? lista.slice(0, limite) : lista;
}

/** Convierte texto plano con líneas en blanco en párrafos. */
export function parrafos(texto: string | undefined | null): string[] {
  return (texto ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

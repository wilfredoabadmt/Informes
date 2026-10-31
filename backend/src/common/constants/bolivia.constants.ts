export const DEPARTAMENTOS_BOLIVIA = [
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Potosí',
  'Oruro',
  'Chuquisaca',
  'Tarija',
  'Beni',
  'Pando',
] as const;

export type DepartamentoBolivia = (typeof DEPARTAMENTOS_BOLIVIA)[number];

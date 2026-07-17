import { NozzleStatus } from '@/types/api';

/** Product mapping: nozzle code → product name (misma tabla que /preset) */
export const NOZZLE_PRODUCTS: Record<string, string> = {
  '01': 'Super',
  '02': 'Regular',
  '03': 'Diesel',
  '04': 'Super',
  '05': 'Regular',
  '06': 'Diesel',
  '07': 'Super',
  '08': 'Regular',
  '09': 'Diesel',
  '10': 'Super',
  '11': 'Regular',
  '12': 'Diesel',
  '13': 'Super',
  '14': 'Regular',
  '15': 'Diesel',
  '16': 'Super',
  '17': 'Regular',
  '18': 'Diesel',
  '19': 'Super',
  '20': 'Regular',
  '21': 'Diesel',
  '22': 'Super',
  '23': 'Regular',
  '24': 'Diesel',
  '25': 'Super',
  '26': 'Exonerado',
  '27': 'Diesel',
  '28': 'Super',
  '29': 'Exonerado',
  '30': 'Diesel',
};

export const STATUS_LABELS: Record<NozzleStatus, string> = {
  [NozzleStatus.NotConfigured]: 'No Configurado',
  [NozzleStatus.Available]: 'Libre',
  [NozzleStatus.Blocked]: 'Bloqueado',
  [NozzleStatus.Fueling]: 'Abasteciendo',
  [NozzleStatus.Ready]: 'Pronto',
  [NozzleStatus.Waiting]: 'Espera',
  [NozzleStatus.Failure]: 'Falla',
  [NozzleStatus.Busy]: 'Ocupado',
  [NozzleStatus.Error]: 'Error',
};

export const STATUS_BADGE: Record<NozzleStatus, string> = {
  [NozzleStatus.NotConfigured]: 'bg-gray-200 text-gray-600',
  [NozzleStatus.Available]: 'bg-green-500 text-white',
  [NozzleStatus.Blocked]: 'bg-red-500 text-white',
  [NozzleStatus.Fueling]: 'bg-orange-500 text-white',
  [NozzleStatus.Ready]: 'bg-blue-500 text-white',
  [NozzleStatus.Waiting]: 'bg-yellow-500 text-black',
  [NozzleStatus.Failure]: 'bg-red-800 text-white',
  [NozzleStatus.Busy]: 'bg-purple-500 text-white',
  [NozzleStatus.Error]: 'bg-red-900 text-white',
};

export const PRODUCT_BADGE: Record<string, string> = {
  Super: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Regular: 'bg-red-100 text-red-700 border-red-200',
  Diesel: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Exonerado: 'bg-sky-100 text-sky-700 border-sky-200',
};

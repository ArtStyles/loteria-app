export const appRoutes = {
  home: '/',
  database: '/base-datos',
  drawings: '/tiradas',
  digits: '/metodos/digitos',
  normal: '/metodos/normal',
  inverse: '/metodos/inverso',
  coincidences: '/coincidencias',
};

export const navItems = [
  { label: 'Inicio', path: appRoutes.home },
  { label: 'Base de datos', path: appRoutes.database },
  { label: 'Tiradas', path: appRoutes.drawings },
  { label: 'Digitos', path: appRoutes.digits },
  { label: 'Normal', path: appRoutes.normal },
  { label: 'Inverso', path: appRoutes.inverse },
  { label: 'Coincidencias', path: appRoutes.coincidences },
];

export const methodRoutes = [
  { key: 'digits', label: 'Digitos', path: appRoutes.digits },
  { key: 'normal', label: 'Normal', path: appRoutes.normal },
  { key: 'inverse', label: 'Inverso', path: appRoutes.inverse },
];

const routeTitles = {
  [appRoutes.home]: 'Inicio',
  [appRoutes.database]: 'Base de datos',
  [appRoutes.drawings]: 'Tiradas',
  [appRoutes.digits]: 'Digitos',
  [appRoutes.normal]: 'Metodo normal',
  [appRoutes.inverse]: 'Metodo inverso',
  [appRoutes.coincidences]: 'Coincidencias',
};

export function getRouteTitle(pathname) {
  return routeTitles[pathname] || 'No encontrado';
}

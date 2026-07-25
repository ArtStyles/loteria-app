import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  appRoutes,
  getRouteTitle,
  methodRoutes,
  navItems,
} from './routes.js';

describe('route metadata', () => {
  test('defines the approved app route paths', () => {
    assert.deepEqual(appRoutes, {
      home: '/',
      database: '/base-datos',
      drawings: '/tiradas',
      digits: '/metodos/digitos',
      normal: '/metodos/normal',
      inverse: '/metodos/inverso',
      coincidences: '/coincidencias',
    });
  });

  test('builds primary navigation in the approved order', () => {
    assert.deepEqual(navItems.map((item) => [item.label, item.path]), [
      ['Inicio', '/'],
      ['Base de datos', '/base-datos'],
      ['Tiradas', '/tiradas'],
      ['Digitos', '/metodos/digitos'],
      ['Normal', '/metodos/normal'],
      ['Inverso', '/metodos/inverso'],
      ['Coincidencias', '/coincidencias'],
    ]);
  });

  test('groups method routes separately from database and drawing routes', () => {
    assert.deepEqual(methodRoutes, [
      { key: 'digits', label: 'Digitos', path: '/metodos/digitos' },
      { key: 'normal', label: 'Normal', path: '/metodos/normal' },
      { key: 'inverse', label: 'Inverso', path: '/metodos/inverso' },
    ]);
  });

  test('returns readable titles for route paths', () => {
    assert.equal(getRouteTitle('/'), 'Inicio');
    assert.equal(getRouteTitle('/metodos/normal'), 'Metodo normal');
    assert.equal(getRouteTitle('/ruta-desconocida'), 'No encontrado');
  });
});

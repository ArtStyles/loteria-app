# Coincidencias de numeros por rangos de apariciones

## Objetivo

Agregar a la ruta `/coincidencias` una segunda busqueda que encuentre numeros de dos cifras repetidos entre grupos de parles normales e inversos. Cada grupo se filtra por una lista de conteos historicos y cada resultado muestra por separado cuantas veces aparece el numero en los parles normales y en los inversos seleccionados.

## Alcance aprobado

- Conservar sin cambios la busqueda actual de coincidencias entre dos conteos exactos.
- Agregar debajo una tarjeta independiente titulada `Coincidencias por rangos`.
- No cambiar la generacion de los metodos normal e inverso.
- No cambiar la regla existente para contar historicamente un parlet.
- No cambiar el formato de Excel ni los endpoints de la API.

## Interaccion

La tarjeta nueva contiene:

- Un campo `Rangos Normal`, con una ayuda como `7, 6, 8, 9, 10, 11`.
- Un campo `Rangos Inverso`, con una ayuda como `5, 4, 12`.
- Un boton `Buscar numeros repetidos`.

Los campos aceptan enteros no negativos separados por comas, puntos o espacios. Se permiten combinaciones de esos separadores y separadores repetidos. Los conteos duplicados se consolidan para que un mismo rango no se procese dos veces.

La busqueda se aplica solamente al pulsar el boton. Editar los campos no modifica los resultados aplicados hasta ejecutar una nueva busqueda.

## Regla de calculo

1. Convertir el campo Normal en un conjunto de conteos enteros no negativos.
2. Convertir el campo Inverso de la misma forma.
3. Seleccionar de `normalParlets` todos los parles cuyo `count` pertenezca al conjunto Normal.
4. Seleccionar de `inverseParlets` todos los parles cuyo `count` pertenezca al conjunto Inverso.
5. Para cada conjunto, contar cada aparicion de `left` y `right` en los parles seleccionados.
6. Conservar solamente los numeros presentes por lo menos una vez en ambos conjuntos.
7. Devolver para cada numero sus conteos separados: `normalOccurrences` e `inverseOccurrences`.

Una aparicion significa que el numero ocupa uno de los dos lados de un parlet seleccionado. Por ejemplo, si `78` aparece en tres parles normales validos y en dos parles inversos validos, el resultado es `78 - Normal: 3 veces - Inverso: 2 veces`.

Los resultados se ordenan primero por la suma descendente de apariciones normales e inversas. Los empates se resuelven por el numero ascendente de `00` a `99`.

## Estados vacios y validacion

- Si uno de los dos campos no contiene ningun entero no negativo valido, no se ejecuta una comparacion y se muestra una indicacion para completar ambos rangos.
- Los fragmentos que no sean enteros no negativos se ignoran sin bloquear los valores validos del mismo campo.
- Si ambos campos son validos pero no hay numeros compartidos, se muestra `No hay numeros repetidos entre esos rangos.`
- Los resultados de esta tarjeta son independientes de los filtros y resultados de la busqueda exacta existente.

## Arquitectura

La logica se implementara como funciones puras en `src/lib/loteria.js`:

- Una funcion analizara el texto de rangos y devolvera conteos enteros unicos.
- Otra funcion filtrara los parles, contara las apariciones de cada numero, calculara la interseccion y ordenara el resultado.

`src/App.jsx` mantendra estados de edicion y estados aplicados independientes para la busqueda por rangos. El calculo derivado usara `useMemo`, igual que la busqueda exacta actual.

`src/views.jsx` ampliara `CoincidencesView` con una tarjeta separada debajo de la interfaz existente. Cada fila mostrara el numero, sus apariciones en Normal y sus apariciones en Inverso.

`src/styles.css` agregara solamente los estilos necesarios para distinguir la nueva tarjeta y mantener los controles y resultados legibles en escritorio y movil.

## Pruebas

Las pruebas unitarias en `src/lib/loteria.test.js` cubriran:

- Listas separadas por comas, puntos, espacios o una combinacion.
- Eliminacion de conteos duplicados.
- Rechazo de valores negativos y fragmentos no numericos sin perder los valores validos. Un punto siempre se interpreta como separador, por lo que `3.5` representa los conteos `3` y `5`.
- Seleccion de parles normales e inversos por multiples conteos.
- Conteo de apariciones repetidas del mismo numero en varios parles.
- Interseccion de numeros con conteos separados para Normal e Inverso.
- Ordenamiento por apariciones totales y desempate numerico.
- Campos sin valores validos y conjuntos validos sin coincidencias.

La verificacion final incluira todas las pruebas existentes, el build de produccion y una comprobacion manual de ambas busquedas en `/coincidencias`.

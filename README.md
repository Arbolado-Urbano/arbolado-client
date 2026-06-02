# Arbolado Client

Mapa colaborativo del arbolado en espacios públicos.

El proyecto está actualmente funcionado en [Arbolado Urbano](https://arboladourbano.com).

## Arbolado API

Este repositorio contiene un cliente que se comunica con [Arbolado API](https://github.com/Arbolado-Urbano/arbolado-api)

## Dependencias para desarrollo

- [Node.js](https://nodejs.org/)

## Instalación

1. Instalar dependencias `npm i`.

2. Levantar la API. Siguiendo las instrucciones del repositorio [Arbolado API](https://github.com/Arbolado-Urbano/arbolado-api).

3. Generar `arboles.pmtiles`:
    1. Visitar el endpoint `/arboles` de la API.
    2. Esperar a que finalice la generación del archivo (puede demorar algunos minutos).
    3. Copiar `arboles.pmtiles` a la carpeta `public/` de este proyecto.

## Ejecución para desarrollo

1. Levantar el proyecto de la API y la base de datos.

2. Iniciar servidor de desarrollo `npm run dev`.

3. Abrir: [http://localhost:5173](http://localhost:5173).

## Instalación para producción

1. Clonar el proyecto en el servidor.

2. Instalar dependencias `npm i`.

3. Compilar el proyecto `npm run build` (`npm run build:staging` para staging).

4. Si se usa Apache incluir el archivo `.htaccess` correspondiente en la carpeta `/dist`.

- Nota: El servidor debe configurarse para apuntar a la carpeta `/dist`.

## Scripts disponibles

| Comando                 | Descripción                      |
| ----------------------- | -------------------------------- |
| `npm i`                 | Instala dependencias             |
| `npm run dev`           | Inicia el servidor de desarrollo |
| `npm run build`         | Compila para producción          |
| `npm run build:staging` | Compila para staging             |
| `npm run start`         | Previsualiza la versión compilada|
| `npm run lint`          | Ejecuta el linter                |
| `npm run typecheck`     | Ejecuta validación de tipos      |

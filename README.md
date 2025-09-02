# Arbolado Client

 Mapa colaborativo del arbolado en espacios públicos.

 El proyecto está actualmente funcionado en [Arbolado Urbano](https://arboladourbano.com).

 ## Arbolado API

 Este repositorio contiene un cliente, el cual se comunica con una API que se encuentra en este otro repositorio: [Arbolado API](https://github.com/Arbolado-Urbano/arbolado-api)

 ## Dependencias

- [node.js](https://nodejs.org/)

## Dependencias para desarrollo

- [Docker](https://docs.docker.com/get-docker/)

## Instalación para desarrollo

1. Ejecutar el comando `npm i` para instalar las dependencias del proyecto.
2. Levantar una instancia del proyecto "Arbolado API". Para esto hay 2 opciones:
    - Descargar e instalar el proyecto desde [Arbolado API](https://github.com/Arbolado-Urbano/arbolado-api).
    - Levantar una instancia de la imagen de Docker del proyecto siguiendo estos pasos:
      1. En caso de no contar con uno, crear un [token classic en Github](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic) con los permisos de read/writer packages, y ejecutar el siguiente comando: `"[token]" | docker login ghcr.io -u [user] --password-stdin`
      2. Ejecutar el comando `npm run docker:pull` para descargar las últimas versiones de las imágenes de Docker necesarias.
      3. Ejecutar el comando `npm run docker:up` para levantar una instancia de la API y de la base de datos con Docker.
      4. Ejecutar el comando `docker exec -i arbolado-client-api-1 php artisan migrate` para inicializar la base de datos.
      5. Opcional: Si se desea cargar la base de datos, obtener una copia de la base de datos en formato SQL y ejectuar el comando: `docker exec -i arbolado-client-db-1 mysql -u root arbolado < [backup.sql]` donde `[backup.sql]` es la ruta al archivo SQL.
      - Notas:
        - El archivo SQL debe contener únicamente los datos de la base y no la estructura.
        - Al exportar los datos de la base asegurarse de que los chequeos de claves foráneas están deshabilitados (`Disable foreign key checks`).
        - No exportar la tabla `migrations` si existe.

## Ejecución para desarrollo

1. Ejecutar el comando `npm run docker:up` para levantar una instancia de la API y de la base de datos con Docker o levantar el servidor de la API y la base de datos local si se optó por esta opción durante la instalación del proyecto.
2. Ejecutar el comando `npm run dev` para levantar una instancia del serivdor de desarrollo.
2. Acceder a [http://localhost:5173](http://localhost:5173).

## Comandos

Los siguientes comandos están disponibles una vez instalado [Node.js](https://nodejs.org/en/):

- `npm i` - Instala las dependencias del proyecto.
- `npm run dev` - Levantar una instancia del serivdor de desarrollo.
- `npm run build` - Compila el proyecto para producción.
- `npm run preview` - Previsualiza la versión compilada para producción.
- `npm run docker:pull` - Descarga las últimas versiones de las imágenes de Docker necesarias.
- `npm run docker:up` - Levanta una instancia de la API y de la base de datos con Docker.
- `npm run docker:down` - Detiene las instancias de la API y de la base de datos.

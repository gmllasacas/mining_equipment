OBJETIVO
Construir y publicar una aplicación pequeña, con su código en GitHub, y automatizar el despliegue para que se haga con un solo comando de terminal. El centro del reto es el despliegue: preferimos una aplicación sencilla bien publicada antes que una grande que solo funcione en local.

APLICACIÓN: REGISTRO DE EQUIPOS MINEROS
- Crear, listar, editar y eliminar equipos: código, tipo (camión, excavadora, perforadora) y horómetro (horas de uso).
- Cada tipo tiene un intervalo de mantenimiento en horas. Si un equipo lo alcanza, debe mostrarse como "Requiere mantenimiento".
- Registrar un mantenimiento deja historial y reinicia el ciclo del equipo.

REQUISITOS TÉCNICOS
- Frontend y backend separados, cada uno con su propia URL pública. Pueden estar en un solo repositorio o en dos.
- Backend con API REST y una ruta /health que responda si el servicio está bien.
- Base de datos relacional (PostgreSQL o MySQL).
- Stack y hosting libres: Vercel, Railway, Render, Fly.io, una VPS o el que domines.
- Sin claves en el repositorio: incluye un .env.example.

AUTOMATIZACIÓN
Un solo comando de terminal, por ejemplo ./deploy.sh o make deploy, que:
1. Verifique lo necesario antes de empezar (herramientas y variables de entorno).
2. Construya y publique el frontend y el backend.
3. Aplique las migraciones de la base de datos.
4. Compruebe al final que ambos servicios responden, usando /health en el backend.
5. Termine con un error claro y un código de salida distinto de 0 si algún paso falla.
Debe poder ejecutarse varias veces sin romper nada.

En el repositorio:
- README con qué hace, cómo levantarlo en local y cómo desplegarlo, indicar qué herramientas de IA usaste

OPCIONAL
- Vuelta a la versión anterior si el despliegue falla.
- Docker o docker-compose.
- GitHub Actions.
- Pruebas automatizadas.
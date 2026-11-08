.PHONY: deploy test build down logs seed clean

# Comando principal de despliegue automatizado
deploy:
	@bash ./deploy.sh

# Ejecución de pruebas automatizadas
test:
	@cd backend && npm test

# Compilación y construcción de contenedores Docker
build:
	@docker compose build

# Detener los contenedores
down:
	@docker compose down

# Ver logs de los servicios en tiempo real
logs:
	@docker compose logs -f

# Poblar la base de datos con datos de prueba
seed:
	@docker compose exec backend npx prisma db seed

# Limpiar contenedores y volúmenes de datos
clean:
	@docker compose down -v


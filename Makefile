# Default goal
.DEFAULT_GOAL := help

# Directories
BACKEND_DIR   := backend
FRONTEND_DIR  := frontend
SHELL_DIR     := shell

#——————————————————————————————————————————————————————————————
# PHONY TARGETS
.PHONY: help install backend-install frontend-install \
        backend-setup frontend-setup run-local dev \
        build build-backend build-frontend upsert \
        test lint format \
        docker-up docker-down deploy \
        build-images push-images \
        backend-dev frontend-dev

#——————————————————————————————————————————————————————————————
help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  install             Install dependencies (backend & frontend)"
	@echo "  backend-install     Install backend dependencies"
	@echo "  frontend-install    Install frontend dependencies"
	@echo ""
	@echo "  backend-setup       Install, build & start backend in dev mode"
	@echo "  frontend-setup      Install, build & start frontend in dev mode"
	@echo "  run-local           Run both backend & frontend concurrently"
	@echo "  dev                 Alias for run-local"
	@echo ""
	@echo "  build               Build both backend & frontend for production"
	@echo "  build-backend       Build backend"
	@echo "  build-frontend      Build frontend"
	@echo ""
	@echo "  upsert              Upsert property data into Pinecone"
	@echo ""
	@echo "  test                Run backend & frontend unit tests"
	@echo ""
	@echo "  lint                Run ESLint on backend & frontend"
	@echo "  format              Run Prettier/formatter on backend & frontend"
	@echo ""
	@echo "  docker-up           Start services via Docker Compose"
	@echo "  docker-down         Stop services"
	@echo "  deploy              Build & launch services via your deploy.sh"
	@echo ""
	@echo "  build-images        Build all Docker images"
	@echo "  push-images         Push all Docker images to registry"
	@echo ""
	@echo "  backend-dev         Start backend in dev mode"
	@echo "  frontend-dev        Start frontend in dev mode"
	@echo ""

#——————————————————————————————————————————————————————————————
# INSTALL
install: backend-install frontend-install

backend-install:
	cd $(BACKEND_DIR) && npm install

frontend-install:
	cd $(FRONTEND_DIR) && npm install

#——————————————————————————————————————————————————————————————
# SETUP (uses your existing shell scripts)
backend-setup:
	bash $(SHELL_DIR)/setup_backend.sh

frontend-setup:
	bash $(SHELL_DIR)/setup_frontend.sh

run-local:
	bash $(SHELL_DIR)/run_local.sh

dev: run-local

#——————————————————————————————————————————————————————————————
# BUILD
build: build-backend build-frontend

build-backend:
	cd $(BACKEND_DIR) && npm run build

build-frontend:
	cd $(FRONTEND_DIR) && npm run build

#——————————————————————————————————————————————————————————————
# DATA UPLOAD
upsert:
	cd $(BACKEND_DIR) && npm run upsert

#——————————————————————————————————————————————————————————————
# TESTS, LINT & FORMAT
test:
	cd $(BACKEND_DIR) && npm run test
	cd $(FRONTEND_DIR) && npm run test

lint:
	cd $(BACKEND_DIR) && npm run lint
	cd $(FRONTEND_DIR) && npm run lint

format:
	cd $(BACKEND_DIR) && npm run format
	cd $(FRONTEND_DIR) && npm run format

#——————————————————————————————————————————————————————————————
# DOCKER & DEPLOY
docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down

deploy:
	bash $(SHELL_DIR)/deploy.sh

#——————————————————————————————————————————————————————————————
# DOCKER IMAGE WORKFLOWS
build-images:
	bash $(SHELL_DIR)/build_images.sh

push-images:
	bash $(SHELL_DIR)/push_images.sh

#——————————————————————————————————————————————————————————————
# DIRECT DEV (if you prefer calling npm scripts yourself)
backend-dev:
	cd $(BACKEND_DIR) && npm run dev

frontend-dev:
	cd $(FRONTEND_DIR) && npm run dev

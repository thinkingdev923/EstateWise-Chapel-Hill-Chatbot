###############################################################################
# Makefile for shell/ directory
#
# Description:
#   Provides convenient Make targets to invoke the various shell scripts
#   in this directory for building images, deploying, setting up services,
#   and running both backend & frontend locally.
#
# Prerequisites:
#   • Ensure this Makefile lives in the "shell/" directory alongside:
#       - build_images.sh
#       - push_images.sh
#       - deploy.sh
#       - setup_backend.sh
#       - setup_frontend.sh
#       - run_local.sh
#   • Make sure all scripts are executable: chmod +x *.sh
#
# Usage:
#   cd shell
#   make <target>
#
# Common targets:
#   help               Show this help message
#   build-images       Build Docker images (backend, crawler, newsletters)
#   push-images        Push Docker images to registry
#   deploy             Build & launch services via deploy.sh
#
#   setup-backend      Install, build & start backend in dev mode
#   setup-frontend     Install, build & start frontend in dev mode
#   run-local          Run both backend & frontend concurrently
#
###############################################################################

.DEFAULT_GOAL := help

.PHONY: help build-images push-images deploy \
        setup-backend setup-frontend run-local

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  help               Show this help message"
	@echo ""
	@echo "  build-images       Build all Docker images:"
	@echo "                       ./build_images.sh"
	@echo "  push-images        Push all Docker images:"
	@echo "                       ./push_images.sh"
	@echo "  deploy             Deploy services via deploy.sh:"
	@echo "                       ./deploy.sh"
	@echo ""
	@echo "  setup-backend      Install, build & start backend in dev mode:"
	@echo "                       ./setup_backend.sh"
	@echo "  setup-frontend     Install, build & start frontend in dev mode:"
	@echo "                       ./setup_frontend.sh"
	@echo "  run-local          Run backend & frontend concurrently:"
	@echo "                       ./run_local.sh"
	@echo ""

build-images:
	@echo "📦 Building Docker images..."
	./build_images.sh

push-images:
	@echo "🚀 Pushing Docker images..."
	./push_images.sh

deploy:
	@echo "🔧 Deploying services..."
	./deploy.sh

setup-backend:
	@echo "🛠 Setting up backend..."
	./setup_backend.sh

setup-frontend:
	@echo "🛠 Setting up frontend..."
	./setup_frontend.sh

run-local:
	@echo "🔄 Running backend & frontend concurrently..."
	./run_local.sh

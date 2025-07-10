###############################################################################
# Makefile for aws/ directory
#
# Description:
#   Manage AWS infrastructure and local AWS-related workflows:
#     - Validate & deploy CloudFormation stacks (VPC, IAM, ALB, ECS)
#     - Deploy CodePipeline
#     - Build & run Docker Compose for local testing
#     - Build & push Docker image
#     - Run the deploy.sh helper
#
# Prerequisites:
#   • AWS CLI v2 installed & configured (credentials + default region).
#   • docker & docker-compose installed.
#   • jq (optional, if you process CF outputs).
#   • Make sure this Makefile lives alongside:
#       – cloudformation/*.yaml
#       – codepipeline.yaml
#       – deploy.sh
#       – docker-compose.yml
#       – Dockerfile
#
# Usage:
#   cd aws
#   make <target>
#
# Variables (override as needed):
#   AWS_REGION    AWS region for deployments (default: us-east-1)
#   STACK_PREFIX  Prefix for all stack names (default: estatewise)
#   REGISTRY      Docker registry for `push-image`
#
###############################################################################

AWS_REGION    ?= us-east-1
STACK_PREFIX  ?= estatewise
CF_DIR         = cloudformation

.PHONY: help validate \
        deploy-vpc deploy-iam deploy-alb deploy-ecs-cluster deploy-ecs-service deploy-all \
        codepipeline \
        docker-up docker-down build-image push-image \
        deploy \
        delete-stack update-stack

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  validate                Validate all CloudFormation templates"
	@echo ""
	@echo "  deploy-vpc              Deploy VPC stack"
	@echo "  deploy-iam              Deploy IAM roles stack"
	@echo "  deploy-alb              Deploy Application Load Balancer stack"
	@echo "  deploy-ecs-cluster      Deploy ECS cluster stack"
	@echo "  deploy-ecs-service      Deploy ECS service stack"
	@echo "  deploy-all              Deploy all CF stacks in order"
	@echo ""
	@echo "  codepipeline            Deploy CodePipeline stack"
	@echo ""
	@echo "  delete-stack STACK=...  Delete a named CloudFormation stack"
	@echo "  update-stack STACK=... TEMPLATE=...  Update a CF stack"
	@echo ""
	@echo "  docker-up               Start services via docker-compose"
	@echo "  docker-down             Stop docker-compose services"
	@echo ""
	@echo "  build-image             Build Docker image (uses Dockerfile)"
	@echo "  push-image              Tag & push to \$$REGISTRY"
	@echo ""
	@echo "  deploy                  Run deploy.sh (custom deploy script)"
	@echo ""

validate:
	@echo "🔍  Validating CloudFormation templates..."
	@for f in $(CF_DIR)/*.yaml; do \
	  echo "  • $$f"; \
	  aws cloudformation validate-template \
	    --template-body file://$$f \
	    --region $(AWS_REGION); \
	done

deploy-vpc:
	@echo "☁️  Deploying VPC stack..."
	aws cloudformation deploy \
	  --template-file $(CF_DIR)/vpc.yaml \
	  --stack-name $(STACK_PREFIX)-vpc \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --region $(AWS_REGION)

deploy-iam:
	@echo "🔐  Deploying IAM roles..."
	aws cloudformation deploy \
	  --template-file $(CF_DIR)/iam-roles.yaml \
	  --stack-name $(STACK_PREFIX)-iam \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --region $(AWS_REGION)

deploy-alb:
	@echo "🎛️  Deploying ALB stack..."
	aws cloudformation deploy \
	  --template-file $(CF_DIR)/alb.yaml \
	  --stack-name $(STACK_PREFIX)-alb \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --region $(AWS_REGION)

deploy-ecs-cluster:
	@echo "🚢  Deploying ECS cluster..."
	aws cloudformation deploy \
	  --template-file $(CF_DIR)/ecs-cluster.yaml \
	  --stack-name $(STACK_PREFIX)-ecs-cluster \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --region $(AWS_REGION)

deploy-ecs-service:
	@echo "📦  Deploying ECS service..."
	aws cloudformation deploy \
	  --template-file $(CF_DIR)/ecs-service.yaml \
	  --stack-name $(STACK_PREFIX)-ecs-service \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --region $(AWS_REGION)

deploy-all: deploy-vpc deploy-iam deploy-alb deploy-ecs-cluster deploy-ecs-service

codepipeline:
	@echo "🔄  Deploying CodePipeline..."
	aws cloudformation deploy \
	  --template-file codepipeline.yaml \
	  --stack-name $(STACK_PREFIX)-codepipeline \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --region $(AWS_REGION)

delete-stack:
ifdef STACK
	@echo "❌  Deleting stack $(STACK)..."
	aws cloudformation delete-stack \
	  --stack-name $(STACK) \
	  --region $(AWS_REGION)
else
	$(error Please specify STACK=<stack-name> to delete)
endif

update-stack:
ifdef STACK
ifdef TEMPLATE
	@echo "🔁  Updating stack $(STACK) with template $(TEMPLATE)..."
	aws cloudformation deploy \
	  --template-file $(TEMPLATE) \
	  --stack-name $(STACK) \
	  --capabilities CAPABILITY_NAMED_IAM \
	  --region $(AWS_REGION)
else
	$(error Please specify TEMPLATE=<path/to/template.yaml>)
endif
else
	$(error Please specify STACK=<stack-name>)
endif

docker-up:
	@echo "🐳  Starting local containers..."
	docker-compose up -d

docker-down:
	@echo "🐳  Stopping local containers..."
	docker-compose down

build-image:
	@echo "🔨  Building Docker image..."
	docker build -t $(STACK_PREFIX)-app .

push-image:
ifndef REGISTRY
	$(error Please set REGISTRY=<your-registry-url>)
endif
	@echo "🚀  Pushing image to $(REGISTRY)..."
	docker tag $(STACK_PREFIX)-app $(REGISTRY)/$(STACK_PREFIX)-app:latest
	docker push $(REGISTRY)/$(STACK_PREFIX)-app:latest

deploy:
	@echo "⚙️  Running custom deploy.sh..."
	bash deploy.sh

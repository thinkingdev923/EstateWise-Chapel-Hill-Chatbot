# AWS Deployment (ECS Fargate)

This directory contains an example task definition for deploying the EstateWise gRPC Market Pulse service to AWS ECS Fargate with AWS Cloud Map service discovery.

## Prerequisites

- Container image pushed to Amazon ECR (see `grpc/Jenkinsfile` for build example).
- VPC with private subnets and security group allowing traffic on the chosen gRPC port (default `50051`).
- AWS CLI configured with sufficient permissions.

## Deploy steps

1. Update the placeholders inside `ecs-task-definition.json`:
   - `AWS_ACCOUNT_ID`
   - `AWS_REGION`
   - `EXECUTION_ROLE_ARN`
   - `TASK_ROLE_ARN`
   - `SUBNET_ID_1`, `SUBNET_ID_2`
   - `SECURITY_GROUP_ID`
   - `CONTAINER_IMAGE`

2. Register the task definition:

   ```bash
   aws ecs register-task-definition \
     --cli-input-json file://ecs-task-definition.json
   ```

3. Create or update an ECS service referencing the new task definition:

   ```bash
   aws ecs create-service \
     --cluster estatewise-cluster \
     --service-name market-pulse-grpc \
     --task-definition estatewise-market-pulse-grpc \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[SUBNET_ID_1,SUBNET_ID_2],securityGroups=[SECURITY_GROUP_ID],assignPublicIp=ENABLED}"
   ```

4. (Optional) Publish the gRPC endpoint behind an AWS Network Load Balancer.

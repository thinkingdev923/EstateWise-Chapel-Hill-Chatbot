# AWS Deployment Stack

![AWS](https://img.shields.io/badge/AWS-Cloud-orange?logo=amazon-aws) ![CloudFormation](https://img.shields.io/badge/CloudFormation-Infrastructure-orange?logo=amazon-cloudformation) ![ECS_Fargate](https://img.shields.io/badge/ECS_Fargate-Serverless-orange?logo=amazon-ecs)

This folder contains an opinionated, production-focused deployment of EstateWise on AWS. The stack is split into CloudFormation templates so teams can promote infrastructure changes safely across environments. For a multi-cloud overview and CI/CD matrix see [DEPLOYMENTS.md](../DEPLOYMENTS.md).

## What’s Provisioned

| Template | Purpose |
|----------|---------|
| `cloudformation/vpc.yaml` | Multi-AZ VPC with public + private subnets, managed NAT gateway, (optional) flow logs. |
| `cloudformation/alb.yaml` | Internet-facing Application Load Balancer with optional HTTPS, security groups, and target group. |
| `cloudformation/iam-roles.yaml` | Execution + service roles for ECS (with optional artifact access). |
| `cloudformation/ecs-cluster.yaml` | ECS Fargate cluster with Container Insights + Execute Command enabled. |
| `cloudformation/ecs-service.yaml` | Backend Fargate service wired to Secrets Manager, CloudWatch logs, and autoscaling policies. |
| `codepipeline.yaml` | Complete CI/CD pipeline using CodePipeline, CodeBuild, and ECS blue/green deploys. |

## Deploy Order

```bash
cd aws
make deploy-vpc
make deploy-iam
make deploy-alb
make deploy-ecs-cluster
# Fill the env vars below with the outputs from the previous stacks / Secrets Manager ARNs
make deploy-ecs-service \
  CLUSTER_NAME=estatewise-ecs-cluster \
  EXECUTION_ROLE_ARN=arn:aws:iam::123:role/estatewise-ecs-execution-role \
  CONTAINER_IMAGE=123.dkr.ecr.us-east-1.amazonaws.com/estatewise-backend:latest \
  SUBNET_IDS=subnet-aaa,subnet-bbb \
  SECURITY_GROUP_IDS=sg-abc123 \
  TARGET_GROUP_ARN=arn:aws:elasticloadbalancing:...:targetgroup/estatewise-tg/abcd \
  MONGO_SECRET_ARN=arn:aws:secretsmanager:...:secret:estatewise/mongo \
  JWT_SECRET_ARN=arn:aws:secretsmanager:...:secret:estatewise/jwt \
  GOOGLE_SECRET_ARN=arn:aws:secretsmanager:...:secret:estatewise/google \
  PINECONE_SECRET_ARN=arn:aws:secretsmanager:...:secret:estatewise/pinecone
```

Outputs from the stacks (VPC subnet IDs, ALB target group, IAM role ARNs) can be retrieved using `aws cloudformation describe-stacks` or via the AWS Console.

### CI/CD Pipeline

1. Create a [CodeStar connection](https://docs.aws.amazon.com/dtconsole/latest/userguide/connections-create-github.html) to GitHub and capture the ARN.
2. Deploy `codepipeline.yaml` with the appropriate `GitHubOwner`, `GitHubRepo`, `GitHubBranch`, `CodeStarConnectionArn`, `EcrRepositoryUri`, `ClusterName`, and `ServiceName` parameters.
3. The pipeline builds the backend Docker image, pushes to ECR, and updates the ECS service using `imagedefinitions.json`.

## Local Validation

- `make validate` runs `aws cloudformation validate-template` on each YAML file.
- `make deploy-all` deploys the infra stacks in sequence (requires the environment overrides described above).
- `make deploy` executes the richer `deploy.sh` script, which provisions DocumentDB, builds the monorepo images, and seeds ECS.

## Secrets + Parameters

Secrets should live in AWS Secrets Manager (ARNS passed to `ecs-service.yaml`). Plain environment variables can be handled with SSM Parameter Store and injected using additional `Secrets` entries in the task definition.

## Observability

- CloudWatch log group: `/aws/ecs/<env>/backend`
- Container Insights is enabled at the cluster level.
- The ALB can emit access logs to S3 by attaching a bucket policy (optional).

## Cleaning Up

```
make delete-stack STACK=estatewise-ecs-service
make delete-stack STACK=estatewise-ecs-cluster
make delete-stack STACK=estatewise-alb
make delete-stack STACK=estatewise-iam
make delete-stack STACK=estatewise-vpc
```

Remember to remove ECR images, NAT gateways, and DocumentDB clusters separately to avoid lingering charges.

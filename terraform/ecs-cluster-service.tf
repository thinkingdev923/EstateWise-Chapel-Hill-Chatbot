resource "aws_ecs_cluster" "main" {
  name = "estatewise-cluster"
}

resource "aws_ecs_task_definition" "backend" {
  family                   = "estatewise-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "512"
  memory                   = "1024"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  container_definitions    = jsonencode([
    {
      name      = "backend"
      image     = var.container_image
      essential = true
      portMappings = [
        {
          containerPort = 3001
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = "production" },
        # Add other env vars or fetch from SSM/Secrets Manager
      ]
    }
  ])
}

resource "aws_security_group" "ecs_service" {
  name        = "estatewise-sg"
  description = "Allow HTTP"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_service" "backend" {
  name            = "estatewise-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = values(aws_subnet.public)[*].id
    security_groups = [aws_security_group.ecs_service.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "backend"
    container_port   = 3001
  }
  depends_on = [aws_lb_listener.http]
}

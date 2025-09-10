provider "aws" {
  region = var.region
}


resource "aws_iam_role" "ecs_task_execution_role" {
  name = "ToolJet-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_cloudwatch_logs_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_policy" "ssm_policy" {
  name = "ToolJet-ssm-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssmmessages:CreateControlChannel",
        "ssmmessages:CreateDataChannel",
        "ssmmessages:OpenControlChannel",
        "ssmmessages:OpenDataChannel"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_iam_policy" "secrets_manager_policy" {
  name = "ToolJet-secrets-manager-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = "arn:aws:secretsmanager:${var.region}:${data.aws_caller_identity.current.account_id}:secret:tooljet-secret"
    }]
  })
}

resource "aws_cloudwatch_log_group" "ecs_log_group" {
  name              = "/ecs/ToolJet"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "postgrest_log_group" {
  name              = "/ecs/postgrest"
  retention_in_days = 30
}

resource "aws_ecs_cluster" "tooljet_cluster" {
  name = "ToolJet"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
resource "aws_ecs_task_definition" "tooljet_task_definition" {
  family                   = var.AppName
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "4096"
  memory                   = "8192"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name   = var.AppName
      image  = "tooljet/tooljet:ee-lts-latest"
      cpu    = 2048
      memory = 4096
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_log_group.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "tooljet"

        }
      }
      portMappings = [{
        containerPort = 3000
        hostPort      = 3000
        protocol      = "tcp"
        name          = "tooljet"
      }]
      command = ["npm", "run", "start:prod"]
      environment = [
        {
          name  = "TOOLJET_HOST"
          value = aws_lb.tooljet_lb.dns_name
        },
        {
          name  = "TOOLJET_DB"
          value = var.TOOLJET_DB
        },
        {
          name  = "TOOLJET_DB_HOST"
          value = aws_db_instance.tooljet_database.endpoint
        },
        {
          name  = "TOOLJET_DB_USER"
          value = var.TOOLJET_DB_USER
        },
        {
          name  = "TOOLJET_DB_PASS"
          value = var.TOOLJET_DB_PASS
        },
        {
          name  = "PG_HOST"
          value = aws_db_instance.tooljet_database.endpoint
        },
        {
          name  = "PG_USER"
          value = var.PG_USER
        },
        {
          name  = "PG_PASS"
          value = var.PG_PASS
        },
        {
          name  = "PG_DB"
          value = var.PG_DB
        },
        {
          name  = "LOCKBOX_MASTER_KEY"
          value = var.LOCKBOX_MASTER_KEY
        },
        {
          name  = "SECRET_KEY_BASE"
          value = var.SECRET_KEY_BASE
        },
        {
          name  = "DEPLOYMENT_PLATFORM"
          value = "aws:ecs"
        },
        {
          name  = "REDIS_HOST"
          value = var.REDIS_HOST
        },
        {
          name  = "REDIS_PORT"
          value = var.REDIS_PORT
        },
        {
          name  = "REDIS_USER"
          value = var.REDIS_USER
        },
        {
          name  = "REDIS_PASSWORD"
          value = var.REDIS_PASSWORD
        },
        {
          name  = "PGSSLMODE"
          value = "require"
        },
        # use this incase using RDS with SSL
        # {
        #   name  = "NODE_EXTRA_CA_CERTS"
        #   value = "/certs/global-bundle.pem"
        # }
        {
          name  = "PGRST_HOST"
          value = "127.0.0.1:3002"
        },
        {
          name  = "PGRST_SERVER_PORT"
          value = "3002"
        },
        {
          name  = "PGRST_DB_URI"
          value = "postgres://${var.TOOLJET_DB_USER}:${var.TOOLJET_DB_PASS}@${aws_db_instance.tooljet_database.endpoint}/${var.TOOLJET_DB}"
        },
        {
          name  = "PGRST_JWT_SECRET"
          value = var.PGRST_JWT_SECRET
        }
      ]
    },
    {
      name      = "redis"
      image     = "redis:6.2"
      cpu       = 512
      memory    = 1024
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs_log_group.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "redis"
        }
      }
      portMappings = [{
        containerPort = 6379
        hostPort      = 6379
        protocol      = "tcp"
        name          = "redis"
      }]
    },
    {
      name      = "postgrest"
      image     = "postgrest/postgrest:v12.2.0"
      cpu       = 512
      memory    = 1024
      essential = true
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.postgrest_log_group.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "postgrest"
          awslogs-create-group  = "true"
        }
      }
      portMappings = [{
        containerPort = 3002
        hostPort      = 3002
        protocol      = "tcp"
        name          = "postgrest"
        appProtocol   = "http"
      }]
      environment = [
        {
          name  = "PGRST_HOST"
          value = "127.0.0.1:3002"
        },
        {
          name  = "PGRST_LOG_LEVEL"
          value = "info"
        },
        {
          name  = "PGRST_DB_PRE_CONFIG"
          value = "postgrest.pre_config"
        },
        {
          name  = "PGRST_SERVER_PORT"
          value = "3002"
        },
        {
          name  = "PGRST_DB_URI"
          value = "postgres://${var.TOOLJET_DB_USER}:${var.TOOLJET_DB_PASS}@${aws_db_instance.tooljet_database.endpoint}/${var.TOOLJET_DB}"
        },
        {
          name  = "PGRST_JWT_SECRET"
          value = var.PGRST_JWT_SECRET
        }
      ]
    }
  ])

  depends_on = [
    aws_db_instance.tooljet_database
  ]
}

# depends_on = [
#   aws_db_instance.tooljet_database,
#   aws_memorydb_cluster.tooljet_mem_cluster
# ]



resource "aws_ecs_service" "tooljet_service" {
  name            = var.ServiceName
  cluster         = aws_ecs_cluster.tooljet_cluster.id
  task_definition = aws_ecs_task_definition.tooljet_task_definition.arn
  launch_type     = "FARGATE"
  desired_count   = 2

  network_configuration {
    subnets          = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]
    security_groups  = [aws_security_group.task_sg.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.tooljet_target_group.arn
    container_name   = var.AppName
    container_port   = 3000
  }

  health_check_grace_period_seconds = 900 # tooljet requires 900 seconds to start
  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
}

resource "aws_lb" "tooljet_lb" {
  name               = "tooljet-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets            = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]
}

resource "aws_lb_target_group" "tooljet_target_group" {
  name        = "tooljet-tg"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.tooljet_vpc.id
  target_type = "ip"

  health_check {
    path     = "/api/health"
    protocol = "HTTP"
  }
}

resource "aws_lb_listener" "listener_80" {
  load_balancer_arn = aws_lb.tooljet_lb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.tooljet_target_group.arn
  }
}

# resource "aws_lb_listener" "listener_443" {
#   load_balancer_arn = aws_lb.tooljet_lb.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-2016-08"
#   certificate_arn   = "" # Replace with your certificate ARN

#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.tooljet_target_group.arn
#   }
# }

resource "aws_vpc" "tooljet_vpc" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "subnet1" {
  vpc_id                  = aws_vpc.tooljet_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.aws_subnet_subnet1_AZ
  map_public_ip_on_launch = true
}

resource "aws_subnet" "subnet2" {
  vpc_id                  = aws_vpc.tooljet_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = var.aws_subnet_subnet2_AZ
  map_public_ip_on_launch = true
}

resource "aws_internet_gateway" "tooljet_igw" {
  vpc_id = aws_vpc.tooljet_vpc.id
}

resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.tooljet_vpc.id
}

resource "aws_route" "public_route" {
  route_table_id         = aws_route_table.public_rt.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.tooljet_igw.id
}

resource "aws_route_table_association" "subnet1_association" {
  subnet_id      = aws_subnet.subnet1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "subnet2_association" {
  subnet_id      = aws_subnet.subnet2.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_security_group" "task_sg" {
  vpc_id = aws_vpc.tooljet_vpc.id

  ingress {
    description     = "ToolJet application port"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }
  ingress {
    description     = "PostgREST port"
    from_port       = 3002
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.lb_sg.id]
  }

  ingress {
    description = "Redis port (internal)"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    self        = true
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "lb_sg" {
  vpc_id = aws_vpc.tooljet_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  }


resource "aws_db_instance" "tooljet_database" {
  allocated_storage      = 100
  instance_class         = "db.t3.micro"
  engine                 = "postgres"
  engine_version         = "16"
  db_name                = "postgres"
  username               = "postgres"
  password               = "postgres"
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.rds_subnet_group.name
  skip_final_snapshot    = true
}

resource "aws_security_group" "rds_sg" {
  vpc_id = aws_vpc.tooljet_vpc.id

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.task_sg.id]
  }
}

resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "tooljet-rds-subnet-group"
  subnet_ids = [aws_subnet.subnet1.id, aws_subnet.subnet2.id]
}

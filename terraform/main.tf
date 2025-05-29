# terraform/main.tf

terraform {
  backend "s3" {
    bucket = "todo-app-state-bucket"
    key    = "todo-devops-suite/terraform.tfstate"
    region = "us-east-1"

    skip_region_validation      = true
    skip_credentials_validation = true
    skip_requesting_account_id  = true
  }
}

provider "aws" {
  region     = var.aws_region
  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
}

# ----------------------------
# Inline Variables
# ----------------------------

variable "aws_region" {
  default = "us-east-1"
}

variable "aws_access_key" {
  type = string
}

variable "aws_secret_key" {
  type = string
}

variable "key_pair_name" {
  type = string
}

# ----------------------------
# Data Source: Reuse SG if exists
# ----------------------------

data "aws_security_group" "existing_sg" {
  count = try(data.aws_security_group.existing_sg.id, null) != null ? 1 : 0
  name  = "todo-app-sg"
}

resource "aws_security_group" "todo_app_sg" {
  count = try(data.aws_security_group.existing_sg.id, null) == null ? 1 : 0
  name  = "todo-app-sg"
  description = "Allow SSH and HTTP traffic for Todo App"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
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

# ----------------------------
# Use existing SG ID or new one
# ----------------------------

locals {
  sg_id = data.aws_security_group.existing_sg.id != null ? data.aws_security_group.existing_sg.id : aws_security_group.todo_app_sg[0].id
}

# ----------------------------
# EC2 Instance
# ----------------------------

resource "aws_instance" "todo_app" {
  ami           = "ami-084568db4383264d4" # Ubuntu 24.04
  instance_type = "t2.micro"
  key_name      = var.key_pair_name
  vpc_security_group_ids = [local.sg_id]

  tags = {
    Name = "TodoAppServer"
  }
}

# ----------------------------
# S3 Bucket for DB Backups
# ----------------------------

resource "aws_s3_bucket" "backup_bucket" {
  count  = 1
  bucket = "todo-db-backups"
  acl    = "private"
  versioning {
    enabled = true
  }
}
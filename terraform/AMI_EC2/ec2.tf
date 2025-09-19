# Define provider
provider "aws" {
  region = var.region
}

# Generate a TLS private key for EC2 access
resource "tls_private_key" "tooljet_key" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

# Define the key pair for EC2 access
resource "aws_key_pair" "tooljet_key" {
  key_name   = "tooljet-key"
  public_key = tls_private_key.tooljet_key.public_key_openssh # file("~/.ssh/tooljet.pub") 
}

# Create a VPC
resource "aws_vpc" "tooljet_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "TooljetVPC"
  }
}

# Create an Internet Gateway for the VPC
resource "aws_internet_gateway" "tooljet_igw" {
  vpc_id = aws_vpc.tooljet_vpc.id

  tags = {
    Name = "TooljetInternetGateway"
  }
}

# Create a public subnet
resource "aws_subnet" "tooljet_public_subnet" {
  vpc_id                  = aws_vpc.tooljet_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "TooljetPublicSubnet"
  }
}

# Create a route table for the public subnet
resource "aws_route_table" "tooljet_public_route_table" {
  vpc_id = aws_vpc.tooljet_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.tooljet_igw.id
  }

  tags = {
    Name = "TooljetPublicRouteTable"
  }
}

# Associate the public route table with the public subnet
resource "aws_route_table_association" "tooljet_public_subnet_assoc" {
  subnet_id      = aws_subnet.tooljet_public_subnet.id
  route_table_id = aws_route_table.tooljet_public_route_table.id
}

# Define the EC2 instance using ToolJet AMI
resource "aws_instance" "tooljet_instance" {
  ami                         = var.tooljet_ami_id
  instance_type              = var.instance_type
  key_name                   = aws_key_pair.tooljet_key.key_name
  subnet_id                  = aws_subnet.tooljet_public_subnet.id
  vpc_security_group_ids     = [aws_security_group.tooljet_sg.id]
  associate_public_ip_address = true
  availability_zone          = var.availability_zone

  # Root EBS volume configuration
  root_block_device {
    volume_size = 20  
    volume_type = "gp3"
  }

  tags = {
    Name = "TooljetAppServer"
  }

  depends_on = [aws_security_group.tooljet_sg]
}


# List of ports for ingress
variable "ingress_ports" {
  default = [22, 80, 443, 3000]
}

# Define the security group
resource "aws_security_group" "tooljet_sg" {
  vpc_id      = aws_vpc.tooljet_vpc.id
  name        = "tooljet-sg"
  description = "Allow SSH, HTTP, and HTTPS"

  dynamic "ingress" {
    for_each = var.ingress_ports
    content {
      from_port   = ingress.value
      to_port     = ingress.value
      protocol    = "tcp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

}


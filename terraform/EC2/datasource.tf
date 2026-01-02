data "aws_ami" "latest_custom_ami" {
  most_recent = true

  owners = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-20240927"]
  }

  # Optional: Add more filters if necessary
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

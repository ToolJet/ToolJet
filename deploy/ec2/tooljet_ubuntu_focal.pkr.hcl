packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "${var.ami_name}"
  instance_type = "${var.instance_type}"
  region        = "${var.ami_region}"
  ami_regions   = "${var.ami_regions}"
  ami_users      = "${var.ami_users}"
  
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  ssh_username = "ubuntu"
  ssh_clear_authorized_keys = "true"
}

build {
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  provisioner "file" {
    source      = "nest.service"
    destination = "/tmp/nest.service"
  }

  provisioner "file" {
    source      = "../../frontend/config/nginx.conf.template"
    destination = "/tmp/nginx.conf"
  }

  provisioner "file" {
    source      = ".env"
    destination = "/tmp/.env"
  }

  provisioner "file" {
    source      = "setup_app"
    destination = "/tmp/setup_app"
  }

  provisioner "file" {
    source      = "postgrest.service"
    destination = "/tmp/postgrest.service"
  }

  provisioner "file" {
    source      = "redis-server.service"
    destination = "/tmp/redis-server.service"
  }  

  provisioner "shell" {
    script = "setup_machine.sh"
    environment_vars = ["SSH_PRIVATE_KEY=${var.ssh_private_key}"]
  }
}

packer {
  required_plugins {
    amazon = {
      version = ">= 0.0.1"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

source "amazon-ebs" "ubuntu" {
  ami_name      = "tooljet_v0.5.11.ubuntu_bionic"
  instance_type = "t2.medium"
  region        = "us-west-2"
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-bionic-18.04-amd64-server-*"
      root-device-type    = "ebs"
      virtualization-type = "hvm"
    }
    most_recent = true
    owners      = ["099720109477"]
  }
  ssh_username = "ubuntu"
}


build {
  sources = [
    "source.amazon-ebs.ubuntu"
  ]

  provisioner "file"{
    source = "puma.service"
    destination = "/tmp/puma.service"
  }

  provisioner "file"{
    source = "nginx.conf"
    destination = "/tmp/nginx.conf"
  }

  provisioner "file"{
    source = ".env"
    destination = "/tmp/.env"
  }

  provisioner "file"{
    source = "setup_app"
    destination = "/tmp/setup_app"
  }

  provisioner "shell" {
    script = "setup_machine.sh"
  }
}

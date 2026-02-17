variable "ami_name" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t2.xlarge"
}

variable "ami_region" {
  type    = string
  default = "us-east-1"
}

variable "ami_groups" {
  type    = list(string)
  default = ["all"]
}

variable "PACKER_BUILDER_TYPE" {
  type    = string
  default = "amazon-ebs"
}

variable "PACKER_BUILD_NAME" {
  type    = string
  default = "ubuntu"
}

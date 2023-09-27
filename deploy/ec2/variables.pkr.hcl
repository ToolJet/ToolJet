variable "ami_name" {
  type = string
}

variable "ssh_private_key" {
  type = string
}

variable "instance_type" {
  type    = string
  default = "t2.medium"
}

variable "ami_region" {
  type    = string
  default = "us-west-1"
}

variable "ami_regions" {
  type    = list(string)
  default = ["us-west-1", "us-east-1", "us-east-2", "eu-west-2", "eu-central-1", "ap-northeast-1", "ap-southeast-1", "ap-northeast-3", "ap-south-1", "ap-northeast-2", "ap-southeast-2", "ca-central-1", "eu-west-1", "eu-north-1", "sa-east-1", "ap-east-1"]
}

variable "ami_users" {
  type    = list(string)
  default = ["687115541366", "155227993165", "527976876550", "256736816188"]
}

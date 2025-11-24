variable "region" {
  default = "us-east-1"
}

variable "ami_id" {
  type    = string
  default = ""
}

variable "instance_type" {
  type    = string
  default = "t2.medium"
}
variable "aws_instance_tooljet_instance_AZ" {
  default = ""
}

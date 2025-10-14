
# Variables
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "availability_zone" {
  description = "Availability zone for the subnet and instance"
  type        = string
  default     = "us-west-2a"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"  # Recommended for ToolJet
}

variable "tooljet_ami_id" {
  description = "ToolJet AMI ID - contact ToolJet team for the specific AMI ID in your region"
  type        = string
  
}

variable "ingress_ports" {
  default = [22, 80, 443, 3000]
}

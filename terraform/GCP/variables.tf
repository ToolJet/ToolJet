variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region"
  type        = string
  default     = "us-central1"
}

variable "zone" {
  description = "The GCP zone"
  type        = string
  default     = "us-central1-a"
}

variable "machine_type" {
  description = "The machine type for the compute instance"
  type        = string
  default     = "e2-medium"
}

variable "firewall_ports" {
  description = "List of ports for firewall ingress"
  type        = list(string)
  default     = ["22", "80", "443", "3000"]
}

variable "ssh_username" {
  description = "Username for SSH access"
  type        = string
  default     = "ubuntu"
}
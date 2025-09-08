variable "subscription_id" {
  default = ""
}
variable "tenant_id" {
  default = ""
}
variable "client_id" {
  default = ""
}
variable "client_secret" {
  default = ""
}
variable "location" {
  default = "East US"
}

variable "resource_group_name" {
  default = "TooljetResourceGroup"
}

variable "vm_size" {
  type    = string
  default = "Standard_DS1_v2"
}

variable "vm_admin_username" {
  type    = string
  default = "azureuser"
}

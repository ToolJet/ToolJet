variable "region" {
  default = "us-east-1"
}
variable "aws_subnet_subnet1_AZ" {
  default = "us-east-1c"
}
variable "aws_subnet_subnet2_AZ" {
  default = "us-east-1d"
}
variable "AppName" {
  default = "ToolJet"
}
variable "ServiceName" {
  default = "Tooljet-service"
}
variable "TOOLJET_DB" {
  default = ""
}
variable "TOOLJET_DB_HOST" {
  default = ""
}
variable "TOOLJET_DB_USER" {
  default = ""
}
variable "TOOLJET_DB_PASS" {
  default = ""
}
variable "PG_HOST" {
  default = ""
}
variable "PG_USER" {
  default = "postgres"
}
variable "PG_PASS" {
  default = "postgres"
}
variable "PG_DB" {
  default = "postgres"
}
variable "LOCKBOX_MASTER_KEY" {
  default = ""
}
variable "SECRET_KEY_BASE" {
  default = ""
}
variable "REDIS_HOST" {
  default = "127.0.0.1"
}
variable "REDIS_PORT" {
  default = ""
}
variable "REDIS_USER" {
  default = ""
}
variable "REDIS_PASSWORD" {
  default = ""
}
variable "PGRST_JWT_SECRET" {
  default = ""
}

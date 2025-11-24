# Outputs
output "tooljet_private_key" {
  value     = tls_private_key.tooljet_key.private_key_pem
  sensitive = true
}

output "instance_ip" {
  value = aws_instance.tooljet_instance.public_ip
}

output "instance_id" {
  value = aws_instance.tooljet_instance.id
}

output "ami_id" {
  value = var.tooljet_ami_id
}

output "ami_description" {
  value = "Using ToolJet AMI ID: ${var.tooljet_ami_id}"
}
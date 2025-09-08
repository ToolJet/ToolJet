output "tooljet_private_key" {
  value     = tls_private_key.tooljet_key.private_key_pem
  sensitive = true
}
# Output instance details
output "instance_ip" {
  value = aws_instance.tooljet_instance.public_ip
}

output "instance_id" {
  value = aws_instance.tooljet_instance.id
}

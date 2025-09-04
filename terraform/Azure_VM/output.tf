
# Outputs
output "tooljet_private_key" {
  value     = tls_private_key.tooljet_key.private_key_pem
  sensitive = true
}

output "public_ip_address" {
  value = azurerm_public_ip.tooljet_public_ip.ip_address
}

output "vm_id" {
  value = azurerm_linux_virtual_machine.tooljet_vm.id
}

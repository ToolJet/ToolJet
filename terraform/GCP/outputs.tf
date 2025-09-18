output "tooljet_private_key" {
  description = "The private SSH key for accessing the instance"
  value       = tls_private_key.tooljet_key.private_key_pem
  sensitive   = true
}

output "instance_ip" {
  description = "The external IP address of the instance"
  value       = google_compute_instance.tooljet_instance.network_interface[0].access_config[0].nat_ip
}

output "instance_id" {
  description = "The ID of the compute instance"
  value       = google_compute_instance.tooljet_instance.id
}

output "instance_name" {
  description = "The name of the compute instance"
  value       = google_compute_instance.tooljet_instance.name
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i private_key.pem ${var.ssh_username}@${google_compute_instance.tooljet_instance.network_interface[0].access_config[0].nat_ip}"
}
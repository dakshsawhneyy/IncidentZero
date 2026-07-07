output "vm_public_ip" {
  value       = azurerm_public_ip.main.ip_address
  description = "The public IP address of the virtual machine"
}

output "admin_username" {
  value     = var.admin_username
  sensitive = false # Username is fine to show
}
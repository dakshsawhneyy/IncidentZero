output "vmss_id" {
  value       = azurerm_linux_virtual_machine_scale_set.example.id
  description = "The id of the VM Scale Set"
}

output "lb_public_ip" {
  value       = azurerm_public_ip.lb.ip_address
  description = "The public IP address of the module Load Balancer"
}

output "admin_username" {
  value     = var.admin_username
  sensitive = false
}
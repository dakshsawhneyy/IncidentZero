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

output "vmss_name" {
  value       = azurerm_linux_virtual_machine_scale_set.example.name
  description = "The name of the VM Scale Set"
}

output "default_instances" {
  value       = var.default_instances
  description = "Configured default VMSS instance count"
}

output "min_instances" {
  value       = var.min_instances
  description = "Autoscale minimum instances"
}

output "max_instances" {
  value       = var.max_instances
  description = "Autoscale maximum instances"
}

output "lb_id" {
  value       = azurerm_lb.main.id
  description = "The id of the Load Balancer"
}

output "backend_pool_id" {
  value       = azurerm_lb_backend_address_pool.bpepool.id
  description = "The id of the LB backend address pool"
}

output "lb_probe_id" {
  value       = azurerm_lb_probe.http.id
  description = "The id of the LB health probe"
}

output "lb_nat_pool_id" {
  value       = azurerm_lb_nat_pool.lbnatpool.id
  description = "The id of the LB NAT pool for SSH"
}

output "lb_rule_id" {
  value       = azurerm_lb_rule.http.id
  description = "The id of the LB rule forwarding HTTP"
}

output "autoscale_id" {
  value       = azurerm_monitor_autoscale_setting.autoscale.id
  description = "The id of the autoscale setting"
}

output "subnet_id" {
  value       = azurerm_subnet.internal.id
  description = "The id of the subnet used by the VMSS"
}

output "nsg_id" {
  value       = azurerm_network_security_group.main.id
  description = "The id of the network security group"
}
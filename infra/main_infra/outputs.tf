output "lb_public_ip" {
  value       = module.vmss.lb_public_ip
  description = "The public IP address of the module Load Balancer"
}

output "admin_username" {
  value     = var.admin_username
  sensitive = true
}

output "vmss_name" {
  value       = module.vmss.vmss_name
  description = "The name of the VM Scale Set"
}

output "vmss_default_instances" {
  value       = module.vmss.default_instances
  description = "The default VMSS instance count configured"
}

output "vmss_min_instances" {
  value       = module.vmss.min_instances
  description = "Autoscale minimum instances"
}

output "vmss_max_instances" {
  value       = module.vmss.max_instances
  description = "Autoscale maximum instances"
}



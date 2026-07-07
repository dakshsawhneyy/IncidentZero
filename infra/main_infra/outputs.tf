output "lb_public_ip" {
  value       = module.vmss.lb_public_ip
  description = "The public IP address of the module Load Balancer"
}

output "admin_username" {
  value     = var.admin_username
  sensitive = true
}

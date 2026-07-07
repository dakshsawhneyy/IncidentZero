output "vm_public_ip" {
  value       = module.vm.vm_public_ip
  description = "The public IP address of the virtual machine"
}

output "admin_username" {
  value     = var.admin_username
  sensitive = true # Username is fine to show
}

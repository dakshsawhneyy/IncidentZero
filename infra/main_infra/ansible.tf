resource "local_file" "ansible_inventory" {
  filename = "${path.root}/../../ansible/inventory.ini"
  content  = <<EOT
[servers]
incidentzero_vm ansible_host=${module.vm.vm_public_ip}

[servers:vars]
ansible_user=${var.admin_username}
ansible_password=${var.admin_password}
ansible_connection=ssh
ansible_ssh_auth_method=password
ansible_python_interpreter=/usr/bin/python3
ansible_ssh_common_args='-o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'
EOT
}
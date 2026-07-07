# Azure doesn't control my resource group
data "azurerm_resource_group" "example" {
  name = var.rsg_name
}

# Virtual Network
resource "azurerm_virtual_network" "main" {
  name                = "${var.prefix}-network"
  address_space       = var.vn_cidr
  location            = data.azurerm_resource_group.example.location
  resource_group_name = data.azurerm_resource_group.example.name
}

# Subnet
resource "azurerm_subnet" "internal" {
  name                 = "internal"
  resource_group_name  = data.azurerm_resource_group.example.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = var.subnet_cidr
}

# Security Group
resource "azurerm_network_security_group" "main" {
  name                = "${var.prefix}-nsg"
  location            = data.azurerm_resource_group.example.location
  resource_group_name = data.azurerm_resource_group.example.name

  security_rule {
    name                       = "Allow-SSH"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = "*" # Note: For safety, replace "*" with your public IP address
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "Allow-HTTP"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "80"
    source_address_prefix      = "*" # Note: For safety, replace "*" with your public IP address
    destination_address_prefix = "*"
  }
  security_rule {
    name                       = "Allow-HTTPS"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "443"
    source_address_prefix      = "*" # Note: For safety, replace "*" with your public IP address
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "main" {
  subnet_id                 = azurerm_subnet.internal.id
  network_security_group_id = azurerm_network_security_group.main.id
}


# virtual_machine_scale_set
resource "azurerm_linux_virtual_machine_scale_set" "example" {
  name                = "${var.prefix}-vmss"
  resource_group_name = data.azurerm_resource_group.example.name
  location            = data.azurerm_resource_group.example.location

  sku       = var.vm_size
  instances = var.default_instances

  admin_username = var.admin_username

  upgrade_mode = "Rolling"

  health_probe_id = azurerm_lb_probe.http.id

  automatic_os_upgrade_policy {
    enable_automatic_os_upgrade = true
    disable_automatic_rollback = false
  }

  rolling_upgrade_policy {
    max_batch_instance_percent              = 20
    max_unhealthy_instance_percent          = 20
    max_unhealthy_upgraded_instance_percent = 5
    pause_time_between_batches              = "PT0S"
  }

  custom_data = base64encode(
    file("${path.module}/user-script.sh")
  )

  admin_ssh_key {
    username   = var.admin_username
    public_key = file("${path.module}/../../azure_rsa.pub")
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  data_disk {
    lun                  = 0
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 10
    create_option        = "Empty"
  }

  network_interface {
    name    = "${var.prefix}-nic"
    primary = true

    ip_configuration {
      name      = "internal"
      primary   = true
      subnet_id = azurerm_subnet.internal.id

      load_balancer_backend_address_pool_ids = [
        azurerm_lb_backend_address_pool.bpepool.id
      ]

      load_balancer_inbound_nat_rules_ids = [
        azurerm_lb_nat_pool.lbnatpool.id
      ]
    }
  }

  tags = {
    environment = var.env
  }

  depends_on = [ azurerm_lb_rule.http ]
}


# Auto Scaling Rules
resource "azurerm_monitor_autoscale_setting" "autoscale" {
  name                = "${var.prefix}-autoscale"
  resource_group_name = data.azurerm_resource_group.example.name
  location            = data.azurerm_resource_group.example.location

  target_resource_id = azurerm_linux_virtual_machine_scale_set.example.id

  profile {
    name = "default"
    capacity {
      minimum = var.min_instances
      maximum = var.max_instances
      default = var.default_instances
    }
    # Rules
    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.example.id

        operator  = "GreaterThan"
        statistic = "Average"  # it compares avg among all instances

        threshold = 70  # CPU > 70% (if yes then autoscale)

        time_grain = "PT1M"
        time_window = "PT5M"

        time_aggregation = "Average"
      }

      scale_action {
        direction = "Increase"
        type = "ChangeCount"
        value = "1"
        cooldown = "PT5M"
      }
    }
  }
}
resource "azurerm_public_ip" "lb" {
  name                = "${var.prefix}-lb-pip"
  location            = data.azurerm_resource_group.example.location
  resource_group_name = data.azurerm_resource_group.example.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

resource "azurerm_lb" "main" {
  name                = "${var.prefix}-lb"
  location            = data.azurerm_resource_group.example.location
  resource_group_name = data.azurerm_resource_group.example.name
  sku                 = "Standard"

  frontend_ip_configuration {
    name                 = "PublicIPAddress"
    public_ip_address_id = azurerm_public_ip.lb.id
  }
}

# collection of servers that receive traffic.
resource "azurerm_lb_backend_address_pool" "bpepool" {
  name          = "BackendPool"
  loadbalancer_id = azurerm_lb.main.id
}

# Health Probe
resource "azurerm_lb_probe" "http" {
  name               = "http-probe"
  loadbalancer_id    = azurerm_lb.main.id
  protocol           = "Http"
  port               = 80
  request_path       = "/"
  interval_in_seconds = 5
  number_of_probes   = 2
}

# sometimes ssh into each vm
resource "azurerm_lb_nat_pool" "lbnatpool" {
  name               = "ssh-nat-pool"
  resource_group_name = data.azurerm_resource_group.example.name
  loadbalancer_id    = azurerm_lb.main.id
  protocol           = "Tcp"
  frontend_port_start = 50000
  frontend_port_end   = 50119
  backend_port        = 22    # All those frontend ports map to SSH.
  frontend_ip_configuration_name = "PublicIPAddress"
}

# This is the rule that actually forwards traffic.
resource "azurerm_lb_rule" "http" {
  name                           = "http-rule"
  loadbalancer_id                = azurerm_lb.main.id
  frontend_ip_configuration_name = "PublicIPAddress"
  protocol                       = "Tcp"
  frontend_port                  = 80
  backend_port                   = 80
  backend_address_pool_ids = [ azurerm_lb_backend_address_pool.bpepool.id ]
  probe_id                       = azurerm_lb_probe.http.id
  idle_timeout_in_minutes        = 4
}
module "vm" {
  source         = "./modules/vm"
  rsg_name       = var.rsg_name
  prefix         = var.prefix
  location       = var.location
  admin_username = var.admin_username
  vn_cidr        = var.vn_cidr
  subnet_cidr    = var.subnet_cidr
  env            = var.env
}
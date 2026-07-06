terraform {
  backend "azurerm" {
    resource_group_name  = "incidentzero"
    storage_account_name = "incidentzerostatefile"
    container_name       = "tfstate"
    key                  = "statefile/terraform.tfstate"
  }
}
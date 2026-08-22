terraform {
  required_version = ">= 1.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0" # Keeps configuration locked to stable v4 minor updates
    }
  }
}

provider "azurerm" {
  features {}
}
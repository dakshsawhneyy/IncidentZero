variable "rsg_name" {
  default = "incidentzero"
  type    = string
}

variable "prefix" {
  default = "incidentzero"
  type    = string
}

variable "location" {
  type    = string
  default = "Central India"
}

variable "admin_username" {
  type = string
}

variable "vn_cidr" {
  default = ["10.0.0.0/16"]
  type    = list(string)
}

variable "subnet_cidr" {
  default = ["10.0.0.0/24"]
  type    = list(string)
}

variable "env" {
  type    = string
  default = "dev"
}

variable "storage_account_name" {
  type    = string
  default = "incidentzerostatefile"
}

variable "DATABASE_URL" {
  type = string
  sensitive = true
}
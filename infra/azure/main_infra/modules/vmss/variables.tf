variable "rsg_name" {
  type = string
}

variable "location" {
  type = string
  default = "Central India"
}

variable "prefix" {
  type = string
}

variable "vn_cidr" {
  type = list(string)
}

variable "subnet_cidr" {
  type = list(string)
}

variable "admin_username" {
  type = string
  sensitive = true
}

variable "env" {
  type = string
}

variable "vm_size" {
  type    = string
  default = "Standard_B1s"
}

variable "min_instances" {
  type    = number
  default = 2
}

variable "max_instances" {
  type    = number
  default = 4
}

variable "default_instances" {
  type    = number
  default = 2
}

variable "DATABASE_URL" {
  type = string
  sensitive = true
}
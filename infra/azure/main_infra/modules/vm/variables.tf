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
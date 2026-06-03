variable "aws_region" {
  description = "Región de AWS donde se desplegará el servidor"
  type        = string
  default     = "us-east-1"
}

variable "aws_access_key" {
  description = "Access Key de AWS"
  type        = string
  sensitive   = true
}

variable "aws_secret_key" {
  description = "Secret Key de AWS"
  type        = string
  sensitive   = true
}

variable "instance_name" {
  description = "Nombre de la instancia de Lightsail"
  type        = string
  default     = "praxishub-prod-instance"
}

variable "availability_zone" {
  description = "Zona de disponibilidad para la instancia"
  type        = string
  default     = "us-east-1a"
}

variable "blueprint_id" {
  description = "ID del sistema operativo (Blueprint) para Lightsail"
  type        = string
  default     = "ubuntu_22_04"
}

variable "bundle_id" {
  description = "Tamaño de la instancia de Lightsail (nano_2_0, micro_2_0, small_2_0, medium_2_0)"
  type        = string
  default     = "small_2_0" # 2 GB RAM, 1 vCPU, 60 GB SSD ($10/mes) - Recomendado para soportar NestJS + React + DB.
}

variable "ssh_public_key" {
  description = "Contenido de tu clave pública SSH local (e.g. el contenido de ~/.ssh/id_rsa.pub) para acceder por consola al servidor"
  type        = string
  default     = ""
}

# 1. Crear el par de claves SSH en AWS Lightsail (si se provee una clave pública)
resource "aws_lightsail_key_pair" "key" {
  count      = var.ssh_public_key != "" ? 1 : 0
  name       = "praxishub-deploy-key"
  public_key = var.ssh_public_key
}

# 2. Crear la instancia de AWS Lightsail
resource "aws_lightsail_instance" "server" {
  name              = var.instance_name
  availability_zone = var.availability_zone
  blueprint_id      = var.blueprint_id
  bundle_id         = var.bundle_id
  key_pair_name     = var.ssh_public_key != "" ? aws_lightsail_key_pair.key[0].name : null

  # Script de inicio (User Data) para aprovisionar Docker y Docker Compose automáticamente
  user_data = <<-EOF
              #!/bin/bash
              set -e

              # Registrar salida del script para depuración
              exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

              echo "=== INICIANDO INSTALACIÓN DE DOCKER ==="
              
              # Actualizar paquetes
              sudo apt-get update -y
              sudo apt-get upgrade -y

              # Instalar dependencias previas
              sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release git

              # Instalar clave GPG oficial de Docker
              sudo mkdir -p /etc/apt/keyrings
              curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

              # Configurar el repositorio
              echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
                $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

              # Instalar Docker Engine y Compose
              sudo apt-get update -y
              sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

              # Iniciar y habilitar servicio Docker
              sudo systemctl enable docker
              sudo systemctl start docker

              # Añadir usuario ubuntu al grupo docker (para correr docker sin sudo)
              sudo usermod -aG docker ubuntu

              echo "=== DOCKER INSTALADO CON ÉXITO ==="
              docker --version
              docker compose version
              EOF

  tags = {
    Environment = "Production"
    Project     = "PraxisHub"
  }
}

# 3. Configurar el Firewall (Puertos públicos) de Lightsail de forma segura
# Solo se exponen externamente SSH (22), HTTP (80) y HTTPS (443)
resource "aws_lightsail_instance_public_ports" "firewall" {
  instance_name = aws_lightsail_instance.server.name

  port_info {
    protocol  = "tcp"
    from_port = 22
    to_port   = 22
  }

  port_info {
    protocol  = "tcp"
    from_port = 80
    to_port   = 80
  }

  port_info {
    protocol  = "tcp"
    from_port = 443
    to_port   = 443
  }
}

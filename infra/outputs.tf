output "public_ip" {
  description = "IP pública del servidor de producción"
  value       = aws_lightsail_instance.server.public_ip_address
}

output "ssh_command" {
  description = "Comando para conectarse al servidor por SSH"
  value       = "ssh ubuntu@${aws_lightsail_instance.server.public_ip_address}"
}

output "app_url" {
  description = "URL principal de la aplicación"
  value       = "http://${aws_lightsail_instance.server.public_ip_address}"
}

output "instrucciones" {
  description = "Siguientes pasos para el despliegue de Docker"
  value       = <<EOF

¡Servidor de AWS Lightsail creado con éxito!

Para desplegar tu proyecto:
1. Conéctate al servidor mediante SSH:
   ssh ubuntu@${aws_lightsail_instance.server.public_ip_address}

2. Una vez dentro, comprueba que Docker esté activo:
   docker --version && docker compose version

3. Transfiere tus archivos locales al servidor (o clona tu repositorio de Git):
   git clone <url_de_tu_repositorio>

4. Copia tu archivo .env de producción a la carpeta raíz y levanta tus contenedores con:
   docker compose -f docker-compose.prod.yml up -d --build
EOF
}

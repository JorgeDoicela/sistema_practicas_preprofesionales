#!/bin/bash
# Script de aprovisionamiento automatizado para el servidor AWS VPS de EmiTesis
# Configura el sistema operativo, instala dependencias de Docker, aplica reglas de firewall estrictas y configura respaldos automáticos

set -e

echo "====================================================================="
echo "   EMITESIS CORE - APROVISIONAMIENTO Y SEGURIZACIÓN DE VPS"
echo "====================================================================="

# 1. Actualización del Sistema Operativo
echo "[1/5] Actualizando paquetes del sistema operativo..."
sudo apt-get update -y
sudo apt-get upgrade -y

# 2. Instalación de Docker y Docker Compose
echo "[2/5] Verificando e instalando Docker Engine y Docker Compose..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    sudo apt-get install -y docker-compose-plugin
fi

# Habilitar e iniciar servicio de Docker
sudo systemctl enable docker
sudo systemctl start docker

# 3. Configuración del Firewall (Seguridad de Nivel Bancario)
# Bloquea todos los puertos del sistema excepto los estrictamente necesarios
echo "[3/5] Aplicando reglas de Firewall estrictas (UFW)..."
sudo apt-get install -y ufw
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp     # SSH (Pipeline de despliegue y administración)
sudo ufw allow 80/tcp     # HTTP (Caddy y Let's Encrypt)
sudo ufw allow 443/tcp    # HTTPS (Acceso seguro)
sudo ufw --force enable
sudo ufw status verbose

# 4. Creación de Directorios y Configuración de Rutas
echo "[4/5] Configurando estructura de directorios..."
mkdir -p "$HOME/emitesis/backups"

# Copiar el script de respaldo al directorio definitivo y dar permisos de ejecución
cp backup-db.sh "$HOME/emitesis/backup-db.sh"
chmod +x "$HOME/emitesis/backup-db.sh"

# 5. Automatización de Copias de Seguridad (Cron Job Diario)
echo "[5/5] Registrando tarea cron diaria para respaldos automáticos..."
CRON_JOB="0 3 * * * $HOME/emitesis/backup-db.sh >> $HOME/emitesis/backups/backup_cron.log 2>&1"
# Asegurar no duplicar la entrada de cron
(crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "$CRON_JOB") | crontab -

echo "====================================================================="
echo "   APROVISIONAMIENTO COMPLETADO CON ÉXITO"
echo "   - Docker instalado y activo."
echo "   - Firewall estrictamente bloqueado (solo puertos 22, 80 y 443 abiertos)."
echo "   - Respaldos diarios automáticos configurados a las 03:00 AM."
echo "====================================================================="

#!/bin/bash
# =====================================================================
#   EMITESIS CORE - APROVISIONAMIENTO Y SEGURIZACIÓN DE VPS
# =====================================================================
# Script de aprovisionamiento optimizado para servidores de producción.
# Configura dependencias, Docker Engine, cortafuegos estricto UFW
# y programa tareas automáticas de copias de seguridad de la base de datos.

set -e

# Códigos de colores ANSI para una visualización premium en consola
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # Sin color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✔]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✘]${NC} $1"
}

# Encabezado elegante
echo -e "${PURPLE}=====================================================================${NC}"
echo -e "${PURPLE}   EMITESIS CORE - DEPLOYMENT & SECURIZATION SYSTEM                  ${NC}"
echo -e "${PURPLE}=====================================================================${NC}"

# 1. Actualización del Sistema Operativo
log_info "Fase 1/5: Actualizando repositorios del sistema operativo..."
sudo apt-get update -y
sudo apt-get upgrade -y
log_success "Sistema operativo actualizado con éxito."

# 2. Instalación de Docker y Docker Compose
log_info "Fase 2/5: Verificando entorno e instalando Docker Engine y Docker Compose..."
if ! command -v docker &> /dev/null; then
    log_info "Docker no detectado. Instalando dependencias previas..."
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    
    log_info "Configurando el repositorio oficial de Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    log_info "Instalando paquetes de Docker Engine..."
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    log_success "Docker Engine instalado correctamente."
else
    log_success "Docker Engine ya se encuentra instalado."
fi

# Instalación de plugin moderno de Docker Compose si no existe
if ! docker compose version &> /dev/null; then
    log_info "Docker Compose v2 no detectado. Instalando plugin de Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
    log_success "Docker Compose Plugin v2 instalado correctamente."
else
    log_success "Docker Compose v2 ya está disponible en el sistema."
fi

# Habilitar e iniciar servicio de Docker
log_info "Asegurando servicio de Docker en arranque automático..."
sudo systemctl enable docker
sudo systemctl start docker
log_success "Servicio Docker activo y habilitado en el arranque."

# 3. Configuración del Firewall (Seguridad Estricta de Nivel Industrial)
# Se cierran los puertos internos de la app (3005 y 5000) al exterior de forma estricta.
# Todo el enrutamiento se maneja internamente en la VPS a través de Nginx en puerto 80 (HTTP).
log_info "Fase 3/5: Aplicando reglas estrictas de cortafuegos UFW..."
sudo apt-get install -y ufw

log_info "Restableciendo valores por defecto del Firewall (Denegar Entrada, Permitir Salida)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing

log_info "Permitiendo acceso a los puertos estrictamente esenciales..."
sudo ufw allow 22/tcp      # SSH (Para pipelines de CI/CD y administración segura)
sudo ufw allow 80/tcp      # HTTP (Proxy Nginx - Utilizado por Cloudflare SSL)
sudo ufw allow 443/tcp     # HTTPS (Preparado para conexiones TLS directas futuras)

# Asegurar el bloqueo explícito de puertos de desarrollo/internos que solían estar abiertos
log_warning "Cerrando puertos internos expuestos anteriormente de forma directa al público..."
sudo ufw delete allow 3005/tcp &> /dev/null || true  # Frontend
sudo ufw delete allow 5000/tcp &> /dev/null || true  # API
sudo ufw delete allow 5432/tcp &> /dev/null || true  # Base de Datos PostgreSQL

log_info "Activando Firewall..."
sudo ufw --force enable
sudo ufw status verbose
log_success "Firewall configurado con éxito. Puertos abiertos externamente: 22, 80 y 443."

# 4. Creación de Directorios y Configuración de Rutas
log_info "Fase 4/5: Configurando estructura de directorios y scripts operativos..."
mkdir -p "$HOME/emitesis/backups"

# Copiar scripts operativos al directorio definitivo de la aplicación
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "backup-db.sh" ]; then
    cp backup-db.sh "$HOME/emitesis/backup-db.sh"
    chmod +x "$HOME/emitesis/backup-db.sh"
    log_success "Script de respaldos copiado a ~/emitesis/backup-db.sh"
elif [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
    cp "$SCRIPT_DIR/backup-db.sh" "$HOME/emitesis/backup-db.sh"
    chmod +x "$HOME/emitesis/backup-db.sh"
    log_success "Script de respaldos copiado a ~/emitesis/backup-db.sh"
else
    log_warning "No se encontró el script 'backup-db.sh' en el directorio actual ni en $SCRIPT_DIR. Asegúrese de transferirlo."
fi

if [ -f "manage-db.sh" ]; then
    cp manage-db.sh "$HOME/emitesis/manage-db.sh"
    chmod +x "$HOME/emitesis/manage-db.sh"
    log_success "Script gestor de base de datos copiado a ~/emitesis/manage-db.sh"
elif [ -f "$SCRIPT_DIR/manage-db.sh" ]; then
    cp "$SCRIPT_DIR/manage-db.sh" "$HOME/emitesis/manage-db.sh"
    chmod +x "$HOME/emitesis/manage-db.sh"
    log_success "Script gestor de base de datos copiado a ~/emitesis/manage-db.sh"
else
    log_warning "No se encontró el script 'manage-db.sh' en el directorio actual ni en $SCRIPT_DIR. Asegúrese de transferirlo."
fi

# 5. Automatización de Copias de Seguridad (Cron Job Diario)
log_info "Fase 5/5: Registrando tarea cron diaria para respaldos automáticos..."
CRON_JOB="0 3 * * * $HOME/emitesis/backup-db.sh >> $HOME/emitesis/backups/backup_cron.log 2>&1"

# Asegurar no duplicar la entrada en el crontab del usuario
(crontab -l 2>/dev/null | grep -v "backup-db.sh"; echo "$CRON_JOB") | crontab -
log_success "Tarea programada registrada con éxito en crontab (Diario a las 03:00 AM)."

echo -e "${PURPLE}=====================================================================${NC}"
log_success "APROVISIONAMIENTO DE VPS EMITESIS COMPLETADO CON ÉXITO"
echo -e "   - Entorno Docker Docker Compose activo."
echo -e "   - Firewall estrictamente blindado (Solo 22, 80, 443 expuestos)."
echo -e "   - Nodos internos 3005 y 5000 aislados para mayor seguridad."
echo -e "   - Copia de seguridad diaria activa a las 03:00 AM."
echo -e "${PURPLE}=====================================================================${NC}"

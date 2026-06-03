# PraxisHub Infrastructure as Code (IaC) - AWS Lightsail & Docker

Este módulo de **Terraform** permite automatizar por completo el aprovisionamiento y despliegue del sistema PraxisHub en la nube de Amazon Web Services (AWS) utilizando **AWS Lightsail**.

El objetivo de esta implementación es garantizar la **portabilidad absoluta y la replicabilidad instantánea** del sistema. Cualquier institución que desee implementar esta plataforma puede levantar un servidor idéntico y seguro en pocos minutos sin necesidad de interactuar manualmente con la consola web de AWS.

---

## Arquitectura de Despliegue

La arquitectura declarada en este módulo consta de los siguientes componentes:

1. **Servidor Virtual (VPS):** Instancia de AWS Lightsail con el sistema operativo Ubuntu 22.04 LTS. Por defecto se utiliza el bundle `small_2_0` (2 GB de RAM, 1 vCPU, 60 GB SSD) para garantizar el rendimiento óptimo del backend, frontend y base de datos corriendo en simultáneo.
2. **Cortafuegos Perimetral (Firewall):** Reglas de seguridad estrictas que bloquean todos los puertos del servidor a nivel de red, permitiendo únicamente el acceso a:
   * **Puerto 22 (SSH):** Para administración segura del servidor y pipelines CI/CD.
   * **Puerto 80 (HTTP):** Redireccionamiento web / Proxy inverso.
   * **Puerto 443 (HTTPS):** Acceso seguro SSL mediante Nginx.
3. **Aprovisionamiento Automático (User Data):** Un script bash que se ejecuta al arrancar el servidor por primera vez, instalando y habilitando automáticamente:
   * **Docker Engine** (Última versión estable).
   * **Docker Compose v2** (Plugin oficial).
   * Configuración de permisos para ejecutar contenedores sin necesidad de usar privilegios de administrador (`sudo`).

---

## Guía de Despliegue en 4 Pasos

### Requisitos Previos
* Tener instalado [Terraform](https://developer.hashicorp.com/terraform/downloads) (v1.5.0 o superior) en tu computadora local.
* Una cuenta de AWS y las credenciales de acceso (Access Key y Secret Key) con permisos para gestionar recursos de Lightsail.

### Paso 1: Configurar Variables de Entorno
Renombra el archivo `terraform.tfvars.example` a `terraform.tfvars` dentro de la carpeta `infra/`:
```bash
cp terraform.tfvars.example terraform.tfvars
```
Abre el archivo `terraform.tfvars` y edita los valores con tus credenciales y configuración deseada:
```hcl
aws_access_key = "TU_AWS_ACCESS_KEY_REAL"
aws_secret_key = "TU_AWS_SECRET_KEY_REAL"
aws_region     = "us-east-1"
ssh_public_key = "ssh-rsa AAAA..." # Contenido de tu archivo ~/.ssh/id_rsa.pub
```

### Paso 2: Inicializar el Entorno
Descarga los proveedores oficiales de AWS requeridos por Terraform:
```bash
terraform init
```

### Paso 3: Validar la Infraestructura
Genera un plan de ejecución para verificar qué recursos se crearán en AWS:
```bash
terraform plan
```

### Paso 4: Desplegar
Crea el servidor VPS automáticamente en la nube:
```bash
terraform apply
```
*Cuando se te solicite confirmación, escribe `yes` y presiona Enter.*

Al finalizar, Terraform mostrará en la terminal la **IP Pública** del servidor y el comando SSH listo para conectarte.

---

## Transferencia y Despliegue de la Aplicación

Una vez creado el servidor con Terraform, la aplicación se despliega en cuestión de minutos siguiendo estos pasos:

1. **Acceder al servidor por SSH:**
   ```bash
   ssh ubuntu@<IP_PUBLICA_DEL_SERVIDOR>
   ```

2. **Clonar el repositorio en el servidor:**
   ```bash
   git clone <URL_DE_TU_REPOSITORIO> praxishub
   cd praxishub
   ```

3. **Configurar las variables de entorno de la aplicación:**
   Crea los archivos `.env` en la raíz del proyecto y en el backend con las configuraciones del servidor y base de datos.

4. **Levantar el ecosistema Docker en producción:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

5. **Poblar la base de datos (Opcional):**
   ```bash
   ./manage-db.sh seed
   ```

---

## Aporte Metodológico para la Tesis (IaC)

Esta carpeta implementa el concepto de **Infraestructura como Código (IaC)**. Al utilizar archivos de configuración declarativos (`main.tf`), se elimina el "factor humano" y la configuración manual propensa a errores. Esto permite que el sistema PraxisHub posea una propiedad de **escalabilidad horizontal y portabilidad multi-región**, lo cual es un estándar de la industria Cloud Native actual (DevOps).

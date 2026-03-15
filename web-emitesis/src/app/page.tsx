import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-24 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 px-8 py-16 text-white shadow-xl md:px-12 md:py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.06\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">
            Sistema web de gestión
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Emitesis
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-emerald-100">
            Automatiza la gestión, validación y seguimiento de la documentación
            académica de las prácticas preprofesionales. Una plataforma
            centralizada para instituto, empresas, estudiantes y tutores:
            convenios, documentos, asistencia y certificados.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-emerald-800 shadow-md transition hover:bg-emerald-50"
            >
              Iniciar sesión
            </Link>
            <a
              href="#modulos"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/60 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Ver módulos
            </a>
          </div>
        </div>
      </section>

      {/* Problema vs Solución */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-red-700">
            El problema actual
          </h2>
          <p className="mt-3 text-zinc-700">
            El proceso de gestión de prácticas hoy es manual, lento, propenso a
            errores y con poca trazabilidad documental.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Procesos manuales y repetitivos
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Lentitud en aprobaciones y seguimiento
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Riesgo de errores humanos
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
              Trazabilidad documental insuficiente
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6 md:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            La solución Emitesis
          </h2>
          <p className="mt-3 text-zinc-700">
            Una plataforma web centralizada que permite gestionar convenios,
            validar documentos, controlar asistencia por geolocalización,
            automatizar notificaciones y generar certificados finales.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-zinc-600">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Convenios con empresas y notificación por correo
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Subida y validación de documentos académicos
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Asistencia con verificación por GPS (200 m)
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Certificados PDF automáticos
            </li>
          </ul>
        </div>
      </section>

      {/* Actores RBAC */}
      <section id="actores" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Actores del sistema
        </h2>
        <p className="mt-2 text-zinc-600">
          Control de acceso por roles (RBAC). Cada usuario accede solo a lo que
          le compete.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-5 shadow-sm transition hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Administrador</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Gestiona usuarios, configuraciones y supervisa el funcionamiento del sistema.
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm transition hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Coordinador de Prácticas</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Crea convenios, asigna estudiantes y tutores, aprueba documentos finales y emite certificados.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm transition hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Tutor Académico</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Supervisa estudiantes, define fechas de entrega y revisa o aprueba documentos antes del coordinador.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm transition hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Estudiante</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Registra asistencia, descarga formatos, sube documentos y consulta estado de aprobación.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm transition hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Empresa</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Consulta convenios y prácticas asignadas a su organización, y puede interactuar con el flujo según permisos.
            </p>
          </div>
        </div>
      </section>

      {/* Módulos funcionales */}
      <section id="modulos" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Módulos funcionales
        </h2>
        <p className="mt-2 text-zinc-600">
          Cuatro pilares que cubren desde el convenio hasta el certificado final.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold">
                1
              </span>
              <h3 className="text-lg font-semibold text-zinc-900">
                Convenios
              </h3>
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              Registro de empresas con RUC único, carga del PDF del convenio
              firmado y asociación con estudiantes. Notificación automática por
              correo al registrar un convenio.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-semibold">
                2
              </span>
              <h3 className="text-lg font-semibold text-zinc-900">
                Gestión documental
              </h3>
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              Módulo central: 8 documentos obligatorios en PDF (máx. 10 MB),
              control de fechas de entrega y flujo de aprobación tutor →
              coordinador. Documentos aprobados quedan bloqueados de forma
              permanente.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 font-semibold">
                3
              </span>
              <h3 className="text-lg font-semibold text-zinc-900">
                Asistencia con geolocalización
              </h3>
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              Registro de entrada/salida con coordenadas GPS. Validación con
              fórmula de Haversine: la asistencia es válida solo si el
              estudiante está a ≤ 200 m de la ubicación de la empresa.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-semibold">
                4
              </span>
              <h3 className="text-lg font-semibold text-zinc-900">
                Certificación automática
              </h3>
            </div>
            <p className="mt-3 text-sm text-zinc-600">
              Generación automática del certificado en PDF cuando los 8
              documentos están aprobados definitivamente y se completó el 100 %
              de las horas de asistencia.
            </p>
          </div>
        </div>
      </section>

      {/* Flujo documental */}
      <section id="flujo-documental" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Flujo de aprobación documental
        </h2>
        <p className="mt-2 text-zinc-600">
          8 documentos obligatorios. Validación en cascada: tutor primero,
          coordinador después. Aprobación final = bloqueo permanente.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
          <Step label="Estudiante sube PDF" />
          <Arrow />
          <Step label="Pendiente revisión tutor" />
          <Arrow />
          <Step label="Tutor aprueba o rechaza" />
          <Arrow />
          <Step label="Coordinador revisa" />
          <Arrow />
          <Step label="Aprobado → Bloqueado" highlight />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            "Pendiente",
            "En revisión por tutor",
            "Aprobado por tutor",
            "Rechazado",
            "Aprobado por coordinador",
            "Bloqueado",
          ].map((state) => (
            <span
              key={state}
              className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700"
            >
              {state}
            </span>
          ))}
        </div>
      </section>

      {/* Asistencia Haversine */}
      <section className="rounded-2xl border border-amber-100 bg-amber-50/40 p-6 md:p-8">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900">
          Validación de asistencia por ubicación
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Se usa la <strong>fórmula de Haversine</strong> para calcular la
          distancia entre la ubicación del estudiante y la de la empresa. La
          asistencia solo es válida si la distancia es menor o igual a{" "}
          <strong>200 metros</strong>.
        </p>
        <div className="mt-4 rounded-xl bg-white/80 p-4 font-mono text-xs text-zinc-700 overflow-x-auto">
          d = 2r · arcsin(√(sin²(Δlat/2) + cos(lat₁)cos(lat₂)sin²(Δlon/2)))
        </div>
      </section>

      {/* Tecnologías */}
      <section id="tecnologias" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Tecnologías
        </h2>
        <p className="mt-2 text-zinc-600">
          Stack moderno: Next.js y React en el frontend; NestJS y PostgreSQL en
          el backend.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Frontend
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
              <li>Next.js · React</li>
              <li>Tailwind CSS · Shadcn/ui</li>
              <li>TanStack Query</li>
              <li>Axios / Fetch · Web Geolocation API</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Backend
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
              <li>Node.js · NestJS</li>
              <li>Zod / class-validator</li>
              <li>Nodemailer · Handlebars</li>
              <li>Puppeteer (PDF)</li>
            </ul>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Datos y archivos
            </h3>
            <ul className="mt-3 space-y-1.5 text-sm text-zinc-700">
              <li>PostgreSQL</li>
              <li>Prisma ORM</li>
              <li>Almacenamiento local / MinIO (S3)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Calidad ISO 25010 */}
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-6 md:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
          Estándares de calidad (ISO/IEC 25010)
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-zinc-900">Seguridad</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Contraseñas con BCrypt, HTTPS, sesión con expiración (30 min).
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-zinc-900">Rendimiento</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Tiempo de respuesta menor a 2 segundos.
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <h3 className="font-semibold text-zinc-900">Trazabilidad</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Registro de auditoría: usuario, acción, fecha y módulo afectado.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="rounded-3xl bg-zinc-900 px-8 py-12 text-center text-white">
        <h2 className="text-2xl font-bold tracking-tight">
          ¿Listo para gestionar prácticas con trazabilidad total?
        </h2>
        <p className="mt-3 text-zinc-400">
          Accede con tu cuenta institucional.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          Iniciar sesión
        </Link>
      </section>
    </div>
  );
}

function Step({
  label,
  highlight,
}: {
  label: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium ${
        highlight
          ? "bg-emerald-600 text-white"
          : "bg-white text-zinc-700 shadow-sm border border-emerald-100"
      }`}
    >
      {label}
    </span>
  );
}

function Arrow() {
  return (
    <span className="hidden text-emerald-300 sm:inline" aria-hidden>
      →
    </span>
  );
}

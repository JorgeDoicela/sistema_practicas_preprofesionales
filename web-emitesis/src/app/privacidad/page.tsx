import type { Metadata } from "next";
import Link from "next/link";
import {
  getDataProtectionContactEmail,
  INSTITUTE_LEGAL_NAME,
} from "@/lib/privacy";

export const metadata: Metadata = {
  title: "Aviso de privacidad — Emitesis",
  description:
    "Información sobre el tratamiento de datos personales en la plataforma Emitesis (LOPDP Ecuador).",
};

export default function PrivacidadPage() {
  const contactEmail = getDataProtectionContactEmail();

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-20 px-6">
      <article className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 md:p-12 text-slate-700">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-blue mb-2">
          Emitesis · Prácticas preprofesionales
        </p>
        <h1 className="text-2xl md:text-3xl font-black text-brand-blue tracking-tight mb-6">
          Aviso de privacidad y tratamiento de datos personales
        </h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-10">
          Este texto resume de forma clara cómo tratamos los datos personales en
          este sistema, en línea con la{" "}
          <strong className="text-slate-700">
            Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP)
          </strong>{" "}
          y buenas prácticas para un instituto privado de Quito.{" "}
          <em>
            Es orientativo: el instituto debe validarlo con asesoría legal
            interna.
          </em>
        </p>

        <section className="space-y-4 mb-10">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            1. Responsable del tratamiento
          </h2>
          <p className="text-sm leading-relaxed">
            El responsable es <strong>{INSTITUTE_LEGAL_NAME}</strong>, quien
            determina las finalidades y medios del uso de la plataforma Emitesis
            en el marco de la formación y la vinculación con la sociedad.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            2. Finalidad del tratamiento
          </h2>
          <ul className="text-sm leading-relaxed list-disc pl-5 space-y-2">
            <li>Gestionar prácticas preprofesionales y pasantías.</li>
            <li>
              Administrar usuarios (estudiantes, tutores, coordinación,
              empresas) y documentación asociada.
            </li>
            <li>
              Registrar asistencia, evaluaciones y certificación cuando aplique.
            </li>
            <li>
              Comunicaciones operativas (por ejemplo recuperación de acceso,
              notificaciones del proceso).
            </li>
            <li>
              Seguridad del sistema (por ejemplo registros técnicos de acceso,
              sin incluir contraseñas).
            </li>
          </ul>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            3. Categorías de datos
          </h2>
          <p className="text-sm leading-relaxed">
            Datos identificativos y de contacto (nombre, correo, rol),
            datos académicos y de prácticas, datos de empresa (RUC, razón
            social, representante), ubicación cuando se registra asistencia,
            documentos que carguen los usuarios según el flujo del sistema, y
            datos técnicos mínimos (IP, fecha/hora en registros de actividad).
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            4. Base legal (enfoque práctico)
          </h2>
          <p className="text-sm leading-relaxed">
            La ejecución del vínculo educativo o de cooperación con la entidad
            receptora, el consentimiento cuando se solicite de forma expresa
            (por ejemplo en altas públicas), y el interés legítimo o cumplimiento
            de obligaciones cuando corresponda, según el caso concreto que
            documente el instituto.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            5. Conservación
          </h2>
          <p className="text-sm leading-relaxed">
            Los datos se conservan el tiempo necesario para las finalidades
            indicadas y los plazos legales o académicos que aplique el ISTPET.
            Pasado ese plazo pueden suprimirse o anonimizarse según política
            interna del instituto.
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            6. Derechos de las personas titulares
          </h2>
          <p className="text-sm leading-relaxed">
            Puede solicitar información sobre sus datos, su rectificación,
            actualización o supresión cuando proceda, y el ejercicio de otros
            derechos reconocidos en la normativa vigente, escribiendo a:
          </p>
          <p className="text-sm">
            <a
              href={`mailto:${contactEmail}`}
              className="font-bold text-brand-blue underline underline-offset-2"
            >
              {contactEmail}
            </a>
          </p>
        </section>

        <section className="space-y-4 mb-10">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            7. Seguridad y encargados
          </h2>
          <p className="text-sm leading-relaxed">
            Se aplican medidas técnicas y organizativas razonables (control de
            accesos por roles, comunicación cifrada cuando el sitio usa HTTPS,
            almacenamiento seguro de contraseñas, etc.). Si el instituto contrata
            servicios de terceros (correo, almacenamiento, nube), estos actúan
            como encargados cuando corresponda y deben regularse por contrato
            o anexos de tratamiento de datos.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-sm font-black text-brand-blue uppercase tracking-widest">
            8. Cookies y almacenamiento local
          </h2>
          <p className="text-sm leading-relaxed">
            El acceso autenticado puede usar almacenamiento local del navegador
            (por ejemplo para mantener la sesión). Las herramientas de terceros
            que use el sitio (como reCAPTCHA) tienen sus propias políticas; el
            instituto debe informarlo si lo exige la normativa aplicable.
          </p>
        </section>

        <p className="text-xs text-slate-400 border-t border-slate-100 pt-8 leading-relaxed">
          Última actualización orientativa: abril de 2026. Para volver al inicio:{" "}
          <Link href="/" className="text-brand-blue font-bold hover:underline">
            Inicio
          </Link>{" "}
          ·{" "}
          <Link
            href="/login"
            className="text-brand-blue font-bold hover:underline"
          >
            Acceso
          </Link>
        </p>
      </article>
    </div>
  );
}

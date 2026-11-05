import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  HeartHandshake,
  Facebook,
  Instagram,
  Sparkles,
  MapPin,
  Calendar,
  Quote,
  ShieldCheck,
  Users,
  ShoppingBag,
  Megaphone,
  ArrowRight,
  Sun,
  Compass,
  CheckCircle2,
  Award,
  Stethoscope,
  Smile,
  Eye,
  Target,
} from "lucide-react";
import { SITE } from "@/config/site";
import SpecialCasesSection from "@/components/SpecialCasesSection";
import FoundingFamily from "@/components/FoundingFamily";
import AboutHeroVisual from "@/components/AboutHeroVisual";

export const metadata: Metadata = {
  title: "Conócenos | DOG rescue Guatemala - Un propósito que nació del corazón",
  description:
    "Conoce la historia, misión y la familia fundadora de DOG rescue Guatemala. Desde Amatitlán para toda Guatemala, rescatando perritos y transformando vidas.",
};

const METRICS = [
  {
    number: "2020",
    label: "Año de fundación",
    detail: "Nacidos en Amatitlán en plena pandemia",
  },
  {
    number: "88K+",
    label: "Comunidad solidaria",
    detail: "Seguidores unidos en redes sociales",
  },
  {
    number: "100%",
    label: "Compromiso familiar",
    detail: "Vocación independiente sin fines de lucro",
  },
  {
    number: "Guatemala",
    label: "Alcance nacional",
    detail: "Rescates en diversos municipios del país",
  },
];

const VALUES = [
  {
    icon: Target,
    title: "Nuestra Misión",
    description:
      "Rescatar, rehabilitar y dignificar a los perritos en situación de abandono, maltrato o riesgo en Amatitlán y Guatemala, garantizándoles atención médica integral, esterilización y un hogar amoroso y responsable.",
    badge: "Propósito",
    color: "from-sky-500/10 to-sky-600/5 text-sky-700 border-sky-200",
  },
  {
    icon: Eye,
    title: "Nuestra Visión",
    description:
      "Construir un país donde no exista la indiferencia ni el sufrimiento animal en las calles; un modelo de comunidad consciente, compasiva y solidaria donde cada vida sea respetada como creación divina.",
    badge: "Futuro",
    color: "from-amber-500/10 to-amber-600/5 text-amber-700 border-amber-200",
  },
  {
    icon: ShieldCheck,
    title: "Nuestros Valores",
    description:
      "Amor inquebrantable, lealtad a la causa animal, transparencia en cada proceso, devoción en el cuidado diario y servicio desinteresado por quienes no tienen voz para pedir auxilio.",
    badge: "Principios",
    color: "from-emerald-500/10 to-emerald-600/5 text-emerald-700 border-emerald-200",
  },
];

const PILLARS_OF_WORK = [
  {
    icon: Heart,
    title: "Rescate y Primeros Auxilios",
    text: "Atención inmediata a casos de perritos atropellados, desnutridos o en situación de calle extrema.",
  },
  {
    icon: Stethoscope,
    title: "Rehabilitación Médica Integral",
    text: "Vacunación, desparasitación, cirugías reconstructivas y tratamiento veterinario certificado.",
  },
  {
    icon: ShieldCheck,
    title: "Esterilización Comunitaria",
    text: "Frenamos la sobrepoblación y el abandono futuro garantizando la esterilización de cada rescatado.",
  },
  {
    icon: Smile,
    title: "Adopción Responsable",
    text: "Evaluación minuciosa de hogares y seguimiento para asegurar que nunca más vuelvan a sufrir abandono.",
  },
];

export default function ConocenosPage() {
  return (
    <div className="bg-slate-50/60 pb-24">
      {/* 1. HERO SECTION: DISEÑO EDITORIAL DE ALTO IMPACTO */}
      <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white pt-24 pb-36 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Glows y patrones de fondo */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Columna de texto */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 text-xs sm:text-sm font-semibold px-4 py-2 rounded-full shadow-sm">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Nuestra Historia • DOG rescue Guatemala</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                Un propósito que nació{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-300 to-amber-300">
                  del corazón
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-light max-w-2xl mx-auto lg:mx-0">
                Somos una familia de Amatitlán unida por el amor, la lealtad y la misión inquebrantable de rescatar, sanar y transformar la vida de los perritos en Guatemala.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-7 py-3.5 rounded-2xl shadow-lg shadow-sky-500/20 transition transform hover:-translate-y-0.5 text-sm"
                >
                  <Heart className="w-4 h-4 fill-slate-950" />
                  <span>Ver perritos en adopción</span>
                </Link>

                <a
                  href="#historia"
                  className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-6 py-3.5 rounded-2xl border border-white/15 transition text-sm backdrop-blur-sm"
                >
                  <span>Leer nuestra historia</span>
                  <ArrowRight className="w-4 h-4 text-sky-300" />
                </a>
              </div>

              {/* Badges de confianza */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Iniciativa 100% independiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Sede en Amatitlán, Guatemala</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400" />
                  <span>Expedientes médicos transparentes</span>
                </div>
              </div>
            </div>

            {/* Columna visual / Imagen representativa editable desde /admin */}
            <div className="lg:col-span-5">
              <AboutHeroVisual />
            </div>
          </div>
        </div>
      </section>

      {/* 2. BARRA DE MÉTRICAS / IMPACTO */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          {METRICS.map((m, i) => (
            <div key={i} className={`text-center ${i > 0 ? "pt-4 lg:pt-0" : ""}`}>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {m.number}
              </p>
              <p className="text-sm font-bold text-sky-600 mt-1">{m.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{m.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. HISTORIA PRINCIPAL (CARTA DE LA FUNDADORA) */}
      <section id="historia" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Tarjeta lateral con cita y datos */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-sky-950 text-white rounded-3xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30 mb-6">
                <Quote className="w-6 h-6" />
              </div>

              <blockquote className="text-lg font-medium leading-relaxed italic text-sky-100/95">
                “Nacer un 4 de octubre no es una casualidad. Su nobleza me ha impulsado a alzar la voz contra la injusticia, el abandono y la indiferencia.”
              </blockquote>

              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="font-bold text-white text-base">Fundadora del Refugio</p>
                <p className="text-xs text-sky-300 mt-0.5">DOG rescue Guatemala • Amatitlán</p>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Amatitlán, Guatemala</span>
                </div>
              </div>
            </div>

            {/* Mini tarjeta de identidad */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
                  4 Oct
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">San Francisco de Asís</h4>
                  <p className="text-xs text-slate-500">Día Mundial de los Animales</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Una fecha que inspira toda nuestra labor: la devoción y el compromiso de cuidar la creación de Dios.
              </p>
            </div>
          </div>

          {/* Cuerpo de la historia */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-100">
              <Heart className="w-3.5 h-3.5 fill-sky-500 text-sky-500" />
              <span>Nuestra Historia</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
              Un propósito que nació del corazón
            </h2>

            <div className="prose prose-slate max-w-none text-slate-700 space-y-5 leading-relaxed text-base sm:text-lg">
              <p className="text-xl sm:text-2xl font-serif text-slate-900 font-semibold leading-relaxed border-l-4 border-sky-500 pl-5 italic">
                “Nacer un 4 de octubre no es una casualidad. Durante toda mi vida he sentido un profundo amor por los animales, especialmente por los perros...”
              </p>

              <p>
                Seres de corazón noble, lealtad inquebrantable y una pureza capaz de perdonar incluso aquello que jamás debieron sufrir. Su nobleza me ha impulsado a alzar la voz contra la injusticia, el abandono y la indiferencia de la sociedad.
              </p>

              <p>
                Ese amor lo sembré en mis hijos, quienes hoy caminan a mi lado, compartiendo este compromiso y haciendo crecer nuestra familia animalista.
              </p>

              {/* Destacados en recuadros modernos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 not-prose">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-50 to-white border border-sky-200/80">
                  <span className="text-xs font-bold text-sky-700 uppercase tracking-wider block mb-1">
                    Amatitlán • 2020
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    En 2020, en medio de la pandemia, nació <strong>DOG rescue Guatemala</strong>, inicialmente como una plataforma en Facebook para crear conciencia sobre el abandono de perros en las calles, especialmente en nuestro querido Amatitlán.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80">
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block mb-1">
                    Compromiso Nacional
                  </span>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    Lo que comenzó como un proyecto familiar se ha convertido en un <strong>compromiso nacional</strong>, con rescates en diferentes lugares de Guatemala y una misión que continúa creciendo cada día.
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 text-white mt-6 not-prose flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 mt-1">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base sm:text-lg font-semibold text-slate-100 leading-relaxed">
                    Hoy te invitamos a conocer nuestra historia, una historia de amor, servicio y esperanza, con la convicción de que llegaremos mucho más lejos, salvando vidas y honrando el cuidado de la creación de Dios.
                  </p>
                  <p className="text-xs font-bold text-amber-300 mt-2 uppercase tracking-wider">
                    Familia Fundadora • DOG rescue Guatemala
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FoundingFamily />

      {/* 4. MISIÓN, VISIÓN Y VALORES (INSTITUCIONAL PROFESIONAL) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-sky-600 tracking-wider uppercase bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200">
            Marco Institucional
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            Nuestros fundamentos
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            La brújula moral y operativa que guía cada uno de nuestros rescates y decisiones en el refugio.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <div
                key={i}
                className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${v.color} border group-hover:scale-110 transition-transform`}>
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                      {v.badge}
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-3">{v.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{v.description}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Principio activo de DOG rescue</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CÓMO TRABAJAMOS (PILARES OPERATIVOS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950 text-white rounded-3xl p-8 sm:p-14 shadow-2xl border border-slate-800">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold text-sky-400 tracking-wider uppercase bg-sky-950 px-3 py-1 rounded-full border border-sky-800">
              Protocolo Integral
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">
              ¿Cómo transformamos una vida rescatada?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed font-light">
              Detrás de cada adopción exitosa existe un proceso integral de atención médica, recuperación emocional y evaluación que garantiza la dignidad del animal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS_OF_WORK.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30 mb-4 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{p.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-light">
                    {p.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. CASOS ESPECIALES DE IMPACTO REAL */}
      <SpecialCasesSection />

      {/* 8. COMUNIDAD Y REDES SOCIALES */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="bg-gradient-to-br from-white to-sky-50/50 border border-sky-200/80 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-md relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center mx-auto shadow-md">
            <HeartHandshake className="w-7 h-7" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-3xl font-black text-slate-900">
              Sé parte de nuestra familia animalista
            </h2>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-light">
              Compartir una publicación o educar contra el abandono también salva vidas. En nuestra página de Facebook compartimos cada día el proceso de recuperación de cada huellita.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href={SITE.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold px-7 py-3.5 rounded-2xl text-sm transition shadow-md hover:-translate-y-0.5"
            >
              <Facebook className="w-4 h-4" /> Seguir en Facebook ({SITE.followers})
            </a>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold px-7 py-3.5 rounded-2xl text-sm transition shadow-xs hover:-translate-y-0.5"
            >
              <Instagram className="w-4 h-4 text-rose-500" /> Síguenos en Instagram
            </a>
          </div>
        </div>
      </section>

      {/* 9. LLAMADO A LA ACCIÓN: CÓMO APOYAR */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-24">
        <div className="text-center mb-10">
          <span className="text-xs font-bold text-sky-600 tracking-wider uppercase bg-sky-50 px-3.5 py-1.5 rounded-full border border-sky-200">
            Formas de Ayudar
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-3">
            Únete a nuestra misión hoy
          </h2>
          <p className="text-slate-600 text-sm mt-1 max-w-xl mx-auto">
            Cada aporte, cada compra solidaria y cada voluntario hace posible que sigamos salvando vidas en Guatemala.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/catalogo"
            className="group bg-white rounded-3xl border border-slate-200/90 p-8 hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 border border-rose-200 group-hover:scale-105 transition-transform">
                <Heart className="w-7 h-7 fill-rose-500" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Adopción Responsable</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                Nuestros perritos se entregan vacunados, desparasitados y con compromiso de esterilización. Abre tu hogar.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-rose-600">
              <span>Explorar catálogo digital</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/tienda"
            className="group bg-white rounded-3xl border border-slate-200/90 p-8 hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 border border-sky-200 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Tienda Solidaria</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                Camisas oficiales, tazas y accesorios para amantes de los animales. El 100% de ganancias va a alimento y medicina.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-sky-600">
              <span>Ver productos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            href="/#voluntariado"
            className="group bg-white rounded-3xl border border-slate-200/90 p-8 hover:shadow-xl hover:border-sky-300 transition-all duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 border border-amber-200 group-hover:scale-105 transition-transform">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">Voluntariado en Amatitlán</h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                Suma tus manos los fines de semana en paseos, baños, rescates o difusión en redes sociales.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-amber-600">
              <span>Postularme como voluntario</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
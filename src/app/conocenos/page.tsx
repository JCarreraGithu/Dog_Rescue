import type { Metadata } from "next";
import Link from "next/link";
import { Facebook, Heart, HeartHandshake, Instagram, Users, ShoppingBag, Calendar, Megaphone } from "lucide-react";
import { SITE } from "@/config/site";
import { IMPACT_CASES } from "@/data/impact-cases";

export const metadata: Metadata = {
  title: "Conócenos | DOG Rescue Guatemala",
  description: "La historia de la familia detrás de DOG Rescue Guatemala: rescatando perritos desde 2014.",
};

// TODO: completar con los datos reales que entregue el refugio (nombres, fotos).
// photo: ruta en /public (ej. "/equipo/fundadora.jpg"). Si se deja vacío se muestra un ícono.
const FAMILY = [
  { name: "Nombre por definir", role: "Fundadora y directora del refugio", photo: "" },
  { name: "Nombre por definir", role: "Familia y equipo de rescate", photo: "" },
  { name: "Nombre por definir", role: "Familia y equipo de rescate", photo: "" },
];

const TIMELINE = [
  {
    year: String(SITE.rescueSince),
    title: "Empieza el rescate",
    text: "Una familia de Guatemala comienza a rescatar perritos abandonados en la calle: los curan y les buscan un hogar digno.",
  },
  {
    year: String(SITE.socialSince),
    title: "Nace el movimiento en redes",
    text: "Con la pandemia, la familia empieza a compartir sus rescates en redes sociales y en su página. La comunidad responde y el movimiento crece.",
  },
  {
    year: "Hoy",
    title: `${SITE.followers} personas nos acompañan`,
    text: "Seguimos rescatando, curando y buscando hogar a perritos que lo necesitan, gracias a quienes comparten, adoptan y ayudan.",
  },
];

export default function ConocenosPage() {
  return (
    <div className="pb-16">
      {/* Banner */}
      <section className="relative bg-gradient-to-b from-sky-900 via-sky-800 to-sky-900 text-white pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 bg-sky-700/60 border border-sky-500/30 text-sky-200 text-xs font-semibold px-3.5 py-1.5 rounded-full">
            <Users className="w-4 h-4" />
            <span>Conócenos</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Una familia que rescata <span className="text-sky-400">con el corazón</span>
          </h1>
          <p className="text-lg text-sky-100/90 leading-relaxed max-w-2xl mx-auto">
            Desde {SITE.rescueSince}, una madre y sus dos hijos dedican su vida a los perritos abandonados de Guatemala.
          </p>
        </div>
      </section>

      {/* Historia */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-20">
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-8">Nuestra historia</h2>
          <ol className="relative border-l-2 border-sky-200 ml-3 space-y-8">
            {TIMELINE.map((item) => (
              <li key={item.year} className="pl-6 relative">
                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-sky-500 border-2 border-white" />
                <span className="text-xs font-black text-sky-600 uppercase tracking-wider">{item.year}</span>
                <h3 className="text-lg font-bold text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-1">{item.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* La familia */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-sky-600 tracking-wider uppercase">Quiénes somos</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">La familia detrás del refugio</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto mt-1">
            El refugio lo dirige una señora junto a sus dos hijos. Todo lo hacen en familia.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {FAMILY.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
              <div className="w-24 h-24 rounded-full bg-sky-100 mx-auto mb-4 overflow-hidden flex items-center justify-center">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <Heart className="w-10 h-10 text-sky-400" />
                )}
              </div>
              <h3 className="font-bold text-slate-800">{m.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Casos de impacto */}
      {IMPACT_CASES.length > 0 && (
        <section id="casos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 scroll-mt-24">
          <div className="text-center mb-8">
            <span className="text-xs font-bold text-sky-600 tracking-wider uppercase">Historias que nos inspiran</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">Casos de impacto</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {IMPACT_CASES.map((c) => (
              <article key={c.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="h-56 bg-slate-100">
                  {c.video ? (
                    <video src={c.video} poster={c.image} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                  ) : (
                    <img src={c.image} alt={c.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-800 leading-snug">
                    {c.name ? `${c.name}: ` : ""}
                    {c.title}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{c.story}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Redes */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-sky-50 border border-sky-100 rounded-3xl p-8 text-center space-y-4">
          <h2 className="text-2xl font-extrabold text-slate-900">Síguenos y comparte</h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Compartir un rescate también salva vidas. Ahí publicamos cada caso, cada recuperación y cada perrito que
            busca hogar.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={SITE.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              <Facebook className="w-4 h-4" /> Facebook ({SITE.followers} seguidores)
            </a>
            <a
              href={SITE.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white hover:bg-sky-100 text-sky-700 border border-sky-200 font-semibold px-5 py-2.5 rounded-xl text-sm transition"
            >
              <Instagram className="w-4 h-4" /> Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Cómo ayudar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-slate-900 flex items-center justify-center gap-2">
            <HeartHandshake className="w-7 h-7 text-sky-500" /> Cómo puedes ayudar
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/tienda" className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-sky-300 transition">
            <ShoppingBag className="w-8 h-8 text-sky-500 mb-3" />
            <h3 className="font-bold text-slate-800">Ayúdanos comprando</h3>
            <p className="text-sm text-slate-600 mt-1">Camisas, tazas y más. Todo lo recaudado es para el refugio.</p>
          </Link>
          <Link href="/#voluntariado" className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-sky-300 transition">
            <Calendar className="w-8 h-8 text-sky-500 mb-3" />
            <h3 className="font-bold text-slate-800">Sé voluntario</h3>
            <p className="text-sm text-slate-600 mt-1">Únete a las jornadas de sábado y ayuda con los perritos.</p>
          </Link>
          <Link href="/#reportar-caso" className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-sky-300 transition">
            <Megaphone className="w-8 h-8 text-sky-500 mb-3" />
            <h3 className="font-bold text-slate-800">Reporta un caso</h3>
            <p className="text-sm text-slate-600 mt-1">¿Viste un perrito herido o abandonado? Avísanos.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

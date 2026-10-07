import Link from "next/link";
import { Dog, MapPin, Heart, Phone, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Col 1 */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                <Dog className="w-6 h-6" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                Refugio DOG Rescue <span className="text-emerald-400">Guatemala</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Iniciativa comunitaria e independiente dedicada al rescate, rehabilitación y fomento de la adopción responsable de perros en Amatitlán y Guatemala.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 className="font-semibold text-white mb-4">Ubicación y Contacto</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <span>9a calle 7-27, Municipio de Amatitlán, Guatemala</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>+502 5555-DOGS (3647)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>contacto@dogrescueguatemala.org</span>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div>
            <h4 className="font-semibold text-white mb-4">Acciones Rápidas</h4>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/catalogo" className="hover:text-emerald-400 transition">
                • Catálogo Digital de Adopciones
              </Link>
              <Link href="/#voluntariado" className="hover:text-emerald-400 transition">
                • Inscripción a Jornadas de Sábados
              </Link>
              <Link href="/#reportar-caso" className="hover:text-emerald-400 transition">
                • Reportar Caso de Abandono o Riesgo
              </Link>
              <Link href="/conocenos" className="hover:text-emerald-400 transition">
                • Conoce nuestra historia
              </Link>
              <Link href="/tienda" className="hover:text-emerald-400 transition">
                • Ayúdanos comprando
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Refugio DOG Rescue Guatemala (Amatitlán). Organización Comunitaria Sin Fines de Lucro.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> para los huellitas de Guatemala.
          </p>
        </div>
      </div>
    </footer>
  );
}

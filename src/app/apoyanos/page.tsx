"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Package, Wallet, ShoppingBag, HandHeart, ArrowRight, AlertCircle } from "lucide-react";

type Item = { id: string; name: string; category: string; quantity: number; minThreshold: number };
type Priority = "alta" | "media" | "cubierta" | "sin datos";
function priority(item: Item): Priority {
  if (!Number.isFinite(item.quantity) || !Number.isFinite(item.minThreshold) || item.minThreshold <= 0) return "sin datos";
  const ratio = item.quantity / item.minThreshold;
  return ratio < 0.5 ? "alta" : ratio < 1 ? "media" : "cubierta";
}
const rank: Record<Priority, number> = { alta: 0, media: 1, cubierta: 2, "sin datos": 3 };
const colors: Record<Priority, string> = { alta: "bg-rose-500", media: "bg-amber-400", cubierta: "bg-emerald-500", "sin datos": "bg-slate-300" };
const labels: Record<Priority, string> = { alta: "Se necesita con urgencia", media: "Se necesita reponer", cubierta: "Necesidad cubierta por ahora", "sin datos": "Pendiente de actualización" };

// Explicaciones públicas de uso. Se pueden ampliar al agregar nuevos insumos.
function donationPurpose(item: Item): string {
  const name = item.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const category = item.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (name.includes("nexgard")) return "Ayuda a proteger a los perros frente a determinados parásitos internos y externos, según indicación veterinaria.";
  if (name.includes("doxiciclina")) return "Antibiótico para tratamientos específicos de perros enfermos, exclusivamente bajo prescripción veterinaria.";
  if (name.includes("cachorro") && (name.includes("alimento") || name.includes("concentrado"))) return "Alimentación adecuada para cachorros en crecimiento y desarrollo.";
  if ((name.includes("adulto") || name.includes("perro adulto")) && (name.includes("alimento") || name.includes("concentrado"))) return "Alimento diario para mantener nutridos a los perros adultos del refugio.";
  if (name.includes("amonio cuaternario")) return "Se utiliza para desinfectar áreas del refugio según la etiqueta, evitando el contacto de los animales durante su aplicación.";
  if (name.includes("detergente")) return "Se utiliza para lavar y retirar suciedad de utensilios y superficies del refugio.";
  if (name.includes("vinagre")) return "Se utiliza en algunas tareas de limpieza y control de olores. No sustituye a un desinfectante adecuado.";
  if (category.includes("concentrado") || category.includes("alimento")) return "Contribuye a la alimentación diaria de los perros rescatados.";
  if (category.includes("limpieza")) return "Apoya las labores de limpieza e higiene de los espacios del refugio, siguiendo las instrucciones del producto.";
  if (category.includes("medicamento")) return "Se destina a la atención veterinaria de los perros, solo cuando el profesional responsable lo indique.";
  return "Insumo solicitado para apoyar las actividades de cuidado y mantenimiento del refugio. Consulta su uso específico con el equipo.";
}

export default function ApoyanosPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  useEffect(() => {
    fetch("/api/inventory")
      .then(async (res) => { if (!res.ok) throw new Error("Inventario no disponible"); return res.json(); })
      .then((data) => { if (!Array.isArray(data)) throw new Error("Formato inválido"); setItems(data); setStatus("ok"); })
      .catch(() => setStatus("error"));
  }, []);
  const ordered = [...items].sort((a, b) => rank[priority(a)] - rank[priority(b)] || a.name.localeCompare(b.name));
  return (
    <div className="bg-slate-50 pb-20">
      <section className="bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white px-5 py-16 sm:py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <Heart className="mx-auto w-12 h-12 text-emerald-300 mb-4" />
          <h1 className="text-4xl sm:text-5xl font-black mb-5">Tu ayuda cambia vidas</h1>
          <p className="text-lg text-emerald-100 leading-relaxed">DOG Rescue Guatemala es un refugio independiente y sin fines de lucro, enfocado en el cuidado, bienestar y protección de los animales. Cada aporte, grande o pequeño, nos ayuda a seguir adelante.</p>
        </div>
      </section>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 mt-10">
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-9" aria-labelledby="especie">
          <div className="flex items-start gap-3 mb-4"><Package className="text-emerald-600 w-8 h-8 shrink-0" /><div><h2 id="especie" className="text-2xl font-extrabold">Donaciones en especie</h2><p className="text-slate-600 mt-2">Los alimentos, artículos de limpieza y otros insumos son esenciales para cuidar a nuestros perritos.</p></div></div>
          <p className="rounded-xl bg-emerald-50 text-emerald-900 p-4 mb-6">Si puedes apoyarnos con alguno de los productos y marcas que nos recomiende el refugio, ¡sería excelente! Y si no, agradecemos de corazón cualquier donación útil y en buen estado. Consulta antes de llevar medicamentos o productos especiales.</p>
          <h3 className="font-bold text-lg mb-2">¿Qué se necesita más?</h3>
          <p className="text-sm text-slate-500 mb-5">Estos indicadores reflejan la prioridad relativa según el inventario registrado; no muestran cantidades ni porcentajes de existencias. La información depende de que el equipo mantenga actualizado su inventario.</p>
          {status === "loading" && <p className="text-slate-500">Consultando necesidades del refugio…</p>}
          {status === "error" && <p className="text-slate-600 flex gap-2"><AlertCircle className="w-5 h-5 shrink-0" /> No se pudo consultar el inventario. Consulta directamente con el refugio cuáles son sus necesidades actuales.</p>}
          {status === "ok" && ordered.length === 0 && <p className="text-slate-600">Pronto publicaremos los productos más necesarios. Mientras tanto, puedes consultar al refugio qué artículos hacen falta.</p>}
          {status === "ok" && ordered.length > 0 && <div className="grid sm:grid-cols-2 gap-4">{ordered.map((item) => { const level = priority(item); return <div key={item.id} className="rounded-2xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{item.name}</p><p className="text-xs text-slate-500 mt-1">{item.category}</p><p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-sm">{donationPurpose(item)}</p></div><span className="text-xs text-slate-500 text-right">{labels[level]}</span></div><div className="mt-4 flex gap-1.5" role="img" aria-label={`Prioridad: ${labels[level]}`}>{[0,1,2,3,4].map((i) => <span key={i} className={`h-2 flex-1 rounded-full ${level === "alta" ? (i < 1 ? colors[level] : "bg-slate-100") : level === "media" ? (i < 3 ? colors[level] : "bg-slate-100") : level === "cubierta" ? colors[level] : "bg-slate-200"}`} />)}</div></div>; })}</div>}
          <p className="text-sm text-slate-500 mt-6">Las barras son categorías visuales de prioridad, no una representación del inventario exacto.</p>
        </section>
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-9">
          <div className="flex items-center gap-3 mb-4"><Wallet className="w-8 h-8 text-emerald-600" /><h2 className="text-2xl font-extrabold">Donaciones económicas</h2></div>
          <p className="text-slate-600 mb-5">También puedes apoyar la alimentación, atención veterinaria y mantenimiento del refugio mediante PayPal.</p>
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 sm:p-6">
            <h3 className="font-bold text-slate-900 text-lg">Donar a DOG Rescue Guatemala</h3>
            <p className="text-sm text-slate-600 mt-2 mb-5">Realiza tu aporte a través de nuestro enlace de PayPal.</p>
            <a href="https://www.paypal.com/paypalme/goodshopDogRescue" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 font-bold transition">
              <Heart className="w-4 h-4" /> Donar con PayPal <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
        <section className="bg-emerald-50 rounded-3xl border border-emerald-200 p-6 sm:p-9"><div className="flex items-center gap-3 mb-3"><ShoppingBag className="w-8 h-8 text-emerald-700" /><h2 className="text-2xl font-extrabold">O apóyanos comprando</h2></div><p className="text-slate-700 mb-5">Explora los productos disponibles en nuestra tienda y colabora con la labor del refugio.</p><Link href="/tienda" className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3 rounded-xl font-bold">Visitar la tienda <ArrowRight className="w-4 h-4" /></Link></section>
        <section className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-9"><div className="flex items-center gap-3 mb-3"><HandHeart className="w-8 h-8 text-rose-500" /><h2 className="text-2xl font-extrabold">También puedes regalar tu tiempo</h2></div><p className="text-slate-600 mb-5">Si no puedes donar o comprar, tu tiempo y cariño también son muy valiosos. Como voluntario puedes colaborar en actividades como:</p><ul className="grid sm:grid-cols-2 gap-3 mb-7 text-slate-700">{["Bañar y cepillar a los perritos", "Limpiar y ordenar el refugio", "Pasear y socializar a los perritos", "Apoyar con alimentación y agua", "Ayudar a organizar donaciones", "Participar en jornadas y actividades"].map((task) => <li key={task} className="bg-slate-50 rounded-xl px-4 py-3">🐾 {task}</li>)}</ul><p className="text-sm text-slate-500 mb-5">Las tareas se coordinan con el equipo del refugio según sus necesidades y medidas de seguridad.</p><Link href="/#voluntariado" className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold">Quiero ser voluntario <ArrowRight className="w-4 h-4" /></Link></section>
      </div>
    </div>
  );
}

const refugeAddress = "9a calle 7-27, Amatitlán, Guatemala";
const mapQuery = encodeURIComponent(refugeAddress);

export default function RefugeMap() {
  return (
    <section id="ubicacion" aria-labelledby="ubicacion-titulo" className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="mb-7 text-center">
        <h2 id="ubicacion-titulo" className="text-3xl font-extrabold text-slate-900">¿Dónde estamos ubicados?</h2>
        <p className="mt-3 text-slate-600">Encuéntranos en Amatitlán, Guatemala.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
        <iframe
          title="Mapa de ubicación del refugio DOG Rescue Guatemala"
          src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
          width="100%"
          height="390"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="block w-full border-0"
          allowFullScreen
        />
        <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
          <div>
            <p className="font-bold text-slate-900">Refugio DOG Rescue Guatemala</p>
            <p className="text-sm text-slate-600">{refugeAddress}</p>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-xl bg-sky-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-sky-600"
          >
            Cómo llegar ↗
          </a>
        </div>
      </div>
    </section>
  );
}

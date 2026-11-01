"use client";

import { useEffect, useState } from "react";
import { Award, Heart } from "lucide-react";

type AboutHeroProps = {
  initialImage?: string;
  initialBadgeText?: string;
  initialCaptionTitle?: string;
  initialCaptionSubtitle?: string;
};

export default function AboutHeroVisual({
  initialImage = "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000",
  initialBadgeText = "Amor animalista desde 2020",
  initialCaptionTitle = "DOG Rescue Guatemala",
  initialCaptionSubtitle = "Salvando vidas con amor y dignidad",
}: AboutHeroProps) {
  const [heroImage, setHeroImage] = useState(initialImage);
  const [badgeText, setBadgeText] = useState(initialBadgeText);
  const [captionTitle, setCaptionTitle] = useState(initialCaptionTitle);
  const [captionSubtitle, setCaptionSubtitle] = useState(initialCaptionSubtitle);

  useEffect(() => {
    fetch("/api/about-settings")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === "object") {
          if (data.heroImage) setHeroImage(data.heroImage);
          if (data.heroBadgeText) setBadgeText(data.heroBadgeText);
          if (data.heroCaptionTitle) setCaptionTitle(data.heroCaptionTitle);
          if (data.heroCaptionSubtitle)
            setCaptionSubtitle(data.heroCaptionSubtitle);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative mx-auto max-w-md lg:max-w-none">
      {/* Marco de fotografía */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl bg-slate-800 aspect-[4/3] sm:aspect-[1/1]">
        <img
          src={heroImage}
          alt={captionTitle}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

        {/* Tarjeta flotante sobre la foto */}
        <div className="absolute bottom-5 left-5 right-5 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/15 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-sky-400 font-bold">
              {captionTitle}
            </p>
            <p className="text-sm font-semibold text-white mt-0.5">
              {captionSubtitle}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-400/30 shrink-0">
            <Heart className="w-5 h-5 fill-sky-400" />
          </div>
        </div>
      </div>

      {/* Badge flotante lateral */}
      <div className="hidden sm:flex absolute -top-4 -right-4 bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 font-black text-xs px-4 py-2 rounded-2xl shadow-xl items-center gap-2 border-2 border-slate-950">
        <Award className="w-4 h-4" />
        <span>{badgeText}</span>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { ABOUT_STATIC_UPLOADS } from "@/lib/about-content";
export default function AboutPhoto({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  const missing = !src || (src.startsWith("/uploads/") && !ABOUT_STATIC_UPLOADS.includes(src));
  return missing || failed ? <div role="img" aria-label={alt + " — fotografía pendiente"} className={"flex items-center justify-center bg-slate-200 text-slate-500 text-xs p-4 text-center " + className}>Fotografía pendiente</div> : <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}

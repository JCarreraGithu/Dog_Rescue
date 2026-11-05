"use client";
import { useEffect, useState } from "react";
import { DEFAULT_FAMILY, type Founder } from "@/lib/about-content";
import AboutPhoto from "@/components/AboutPhoto";
export default function FoundingFamily() {
  const [members, setMembers] = useState<Founder[]>(DEFAULT_FAMILY);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/about-settings", { cache: "no-store", signal: controller.signal }).then(res => { if (!res.ok) throw Error(); return res.json(); }).then(data => { if (Array.isArray(data.family) && data.family.length === 3) setMembers(data.family); }).catch(() => {});
    return () => controller.abort();
  }, []);
  return <section aria-labelledby="founding-family-title" className="max-w-5xl mx-auto px-4 sm:px-6 mt-16 text-center"><h2 id="founding-family-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900">Familia Fundadora</h2><div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 justify-items-center">{members.map((member, i) => <figure key={i} className="flex flex-col items-center gap-4"><AboutPhoto key={member.image} src={member.image} alt={member.name} className="w-36 h-36 sm:w-44 sm:h-44 rounded-full object-cover border-4 border-sky-100 shadow-md" /><figcaption className="font-bold text-slate-800">{member.name}</figcaption></figure>)}</div></section>;
}

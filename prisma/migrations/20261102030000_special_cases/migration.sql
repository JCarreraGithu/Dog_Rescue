-- CreateTable
CREATE TABLE "SpecialCase" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "story" TEXT NOT NULL,
    "beforeText" TEXT NOT NULL DEFAULT '',
    "afterText" TEXT NOT NULL DEFAULT '',
    "location" TEXT NOT NULL DEFAULT 'Amatitlán, Guatemala',
    "date" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Caso Éxito',
    "image" TEXT NOT NULL,
    "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "video" TEXT NOT NULL DEFAULT '',
    "featured" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "draft" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SpecialCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpecialCase_isDeleted_createdAt_idx" ON "SpecialCase"("isDeleted", "createdAt");

-- Instantánea inicial pública, aplicada una sola vez. Nunca se siembra al leer o arrancar.
INSERT INTO "SpecialCase" ("id","name","title","subtitle","story","beforeText","afterText","location","date","status","image","gallery","video","featured","published","draft") VALUES ('caso-1793171848791','Arizona','Caso de impacto 02 | Arizona: tres patitas, un corazón inmenso','Para salvarla, fue necesario amputar la extremidad afectada.','En 2026, Arizona fue rescatada en el Puerto de San José, Escuintla, en condiciones de abandono y maltrato. Tras realizarle diversos estudios veterinarios, se descubrió que una infección parasitaria había provocado una deformidad y una enorme protuberancia en su pata derecha, que comprometía seriamente su bienestar y calidad de vida.

Para salvarla, fue necesario amputar la extremidad afectada. Arizona quedó con tres patitas, pero nunca perdió su esencia: es una perrita amorosa, juguetona e inteligente que nos demuestra cada día que las ganas de vivir pueden ser más grandes que cualquier adversidad.

Su caso nos recuerda por qué vale la pena luchar por aquellos seres que la sociedad ha abandonado. Aquella protuberancia llegó a pesar más que ella misma, y aun así, Arizona conservó una fortaleza que nos inspira a seguir trabajando por una vida digna para cada animal rescatado.

Hoy, Arizona vive feliz y recibe los cuidados y el cariño que merece en nuestro refugio. Aunque está rodeada de amor, soñamos con encontrar para ella una familia responsable que le brinde un hogar definitivo, donde pueda disfrutar del calor de una familia propia.

Arizona nos enseña que no se necesitan cuatro patitas para correr hacia la felicidad, ni una vida perfecta para merecer una segunda oportunidad.

Te invitamos a seguir su evolución, conocer sus fotografías y descubrir sus avances en nuestras redes sociales, Facebook y TikTok. Quizá tú seas esa persona que le abra las puertas de su hogar.','muy mal','Exelente esttado','Amatitlán, Guatemala','2020','Caso Éxito','/uploads/casos/whatsapp-image-2026-10-26-at-10-04-47-pm-1793171844608.jpeg',ARRAY['/uploads/casos/whatsapp-image-2026-10-26-at-10-04-47-pm-1793171844608.jpeg']::TEXT[],'',true,true,false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SpecialCase" ("id","name","title","subtitle","story","beforeText","afterText","location","date","status","image","gallery","video","featured","published","draft") VALUES ('caso-1793163352053','oso','Caso de impacto 01 | Oso: una historia de lucha, amor y esperanza','','A principios de 2022, Oso fue rescatado en la carretera Circunvalación al Lago de Amatitlán, después de ser atropellado por un vehículo. Sufrió una fractura de cadera y la luxación de dos vértebras que le impidieron caminar. Algunos médicos veterinarios recomendaron la eutanasia, pero nosotros vimos en él una fortaleza y unas ganas de vivir que nos motivaron a luchar por su recuperación.

Durante dos años, Oso recibió terapias, cuidados permanentes y asistencia para realizar sus necesidades básicas. Su recuperación representó un enorme esfuerzo emocional, físico y económico, pero nunca dejamos de creer en él.

Hoy, Oso camina con sus cuatro patas, corre e incluso logra ponerse de pie sobre las dos traseras. Aunque continúa necesitando cuidados y medicamentos de apoyo debido a su condición, su evolución es un testimonio de perseverancia, dedicación y amor por la vida.

Oso fue uno de esos casos que marcaron nuestra historia y fortalecieron la decisión de abrir nuestro refugio. Su vida nos recuerda que detrás de cada rescate existe una oportunidad para luchar por un futuro diferente.

Te invitamos a conocer sus avances y seguir su historia a través de nuestros videos y actualizaciones en Facebook y TikTok.

Oso no solo recuperó la movilidad: se convirtió en parte de la razón por la que hoy seguimos salvando vidas.','','','Amatitlán, Guatemala','2023','Caso Éxito','/uploads/casos/whatsapp-image-2026-10-26-at-10-04-46-pm-1793163302607.jpeg',ARRAY['/uploads/casos/whatsapp-image-2026-10-26-at-10-04-46-pm-1793163302607.jpeg']::TEXT[],'',true,true,false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SpecialCase" ("id","name","title","subtitle","story","beforeText","afterText","location","date","status","image","gallery","video","featured","published","draft") VALUES ('caso-valentin','Valentín','De ser atropellado en carretera a correr feliz en sus 4 patas','Fractura doble en patas traseras y deshidratación severa','A Valentín lo encontraron inmóvil a un costado de la carretera en Amatitlán tras haber sido atropellado. Tenía ambas patas traseras fracturadas y mucho miedo, pero en su mirada seguía viva la esperanza. Nuestro equipo acudió de inmediato, financiamos su cirugía traumatológica con placas ortopédicas y durante 4 meses recibió fisioterapia diaria y amor en el refugio. Hoy Valentín camina, corre sin dolor y vive rodeado del cariño de una familia responsable.','Rescatado en carretera con fractura doble en extremidades posteriores, dolor agudo y desnutrición.','Operado con éxito, rehabilitado al 100% con fisioterapia y adoptado por una familia amorosa.','Amatitlán, Guatemala','Octubre 2024','Rehabilitado y Adoptado','https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000',ARRAY['https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000','https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=1000']::TEXT[],'',true,true,false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SpecialCase" ("id","name","title","subtitle","story","beforeText","afterText","location","date","status","image","gallery","video","featured","published","draft") VALUES ('caso-esperanza','Esperanza','Sanando las heridas del abandono extremo con amor y paciencia','Sarna sarcóptica avanzada, anemia y temor profundo a los humanos','Esperanza deambulaba sola buscando comida entre la basura; había perdido casi todo su pelaje por una infección severa en la piel y temblaba cada vez que alguien se acercaba. En DOG Rescue iniciamos un protocolo de baños medicados semanales, alimentación hiperproteica y rehabilitación emocional. Poco a poco su piel sanó, su pelaje dorado volvió a brillar y aprendió a confiar nuevamente en las caricias.','Pérdida del 80% de su pelaje por infección cutánea, anemia severa y desconfianza extrema.','Pelaje completamente recuperado, esterilizada, vacunada y convertida en la perrita más dulce del refugio.','Barrio San Antonio, Amatitlán','Enero 2025','Caso Éxito','https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000',ARRAY['https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=1000','https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=1000']::TEXT[],'',true,true,false) ON CONFLICT ("id") DO NOTHING;
INSERT INTO "SpecialCase" ("id","name","title","subtitle","story","beforeText","afterText","location","date","status","image","gallery","video","featured","published","draft") VALUES ('caso-campeon','Campeón','Un abuelito rescatado de la lluvia que conoció la dignidad','Perro geriátrico abandonado con infección respiratoria y desgaste articular','A sus más de 9 años, Campeón fue dejado a su suerte bajo un aguacero. Estaba agotado, con problemas respiratorios y dolor en sus articulaciones. Lo abrigamos, tratamos su neumonía con antibióticos y le dimos una cama ortopédica calientita junto con suplementos condroprotectores. Hoy disfruta sus días soleados rodeado de paz, demostrando que ningún perrito anciano merece terminar su vida en la calle.','Abandonado en edad avanzada bajo la lluvia, con hipotermia, tos severa y debilidad articular.','Estable, sin dolor articular, con chequeos veterinarios al día y rodeado de cuidados especiales.','Villa Nueva / Amatitlán','Febrero 2025','En Rehabilitación','https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1000',ARRAY['https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&q=80&w=1000','https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1000']::TEXT[],'',true,true,false) ON CONFLICT ("id") DO NOTHING;

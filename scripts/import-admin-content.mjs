// Explicit legacy rescue tool. Offline validation by default; never loads project .env.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { PrismaClient } from '@prisma/client';
export class LegacyImportError extends Error {}
const fail = () => { throw new LegacyImportError('Archivo legado inválido; no se modificó ningún registro.'); };
const strings = ['name', 'breed', 'ageCategory', 'gender', 'size', 'temperament', 'status', 'rescueHistory', 'healthNotes', 'photoUrl'];
const date = value => { const d = new Date(value); if (typeof value !== 'string' || !Number.isFinite(d.getTime())) fail(); return d; };
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function validateDocumentation(doc) {
  if (!object(doc)) fail();
  const stages = {
    arrival: { strings: ['intakeDate','rescueLocation','rescuedBy','initialCondition','initialWeightKg','triageNotes'], booleans: ['intakeCompleted'], optional: ['linkedCaseReportId'] },
    rehabilitation: { strings: ['sterilizationDate','vetResponsible','behavioralAssessment'], booleans: ['dewormed','vaccinatedSextuple','vaccinatedRabies','sterilized','rehabCompleted'], optional: [] },
    adoption: { strings: ['adopterName','adopterPhone','adopterIdNumber','deliveryDate','contractPhotoUrl','deliveryPhotoUrl'], booleans: ['signedContractAccepted','adoptionCompleted'], optional: ['adoptionApplicationId'] },
  };
  for (const [name, fields] of Object.entries(stages)) {
    const stage = doc[name]; if (!object(stage)) fail();
    for (const key of fields.strings) if (typeof stage[key] !== 'string') fail();
    for (const key of fields.booleans) if (typeof stage[key] !== 'boolean') fail();
    for (const key of fields.optional) if (stage[key] !== undefined && typeof stage[key] !== 'string') fail();
  }
  if (!Array.isArray(doc.arrival.beforePhotos) || doc.arrival.beforePhotos.some(v => typeof v !== 'string')) fail();
  for (const [rows, keys] of [[doc.rehabilitation.medicalAttachments, ['id','title','type','url','date']], [doc.adoption.followUps, ['id','period','date','status','notes']]]) {
    if (!Array.isArray(rows) || new Set(rows.map(r => r?.id)).size !== rows.length) fail();
    for (const row of rows) if (!object(row) || keys.some(k => typeof row[k] !== 'string') || !row.id || (row.photoUrl !== undefined && typeof row.photoUrl !== 'string')) fail();
  }
  if (doc.updatedAt !== undefined) date(doc.updatedAt);
}
export function validateLegacyDogs(input) {
  if (!Array.isArray(input) || input.length > 10000) fail();
  const ids = new Set(), medicalIds = new Set();
  return input.map(source => {
    if (!object(source) || typeof source.id !== 'string' || !source.id || ids.has(source.id)) fail(); ids.add(source.id);
    if (strings.some(key => typeof source[key] !== 'string') || !source.name || !source.photoUrl || !Number.isFinite(source.ageYears) || source.ageYears < 0 || typeof source.isSterilized !== 'boolean') fail();
    if (source.isDeleted !== undefined && typeof source.isDeleted !== 'boolean') fail();
    if (source.applications?.length) throw new LegacyImportError('Hay solicitudes anidadas: deben conciliarse antes de importar el expediente. No se omitieron datos.');
    if (source.documentation !== undefined) validateDocumentation(source.documentation);
    const data = { id: source.id, ...Object.fromEntries(strings.map(k => [k, source[k]])), ageYears: source.ageYears, isSterilized: source.isSterilized, isDeleted: source.isDeleted ?? false, ...(source.createdAt ? { createdAt: date(source.createdAt) } : {}), ...(source.rescueDate ? { rescueDate: date(source.rescueDate) } : {}), deletedAt: source.deletedAt ? date(source.deletedAt) : null, ...(source.documentation ? { documentation: structuredClone(source.documentation) } : {}) };
    if (source.medicalRecords !== undefined && !Array.isArray(source.medicalRecords)) fail();
    const medical = (source.medicalRecords ?? []).map(r => {
      if (!object(r) || typeof r.id !== 'string' || !r.id || medicalIds.has(r.id) || ['type','title','description','vetName','status'].some(k => typeof r[k] !== 'string') || (r.dogId !== undefined && r.dogId !== source.id)) fail(); medicalIds.add(r.id);
      return { id: r.id, dogId: source.id, ...Object.fromEntries(['type','title','description','vetName','status'].map(k => [k,r[k]])), date: date(r.date), nextDueDate: r.nextDueDate ? date(r.nextDueDate) : null, ...(r.createdAt ? { createdAt: date(r.createdAt) } : {}) };
    });
    return { data, medical };
  });
}
async function prepareAssets(dogs, publicRoot) {
  const assets = new Map(); let root;
  async function rewrite(value, isPrivate) {
    if (Array.isArray(value)) return Promise.all(value.map(v => rewrite(v, isPrivate)));
    if (object(value)) return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k,v]) => [k, await rewrite(v, isPrivate)])));
    if (typeof value !== 'string' || !value.startsWith('/uploads/')) return value;
    if (!publicRoot) throw new LegacyImportError('Hay fotos locales: indica la copia privada del directorio public para conservar sus archivos.');
    root ??= await fs.realpath(publicRoot);
    const file = await fs.realpath(path.join(root, decodeURIComponent(value)));
    const relative = path.relative(root, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) fail();
    const bytes = await fs.readFile(file); if (!bytes.length || bytes.length > 8 * 1024 * 1024) fail();
    let contentType;
    if (bytes.subarray(0,3).equals(Buffer.from([255,216,255]))) contentType='image/jpeg';
    else if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) contentType='image/png';
    else if (bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') contentType='image/webp';
    else if (bytes.subarray(4,8).toString()==='ftyp' && /^(avif|avis)$/.test(bytes.subarray(8,12).toString())) contentType='image/avif';
    else fail();
    const hash=crypto.createHash('sha256').update(isPrivate?'private':'public').update(bytes).digest('hex');
    const id=[hash.slice(0,8),hash.slice(8,12),hash.slice(12,16),hash.slice(16,20),hash.slice(20,32)].join('-');
    assets.set(id,{ id, content: bytes, contentType, totalSize: bytes.length, received: bytes.length, isPrivate, uploadTokenHash: null });
    return '/api/case-reports/images/'+id;
  }
  const transformed=[];
  for (const source of dogs) {
    const row=structuredClone(source);
    row.data.photoUrl=await rewrite(row.data.photoUrl,false);
    if(row.data.documentation) row.data.documentation=await rewrite(row.data.documentation,true);
    row.originalData=source.data;
    transformed.push(row);
  }
  return { dogs:transformed, assets:[...assets.values()] };
}
export async function importLegacyDogs(client, input, apply=false, publicRoot) {
  const prepared=await prepareAssets(validateLegacyDogs(input),publicRoot);
  try {
    return await client.$transaction(async tx=>{
      await tx.$queryRaw`SELECT 1::int AS locked FROM pg_advisory_xact_lock(74190220)`;
      let pendingDogs=0,pendingDocuments=0,pendingMedical=0,pendingImages=0;
      for(const asset of prepared.assets){
        const existing=await tx.reportImage.findUnique({where:{id:asset.id}});
        if(existing && (!Buffer.from(existing.content).equals(asset.content) || existing.isPrivate!==asset.isPrivate || existing.received!==asset.received)) throw Error('conflict');
        if(!existing){pendingImages++;if(apply)await tx.reportImage.create({data:asset});}
      }
      for(const {data,medical,originalData} of prepared.dogs){
        await tx.$queryRaw`SELECT id FROM "Dog" WHERE id = ${data.id} FOR UPDATE`;
        const existing=await tx.dog.findUnique({where:{id:data.id}});
        if(existing){
          if(existing.isArchived || [...strings,'ageYears','isSterilized','isDeleted'].some(k=>existing[k]!==data[k] && !(k==='photoUrl' && existing[k]===originalData[k]))) throw Error('conflict');
          if(data.documentation && existing.documentation && !isDeepStrictEqual(existing.documentation,data.documentation) && !isDeepStrictEqual(existing.documentation,originalData.documentation)) throw Error('conflict');
          const patch={};
          if(data.documentation && !isDeepStrictEqual(existing.documentation,data.documentation)){pendingDocuments++;patch.documentation=data.documentation;}
          if(existing.photoUrl!==data.photoUrl)patch.photoUrl=data.photoUrl;
          if(apply && Object.keys(patch).length)await tx.dog.update({where:{id:data.id},data:patch});
        }else{pendingDogs++;if(apply)await tx.dog.create({data});}
        for(const record of medical){
          const current=await tx.medicalRecord.findUnique({where:{id:record.id}});
          if(current && Object.entries(record).some(([k,v])=>!isDeepStrictEqual(current[k],v)))throw Error('conflict');
          if(!current){pendingMedical++;if(apply)await tx.medicalRecord.create({data:record});}
        }
      }
      return {pendingDogs,pendingDocuments,pendingMedical,pendingImages,applied:apply};
    },{timeout:60000});
  }catch{throw new LegacyImportError('Importación cancelada por conflicto o fallo de PostgreSQL. No se sobrescribieron expedientes ni adjuntos.');}
}
async function main(){
  const [file,mode,publicRoot]=process.argv.slice(2);
  if(!file || process.argv.length>5 || (mode && !['--check-db','--apply'].includes(mode)))throw new LegacyImportError('Uso: npm run admin:import -- ARCHIVO_PERROS [--check-db | --apply] [COPIA_PUBLIC]. Sin modo: validación offline.');
  const stat=await fs.stat(file);if(!stat.isFile() || stat.size>30*1024*1024)fail();
  const input=JSON.parse(await fs.readFile(file,'utf8')),dogs=validateLegacyDogs(input);
  if(!mode){console.log(JSON.stringify({validatedDogs:dogs.length,databaseAccess:false}));return;}
  const url=process.env.ADMIN_IMPORT_DATABASE_URL,host=process.env.ADMIN_IMPORT_EXPECT_HOST;
  if(!url || !host || new URL(url).hostname!==host)throw new LegacyImportError('Configura explícitamente ADMIN_IMPORT_DATABASE_URL y ADMIN_IMPORT_EXPECT_HOST para el destino verificado.');
  const client=new PrismaClient({datasourceUrl:url,log:[]});
  try{console.log(JSON.stringify(await importLegacyDogs(client,input,mode==='--apply',publicRoot)));}finally{await client.$disconnect();}
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main().catch(error=>{console.error(error instanceof LegacyImportError?error.message:'No se pudo validar o importar el archivo privado.');process.exitCode=1;});

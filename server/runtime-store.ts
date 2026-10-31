import {mkdirSync,existsSync,readFileSync,openSync,writeFileSync,fsyncSync,closeSync,renameSync,chmodSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {z} from 'zod';
import {EngineRecoverySchema,restoreState,type ForgeState,type ForgeEngine} from '../shared/engine.js';
const Envelope=z.object({version:z.literal(1),payload:z.object({state:z.unknown(),recovery:EngineRecoverySchema}),sha256:z.string().regex(/^[a-f0-9]{64}$/)});
const hash=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
/** Local, owner-only checkpoint. Never send the recovery ledger to browser readers. */
export class RuntimeStore{
 private file:string;
 constructor(directory:string){mkdirSync(directory,{recursive:true,mode:0o700});chmodSync(directory,0o700);this.file=path.join(directory,'runtime.json');}
 load(){
  if(!existsSync(this.file))return null;
  try{const packed=JSON.parse(readFileSync(this.file,'utf8'));if(hash(packed.payload)!==packed.sha256)throw new Error('Checkpoint checksum mismatch');const raw=Envelope.parse(packed);const state=restoreState(raw.payload.state);const original=raw.payload.state as ForgeState;if(original?.version!==1||state.revision!==original.revision||state.scene.name!==original.scene?.name)throw new Error('Invalid checkpoint state');return {state,recovery:raw.payload.recovery};}
  catch{throw new Error('PopForge could not read its runtime checkpoint. Preserve .data/runtime.json for recovery instead of silently starting a new garden.');}
 }
 save(engine:ForgeEngine){
  const payload={state:engine.state,recovery:engine.recovery()};const data=JSON.stringify({version:1,payload,sha256:hash(payload)});const temporary=this.file+'.tmp';const fd=openSync(temporary,'w',0o600);
  try{writeFileSync(fd,data);fsyncSync(fd);}finally{closeSync(fd);}
  chmodSync(temporary,0o600);renameSync(temporary,this.file);
 }
}

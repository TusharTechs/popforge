import { z } from 'zod';
import {GardenSchema,emptyGarden,gardenSeeds,landmarkName,closeGardenDecision,LandmarkSchema,type GardenMemory,type Landmark} from './world.js';
export type {GardenMemory} from './world.js';
import {initialLounge,restoreLounge,MoodSchema,EnergySchema,EffectSchema,MOODS,type LoungeState,type EffectKind} from './lounge.js';

export const SceneSchema = z.object({
  name: z.string().min(3).max(60), description: z.string().min(5).max(200),
  kind: z.enum(['reactor', 'meteor', 'garden', 'focus']),
  accent: z.enum(['lime', 'lilac', 'amber', 'cyan']), keyword: z.string().regex(/^[a-zA-Z]{2,20}$/),
  duration: z.number().int().min(30).max(300), increment: z.number().int().min(1).max(30),
  goal: z.number().int().min(5).max(100), gravity: z.enum(['low', 'normal', 'high']),
});
export type Scene = z.infer<typeof SceneSchema>;
export type SceneKind = Scene['kind'];
export const RECIPES: { id: string; label: string; category: string; prompt: string; scene: Scene }[] = [
  { id: 'reactor', label: 'Unlucky reactor', category: 'REACTIVE WIDGET', prompt: 'A luck reactor that heats up whenever I say unlucky. Chat can shield the moon from a meteor shower.', scene: {name:'Unlucky reactor',description:'One unlucky too many. Chat, the moon is in your hands.',kind:'reactor',accent:'lime',keyword:'unlucky',duration:180,increment:10,goal:20,gravity:'normal'} },
  { id:'meteor',label:'Save the moon',category:'QUEUE-TIME GAME',prompt:'A three-minute meteor shower. Chat builds a shield together to save the moon while I am away.',scene:{name:'Save the moon',description:'You have three minutes. One moon. Absolutely no pressure.',kind:'meteor',accent:'lilac',keyword:'meteor',duration:180,increment:15,goal:25,gravity:'low'} },
  { id:'garden',label:'Little chaos garden',category:'COMMUNITY GOAL',prompt:'A cozy community garden. Every !water grows a flower. Bloom together while I take a break.',scene:{name:'Little chaos garden',description:'A little water. A little chaos. Something good grows here.',kind:'garden',accent:'cyan',keyword:'bloom',duration:180,increment:5,goal:15,gravity:'low'} },
  { id:'focus',label:'Beat the meltdown',category:'FOCUS CHALLENGE',prompt:'A focus timer that counts down for three minutes. Chat cheers with !shield while I finish my task before the reactor melts.',scene:{name:'Beat the meltdown',description:'Finish the mission before the core goes critical.',kind:'focus',accent:'amber',keyword:'panic',duration:180,increment:10,goal:20,gravity:'high'} },
];
// Additional ready-to-publish presets reuse the tested community mechanics.
RECIPES.push(...[
 {id:'firefly',label:'Firefly meadow',category:'COZY COMMUNITY',prompt:'A cyan garden of fireflies. Say glow to brighten the meadow.',scene:{...RECIPES[2].scene,name:'Firefly meadow',description:'Gather a little light together. Chat waters the meadow.',keyword:'glow',accent:'cyan' as const,goal:12}},
 {id:'comet',label:'Comet café',category:'QUEUE-TIME GAME',prompt:'A low gravity purple meteor scene with a two minute queue timer.',scene:{...RECIPES[1].scene,name:'Comet café',description:'Keep the cosmic café safe while the kettle warms.',duration:120,goal:12}},
 {id:'sunrise',label:'Sunrise stretch',category:'GENTLE FOCUS',prompt:'A golden one minute focus timer for a gentle stretch.',scene:{...RECIPES[3].scene,name:'Sunrise stretch',description:'One minute to breathe, stretch, and return refreshed.',duration:60,keyword:'breathe',accent:'amber' as const,gravity:'low' as const}},
 {id:'lucky',label:'Good luck lantern',category:'REACTIVE WIDGET',prompt:'A lilac luck reactor that fills whenever I say lucky.',scene:{...RECIPES[0].scene,name:'Good luck lantern',description:'Collect the little wins. Every lucky moment lights the room.',keyword:'lucky',increment:5,accent:'lilac' as const}},
 {id:'bloom',label:'Midnight bloom',category:'COMMUNITY GOAL',prompt:'A purple low gravity community garden.',scene:{...RECIPES[2].scene,name:'Midnight bloom',description:'A quiet garden that grows with your community.',accent:'lilac' as const,goal:30,keyword:'grow'}},
 {id:'sprint',label:'Tiny victory sprint',category:'FOCUS CHALLENGE',prompt:'A two minute timer to finish one small task.',scene:{...RECIPES[3].scene,name:'Tiny victory sprint',description:'Pick one small thing. Chat cheers you to the finish.',duration:120,goal:10,keyword:'done',accent:'cyan' as const}},
]);
export type TimelineEvent = { id: string; at: number; title: string; detail: string; type: 'scene'|'chat'|'game'|'poll'|'keyword'|'note'|'community'; source: 'demo'|'twitch'|'streamer' };
export type ChatMessage = { id:string; at:number; user:string; text:string; source:'demo'|'twitch' };
export type Poll = { id:string; question:string; options:string[]; counts:number[]; endsAt:number; status:'open'|'closed'; winner:number|null };
export type Round = { id:string; status:'idle'|'playing'|'paused'|'ended'; deadline:number; remaining:number; shields:number; actions:number; participants:number; outcome:'saved'|'lost'|null };
export type ForgeState = { garden:GardenMemory; demoGarden:GardenMemory; taskConfirmed:boolean; version:1; revision:number; scene:Scene; previous:Scene[]; charge:number; round:Round; poll:Poll|null; events:TimelineEvent[]; chat:ChatMessage[]; proposals:{id:string;user:string;text:string}[]; stats:{scenes:number;rounds:number;actions:number}; settings:{reducedMotion:boolean;compact:boolean}; lounge:LoungeState; };
export const CommandSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('startMoment'),scene:SceneSchema}),
  z.object({type:z.literal('openGardenVote'),mode:z.enum(['live','rehearsal'])}),
  z.object({type:z.literal('closeGardenVote'),mode:z.enum(['live','rehearsal'])}),
  z.object({type:z.literal('buildGardenChoice'),mode:z.enum(['live','rehearsal'])}),
  z.object({type:z.literal('endActivity')}),z.object({type:z.literal('confirmTask')}),
  z.object({type:z.literal('publish'),scene:SceneSchema}), z.object({type:z.literal('rollback')}),
  z.object({type:z.literal('start')}), z.object({type:z.literal('pause')}),z.object({type:z.literal('resume')}),z.object({type:z.literal('finish')}),
  z.object({type:z.literal('stop')}), z.object({type:z.literal('keyword')}),z.object({type:z.literal('resetCharge')}),
  z.object({type:z.literal('poll')}), z.object({type:z.literal('closePoll')}),
  z.object({type:z.literal('note'),text:z.string().min(3).max(240)}),
  z.object({type:z.literal('settings'),reducedMotion:z.boolean(),compact:z.boolean()}),
  z.object({type:z.literal('dismissProposal'),id:z.string().max(100)}),
  z.object({type:z.literal('ambience'),mood:MoodSchema.optional(),energy:EnergySchema.optional(),particles:z.boolean().optional(),intensity:z.number().min(0).max(1).optional(),showBackground:z.boolean().optional()}),
  z.object({type:z.literal('celebrate'),kind:EffectSchema}),
  z.object({type:z.literal('takeBreak'),duration:z.number().int().min(30).max(600),message:z.string().min(3).max(120)}),
  z.object({type:z.literal('returnFromBreak')}),
  z.object({type:z.literal('approveKindness'),id:z.string().max(100)}),
  z.object({type:z.literal('dismissKindness'),id:z.string().max(100)}),
  z.object({type:z.literal('removeKindness'),id:z.string().max(100)}),
  z.object({type:z.literal('resetVibes')}),
  z.object({type:z.literal('reset')}),
]);
export type Command = z.infer<typeof CommandSchema>;
const uid = () => globalThis.crypto.randomUUID();
const idle = (duration=180): Round => ({id:uid(),status:'idle',deadline:0,remaining:duration*1000,shields:0,actions:0,participants:0,outcome:null});
export function initialState(): ForgeState {
  return {garden:emptyGarden(),demoGarden:emptyGarden(),taskConfirmed:false,version:1,revision:0,scene:{...RECIPES[0].scene},previous:[],charge:30,round:idle(),poll:null,events:[],chat:[],proposals:[],stats:{scenes:0,rounds:0,actions:0},settings:{reducedMotion:false,compact:false},lounge:initialLounge()};
}
export function restoreState(raw: unknown): ForgeState {
  try {
    const v = raw as ForgeState;
    if(v.version !== 1 || !Number.isFinite(v.revision) || !Array.isArray(v.events) || !Array.isArray(v.chat) || !v.round || !v.stats || !v.settings) return initialState();
    return {...v,garden:GardenSchema.safeParse(v.garden).success?GardenSchema.parse(v.garden):emptyGarden(),demoGarden:GardenSchema.safeParse(v.demoGarden).success?GardenSchema.parse(v.demoGarden):emptyGarden(),taskConfirmed:v.taskConfirmed===true,scene:SceneSchema.parse(v.scene),previous:(v.previous??[]).slice(-3).map(s=>SceneSchema.parse(s)),events:v.events.slice(0,80),chat:v.chat.slice(-50),proposals:(v.proposals??[]).slice(0,10),lounge:restoreLounge(v.lounge)};
  } catch { return initialState(); }
}
export function remix(prompt: string): Scene {
  const p=prompt.toLowerCase();
  const base = /garden|water|flower|cozy/.test(p) ? RECIPES[2] : /focus|timer|finish|bomb|task/.test(p) ? RECIPES[3] : /meteor|moon|defen|shield/.test(p)&&!/reactor|rage|meter|unlucky/.test(p) ? RECIPES[1] : RECIPES[0];
  const s={...base.scene};
  const keyword=prompt.match(/(?:say|saying|word|keyword)\s+["“']?([a-zA-Z]{2,20})\b/i)?.[1];
  if(keyword)s.keyword=keyword.toLowerCase();
  const minutes=p.match(/(\d+)\s*(?:minute|min)/)?.[1];
  if(minutes)s.duration=Math.max(30,Math.min(300,Number(minutes)*60));
  if(/low gravity|zero gravity|float/.test(p))s.gravity='low';
  if(/high gravity|heavy/.test(p))s.gravity='high';
  if(/purple|violet|lilac/.test(p))s.accent='lilac';
  if(/orange|amber|fire/.test(p))s.accent='amber';
  if(/blue|cyan|ocean/.test(p))s.accent='cyan';
  return SceneSchema.parse(s);
}

export const EngineRecoverySchema=z.object({participants:z.array(z.string().max(100)).max(50000).default([]),cooldowns:z.array(z.tuple([z.string().max(100),z.number().finite()])).max(50000).default([]),pollVotes:z.array(z.tuple([z.string().max(100),z.number().int().min(0).max(2)])).max(50000).default([]),encouragement:z.array(z.tuple([z.string().max(100),z.number().finite()])).max(50000).default([]),moodVotes:z.array(z.tuple([z.string().max(100),z.number().int().min(0).max(3)])).max(50000).default([]),eventIds:z.array(z.string().min(1).max(200)).max(20000),gardenVotes:z.object({live:z.object({decisionId:z.string().max(100).nullable(),votes:z.array(z.tuple([z.string().max(100),LandmarkSchema])).max(50000)}),rehearsal:z.object({decisionId:z.string().max(100).nullable(),votes:z.array(z.tuple([z.string().max(100),LandmarkSchema])).max(50000)})})});
export type EngineRecovery=z.infer<typeof EngineRecoverySchema>;

export class ForgeEngine {
  state: ForgeState;
  private participants = new Set<string>();
  private votes = new Map<string,number>();
  private cooldown = new Map<string,number>();
  private seen = new Set<string>();
  private encouragementCooldown = new Map<string,number>();
  private moodVotes = new Map<string,number>();
  private effectBucket={at:0,count:0};
  private gardenVotes={live:new Map<string,Landmark>(),rehearsal:new Map<string,Landmark>()};
  constructor(state=initialState(),recovery?:EngineRecovery){
    this.state=state;const parsed=recovery?EngineRecoverySchema.parse(recovery):null;if(parsed){this.seen=new Set(parsed.eventIds);this.participants=new Set(parsed.participants);this.cooldown=new Map(parsed.cooldowns);this.votes=new Map(parsed.pollVotes);this.encouragementCooldown=new Map(parsed.encouragement);this.moodVotes=new Map(parsed.moodVotes);}
    for(const mode of ['live','rehearsal'] as const){
      const d=(mode==='live'?state.garden:state.demoGarden).decision;const ledger=parsed?.gardenVotes[mode];
      if(d&&ledger&&d.id===ledger.decisionId){const votes=new Map(ledger.votes);const consistent=votes.size===ledger.votes.length&&[...votes.values()].every(x=>d!.options.includes(x))&&d.options.every((id,i)=>[...votes.values()].filter(x=>x===id).length===d.counts[i]);if(consistent){this.gardenVotes[mode]=votes;continue;}}
      if(d?.status==='open'){d.status='closed';d.winner=null;d.reason='recovery';}
    }
  }
  recovery():EngineRecovery{return {participants:[...this.participants].slice(-50000),cooldowns:[...this.cooldown].slice(-50000),pollVotes:[...this.votes].slice(-50000),encouragement:[...this.encouragementCooldown].slice(-50000),moodVotes:[...this.moodVotes].slice(-50000),eventIds:[...this.seen],gardenVotes:{live:{decisionId:this.state.garden.decision?.id??null,votes:[...this.gardenVotes.live]},rehearsal:{decisionId:this.state.demoGarden.decision?.id??null,votes:[...this.gardenVotes.rehearsal]}}};}
  private closeWorld(mode:'live'|'rehearsal',now:number){const g=mode==='live'?this.state.garden:this.state.demoGarden;if(g.decision?.status!=='open')return;closeGardenDecision(g);const d=g.decision!;this.record('community',d.winner?`Chat chose ${landmarkName(d.winner)}`:d.reason==='tie'?'The garden choice ended in a tie':'The garden choice ended without votes',d.winner?'The creator can now build this corner. One garden seed will be used.':'No seed was spent. Open a fresh choice whenever you like.',mode==='live'?'twitch':'demo',now);}

  private record(type:TimelineEvent['type'],title:string,detail:string,source:TimelineEvent['source']='streamer',now=Date.now()) {
    this.state.events.unshift({id:uid(),at:now,type,title,detail,source});this.state.events=this.state.events.slice(0,80);
  }
  private changed(){this.state={...this.state,revision:this.state.revision+1};return this.state;}
  dispatch(input:unknown,now=Date.now()): ForgeState {
    const c=CommandSchema.parse(input);const s=this.state;
    if(c.type==='openGardenVote'){
      const g=c.mode==='live'?s.garden:s.demoGarden;if(g.decision?.status==='open')throw new Error('A garden choice is already open.');
      const options=LandmarkSchema.options.filter(id=>!g.landmarks.includes(id));if(!options.length)throw new Error('Every corner is built. Enjoy what you made together.');
      if(gardenSeeds(g)<1)throw new Error('Grow one flower to earn a garden seed first.');
      g.decision={id:uid(),endsAt:now+45000,status:'open',options:[...options],counts:options.map(()=>0),winner:null,reason:null};this.gardenVotes[c.mode].clear();
      this.record('community',c.mode==='live'?'Chat is choosing the garden’s next corner':'A rehearsal garden choice opened','Use '+options.map(id=>'!grow '+id).join(', ')+'. One choice per account; changes allowed. The creator approves the build.',c.mode==='live'?'twitch':'demo',now);
    } else if(c.type==='closeGardenVote'){this.closeWorld(c.mode,now);
    } else if(c.type==='buildGardenChoice'){
      const g=c.mode==='live'?s.garden:s.demoGarden;const d=g.decision;
      if(!d||d.status!=='closed'||!d.winner||g.landmarks.includes(d.winner)||gardenSeeds(g)<1)throw new Error('Close a garden choice with a clear winner before building.');
      const votes=d.counts.reduce((a,b)=>a+b,0);g.landmarks.push(d.winner);g.chapters=[{id:d.id,at:now,landmark:d.winner,votes},...g.chapters].slice(0,12);d.status='built';
      this.record('community',`${c.mode==='rehearsal'?'Rehearsal: ':''}${landmarkName(d.winner)} became part of our garden`,`${votes} community ${votes===1?'choice':'choices'}. One seed became a place to come back to. ${c.mode==='live'?'It stays across fresh sessions.':'It stays across browser reloads; resetting the rehearsal clears it.'}`,c.mode==='live'?'twitch':'demo',now);
    } else if(c.type==='confirmTask'){
      if(s.scene.kind!=='focus'||s.taskConfirmed||s.round.status==='idle')throw new Error('Start a focus sprint before confirming your task.');
      s.taskConfirmed=true;this.record('note','The streamer completed their task',s.scene.name+': completion confirmed by the streamer.','streamer',now);
    } else if(c.type==='startMoment'){
      if(s.lounge.break.status!=='idle'||s.round.status==='playing'||s.round.status==='paused')throw new Error('End the current activity before starting another moment.');
      this.dispatch({type:'publish',scene:c.scene},now);
      // A playable moment must remain visible after leaving a full-screen lounge.
      this.state.settings.compact=false;this.state.lounge.showBackground=false;
      return this.dispatch({type:'start'},now);
    } else if(c.type==='endActivity'){
      if(s.lounge.break.status!=='idle')this.dispatch({type:'returnFromBreak'},now);
      return this.dispatch({type:'stop'},now);
    } else if(c.type==='publish') {
      s.previous=[...s.previous,s.scene].slice(-3);s.scene={...c.scene};s.round=idle(c.scene.duration);s.charge=0;s.stats.scenes++;
      this.participants.clear();this.cooldown.clear();this.record('scene',`${c.scene.name} went live`,c.scene.description,'streamer',now);
    } else if(c.type==='rollback') {
      const old=s.previous.pop();if(!old)throw new Error('No previous scene to restore.');
      s.scene=old;s.round=idle(old.duration);s.charge=0;this.record('scene','Previous scene restored',`${old.name} is back on the stage.`,'streamer',now);
    } else if(c.type==='start') {
      if(s.lounge.break.status!=='idle')throw new Error('Welcome back first, then start a new round.');
      if(s.round.status==='playing'||s.round.status==='paused')throw new Error('A round is already in progress.');
      s.taskConfirmed=false;s.round={...idle(s.scene.duration),status:'playing',deadline:now+s.scene.duration*1000};this.participants.clear();this.cooldown.clear();
      this.record('game','The community took the controls',`${s.scene.name}: ${s.scene.goal} team actions before the timer ends. Type ${s.scene.kind==='garden'?'!water':'!shield'} in chat.`,'streamer',now);
    } else if(c.type==='pause' && s.round.status==='playing'){s.round.remaining=Math.max(0,s.round.deadline-now);s.round.status='paused';
    } else if(c.type==='resume' && s.round.status==='paused'){
      if(s.lounge.break.status!=='idle')throw new Error('Use I’m back to resume after your breather.');
      s.round.deadline=now+s.round.remaining;s.round.status='playing';
    } else if(c.type==='finish'){if(s.round.status!=='playing'&&s.round.status!=='paused')throw new Error('Start a round first.');this.end(now);
    } else if(c.type==='stop'){s.round=idle(s.scene.duration);s.charge=0;this.record('scene','Scene stopped','The streamer returned the overlay to standby.','streamer',now);
    } else if(c.type==='keyword'){this.heat(now,'streamer');
    } else if(c.type==='resetCharge'){s.charge=0;
    } else if(c.type==='poll'){
      if(s.poll?.status==='open')throw new Error('Close the current vote first.');
      s.poll={id:uid(),question:'What twist should we forge next?',options:['Low gravity','Meteor mayhem','Cozy garden'],counts:[0,0,0],endsAt:now+45000,status:'open',winner:null};this.votes.clear();
      this.record('poll','Chat is choosing the next twist','Free chat vote: !vote 1, !vote 2, or !vote 3. One vote per account.','streamer',now);
    } else if(c.type==='closePoll'){this.closePoll(now);
    } else if(c.type==='note'){this.record('note','A moment worth remembering',c.text,'streamer',now);
    } else if(c.type==='settings'){s.settings={reducedMotion:c.reducedMotion,compact:c.compact};
    } else if(c.type==='dismissProposal'){s.proposals=s.proposals.filter(p=>p.id!==c.id);
    } else if(c.type==='ambience'){
      const old=s.lounge.mood;Object.assign(s.lounge,Object.fromEntries(Object.entries(c).filter(([key,value])=>key!=='type'&&value!==undefined)));
      if(c.mood&&c.mood!==old)this.record('community',`The room became ${MOODS.find(m=>m.id===c.mood)!.name}`,`The streamer chose a new atmosphere. Chat can suggest one with !vibe.`,'streamer',now);
    } else if(c.type==='celebrate'){this.effect(c.kind,'Streamer',now);
    } else if(c.type==='takeBreak'){
      if(s.lounge.break.status!=='idle')throw new Error('A breather is already active. Return when you are ready.');
      let pausedRoundId:string|null=null;
      if(s.round.status==='playing'){s.round.remaining=Math.max(0,s.round.deadline-now);s.round.status='paused';pausedRoundId=s.round.id;}
      s.lounge.break={status:'running',deadline:now+c.duration*1000,duration:c.duration,message:c.message,pausedRoundId};
      this.record('community','A little pause, together',`The streamer took a breather. Chat can keep the room glowing with !glow, !heart, and !star.`,'streamer',now);
    } else if(c.type==='returnFromBreak'){
      const b=s.lounge.break;if(b.status==='idle')return this.state;
      if(b.pausedRoundId===s.round.id&&s.round.status==='paused'){s.round.deadline=now+s.round.remaining;s.round.status='playing';}
      s.lounge.break={...initialLounge().break};this.record('community','Welcome back. We kept the lights on.',`${s.lounge.lanterns} lanterns and ${s.lounge.hearts} hearts are part of today's story.`,'streamer',now);this.effect('lanterns','Community',now);
    } else if(c.type==='approveKindness'){
      const k=s.lounge.pending.find(k=>k.id===c.id);if(!k)throw new Error('That note is no longer pending.');
      s.lounge.pending=s.lounge.pending.filter(k=>k.id!==c.id);s.lounge.wall=[{...k,at:now},...s.lounge.wall].slice(0,9);this.effect('hearts',k.user,now);
      this.record('community','A little kindness made it on screen',`${k.user}: ${k.text}`,k.source,now);
    } else if(c.type==='dismissKindness'){s.lounge.pending=s.lounge.pending.filter(k=>k.id!==c.id);
    } else if(c.type==='removeKindness'){
      const k=s.lounge.wall.find(k=>k.id===c.id);
      if(k)s.events=s.events.filter(e=>!(e.type==='community'&&e.title==='A little kindness made it on screen'&&e.detail===`${k.user}: ${k.text}`));
      s.lounge.wall=s.lounge.wall.filter(k=>k.id!==c.id);
    } else if(c.type==='resetVibes'){s.lounge.vibeVotes=[0,0,0,0];this.moodVotes.clear();
    } else if(c.type==='reset'){const garden=s.garden;this.state=initialState();this.state.garden=garden;this.participants.clear();this.cooldown.clear();this.votes.clear();this.gardenVotes.rehearsal.clear();this.encouragementCooldown.clear();this.moodVotes.clear();}
    return this.changed();
  }
  private heat(now:number,source:TimelineEvent['source']){
    if(this.state.lounge.break.status!=='idle')return;
    const s=this.state;const before=s.charge;s.charge=Math.min(100,s.charge+s.scene.increment);
    if(before<100&&s.charge===100){this.record('keyword','The reactor went critical',`The “${s.scene.keyword}” meter hit 100%. Meteor mode activated.` ,source,now);}
  }
  ingest(user:string,text:string,source:'demo'|'twitch',messageId:string=uid(),now=Date.now(),displayName=user,isBroadcaster=false) {
    if(this.seen.has(messageId))return this.state;
    this.seen.add(messageId);if(this.seen.size>20000)this.seen.delete(this.seen.values().next().value!);
    const s=this.state;const clean=text.slice(0,500);const who=displayName.slice(0,40);
    s.chat.push({id:messageId,at:now,user:who,text:clean,source});s.chat=s.chat.slice(-50);
    const vote=clean.trim().match(/^!vote\s+([123])$/i);
    if(s.poll?.status==='open'&&now<s.poll.endsAt&&vote){
      const choice=Number(vote[1])-1;const prev=this.votes.get(user);
      if(prev!==choice){if(prev!==undefined)s.poll.counts[prev]--;s.poll.counts[choice]++;this.votes.set(user,choice);}
    }
    const command=clean.trim().toLowerCase();
    const growth=command.match(/^!grow (pond|nook|lanterns)$/)?.[1] as Landmark|undefined;
    const mode=source==='twitch'?'live':'rehearsal';const garden=mode==='live'?s.garden:s.demoGarden;const decision=garden.decision;
    if(growth&&!isBroadcaster&&decision?.status==='open'&&now<decision.endsAt&&decision.options.includes(growth)){
      const ledger=this.gardenVotes[mode];const old=ledger.get(user);
      if(old!==growth&&(old!==undefined||ledger.size<50000)){if(old!==undefined)decision.counts[decision.options.indexOf(old)]--;decision.counts[decision.options.indexOf(growth)]++;ledger.set(user,growth);}
    }

    const vibe=command.match(/^!vibe\s+(starlight|rain|aurora|sunset)$/)?.[1];
    if(vibe){const choice=MOODS.findIndex(m=>m.id===vibe);const prior=this.moodVotes.get(user);if(prior!==choice){if(prior!==undefined)s.lounge.vibeVotes[prior]=Math.max(0,s.lounge.vibeVotes[prior]-1);s.lounge.vibeVotes[choice]++;this.moodVotes.set(user,choice);}}
    if(['!heart','!hug','!glow','!star','!hype'].includes(command)&&now-(this.encouragementCooldown.get(user)??-Infinity)>=4000){
      this.encouragementCooldown.set(user,now);if(this.encouragementCooldown.size>50000)this.encouragementCooldown.delete(this.encouragementCooldown.keys().next().value!);
      const before=s.lounge.jars;
      if(command==='!heart'||command==='!hug'){s.lounge.hearts++;s.lounge.jars=Math.floor(s.lounge.hearts/12);this.effect('hearts',who,now);}
      if(command==='!glow'){s.lounge.lanterns++;this.effect('lanterns',who,now);}
      if(command==='!star'){s.lounge.stars++;this.effect('stars',who,now);}
      if(command==='!hype')this.effect('confetti',who,now);
      if(s.lounge.jars>before){this.record('community','Chat filled a kindness jar',`Twelve more hearts, shared freely. ${s.lounge.jars} kindness ${s.lounge.jars===1?'jar':'jars'} filled today.`,source,now);this.effect('stars','Community',now);}
    }
    const kindness=clean.match(/^!kind\s+(.{3,160})$/i)?.[1];
    if(kindness&&s.lounge.pending.length<12&&!s.lounge.pending.some(k=>k.user===who))s.lounge.pending.push({id:messageId,user:who,text:kindness,at:now,source});
    const plant=command.match(/^!plant (mint|moon|sunset)$/)?.[1] as 'mint'|'moon'|'sunset'|undefined;
    if(s.round.status==='playing'&&now<s.round.deadline&&(['!shield','!water','!cheer'].includes(command)||(s.scene.kind==='garden'&&plant))){
      if(now-(this.cooldown.get(user)??-Infinity)>=3000){
        this.cooldown.set(user,now);this.participants.add(user);s.round.actions++;s.round.shields=Math.min(s.scene.goal,s.round.actions);s.round.participants=this.participants.size;s.stats.actions++;
        if(s.scene.kind==='garden'){const garden=source==='twitch'?s.garden:s.demoGarden;garden.water=Math.min(100000000,garden.water+1);garden.care=[...(garden.care??[]).filter(e=>now-e.at<4500),{id:messageId,at:now,kind:plant??(command==='!water'?'water' as const:'cheer' as const),plot:Math.min(23,Math.floor((garden.water-1)/5))}].slice(-12);if(garden.water%5===0){garden.blooms=[...garden.blooms,plant??'mint'].slice(-24);this.record('community',source==='twitch'?'Your lasting garden grew a bloom':'The rehearsal garden grew a bloom',`Five contributions grew a ${plant??'mint'} flower. ${source==='twitch'?'It will be here next stream.':'Rehearsal stays separate from the live garden.'}`,source,now);}}
        if(s.round.shields>=s.scene.goal&&s.scene.kind!=='focus')this.end(now);
      }
    }
    if(clean.toLowerCase().split(/\W+/).includes(s.scene.keyword.toLowerCase()))this.heat(now,source);
    const idea=clean.match(/^!forge\s+(.{3,240})$/i)?.[1];
    if(idea&&s.proposals.length<10&&!s.proposals.some(p=>p.user===who))s.proposals.push({id:messageId,user:who,text:idea});
    return this.changed();
  }
  private closePoll(now:number){
    const p=this.state.poll;if(!p||p.status==='closed')return;
    p.status='closed';const max=Math.max(...p.counts);p.winner=max>0?p.counts.indexOf(max):null;
    const tied=p.counts.filter(c=>c===max).length>1;
    this.record('poll',p.winner===null?'The vote ended without votes':`Chat chose ${p.options[p.winner]}`,p.winner===null?'The streamer can choose the next twist.':`${p.counts.reduce((a,b)=>a+b,0)} votes. ${tied?'Tie resolved by the first listed option. ':''}Preview the twist before publishing.`,'streamer',now);
  }
  private effect(kind:EffectKind,user:string,now:number){
    const l=this.state.lounge;if(l.energy==='quiet'||!l.particles)return;
    if(now-this.effectBucket.at>=1000)this.effectBucket={at:now,count:0};
    if(this.effectBucket.count>=4)return;this.effectBucket.count++;
    l.effects=[...l.effects.filter(e=>now-e.at<8000),{id:uid(),kind,at:now,user:user.slice(0,40)}].slice(-12);
  }
  private end(now:number){
    const s=this.state;if(s.round.status==='ended')return;
    const saved=s.round.shields>=s.scene.goal;s.round.status='ended';s.round.remaining=0;s.round.outcome=saved?'saved':'lost';s.stats.rounds++;
    const title=s.scene.kind==='garden'?(saved?'The chaos garden bloomed':'A little garden progress, kept') :s.scene.kind==='focus'?'The focus sprint ended':saved?'Chat saved the moon!':'The moon took a hit';
    this.record('game',title,`${s.round.participants} participants contributed ${s.round.actions} actions. ${s.scene.kind==='focus'?(s.taskConfirmed?'The streamer confirmed their task was completed.':'Task completion has not been confirmed by the streamer.'):s.scene.kind==='garden'?'Your contributions remain in the garden.':saved?'The community earned a survivor star.':'A cracked moon remains. There is always another round.'}`, 'streamer',now);
  }
  tick(now=Date.now()){
    let changed=false;
    for(const mode of ['live','rehearsal'] as const){const g=mode==='live'?this.state.garden:this.state.demoGarden;if(g.decision?.status==='open'&&now>=g.decision.endsAt){this.closeWorld(mode,now);changed=true;}}
    if(this.state.lounge.break.status==='running'&&now>=this.state.lounge.break.deadline){this.state.lounge.break.status='resting';changed=true;}
    if(this.state.round.status==='playing'&&now>=this.state.round.deadline){this.end(now);changed=true;}
    if(this.state.poll?.status==='open'&&now>=this.state.poll.endsAt){this.closePoll(now);changed=true;}
    return changed?this.changed():null;
  }
}

export function recap(state:ForgeState,windowMs=15*60*1000,now=Date.now(),rehearsal=false){
  const garden=rehearsal?state.demoGarden:state.garden;
  const world=garden.landmarks.map(landmarkName);
  const recent=state.events.filter(e=>e.at>=now-windowMs);
  const important=recent.filter(e=>e.type==='game'||e.type==='keyword'||e.type==='note'||e.type==='poll'||e.type==='scene'||e.type==='community').slice(0,3).reverse();
  return {moments:important,world,action:garden.decision?.status==='open'?`Help choose our next garden corner: ${garden.decision.options.map(x=>'!grow '+x).join(', ')}.`:state.lounge.break.status!=='idle'?'Type !glow or !heart in Twitch chat. Keep the room warm while the streamer takes a breather.':state.round.status==='playing'?`Type ${state.scene.kind==='garden'?'!water':'!shield'} in Twitch chat to help the team.`:state.poll?.status==='open'?'Type !vote 1, !vote 2, or !vote 3 in Twitch chat.':'Suggest our next scene with !forge followed by your idea in Twitch chat.',goal:state.lounge.break.status!=='idle'?`${state.lounge.lanterns} lanterns are keeping the lights on.`:state.round.status==='playing'?`${Math.max(0,state.scene.goal-state.round.shields)} more team actions to reach the goal.`:'The next chapter is yours to help create.'};
}

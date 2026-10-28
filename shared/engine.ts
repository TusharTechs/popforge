import { z } from 'zod';

export const SceneSchema = z.object({
  name: z.string().min(3).max(60), description: z.string().min(5).max(200),
  kind: z.enum(['reactor', 'meteor', 'garden', 'focus']),
  accent: z.enum(['lime', 'lilac', 'amber', 'cyan']), keyword: z.string().regex(/^[a-zA-Z]{2,20}$/),
  duration: z.number().int().min(30).max(300), increment: z.number().int().min(1).max(30),
  goal: z.number().int().min(5).max(100), gravity: z.enum(['low', 'normal', 'high']),
});
export type Scene = z.infer<typeof SceneSchema>;
export type SceneKind = Scene['kind'];
export const RECIPES: { id: SceneKind; label: string; category: string; prompt: string; scene: Scene }[] = [
  { id: 'reactor', label: 'Unlucky reactor', category: 'REACTIVE WIDGET', prompt: 'A luck reactor that heats up whenever I say unlucky. Chat can shield the moon from a meteor shower.', scene: {name:'Unlucky reactor',description:'One unlucky too many. Chat, the moon is in your hands.',kind:'reactor',accent:'lime',keyword:'unlucky',duration:180,increment:10,goal:20,gravity:'normal'} },
  { id:'meteor',label:'Save the moon',category:'QUEUE-TIME GAME',prompt:'A three-minute meteor shower. Chat builds a shield together to save the moon while I am away.',scene:{name:'Save the moon',description:'You have three minutes. One moon. Absolutely no pressure.',kind:'meteor',accent:'lilac',keyword:'meteor',duration:180,increment:15,goal:25,gravity:'low'} },
  { id:'garden',label:'Little chaos garden',category:'COMMUNITY GOAL',prompt:'A cozy community garden. Every !water grows a flower. Bloom together while I take a break.',scene:{name:'Little chaos garden',description:'A little water. A little chaos. Something good grows here.',kind:'garden',accent:'cyan',keyword:'bloom',duration:180,increment:5,goal:15,gravity:'low'} },
  { id:'focus',label:'Beat the meltdown',category:'FOCUS CHALLENGE',prompt:'A focus timer that counts down for three minutes. Chat cheers with !shield while I finish my task before the reactor melts.',scene:{name:'Beat the meltdown',description:'Finish the mission before the core goes critical.',kind:'focus',accent:'amber',keyword:'panic',duration:180,increment:10,goal:20,gravity:'high'} },
];
export type TimelineEvent = { id: string; at: number; title: string; detail: string; type: 'scene'|'chat'|'game'|'poll'|'keyword'|'note'; source: 'demo'|'twitch'|'streamer' };
export type ChatMessage = { id:string; at:number; user:string; text:string; source:'demo'|'twitch' };
export type Poll = { id:string; question:string; options:string[]; counts:number[]; endsAt:number; status:'open'|'closed'; winner:number|null };
export type Round = { id:string; status:'idle'|'playing'|'paused'|'ended'; deadline:number; remaining:number; shields:number; actions:number; participants:number; outcome:'saved'|'lost'|null };
export type ForgeState = { version:1; revision:number; scene:Scene; previous:Scene[]; charge:number; round:Round; poll:Poll|null; events:TimelineEvent[]; chat:ChatMessage[]; proposals:{id:string;user:string;text:string}[]; stats:{scenes:number;rounds:number;actions:number}; settings:{reducedMotion:boolean;compact:boolean}; };
export const CommandSchema = z.discriminatedUnion('type', [
  z.object({type:z.literal('publish'),scene:SceneSchema}), z.object({type:z.literal('rollback')}),
  z.object({type:z.literal('start')}), z.object({type:z.literal('pause')}),z.object({type:z.literal('resume')}),z.object({type:z.literal('finish')}),
  z.object({type:z.literal('stop')}), z.object({type:z.literal('keyword')}),z.object({type:z.literal('resetCharge')}),
  z.object({type:z.literal('poll')}), z.object({type:z.literal('closePoll')}),
  z.object({type:z.literal('note'),text:z.string().min(3).max(240)}),
  z.object({type:z.literal('settings'),reducedMotion:z.boolean(),compact:z.boolean()}),
  z.object({type:z.literal('dismissProposal'),id:z.string().max(100)}),
  z.object({type:z.literal('reset')}),
]);
export type Command = z.infer<typeof CommandSchema>;
const uid = () => globalThis.crypto.randomUUID();
const idle = (duration=180): Round => ({id:uid(),status:'idle',deadline:0,remaining:duration*1000,shields:0,actions:0,participants:0,outcome:null});
export function initialState(): ForgeState {
  return {version:1,revision:0,scene:{...RECIPES[0].scene},previous:[],charge:30,round:idle(),poll:null,events:[],chat:[],proposals:[],stats:{scenes:0,rounds:0,actions:0},settings:{reducedMotion:false,compact:false}};
}
export function restoreState(raw: unknown): ForgeState {
  try {
    const v = raw as ForgeState;
    if(v.version !== 1 || !Number.isFinite(v.revision) || !Array.isArray(v.events) || !Array.isArray(v.chat) || !v.round || !v.stats || !v.settings) return initialState();
    return {...v,scene:SceneSchema.parse(v.scene),previous:(v.previous??[]).slice(-3).map(s=>SceneSchema.parse(s)),events:v.events.slice(0,80),chat:v.chat.slice(-50),proposals:(v.proposals??[]).slice(0,10)};
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

export class ForgeEngine {
  state: ForgeState;
  private participants = new Set<string>();
  private votes = new Map<string,number>();
  private cooldown = new Map<string,number>();
  private seen = new Set<string>();
  constructor(state=initialState()){this.state=state;}
  private record(type:TimelineEvent['type'],title:string,detail:string,source:TimelineEvent['source']='streamer',now=Date.now()) {
    this.state.events.unshift({id:uid(),at:now,type,title,detail,source});this.state.events=this.state.events.slice(0,80);
  }
  private changed(){this.state={...this.state,revision:this.state.revision+1};return this.state;}
  dispatch(input:unknown,now=Date.now()): ForgeState {
    const c=CommandSchema.parse(input);const s=this.state;
    if(c.type==='publish') {
      s.previous=[...s.previous,s.scene].slice(-3);s.scene={...c.scene};s.round=idle(c.scene.duration);s.charge=0;s.stats.scenes++;
      this.participants.clear();this.cooldown.clear();this.record('scene',`${c.scene.name} went live`,c.scene.description,'streamer',now);
    } else if(c.type==='rollback') {
      const old=s.previous.pop();if(!old)throw new Error('No previous scene to restore.');
      s.scene=old;s.round=idle(old.duration);s.charge=0;this.record('scene','Previous scene restored',`${old.name} is back on the stage.`,'streamer',now);
    } else if(c.type==='start') {
      if(s.round.status==='playing'||s.round.status==='paused')throw new Error('A round is already in progress.');
      s.round={...idle(s.scene.duration),status:'playing',deadline:now+s.scene.duration*1000};this.participants.clear();this.cooldown.clear();
      this.record('game','The community took the controls',`${s.scene.name}: ${s.scene.goal} team actions before the timer ends. Type ${s.scene.kind==='garden'?'!water':'!shield'} in chat.`,'streamer',now);
    } else if(c.type==='pause' && s.round.status==='playing'){s.round.remaining=Math.max(0,s.round.deadline-now);s.round.status='paused';
    } else if(c.type==='resume' && s.round.status==='paused'){s.round.deadline=now+s.round.remaining;s.round.status='playing';
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
    } else if(c.type==='reset'){this.state=initialState();this.participants.clear();this.cooldown.clear();this.votes.clear();this.seen.clear();}
    return this.changed();
  }
  private heat(now:number,source:TimelineEvent['source']){
    const s=this.state;const before=s.charge;s.charge=Math.min(100,s.charge+s.scene.increment);
    if(before<100&&s.charge===100){this.record('keyword','The reactor went critical',`The “${s.scene.keyword}” meter hit 100%. Meteor mode activated.` ,source,now);}
  }
  ingest(user:string,text:string,source:'demo'|'twitch',messageId:string=uid(),now=Date.now()) {
    if(this.seen.has(messageId))return this.state;
    this.seen.add(messageId);if(this.seen.size>20000)this.seen.delete(this.seen.values().next().value!);
    const s=this.state;const clean=text.slice(0,500);const who=user.slice(0,40);
    s.chat.push({id:messageId,at:now,user:who,text:clean,source});s.chat=s.chat.slice(-50);
    const vote=clean.trim().match(/^!vote\s+([123])$/i);
    if(s.poll?.status==='open'&&now<s.poll.endsAt&&vote){
      const choice=Number(vote[1])-1;const prev=this.votes.get(user);
      if(prev!==choice){if(prev!==undefined)s.poll.counts[prev]--;s.poll.counts[choice]++;this.votes.set(user,choice);}
    }
    const command=clean.trim().toLowerCase();
    if(s.round.status==='playing'&&now<s.round.deadline&&['!shield','!water','!cheer'].includes(command)){
      if(now-(this.cooldown.get(user)??-Infinity)>=3000){
        this.cooldown.set(user,now);this.participants.add(user);s.round.actions++;s.round.shields=Math.min(s.scene.goal,s.round.actions);s.round.participants=this.participants.size;s.stats.actions++;
        if(s.round.shields>=s.scene.goal)this.end(now);
      }
    }
    if(clean.toLowerCase().split(/\W+/).includes(s.scene.keyword.toLowerCase()))this.heat(now,source);
    const idea=clean.match(/^!forge\s+(.{3,240})$/i)?.[1];
    if(idea&&s.proposals.length<10&&!s.proposals.some(p=>p.user===user))s.proposals.push({id:messageId,user:who,text:idea});
    return this.changed();
  }
  private closePoll(now:number){
    const p=this.state.poll;if(!p||p.status==='closed')return;
    p.status='closed';const max=Math.max(...p.counts);p.winner=max>0?p.counts.indexOf(max):null;
    const tied=p.counts.filter(c=>c===max).length>1;
    this.record('poll',p.winner===null?'The vote ended without votes':`Chat chose ${p.options[p.winner]}`,p.winner===null?'The streamer can choose the next twist.':`${p.counts.reduce((a,b)=>a+b,0)} votes. ${tied?'Tie resolved by the first listed option. ':''}Preview the twist before publishing.`,'streamer',now);
  }
  private end(now:number){
    const s=this.state;if(s.round.status==='ended')return;
    const saved=s.round.shields>=s.scene.goal;s.round.status='ended';s.round.remaining=0;s.round.outcome=saved?'saved':'lost';s.stats.rounds++;
    this.record('game',saved?(s.scene.kind==='garden'?'The chaos garden bloomed':'Chat saved the moon!'):'The moon took a hit',`${s.round.participants} participants contributed ${s.round.actions} actions. ${saved?'The community earned a survivor star.':'A cracked moon remains. There is always another round.'}`, 'streamer',now);
  }
  tick(now=Date.now()){
    let changed=false;
    if(this.state.round.status==='playing'&&now>=this.state.round.deadline){this.end(now);changed=true;}
    if(this.state.poll?.status==='open'&&now>=this.state.poll.endsAt){this.closePoll(now);changed=true;}
    return changed?this.changed():null;
  }
}

export function recap(state:ForgeState,windowMs=15*60*1000,now=Date.now()){
  const recent=state.events.filter(e=>e.at>=now-windowMs);
  const important=recent.filter(e=>e.type==='game'||e.type==='keyword'||e.type==='note'||e.type==='poll'||e.type==='scene').slice(0,3).reverse();
  return {moments:important,action:state.round.status==='playing'?`Type ${state.scene.kind==='garden'?'!water':'!shield'} in Twitch chat to help the team.`:state.poll?.status==='open'?'Type !vote 1, !vote 2, or !vote 3 in Twitch chat.':'Suggest our next scene with !forge followed by your idea in Twitch chat.',goal:state.round.status==='playing'?`${Math.max(0,state.scene.goal-state.round.shields)} more team actions to reach the goal.`:'The next chapter is yours to help create.'};
}

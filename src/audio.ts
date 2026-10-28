import {MOODS,type Mood,type Energy,type EffectKind} from '../shared/lounge';

type Mix={master:number;music:number;rain:number;wind:number;chimes:boolean};
type AudioState={enabled:boolean;running:boolean;error:string|null;mix:Mix};
const defaults:Mix={master:.28,music:.65,rain:0,wind:.15,chimes:false};
const clamp=(v:number)=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
let stored=defaults;try{const v=JSON.parse(localStorage.getItem('popforge.mix.v1')??'null');if(v)stored={master:clamp(v.master??.28),music:clamp(v.music??.65),rain:clamp(v.rain??0),wind:clamp(v.wind??.15),chimes:!!v.chimes};}catch{}

// Original procedural notes and filtered noise; no third-party tracks or audio downloads.
class SoundGarden {
  private context:AudioContext|null=null;
  private master?:GainNode;private music?:GainNode;private rain?:GainNode;private wind?:GainNode;private sfx?:GainNode;
  private nodes:AudioScheduledSourceNode[]=[];private timer?:ReturnType<typeof setInterval>;
  private nextNote=0;private step=0;private mood:Mood='starlight';private energy:Energy='gentle';
  private listeners=new Set<()=>void>();
  private snapshot:AudioState={enabled:false,running:false,error:null,mix:stored};
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);};};
  getState=()=>this.snapshot;
  private update(patch:Partial<AudioState>){this.snapshot={...this.snapshot,...patch};this.listeners.forEach(fn=>fn());}
  async enable(){
    try{
      if(this.energy==='quiet')throw new Error('Quiet mode is on. Choose a different energy level to enable sound.');
      if(!this.context){
        const AudioCtor=window.AudioContext??(window as any).webkitAudioContext;
        if(!AudioCtor)throw new Error('This browser does not support Web Audio.');
        const ctx:AudioContext=this.context=new AudioCtor();
        this.master=ctx.createGain();this.master.gain.value=0;
        const limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-16;limiter.knee.value=20;limiter.ratio.value=8;limiter.attack.value=.02;limiter.release.value=.3;
        this.master.connect(limiter);limiter.connect(ctx.destination);
        this.music=ctx.createGain();this.music.connect(this.master);
        this.rain=ctx.createGain();this.rain.connect(this.master);
        this.wind=ctx.createGain();this.wind.connect(this.master);
        this.sfx=ctx.createGain();this.sfx.gain.value=.3;this.sfx.connect(this.master);
        this.noise(this.rain,'bandpass',1500);this.noise(this.wind,'lowpass',260);
        ctx.onstatechange=()=>this.update({running:ctx.state==='running'&&this.snapshot.enabled&&this.energy!=='quiet'});
      }
      await this.context.resume();this.nextNote=this.context.currentTime+.1;
      this.update({enabled:true,running:this.context.state==='running',error:null});this.applyMix();
      if(!this.timer)this.timer=setInterval(()=>this.schedule(),100);
      this.schedule();
    }catch(e){this.update({enabled:false,running:false,error:e instanceof Error?e.message:'Sound could not start.'});}
  }
  async disable(){
    this.update({enabled:false,running:false});if(this.timer){clearInterval(this.timer);this.timer=undefined;}
    if(this.context&&this.master){this.master.gain.cancelScheduledValues(this.context.currentTime);this.master.gain.setTargetAtTime(0,this.context.currentTime,.06);await this.context.suspend();}
  }
  setMix(patch:Partial<Mix>){const mix={...this.snapshot.mix,...patch};for(const key of ['master','music','rain','wind'] as const)mix[key]=clamp(mix[key]);this.update({mix});try{localStorage.setItem('popforge.mix.v1',JSON.stringify(mix));}catch{}this.applyMix();}
  setAtmosphere(mood:Mood,energy:Energy){
    const wasQuiet=this.energy==='quiet';this.mood=mood;this.energy=energy;
    if(energy==='quiet'&&this.context){void this.context.suspend();this.update({running:false});}
    else if(wasQuiet&&this.snapshot.enabled&&this.context){void this.context.resume().then(()=>{this.nextNote=this.context!.currentTime+.1;this.update({running:true});});}
    this.applyMix();
  }
  private applyMix(){if(!this.context||!this.master)return;const t=this.context.currentTime,m=this.snapshot.mix;
    this.master.gain.setTargetAtTime(this.snapshot.enabled&&this.energy!=='quiet'?m.master*(this.energy==='gentle'?.65:1):0,t,.3);
    this.music!.gain.setTargetAtTime(m.music*.2,t,.3);this.rain!.gain.setTargetAtTime(m.rain*.12,t,.3);this.wind!.gain.setTargetAtTime(m.wind*.15,t,.3);
  }
  private noise(destination:GainNode,type:BiquadFilterType,frequency:number){
    const c=this.context!;const buffer=c.createBuffer(1,c.sampleRate*4,c.sampleRate);const samples=buffer.getChannelData(0);
    let smooth=0;for(let i=0;i<samples.length;i++){const n=Math.random()*2-1;smooth=smooth*.96+n*.04;samples[i]=type==='lowpass'?smooth*3:n*.5;}
    const source=c.createBufferSource();source.buffer=buffer;source.loop=true;
    const filter=c.createBiquadFilter();filter.type=type;filter.frequency.value=frequency;filter.Q.value=.5;
    source.connect(filter);filter.connect(destination);source.start();this.nodes.push(source);
  }
  private tone(midi:number,at:number,duration:number,volume:number,target:GainNode,type:OscillatorType='sine',pan=0){
    const c=this.context!;const osc=c.createOscillator(),gain=c.createGain(),filter=c.createBiquadFilter();
    osc.type=type;osc.frequency.value=440*2**((midi-69)/12);filter.type='lowpass';filter.frequency.value=1200;
    const panner=c.createStereoPanner();panner.pan.value=pan;
    gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.09);gain.gain.exponentialRampToValueAtTime(.001,at+duration);
    osc.connect(filter);filter.connect(gain);gain.connect(panner);panner.connect(target);osc.start(at);osc.stop(at+duration+.05);
    osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();};
  }
  private schedule(){
    const c=this.context;if(!c||!this.snapshot.enabled||c.state!=='running'||this.energy==='quiet')return;
    const mood=MOODS.find(m=>m.id===this.mood)!;const stepSeconds=60/mood.bpm/2;
    if(this.nextNote<c.currentTime)this.nextNote=c.currentTime+.05;
    while(this.nextNote<c.currentTime+.3){
      const roots={starlight:48,rain:45,aurora:50,sunset:53};const root=roots[this.mood];const chord=[0,5,9,5][Math.floor(this.step/16)%4];
      const pattern=[0,7,12,16,19,16,12,7,0,12,7,19,16,12,7,4];
      this.tone(root+chord+pattern[this.step%16],this.nextNote,1.8,.32,this.music!,this.mood==='sunset'?'triangle':'sine',Math.sin(this.step*.7)*.4);
      if(this.step%8===0){for(const n of [0,7,12])this.tone(root+chord+n-12,this.nextNote,4,.11,this.music!);}
      this.nextNote+=stepSeconds;this.step++;
    }
  }
  chime(kind:EffectKind){
    if(!this.context||!this.snapshot.running||!this.snapshot.mix.chimes||this.energy==='quiet')return;
    const notes=kind==='hearts'?[72,76]:kind==='lanterns'?[67,74]:kind==='stars'?[79,83,86]:[72,76,79,84];const t=this.context.currentTime;
    notes.forEach((n,i)=>this.tone(n,t+i*.12,.8,.14,this.sfx!));
  }
}
export const soundGarden=new SoundGarden();

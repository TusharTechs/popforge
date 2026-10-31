import {useEffect,useRef,useState} from 'react';
import type {ForgeState,Scene} from '../shared/engine';
import {RENDERER_DOCUMENT,renderScene} from './renderer';

export function SceneFrame({state,scene,transparent=false,paused=false,onReady,ambientOnly=false,forceScene=false,rehearsal=false,onInteract}:{state:ForgeState;scene?:Scene;transparent?:boolean;paused?:boolean;onReady?:()=>void;ambientOnly?:boolean;forceScene?:boolean;rehearsal?:boolean;onInteract?:()=>void}){
  const ref=useRef<HTMLIFrameElement>(null);const [ready,setReady]=useState(false);
  const callback=useRef(onReady);callback.current=onReady;
  const interact=useRef(onInteract);interact.current=onInteract;
  useEffect(()=>{
    const listener=(e:MessageEvent)=>{if(e.source!==ref.current?.contentWindow)return;if(e.data?.type==='popforge:ready'){setReady(true);callback.current?.();}if(e.data?.type==='popforge:tap')interact.current?.();};
    window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);
  },[]);
  useEffect(()=>{if(ready)ref.current?.contentWindow?.postMessage({type:'popforge:state',payload:{...state,scene:scene??state.scene,transparent,previewPaused:paused,ambientOnly,forceScene,rehearsal}},'*');},[ready,state,scene,transparent,paused,ambientOnly,forceScene,rehearsal]);
  return <iframe ref={ref} title={`${scene?.name??state.scene.name} scene renderer`} sandbox="allow-scripts" srcDoc={RENDERER_DOCUMENT} className={`scene-frame ${ready?'is-ready':''}`} />;
}

// OBS uses the same trusted renderer directly to preserve alpha across CEF versions.
// Generated data never becomes executable code; private previews retain their iframe sandbox.
export function BroadcastCanvas({state,rehearsal=false}:{state:ForgeState;rehearsal?:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null);const renderer=useRef<ReturnType<typeof renderScene>|null>(null);
 useEffect(()=>{renderer.current=renderScene(canvas.current!);return()=>{renderer.current?.dispose();renderer.current=null;};},[]);
 useEffect(()=>{renderer.current?.update({...state,transparent:true,rehearsal});},[state,rehearsal]);
 return <canvas ref={canvas} className="broadcast-canvas" aria-label="PopForge broadcast scene" style={{position:'absolute',inset:0,width:'100%',height:'100%',background:'transparent'}}/>;
}

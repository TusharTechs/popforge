import {useEffect,useRef,useState} from 'react';
import type {ForgeState,Scene} from '../shared/engine';
import {RENDERER_DOCUMENT} from './renderer';

export function SceneFrame({state,scene,transparent=false,paused=false,onReady}:{state:ForgeState;scene?:Scene;transparent?:boolean;paused?:boolean;onReady?:()=>void}){
  const ref=useRef<HTMLIFrameElement>(null);const [ready,setReady]=useState(false);
  const callback=useRef(onReady);callback.current=onReady;
  useEffect(()=>{
    const listener=(e:MessageEvent)=>{if(e.source===ref.current?.contentWindow&&e.data?.type==='popforge:ready'){setReady(true);callback.current?.();}};
    window.addEventListener('message',listener);return()=>window.removeEventListener('message',listener);
  },[]);
  useEffect(()=>{if(ready)ref.current?.contentWindow?.postMessage({type:'popforge:state',payload:{...state,scene:scene??state.scene,transparent,previewPaused:paused}},'*');},[ready,state,scene,transparent,paused]);
  return <iframe ref={ref} title={`${scene?.name??state.scene.name} scene renderer`} sandbox="allow-scripts" srcDoc={RENDERER_DOCUMENT} className={`scene-frame ${ready?'is-ready':''}`} />;
}

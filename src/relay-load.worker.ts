import {runRelayLoad} from '../shared/relay';
self.onmessage=(event:MessageEvent<{host:number;guest:number}>)=>{try{self.postMessage({ok:true,...runRelayLoad(event.data.host,event.data.guest)});}catch(e){self.postMessage({ok:false,error:e instanceof Error?e.message:'Load rehearsal failed.'});}};

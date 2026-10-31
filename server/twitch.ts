import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { ForgeEngine } from '../shared/engine.js';
import type {TwitchMemory,RememberedTwitch} from './local-identity.js';

export type TwitchStatus={configured:boolean;connected:boolean;listening:boolean;name:string|null;category:string|null;error:string|null;restoring?:boolean;remembered?:boolean;lastMessageAt?:number|null};
export type TwitchRuntime={auth:()=>RefreshingAuthProvider;api:(auth:RefreshingAuthProvider)=>ApiClient;listener:(api:ApiClient)=>EventSubWsListener};
const runtime:TwitchRuntime={
  auth:()=>new RefreshingAuthProvider({clientId:process.env.TWITCH_CLIENT_ID!,clientSecret:process.env.TWITCH_CLIENT_SECRET!,redirectUri:process.env.TWITCH_REDIRECT_URI!}),
  api:auth=>new ApiClient({authProvider:auth}),listener:api=>new EventSubWsListener({apiClient:api}),
};
export class TwitchBridge {
  status:TwitchStatus={configured:!!(process.env.TWITCH_CLIENT_ID&&process.env.TWITCH_CLIENT_SECRET),connected:false,listening:false,name:null,category:null,error:null,restoring:false,remembered:false,lastMessageAt:null};
  private listener?:EventSubWsListener;
  private api?:ApiClient;
  private userId?:string;
  private lastRecap=0;
  private generation=0;
  onChat?: (event:{userId:string;text:string;messageId:string;at:number;isBroadcaster:boolean})=>void;
  get accountId(){return this.userId;}
  constructor(private engine:ForgeEngine,private notify:()=>void,private recapText:()=>string,private memory?:TwitchMemory,private services=runtime){}
  async connect(code:string){
    this.disconnect();
    await this.open(code);
  }
  async restore(){
    if(this.status.restoring||this.status.connected)return;
    const saved=this.memory?.load();this.status.remembered=!!saved;
    if(!saved||!this.status.configured){this.notify();return;}
    if(saved.clientId!==process.env.TWITCH_CLIENT_ID){this.status.error='The Twitch application changed. Connect Twitch again.';this.notify();return;}
    await this.open(saved);
  }
  private async open(input:string|RememberedTwitch){
    this.stop();const generation=this.generation;const current=()=>generation===this.generation;
    this.status={...this.status,restoring:true,error:null};this.notify();
    try{
      const auth=this.services.auth();
      const remember=(id:string,token:RememberedTwitch['token'])=>{
        if(!current()||!this.memory)return;
        try{this.memory.save({clientId:process.env.TWITCH_CLIENT_ID!,userId:id,token});this.status.remembered=true;}
        catch{this.status.error='This connection could not be saved. Check local disk access before restarting.';}
      };
      auth.onRefresh((id,token)=>{remember(id,token);if(current())this.notify();});
      auth.onRefreshFailure(()=>{if(current()){this.status={...this.status,connected:false,listening:false,error:'Twitch authorization could not refresh. Retry the connection, or connect Twitch again.'};this.listener?.stop();this.notify();}});
      let id:string;
      if(typeof input==='string')id=await auth.addUserForCode(input);
      else{id=input.userId;auth.addUser(id,input.token);}
      if(!current())return;
      const token=await auth.getAccessTokenForUser(id,['user:read:chat','user:write:chat']);
      if(!current())return;
      if(!token)throw new Error('No Twitch user token');
      const api=this.services.api(auth);
      const [user,channel]=await Promise.all([api.users.getUserById(id),api.channels.getChannelInfoById(id)]);
      if(!current())return;
      remember(id,token);this.api=api;this.userId=id;
      this.status={...this.status,connected:true,restoring:false,name:user?.displayName??id,category:channel?.gameName??'Just Chatting'};
      const listener=this.services.listener(api);this.listener=listener;let chatReady=false;
      listener.onSubscriptionCreateSuccess((_subscription,subscription)=>{if(current()&&subscription.type==='channel.chat.message'){chatReady=true;this.status.listening=true;this.notify();}});
      listener.onSubscriptionCreateFailure(()=>{if(current()){this.status.error='Twitch subscription failed. Reconnect and approve the requested chat permissions.';this.status.listening=false;this.notify();}});
      listener.onUserSocketDisconnect(()=>{if(current()){this.status.listening=false;this.notify();}});
      listener.onUserSocketConnect(()=>{if(current()){this.status.listening=chatReady;this.notify();}});
      listener.onChannelChatMessage(id,id,event=>{
        if(!current())return;
        const now=Date.now();this.status.lastMessageAt=now;
        this.onChat?.({userId:event.chatterId,text:event.messageText,messageId:event.messageId,at:now,isBroadcaster:event.chatterId===id});
        this.engine.ingest(event.chatterId,event.messageText,'twitch',event.messageId,now,event.chatterDisplayName,event.chatterId===id);
        const last=this.engine.state.chat.at(-1);if(last?.id===event.messageId)last.user=event.chatterDisplayName;
        if(event.messageText.trim().toLowerCase()==='!recap'&&now-this.lastRecap>30000){
          this.lastRecap=now;void api.chat.sendChatMessage(id,this.recapText().slice(0,450)).catch(()=>{if(current()){this.status.error='Could not send recap to chat. Check user:write:chat permission.';this.notify();}});
        }
        this.notify();
      });
      listener.onChannelUpdate(id,event=>{if(current()){this.status.category=event.categoryName;this.notify();}});
      listener.start();this.notify();
    }catch{
      if(!current())return;
      this.stop();this.status.error='Could not connect to Twitch. Check your connection, retry, or authorize Twitch again.';this.notify();
      if(typeof input==='string')throw new Error('Twitch connection failed.');
    }
  }
  /** Stops runtime work without forgetting the connection; used during shutdown. */
  stop(){
    this.generation++;this.listener?.stop();this.listener=undefined;this.api=undefined;this.userId=undefined;
    this.status={...this.status,connected:false,listening:false,restoring:false,name:null,category:null,error:null,lastMessageAt:null};this.notify();
  }
  disconnect(){this.stop();this.memory?.clear();this.status.remembered=false;this.notify();}
}

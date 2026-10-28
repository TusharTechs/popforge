import { RefreshingAuthProvider } from '@twurple/auth';
import { ApiClient } from '@twurple/api';
import { EventSubWsListener } from '@twurple/eventsub-ws';
import type { ForgeEngine } from '../shared/engine.js';

export type TwitchStatus={configured:boolean;connected:boolean;listening:boolean;name:string|null;category:string|null;error:string|null};
export class TwitchBridge {
  status:TwitchStatus={configured:!!(process.env.TWITCH_CLIENT_ID&&process.env.TWITCH_CLIENT_SECRET),connected:false,listening:false,name:null,category:null,error:null};
  private listener?:EventSubWsListener;
  private api?:ApiClient;
  private userId?:string;
  private lastRecap=0;
  constructor(private engine:ForgeEngine,private notify:()=>void,private recapText:()=>string){}
  async connect(code:string){
    this.disconnect();
    const auth=new RefreshingAuthProvider({clientId:process.env.TWITCH_CLIENT_ID!,clientSecret:process.env.TWITCH_CLIENT_SECRET!,redirectUri:process.env.TWITCH_REDIRECT_URI!});
    const id=await auth.addUserForCode(code);
    const api=new ApiClient({authProvider:auth});this.api=api;this.userId=id;
    const [user,channel]=await Promise.all([api.users.getUserById(id),api.channels.getChannelInfoById(id)]);
    this.status={...this.status,connected:true,name:user?.displayName??id,category:channel?.gameName??'Just Chatting',error:null};
    const listener=new EventSubWsListener({apiClient:api});this.listener=listener;
    listener.onSubscriptionCreateSuccess(()=>{this.status.listening=true;this.status.error=null;this.notify();});
    listener.onSubscriptionCreateFailure(()=>{this.status.error='Twitch subscription failed. Reconnect and approve the requested chat permissions.';this.status.listening=false;this.notify();});
    listener.onUserSocketDisconnect(()=>{this.status.listening=false;this.notify();});
    listener.onUserSocketConnect(()=>{this.status.listening=true;this.notify();});
    listener.onChannelChatMessage(id,id,event=>{
      this.engine.ingest(event.chatterId,event.messageText,'twitch',event.messageId,Date.now(),event.chatterDisplayName);
      // Keep the account ID for deduplication, display the public name in the recent chat feed.
      const last=this.engine.state.chat.at(-1);if(last?.id===event.messageId)last.user=event.chatterDisplayName;
      if(event.messageText.trim().toLowerCase()==='!recap'&&Date.now()-this.lastRecap>30000){
        this.lastRecap=Date.now();void api.chat.sendChatMessage(id,this.recapText().slice(0,450)).catch(()=>{this.status.error='Could not send recap to chat. Check user:write:chat permission.';this.notify();});
      }
      this.notify();
    });
    listener.onChannelUpdate(id,event=>{this.status.category=event.categoryName;this.notify();});
    listener.start();this.notify();
  }
  disconnect(){this.listener?.stop();this.listener=undefined;this.api=undefined;this.userId=undefined;this.status={...this.status,connected:false,listening:false,name:null,category:null,error:null};this.notify();}
}

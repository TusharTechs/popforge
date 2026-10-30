import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TwitchBridge,type TwitchRuntime} from '../server/twitch.js';
import {ForgeEngine} from '../shared/engine.js';
import type {RememberedTwitch,TwitchMemory} from '../server/local-identity.js';
const token={accessToken:'fake-access',refreshToken:'fake-refresh',scope:['user:read:chat','user:write:chat'],expiresIn:3600,obtainmentTimestamp:100};
function fixture(){
 let stored:RememberedTwitch|null=null;let fail=false;let stopped=0;let added='';const callbacks:Record<string,(...args:any[])=>void>={};
 const memory:TwitchMemory={load:()=>stored,save:v=>{stored=structuredClone(v);},clear:()=>{stored=null;}};
 const runtime={
  auth:()=>({onRefresh:(f:any)=>{callbacks.refresh=f;},onRefreshFailure:(f:any)=>{callbacks.failure=f;},addUserForCode:async()=> 'creator',addUser:(id:string)=>{added=id;},getAccessTokenForUser:async()=>token}),
  api:()=>({users:{getUserById:async()=>{if(fail)throw new Error('network down');return {displayName:'Creator'};}},channels:{getChannelInfoById:async()=>({gameName:'Art'})},chat:{sendChatMessage:async()=>{}}}),
  listener:()=>({onSubscriptionCreateSuccess:(f:any)=>{callbacks.ready=f;},onSubscriptionCreateFailure:(f:any)=>{callbacks.subfail=f;},onUserSocketDisconnect:(f:any)=>{callbacks.off=f;},onUserSocketConnect:(f:any)=>{callbacks.on=f;},onChannelChatMessage:(_a:any,_b:any,f:any)=>{callbacks.chat=f;},onChannelUpdate:(_a:any,f:any)=>{callbacks.category=f;},start:()=>{},stop:()=>{stopped++;}}),
 } as unknown as TwitchRuntime;
 return {memory,runtime,callbacks,stored:()=>stored,added:()=>added,stopped:()=>stopped,fail:()=>{fail=true;}};
}
async function withClient(fn:()=>Promise<void>){const priorId=process.env.TWITCH_CLIENT_ID,priorSecret=process.env.TWITCH_CLIENT_SECRET;process.env.TWITCH_CLIENT_ID='fake-client';process.env.TWITCH_CLIENT_SECRET='fake-secret';try{await fn();}finally{if(priorId===undefined)delete process.env.TWITCH_CLIENT_ID;else process.env.TWITCH_CLIENT_ID=priorId;if(priorSecret===undefined)delete process.env.TWITCH_CLIENT_SECRET;else process.env.TWITCH_CLIENT_SECRET=priorSecret;}}

test('Twitch reconnects from stored tokens and persists refreshes; stopping preserves, disconnecting forgets',()=>withClient(async()=>{
 const f=fixture();const first=new TwitchBridge(new ForgeEngine(),()=>{},()=> 'Recap',f.memory,f.runtime);
 await first.connect('authorization-code');assert.equal(f.stored()?.userId,'creator');assert.equal(first.status.remembered,true);assert.equal(first.status.listening,false);
 f.callbacks.ready(null,{type:'channel.update'});assert.equal(first.status.listening,false);
 f.callbacks.ready(null,{type:'channel.chat.message'});assert.equal(first.status.listening,true);
 f.callbacks.chat({chatterId:'viewer',messageText:'!heart',messageId:'one',chatterDisplayName:'Viewer'});assert.ok(first.status.lastMessageAt);
 first.stop();assert.ok(f.stored());
 const second=new TwitchBridge(new ForgeEngine(),()=>{},()=> 'Recap',f.memory,f.runtime);await second.restore();
 assert.equal(f.added(),'creator');assert.equal(second.status.connected,true);
 f.callbacks.refresh('creator',{...token,refreshToken:'new-refresh'});assert.equal(f.stored()?.token.refreshToken,'new-refresh');
 const oldRefresh=f.callbacks.refresh;second.disconnect();assert.equal(f.stored(),null);oldRefresh('creator',token);assert.equal(f.stored(),null,'late refresh cannot resurrect a disconnected account');
}));

test('temporary restore failures keep credentials for retry and never report chat ready',()=>withClient(async()=>{
 const f=fixture();f.memory.save({clientId:'fake-client',userId:'creator',token});f.fail();
 const bridge=new TwitchBridge(new ForgeEngine(),()=>{},()=>'',f.memory,f.runtime);await bridge.restore();
 assert.equal(bridge.status.connected,false);assert.equal(bridge.status.listening,false);assert.equal(bridge.status.restoring,false);assert.ok(bridge.status.error);assert.ok(f.stored());
}));

test('changed application identity requires authorization again and does not restore another client’s token',()=>withClient(async()=>{
 const f=fixture();f.memory.save({clientId:'old-client',userId:'creator',token});
 const bridge=new TwitchBridge(new ForgeEngine(),()=>{},()=>'',f.memory,f.runtime);await bridge.restore();
 assert.equal(f.added(),'');assert.equal(bridge.status.connected,false);assert.match(bridge.status.error!,/application changed/);
}));

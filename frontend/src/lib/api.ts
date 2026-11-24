export class ApiError extends Error { constructor(message: string, public status = 500) { super(message); this.name = 'ApiError'; } }
let refreshing:Promise<boolean>|null=null;
async function refreshSession(){const attempt=async()=>{const check=await fetch('/api/backend/auth/me',{credentials:'same-origin'});if(check.ok)return true;return (await fetch('/api/backend/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',credentials:'same-origin'})).ok;};if(typeof navigator!=='undefined'&&navigator.locks)return navigator.locks.request('trendhive-refresh',attempt);return attempt();}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 const send=()=>fetch('/api/backend/'+path.replace(/^\//,''),{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...options.headers}});
 let res=await send();
 if(res.status===401&&!['auth/login','auth/signup','auth/refresh','auth/forgot-password','auth/reset-password'].includes(path)){
  refreshing??=refreshSession().catch(()=>false).finally(()=>{refreshing=null;});
  if(await refreshing)res=await send();
 }
 let data;try{data=await res.json();}catch{throw new ApiError('The service returned an unreadable response.',res.status);}
 if(!res.ok)throw new ApiError(data.message||'Please try again.',res.status);return data as T;
}
export const submit=<T={message?:string}>(path:string,data:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(data)});

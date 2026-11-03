import {getSaved,synchronize} from '../lib/sync.mjs';
export default async function handler(request){
  if(request.method!=='GET')return new Response('Method not allowed',{status:405});
  let data=await getSaved();let error=null;
  // At most once every six hours on demand; scheduled sync also runs daily.
  if(!data || Date.now()-Date.parse(data.syncedAt)>6*3600*1000){try{data=await synchronize()}catch(e){error=String(e.message||e)}}
  return Response.json({ok:!!data,stale:!!error,warning:error,data:data||null},{status:data?200:503,headers:{'Cache-Control':'no-store'}});
}

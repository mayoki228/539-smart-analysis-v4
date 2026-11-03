import { getStore } from '@netlify/blobs';
import * as cheerio from 'cheerio';
const URL='https://www.pilio.idv.tw/lto539/list.asp';
const KEY='pilio539-draws-v1';
const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d.date)&&d.numbers.length===5&&new Set(d.numbers).size===5&&d.numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=39);
export function parsePilio(html){
  const $=cheerio.load(html);
  // Prefer table rows, which keep the draw date and numbers in the same record.
  const found=[];
  $('tr').each((_,el)=>{
    const txt=$(el).text().replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
    const date=txt.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\s*\/?\s*(?:\(?\s*(20\d{2}|\d{2})\s*\)?)/);
    if(!date)return;
    const year=Number(date[3])<100?2000+Number(date[3]):Number(date[3]);
    const day=`${year}-${String(date[1]).padStart(2,'0')}-${String(date[2]).padStart(2,'0')}`;
    const rest=txt.slice(date.index+date[0].length).replace(/^\s*\([一二三四五六日]\)/,'');
    const m=rest.match(/(?:^|[^\d])([0-3]?\d)\s*[,，、]\s*([0-3]?\d)\s*[,，、]\s*([0-3]?\d)\s*[,，、]\s*([0-3]?\d)\s*[,，、]\s*([0-3]?\d)(?!\d)/);
    if(!m)return;
    const draw={date:day,period:'',numbers:m.slice(1,6).map(Number).sort((a,b)=>a-b),source:'pilio'};
    if(valid(draw))found.push(draw);
  });
  // Some versions use line breaks instead of a table. Fallback uses adjacent text lines.
  if(!found.length){
    const text=$('body').text().replace(/\u00a0/g,' ');
    const re=/(\d{1,2})\s*\/\s*(\d{1,2})\s*(?:\r?\n|\s)*(?:20)?(\d{2})\s*\([一二三四五六日]\)\s*([0-3]?\d)\s*[,，、]\s*([0-3]?\d)\s*[,，、]\s*([0-3]?\d)\s*[,，、]\s*([0-3]?\d)\s*[,，、]\s*([0-3]?\d)/g;
    for(const m of text.matchAll(re)){const draw={date:`20${m[3]}-${String(m[1]).padStart(2,'0')}-${String(m[2]).padStart(2,'0')}`,period:'',numbers:m.slice(4,9).map(Number).sort((a,b)=>a-b),source:'pilio'};if(valid(draw))found.push(draw)}
  }
  return [...new Map(found.map(x=>[x.date,x])).values()].sort((a,b)=>b.date.localeCompare(a.date));
}
export async function getSaved(){const store=getStore('539-history');return await store.get(KEY,{type:'json'}).catch(()=>null)}
export async function synchronize(){
  const res=await fetch(URL,{headers:{'User-Agent':'Mozilla/5.0 (compatible; 539DataResearch/1.0)','Accept':'text/html'},signal:AbortSignal.timeout(18000)});
  if(!res.ok)throw Error('來源網站 HTTP '+res.status);
  const bytes=await res.arrayBuffer();const contentType=res.headers.get('content-type')||'';
  const charset=/charset\s*=\s*['"]?([^;'"\s]+)/i.exec(contentType)?.[1]||(/charset\s*=\s*['"]?([^;'"\s]+)/i.exec(new TextDecoder('latin1').decode(bytes.slice(0,2500)))?.[1])||'big5';
  let html;try{html=new TextDecoder(charset).decode(bytes)}catch{html=new TextDecoder('big5').decode(bytes)}
  const draws=parsePilio(html);
  if(draws.length<2)throw Error('無法可靠解析來源網站的開獎列表（未寫入資料庫）');
  const old=await getSaved();const merged=new Map((old?.draws||[]).map(d=>[d.date,d]));
  for(const d of draws)merged.set(d.date,d);
  const payload={draws:[...merged.values()].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,1000),syncedAt:new Date().toISOString(),source:URL,latestFetchedDate:draws[0].date,sourceCount:draws.length};
  await getStore('539-history').setJSON(KEY,payload);
  return payload;
}

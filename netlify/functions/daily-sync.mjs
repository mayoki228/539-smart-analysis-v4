import {schedule} from '@netlify/functions';
import {synchronize} from './sync.mjs';
export default schedule('30 13 * * *',async()=>{try{const result=await synchronize();console.log('539 sync',result.syncedAt,result.latestFetchedDate,result.sourceCount)}catch(e){console.error('539 sync failed',e);throw e}});

// Network-first app shell. Offline cache is fallback only; never cache personal entries.
const CACHE='daily-checkin-offline-v57';
const SHELL=new URL('./index.html',self.registration.scope).href;
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.add(new Request(SHELL,{cache:'reload'}))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('daily-checkin-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const response=await fetch(new Request(request,{cache:'no-store'}));
        if(response.ok){
          const cache=await caches.open(CACHE);
          await cache.put(SHELL,response.clone());
        }
        return response;
      }catch(err){
        const cached=await caches.match(SHELL);
        if(cached)return cached;
        throw err;
      }
    })());
    return;
  }
  // Other resources are always network-first too, with an offline fallback.
  event.respondWith(fetch(new Request(request,{cache:'no-store'})).catch(()=>caches.match(request)));
});

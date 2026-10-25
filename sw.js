// Service worker do EBD Juventude — permite abrir o app sem internet.
// Ao publicar uma nova versão do index.html, aumente o número abaixo.
const CACHE = 'ebd-juventude-v1';
const BASICOS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // áudios (streaming com Range) e arquivos grandes de mídia: sempre da rede
  if (req.headers.has('range') || /\.(mp3|m4a|ogg|wav|mp4)(\?|$)/i.test(req.url)) return;
  // abre do cache na hora e atualiza em segundo plano
  e.respondWith(
    caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then((cacheada) => {
      const rede = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia)).catch(() => {});
          }
          return res;
        })
        .catch(() => cacheada || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
      return cacheada || rede;
    })
  );
});

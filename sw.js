const CACHE_NAME = 'painel-karaiba-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/favicon.ico',
  '/public/favicon.ico',
  '/public/login.html'
];

// Instalação do service worker
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Service Worker: Erro ao cachear:', error);
      })
  );
});

// Ativação do service worker
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativo');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', event => {
  // Só cache para requisições GET da mesma origem
  if (event.request.method === 'GET' && event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Retorna do cache se encontrar
          if (response) {
            return response;
          }
          
          // Senão, busca na rede
          return fetch(event.request)
            .then(response => {
              // Verifica se a resposta é válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clona a resposta para cache
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(error => {
              console.log('Service Worker: Erro na requisição:', error);
              // Aqui poderia retornar uma página offline personalizada
            });
        })
    );
  }
});

// Notificações push (opcional para futuro)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('Push recebido:', data);
    
    const options = {
      body: data.body || 'Novo pedido recebido!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Painel Karaíba', options)
    );
  }
});

// Click na notificação
self.addEventListener('notificationclick', event => {
  console.log('Notificação clicada:', event.notification.tag);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
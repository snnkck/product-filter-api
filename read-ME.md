1. Kurulum

# Gerekli paketleri kur
npm install redis

# Veya tüm paketleri yeniden kur
npm install

2. Özellikler
✅ Otomatik Cache:

    GET istekleri otomatik cache'lenir
    Farklı TTL süreleri (ürünler: 15-30dk, kategoriler: 30dk-1saat)
    Akıllı cache key oluşturma

✅ Cache Invalidation:

    Ürün/kategori güncellemelerinde ilgili cache'ler temizlenir
    Pattern-based cache temizleme
    Cross-reference temizleme (kategori değişirse ürün cache'leri de temizlenir)

✅ Hata Toleransı:

    Redis bağlantısı yoksa uygulama normal çalışır
    Cache hatalarında otomatik fallback
    Graceful shutdown

3. Cache Süreleri

    Ürün detayı: 30 dakika
    Ürün listeleri: 15 dakika
    Kategori detayı: 45 dakika
    Kategori listeleri: 30 dakika
    İndirimli ürünler: 10 dakika (sık değişebilir)

4. API Endpoints
bash

# Cache durumunu kontrol et
GET /api/cache/status

# Tüm cache'i temizle (admin)
DELETE /api/cache/flush

5. Kullanım Örnekleri
Route'larda Middleware Kullanımı:
javascript

// Otomatik cache (15 dakika)
router.get('/', productsCacheMiddleware, getAllProducts);

// Manuel cache kontrol
const data = await manualCache.get('custom-key');
if (!data) {
  const freshData = await fetchFromDB();
  await manualCache.set('custom-key', freshData, 600);
}

Cache Invalidation:
javascript

// Ürün güncellendiğinde
await invalidateProductCache(productId);

// Kategori güncellendiğinde  
await invalidateCategoryCache(categoryId);

6. Monitoring

Console'da cache durumunu görebilirsiniz:

    Cache HIT: getAllProducts - Cache'den veri geldi
    Cache SET: getAllProducts - Veri cache'e kaydedildi
    Cache MISS: getAllProducts - Cache'de veri yok

Bu sistem ile:

    %70-90 performans artışı bekleyebilirsiniz
    Veritabanı yükü azalır
    Response süreleri düşer
    Scalability artar

Sorunuz varsa veya özelleştirme yapmak istiyorsanız söyleyin!
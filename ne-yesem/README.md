# Ne Yesem? 🍽️

Yemeğe çıkmadan önce "ne yesem" krizini bitiren, çok basit bir öneri aracı.
Birkaç hızlı seçim yap (konum, mutfak, restoran/kafe, mesafe) — sana en
yakın yerlerden **3 tanesini** önerelim. Beğenmezsen tek tuşla başka 3 tane
daha iste.

## Nasıl çalışır?

- **Konum:** Tarayıcı konumu (tek dokunuş) veya semt/şehir adıyla manuel arama.
- **Veri kaynağı:** [OpenStreetMap Overpass API](https://overpass-api.de) —
  ücretsiz, API key gerektirmez. Restoran/kafe verisi gerçek zamanlı çekilir.
- **Öneri algoritması:** Konuma yakınlık + seçilen mutfak eşleşmesine göre
  puanlanan mekanlar arasından, en iyi ~10 mekanlık havuzdan rastgele 3 tanesi
  seçilir. "Başka Öneriler Göster" aynı havuzdan farklı 3 tane sunar; havuz
  tükenirse otomatik olarak sıfırlanır. Sonuç bulunamazsa arama yarıçapı
  otomatik genişletilir.
- **Yol tarifi:** Her kart, doğrudan Google Maps yol tarifine açılan bir
  buton içerir.

Backend, veritabanı veya API anahtarı **yok** — tamamen istemci taraflı bir
SPA. Bu da onu ücretsiz ve anında yayına almayı mümkün kılıyor.

## Tasarım

Tasarım dili, [VoltAgent/awesome-claude-design](https://github.com/VoltAgent/awesome-claude-design)
koleksiyonundaki **Airbnb** sistemi referans alınarak uyarlandı: sıcak
mercan/coral vurgu rengi, krem arka plan, yuvarlak hatlı kartlar ve
fotoğraf/emoji odaklı sonuç kartları. Başlıklarda `Fraunces` (sıcak, editoryal
serif), arayüzde `Plus Jakarta Sans` (yuvarlak, geometrik) kullanıldı.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # ./dist içine production build
npm run preview  # production build'i yerelde önizle
```

## Yayına alma (launch)

Herhangi bir statik hosting yeterli — sunucu, veritabanı veya ortam
değişkeni gerekmiyor.

**Vercel / Netlify:**
- Root directory: `ne-yesem`
- Build command: `npm run build`
- Output directory: `dist`

Bu kadar. Deploy eder etmez uygulama canlıda kullanılabilir durumda olur.

## Yol haritası (v2 fikirleri)

- Gerçek fotoğraflar + puanlar için Google Places / Yelp entegrasyonu
  (ücretli API key gerektirir)
- Favorilere ekleme / geçmiş öneriler
- PWA offline desteği (şu an sadece "ana ekrana ekle" manifesti var)
- Çoklu dil desteği (EN)

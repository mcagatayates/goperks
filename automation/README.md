# Etsy → Logo İşbaşı Fatura Otomasyonu

Etsy'nin sipariş bildirim e-postalarını (`transaction@etsy.com` — "Congratulations
on your Etsy sale...") IMAP üzerinden okur, sipariş bilgilerini ayrıştırır ve
Logo İşbaşı entegrasyon API'si üzerinden otomatik satış faturası oluşturur.

Bu Gatsby/Contentful reposundan bağımsız, kendi `package.json`'ı olan ayrı bir
Node.js servisidir (`goperks` reposunun geri kalanıyla hiçbir bağımlılığı yok).

## Kurulum

```bash
cd automation
npm install
cp .env.example .env
# .env dosyasını kendi bilgilerinizle doldurun
```

```bash
npm run once   # kutuyu bir kez kontrol edip çık (cron için uygun)
npm start      # RUN_ONCE=false ile sürekli döngüde çalışır (POLL_INTERVAL_MS)
```

## Nasıl çalışır

1. `src/email/imapClient.js` — IMAP kutusunda `transaction@etsy.com`'dan gelen
   okunmamış (`\Seen` olmayan) e-postaları arar, ham içeriği indirir.
2. `src/email/etsyOrderParser.js` — e-posta metnini sipariş no, alıcı adresi,
   ürün(ler), miktar/fiyat ve toplamlara ayrıştırır.
3. `src/logo/exchangeRate.js` — fatura TL cinsindense TCMB'nin günlük
   `today.xml` kurundan USD/TRY çevrimini alır.
4. `src/logo/invoiceMapper.js` — siparişi Logo fatura isteğine dönüştürür
   (referans olarak paylaştığınız örnek fatura ekran görüntüsündeki
   varsayılanları kullanır: Bireysel müşteri, TL, KDV muafiyet kodu
   `302/11/1-a` "Hizmet İhracı", "Toptan Satış Faturası (KDV Hariç)").
5. `src/logo/logoClient.js` — `integrationLogin` ile giriş yapıp token alır,
   ardından fatura oluşturma isteğini gönderir.
6. Başarılı olursa e-posta `\Seen` işaretlenir (ve `IMAP_PROCESSED_FOLDER`
   ayarlıysa o klasöre taşınır); hata olursa okunmamış bırakılır, bir sonraki
   döngüde tekrar denenir.

## ⚠️ Canlıya almadan önce doğrulanması gerekenler

Bu ilk sürüm, sağladığınız login endpoint bilgisi ve tek bir örnek sipariş
e-postası ile hazırlandı. Bu oturumun ağ politikası test ortamına
(`soho-isbasi-mwv2-test.logo-paas.com`) ve `developers.isbasi.com` dokümantasyon
portalına erişimi engellediği için **hiçbir Logo API çağrısı canlı test
edilemedi**. Devam etmeden önce:

1. **Fatura oluşturma endpoint'i** — `src/logo/logoClient.js` içindeki
   `POST /api/v1.0/invoice/create` yolu ve `src/logo/invoiceMapper.js`
   içindeki alan adları (customer/lines/vatRate vb.) **tahmini**dir, gerçek
   API şemasıyla teyit edilip güncellenmelidir. `developers.isbasi.com`
   üzerinden ilgili endpoint dokümanını paylaşırsanız bu kısmı kesinleştiririm.
2. **Login yanıt formatı** — `logoClient.js`'deki token alanı adı
   (`token`/`accessToken`/`data.token`) doğrulanmalı.
3. **Müşteri kaydı** — Logo, faturalamadan önce müşterinin ayrıca
   oluşturulmasını/aranmasını mı istiyor, yoksa müşteri bilgisi fatura isteğine
   satır içi mi gönderiliyor? Dokümana göre netleştirilmeli.
4. **Kur tipi** — TCMB kurundan hangisinin (`ForexBuying`/`ForexSelling`/...)
   kullanılacağı `TCMB_RATE_TYPE` ile ayarlanabilir; mali müşavirinizle teyit
   edin.
5. **KDV muafiyet kodu** — Örnek faturanızda "Hizmet İhracı" (302/11/1-a)
   kullanılmış; Etsy'den satılan fiziksel ürünler için bunun doğru
   sınıflandırma olup olmadığını (vs. "Mal İhracı") muhasebecinizle teyit edin.
6. **Çoklu ürünlü / dijital siparişler** — Parser tek örnek üzerinden
   yazıldı; birden fazla ürünlü siparişler, kargo adresi olmayan dijital
   ürün siparişleri ve ABD dışı adresler ile ayrıca test edilmeli.
7. **Mükerrer fatura koruması** — Şu an tekrar deneme sadece e-posta
   `\Seen` durumuna dayanıyor; aynı sipariş için IMAP dışında bir kayıt
   (ör. veritabanı) tutulmuyor. Aynı e-postanın yanlışlıkla iki kez
   işlenmemesi için ek bir idempotency kontrolü (sipariş no bazlı) eklemek
   isteyebilirsiniz.

## Ortam değişkenleri

Bkz. `.env.example`.

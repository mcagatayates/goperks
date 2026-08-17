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

`developers.isbasi.com` API referansı paylaşıldıktan sonra endpoint'ler ve
login/fatura akışı gerçek dokümana göre güncellendi, ancak bu oturumun ağ
politikası test ortamına (`soho-isbasi-mwv2-test.logo-paas.com`) erişimi
engellediği için **hiçbir Logo API çağrısı canlı test edilemedi**. Devam
etmeden önce:

1. ✅ **Fatura oluşturma endpoint'i** — `POST /api/v1.0/invoices/integrationInvoices`
   olarak doğrulandı (`src/logo/logoClient.js`). `invoiceId: 0` yeni kayıt
   oluşturur.
2. **Login yanıt alan adları** — `integrationLogin` yanıtındaki token/tenant
   alanlarının tam adı (`accessToken`/`token`, `tenantId`/`TenantId`) API
   referansında örnek yanıt olarak verilmedi, sadece istek örneği var.
   `src/logo/logoClient.js` yaygın adlandırmaları deniyor ve eşleşmezse
   hata fırlatıyor — test ortamına gerçek bir login denemesi yapılıp
   dönen JSON paylaşılırsa kesinleştirilir.
3. **`salesInvoiceDetails` satır alanları** — API referansı bu dizinin
   amacını anlatıyor ("ürün/hizmet adı, miktar, tutar, KDV oranı") ama tam
   alan adlarını tablo halinde vermiyor. `src/logo/invoiceMapper.js`
   içindeki `productName/quantity/unit/price/vatRate/vatExemptionCode`
   alanları makul bir taslak; test ortamında bir deneme isteğiyle (muhtemelen
   400 hatası dönerse mesajındaki eksik/yanlış alan adlarıyla) netleştirilmeli.
4. **`vatExemptionCode` konumu** — Dokümana göre "Muafiyetli satırlar için
   vatExemptionCode doldurulmalıdır, kodlar `/api/v1.0/master/vatexcepts`
   endpointinden alınır." Kodun gerçekten `302/11/1-a` olarak mı, yoksa
   `/master/vatexcepts` listesindeki başka bir kod/ID olarak mı
   gönderilmesi gerektiği teyit edilmeli.
5. **`eArchivePortalInvoice.eGovernmentType`** — Paylaştığınız gerçek müşteri
   kartı ekran görüntüsünde "Fatura Türü: E-Arşiv" (İnternet değil) ve
   "İrsaliye Yerine Geçer" işaretli olduğu için `invoiceMapper.js` artık
   `eArchivePortalInvoice: { isEArchive: true, dispatchIncluded: true }`
   gönderiyor — bu kısım ekran görüntüsüyle doğrulandı. Ancak ekranda görünen
   "GİB Fatura Tipi: Satış" seçeneğinin API'deki `eGovernmentType` sayısal/
   string değeri dokümanda verilmemiş; alan şu an bilinçli olarak boş
   bırakıldı (gönderilen JSON'da otomatik olarak düşüyor). Web araması bu
   değeri açığa çıkarmadı — netleştirmek için ya bir test çağrısı, ya da
   Logo'nun entegrasyon destek hattı (isbasientegrasyon@logo.com.tr) gerekiyor.
6. ✅ **Müşteri (cari) eşleştirme davranışı** — Teyit edildi: her sipariş
   için yeni bir cari açılacak (ortak/paylaşılan bir "Etsy Alıcıları" kodu
   kullanılmıyor). `customer.code` bilinçli olarak gönderilmiyor.
   Paylaştığınız gerçek müşteri kartına göre `taxOrPersonalId` alanına
   yabancı bireysel müşteriler için kullandığınız yer tutucu değer
   (`LOGO_FOREIGN_CUSTOMER_TCKN`, varsayılan `2222222222`) ve
   `notApplyVat: true` eklendi. Adres, ekran görüntüsündeki gibi tek bir
   serbest metin bloğu olarak gönderiliyor (il/ilçe alanları boş
   bırakılıyor, yalnızca `country` dropdown'ı dolduruluyor).
7. **Kur tipi** — TCMB kurundan hangisinin (`ForexBuying`/`ForexSelling`/...)
   kullanılacağı `TCMB_RATE_TYPE` ile ayarlanabilir; mali müşavirinizle teyit
   edin.
8. **KDV muafiyet kodu** — Örnek faturanızda "Hizmet İhracı" (302/11/1-a)
   kullanılmış; Etsy'den satılan fiziksel ürünler için bunun doğru
   sınıflandırma olup olmadığını (vs. "Mal İhracı") muhasebecinizle teyit edin.
9. **Çoklu ürünlü / dijital siparişler** — Parser tek örnek üzerinden
   yazıldı; birden fazla ürünlü siparişler, kargo adresi olmayan dijital
   ürün siparişleri ve ABD dışı adresler ile ayrıca test edilmeli.
10. ✅ **Mükerrer fatura koruması** — `src/state/processedOrders.js`,
    faturası kesilen Etsy sipariş numaralarını yerel bir JSON dosyasında
    (`PROCESSED_ORDERS_FILE`, varsayılan `automation/data/processed-orders.json`)
    tutuyor. IMAP `\Seen` durumundan bağımsız olarak, aynı sipariş numarası
    tekrar görülürse fatura ikinci kez oluşturulmuyor. Bu dosya git'e
    commit edilmez (`.gitignore`); üretimde kalıcı bir diske (ör. mount
    edilmiş bir volume) yazıldığından emin olun, aksi halde konteyner
    yeniden başladığında sıfırlanır.

## Ortam değişkenleri

Bkz. `.env.example`.

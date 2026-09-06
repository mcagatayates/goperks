import type { Channel, ReservationStatus } from "@/lib/types";

// The product targets the Turkish restaurant market only — there is no
// locale switching, so this is a flat dictionary rather than a per-locale
// lookup table.
export const dictionary = {
  nav: {
    pricing: "Fiyatlandırma",
    liveDemo: "Canlı demo",
    dashboard: "Panel",
  },
  landing: {
    heroTitle: "Restoranınızın resepsiyonunda artık yapay zeka var — 7/24",
    heroSubtitle:
      "HeyTable, web siteniz ve WhatsApp üzerinden gelen her rezervasyon talebini yanıtlar, gerçek masa müsaitliğini kontrol eder, anında onaylar ve akşamın özel yemeklerini önerir — ekibiniz salona odaklanabilsin diye.",
    ctaPrimary: "Canlı demoyu dene",
    ctaSecondary: "Restoran panelini gör",
    builtForLabel: "Kimler için",
    audiences: [
      "Bağımsız restoranlar",
      "Çoklu şube zincirleri",
      "Fine dining",
      "Günlük restoran ve kafeler",
    ],
    howItWorksTitle: "Nasıl çalışır",
    steps: [
      {
        title: "Misafir mesaj atar",
        body: "Web sitenizdeki sohbet veya WhatsApp üzerinden — günün her saati, hangi dilde yazarsa o dilde.",
      },
      {
        title: "HeyTable hallediyor",
        body: "Gerçek masa müsaitliğini kontrol eder, rezervasyonu onaylar ve akşamın özel yemeklerini önerebilir.",
      },
      {
        title: "Ekibiniz her şeyi görür",
        body: "Her rezervasyon ve konuşmanın tam kaydı tek bir panelde toplanır — elle giriş yapmaya gerek yok.",
      },
    ],
    featuresTitle: "Resepsiyonunuzun yaptığı her şey — otomatik",
    features: [
      {
        title: "Web sohbet + WhatsApp",
        body: "Aynı AI resepsiyonist, misafirlerin zaten bulunduğu her yerde — indirilecek bir uygulama yok.",
      },
      {
        title: "Gerçek zamanlı müsaitlik",
        body: "Her onay gerçek masalarınıza göre kontrol edilir — asla çift rezervasyon olmaz.",
      },
      {
        title: "Kendi kendine değişiklik",
        body: "Misafirler sadece sorarak erteleyebilir veya iptal edebilir — telefon araması, bekleme müziği yok.",
      },
      {
        title: "Akıllı upsell",
        body: "Konuşmanın doğru anında şefin özel yemeklerini ve mevsimlik menüyü öne çıkarır.",
      },
      {
        title: "Varsayılan olarak çok dilli",
        body: "Misafir hangi dilde yazarsa o dilde yanıt verir — ayar gerekmez.",
      },
      {
        title: "Tek panel",
        body: "Rezervasyonlar, masalar, özel yemekler ve tüm konuşma kayıtları tek bir yerde.",
      },
    ],
    channelsTitle: "Kanallar",
    channels: [
      { label: "Web sohbet", status: "Canlı", isLive: true },
      { label: "WhatsApp", status: "Canlı", isLive: true },
      { label: "Sesli / telefon", status: "Yakında", isLive: false },
    ],
    pricingTitle: "Basit, şeffaf fiyatlandırma",
    pricingSubtitle:
      "Kurumsal değil, bağımsız bir restoranın bütçesine göre fiyatlandırıldı. Her pakette AI resepsiyonist, gerçek zamanlı müsaitlik ve yönetim paneli var.",
    pricingBillingNote: "Fiyatlar Türk Lirası ile, aylık faturalandırılır.",
    pricingOverage: "Paket üzeri her konuşma: ₺4.",
    pricingTiers: [
      {
        name: "Başlangıç",
        price: "₺1.490",
        period: "/ay",
        description: "Yeni başlayan tek bir restoran için.",
        features: [
          "Web sohbet resepsiyonisti",
          "Ayda 200 AI konuşmasına kadar",
          "Rezervasyon, masa ve menü yönetimi",
          "Tam konuşma geçmişi",
        ],
        cta: "Hemen başla",
        highlighted: false,
      },
      {
        name: "Büyüme",
        price: "₺3.990",
        period: "/ay",
        description: "WhatsApp'ı eklemeye hazır restoranlar için.",
        badge: "En popüler",
        features: [
          "Başlangıç'taki her şey",
          "WhatsApp kanalı",
          "Ayda 800 AI konuşmasına kadar",
          "Öncelikli destek",
        ],
        cta: "Hemen başla",
        highlighted: true,
      },
      {
        name: "Kurumsal",
        price: "Özel",
        period: "",
        description: "Çoklu şube zincirleri ve özel ihtiyaçlar için.",
        features: [
          "Büyüme'deki her şey",
          "Çoklu şube desteği",
          "Özel POS/rezervasyon entegrasyonları",
          "Özel hesap yöneticisi",
        ],
        cta: "Bize ulaşın",
        highlighted: false,
      },
    ],
    closingTitle: "Anlatılan değil, çalışan haliyle görün",
    closingBody:
      'Canlı demo tamamen çalışan bir prototiptir — "Masa19" üzerinde gerçek bir masa ayırtın, ardından panelde anında yansıdığını görün.',
    footer:
      'HeyTable — MVP prototip. Test için "Masa19" demo restoranı ile hazırlanmıştır.',
  },
  restaurant: {
    poweredBy: "HeyTable ile çalışıyor",
    openDaily: "Her gün açık",
    specialsTitle: "Bugünün özel yemekleri",
    menuTitle: "Menü",
    chatHint:
      "Masa ayırtmak, değiştirmek veya iptal etmek için köşedeki sohbet balonuna dokunun — AI resepsiyonistimiz günün her saati anında yanıt verir.",
  },
  chat: {
    headerSubtitle: "AI rezervasyon asistanı",
    greeting: (restaurantName: string) =>
      `Merhaba! Ben ${restaurantName} rezervasyon asistanıyım. Sizin için masa ayırtabilir, değiştirebilir veya iptal edebilirim — ne yapmak istersiniz?`,
    inputPlaceholder: "Masa hakkında sorun…",
    send: "Gönder",
    typing: "Yazıyor…",
    bubbleOpen: "Masa ayırt",
    bubbleClose: "Kapat",
    genericError: "Bir şeyler ters gitti.",
    closeAria: "Sohbeti kapat",
  },
  auth: {
    signupTitle: "Restoranınızı ekleyin",
    signupSubtitle:
      "Birkaç bilgiyle hesabınızı oluşturun, hemen ardından masa ve menünüzü ekleyip AI resepsiyonistinizi çalıştırmaya başlayın.",
    loginTitle: "Giriş yap",
    loginSubtitle: "Restoran panelinize erişmek için giriş yapın.",
    restaurantNameLabel: "Restoran adı",
    slugLabel: "URL adı",
    slugHint: "Panel adresiniz: heytable.app/admin/",
    emailLabel: "E-posta",
    passwordLabel: "Şifre",
    passwordHint: "En az 8 karakter",
    addressLabel: "Adres",
    phoneLabel: "Telefon",
    descriptionLabel: "Açıklama",
    descriptionPlaceholder: "opsiyonel",
    openTimeLabel: "Açılış saati",
    closeTimeLabel: "Kapanış saati",
    signupSubmit: "Hesap oluştur",
    signupSubmitting: "Oluşturuluyor…",
    loginSubmit: "Giriş yap",
    loginSubmitting: "Giriş yapılıyor…",
    haveAccount: "Zaten hesabınız var mı?",
    noAccount: "Hesabınız yok mu?",
    loginLink: "Giriş yapın",
    signupLink: "Kayıt olun",
    genericError: "Bir şeyler ters gitti, tekrar deneyin.",
  },
  admin: {
    dashboardLabel: "HeyTable paneli",
    logout: "Çıkış yap",
    tabs: {
      reservations: "Rezervasyonlar",
      menu: "Menü & Özel Yemekler",
      conversations: "Konuşmalar",
      settings: "Ayarlar",
    },
    reservations: {
      dateLabel: "Tarih",
      newButton: "Yeni rezervasyon",
      cancelButton: "Vazgeç",
      loading: "Yükleniyor…",
      empty: "Bu tarih için rezervasyon yok.",
      colTime: "Saat",
      colGuest: "Misafir",
      colParty: "Kişi",
      colTable: "Masa",
      colChannel: "Kanal",
      colStatus: "Durum",
      colNotes: "Not",
    },
    newReservationForm: {
      timeLabel: "Saat",
      partySizeLabel: "Kişi sayısı",
      nameLabel: "Misafir adı",
      phoneLabel: "Telefon",
      notesLabel: "Not",
      notesPlaceholder: "opsiyonel",
      submit: "Masa ayırt",
      submitting: "Ayırtılıyor…",
      genericError: "Rezervasyon oluşturulamadı.",
    },
    waitlist: {
      title: "Bekleme listesi",
      empty: "Bu tarih için bekleme listesi yok.",
      colTime: "Saat",
      colGuest: "Misafir",
      colParty: "Kişi",
      colNotes: "Not",
      colStatus: "Durum",
      statusLabels: {
        waiting: "Bekliyor",
        seated: "Oturdu",
        cancelled: "İptal edildi",
      },
    },
    menu: {
      menuTitle: "Menü & özel yemekler",
      addItemButton: "Ürün ekle",
      tablesTitle: "Masalar",
      addTableButton: "Masa ekle",
      specialLabel: "özel",
      availableLabel: "mevcut",
      removeLabel: "kaldır",
      seatsLabel: "kişilik",
      activeLabel: "aktif",
      confirmDelete: "Bu ürün menüden kaldırılsın mı?",
    },
    newMenuItemForm: {
      nameLabel: "İsim",
      categoryLabel: "Kategori",
      priceLabel: "Fiyat (₺)",
      descriptionLabel: "Açıklama",
      specialLabel: "özel",
      submit: "Ürün ekle",
      genericError: "Ürün eklenemedi.",
      // value is the canonical, database-stored category slug; label is
      // what's shown in the dropdown.
      categoryOptions: [
        { value: "starter", label: "başlangıç" },
        { value: "main", label: "ana yemek" },
        { value: "dessert", label: "tatlı" },
        { value: "drink", label: "içecek" },
      ],
    },
    newTableForm: {
      nameLabel: "İsim",
      namePlaceholder: "T9",
      capacityLabel: "Kapasite",
      submit: "Masa ekle",
      genericError: "Masa eklenemedi.",
    },
    conversations: {
      empty: "Henüz konuşma yok.",
      msgsSuffix: "mesaj",
      selectPrompt: "Kaydı görmek için bir konuşma seçin.",
    },
    statusLabels: {
      pending: "Bekliyor",
      confirmed: "Onaylandı",
      cancelled: "İptal edildi",
      completed: "Tamamlandı",
      no_show: "Gelmedi",
    } satisfies Record<ReservationStatus, string>,
    channelLabels: {
      web: "Web",
      whatsapp: "WhatsApp",
      voice: "Sesli",
      staff: "Personel",
      external: "Dış sistem",
    } satisfies Record<Channel, string>,
    whatsapp: {
      title: "WhatsApp",
      description:
        "Kendi WhatsApp Business numaranızı bağlayın — misafirler doğrudan yazabilir ve AI resepsiyonist, web sohbetinde olduğu gibi yanıt verir.",
      notConfigured:
        "Bu restoranın HeyTable hesabı henüz WhatsApp için ayarlanmamış. Bu bizim tarafımızda yapılan tek seferlik bir kurulum (Meta Tech Provider başvurusu) — sizin yapmanız gereken bir şey yok, hesabınız için aktifleştirmemizi isteyin.",
      connectButton: "WhatsApp'ı Bağla",
      connecting: "Bağlanıyor…",
      connectedTo: (phone: string) => `Bağlı — ${phone}`,
      disconnect: "Bağlantıyı kes",
      loading: "Yükleniyor…",
      popupCancelled: "Bağlantı penceresi tamamlanmadan kapatıldı.",
      missingWabaData:
        "Meta, işletme hesabı bilgilerini döndürmedi — lütfen tekrar deneyin.",
      genericError: "WhatsApp bağlantısı tamamlanamadı.",
    },
    pos: {
      title: "POS / rezervasyon sistemi entegrasyonu",
      description:
        "Kendi POS'unuzu veya rezervasyon sisteminizi bağlamak için API anahtarını ve webhook URL'sini kullanın. Aynı anahtarla hem HeyTable'daki rezervasyonları çekebilir hem de POS'unuzdaki mevcut rezervasyonları buraya gönderip masaların dolu görünmesini sağlayabilirsiniz.",
      apiKeyLabel: "API anahtarı",
      apiKeyHint:
        "Authorization: Bearer <anahtar> başlığında kullanın — hem rezervasyonları çekmek (GET .../pos/reservations) hem de POS'unuzdaki mevcut rezervasyonları buraya göndermek (POST .../pos/external-bookings) için.",
      generateApiKey: "Anahtar oluştur",
      regenerateApiKey: "Anahtarı yenile",
      copy: "Kopyala",
      copied: "Kopyalandı",
      webhookUrlLabel: "Webhook URL'si",
      webhookUrlPlaceholder: "https://sizin-pos-sisteminiz.com/webhooks/heytable",
      webhookSecretLabel: "Webhook imza anahtarı",
      webhookSecretHint:
        "Gelen isteklerin gerçekten HeyTable'dan geldiğini doğrulamak için X-HeyTable-Signature başlığını bu anahtarla HMAC-SHA256 olarak karşılaştırın.",
      save: "Kaydet",
      saving: "Kaydediliyor…",
      genericError: "Bir şeyler ters gitti.",
    },
  },
};

export type Dictionary = typeof dictionary;

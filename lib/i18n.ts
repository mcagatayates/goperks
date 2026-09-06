import type { Channel, ReservationStatus } from "@/lib/types";

export const locales = ["en", "tr"] as const;
export type Locale = (typeof locales)[number];

// Turkish serves at bare paths ("/", "/r/[slug]", "/admin/[slug]") since
// Turkey is the primary market; English lives under "/en" instead of the
// other way around.
export const defaultLocale: Locale = "tr";

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "tr" : "en";
}

export function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

// English is the source of truth for shape; the Turkish dictionary is typed
// against it (`: typeof en`) so a missing key is a compile error, not a
// silent fallback to English text at runtime.
const en = {
  nav: {
    pricing: "Pricing",
    liveDemo: "Live demo",
    dashboard: "Dashboard",
  },
  landing: {
    heroTitle: "Your restaurant's front desk, staffed by AI — 24/7",
    heroSubtitle:
      "HeyTable answers every reservation request on your website and WhatsApp, checks live table availability, confirms instantly, and suggests tonight's specials — so your team can focus on the dining room.",
    ctaPrimary: "Try the live demo",
    ctaSecondary: "See the restaurant dashboard",
    builtForLabel: "Built for",
    audiences: [
      "Independent restaurants",
      "Multi-location groups",
      "Fine dining",
      "Casual dining & cafés",
    ],
    howItWorksTitle: "How it works",
    steps: [
      {
        title: "Guest messages",
        body: "On your website chat or WhatsApp — any time of day, in whatever language they write in.",
      },
      {
        title: "HeyTable handles it",
        body: "Checks real availability against your actual tables, confirms the booking, and can suggest tonight's specials.",
      },
      {
        title: "Your team sees everything",
        body: "Every reservation and full conversation transcript lands in one dashboard — no manual entry.",
      },
    ],
    featuresTitle: "Everything your front desk does — automated",
    features: [
      {
        title: "Web chat + WhatsApp",
        body: "The same AI concierge, wherever guests already are — no app to download.",
      },
      {
        title: "Real-time availability",
        body: "Every confirmation is checked against your actual tables — never double-booked.",
      },
      {
        title: "Self-serve changes",
        body: "Guests reschedule or cancel by just asking — no phone call, no hold music.",
      },
      {
        title: "Smart upsell",
        body: "Surfaces the chef's specials and seasonal menu at the right moment in the conversation.",
      },
      {
        title: "Multilingual by default",
        body: "Replies in whatever language the guest writes in — no configuration needed.",
      },
      {
        title: "One dashboard",
        body: "Reservations, tables, specials, and full conversation logs, all in one place.",
      },
    ],
    channelsTitle: "Channels",
    channels: [
      { label: "Web chat", status: "Live", isLive: true },
      { label: "WhatsApp", status: "Live", isLive: true },
      { label: "Voice / phone", status: "Coming soon", isLive: false },
    ],
    pricingTitle: "Simple, transparent pricing",
    pricingSubtitle:
      "Priced for an independent restaurant's budget, not an enterprise one. Every plan includes the AI concierge, live availability, and the staff dashboard.",
    pricingBillingNote: "Prices in Turkish Lira, billed monthly.",
    pricingOverage: "Extra conversations beyond your plan: ₺4 each.",
    pricingTiers: [
      {
        name: "Starter",
        price: "₺1.490",
        period: "/mo",
        description: "For a single restaurant getting started.",
        features: [
          "Web chat concierge",
          "Up to 200 AI conversations/mo",
          "Reservations, tables & menu management",
          "Full conversation history",
        ],
        cta: "Get started",
        highlighted: false,
      },
      {
        name: "Growth",
        price: "₺3.990",
        period: "/mo",
        description: "For restaurants ready to add WhatsApp.",
        badge: "Most popular",
        features: [
          "Everything in Starter",
          "WhatsApp channel",
          "Up to 800 AI conversations/mo",
          "Priority support",
        ],
        cta: "Get started",
        highlighted: true,
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "For multi-location groups and custom needs.",
        features: [
          "Everything in Growth",
          "Multiple locations",
          "Custom POS/reservation integrations",
          "Dedicated account manager",
        ],
        cta: "Contact us",
        highlighted: false,
      },
    ],
    closingTitle: "See it running, not just described",
    closingBody:
      'The live demo is a fully working prototype — book a real table on "Masa19", then check the dashboard to see it land there instantly.',
    footer:
      'HeyTable — MVP prototype. Demo restaurant "Masa19" seeded for testing.',
  },
  restaurant: {
    poweredBy: "Powered by HeyTable",
    openDaily: "Open daily",
    specialsTitle: "Today's specials",
    menuTitle: "Menu",
    chatHint:
      "Tap the chat bubble in the corner to book, change, or cancel a table — our AI concierge answers instantly, any time of day.",
  },
  chat: {
    headerSubtitle: "AI reservations concierge",
    greeting: (restaurantName: string) =>
      `Hi! I'm the ${restaurantName} reservations concierge. I can book, change, or cancel a table for you — what would you like to do?`,
    inputPlaceholder: "Ask about a table…",
    send: "Send",
    typing: "Typing…",
    bubbleOpen: "Reserve a table",
    bubbleClose: "Close",
    genericError: "Something went wrong.",
    closeAria: "Close chat",
  },
  admin: {
    dashboardLabel: "HeyTable dashboard",
    tabs: {
      reservations: "Reservations",
      menu: "Menu & Specials",
      conversations: "Conversations",
      settings: "Settings",
    },
    reservations: {
      dateLabel: "Date",
      newButton: "New reservation",
      cancelButton: "Cancel",
      loading: "Loading…",
      empty: "No reservations for this date.",
      colTime: "Time",
      colGuest: "Guest",
      colParty: "Party",
      colTable: "Table",
      colChannel: "Channel",
      colStatus: "Status",
      colNotes: "Notes",
    },
    newReservationForm: {
      timeLabel: "Time",
      partySizeLabel: "Party size",
      nameLabel: "Guest name",
      phoneLabel: "Phone",
      notesLabel: "Notes",
      notesPlaceholder: "optional",
      submit: "Book table",
      submitting: "Booking…",
      genericError: "Could not create the reservation.",
    },
    menu: {
      menuTitle: "Menu & specials",
      addItemButton: "Add item",
      tablesTitle: "Tables",
      addTableButton: "Add table",
      specialLabel: "special",
      availableLabel: "available",
      removeLabel: "remove",
      seatsLabel: "seats",
      activeLabel: "active",
      confirmDelete: "Remove this item from the menu?",
    },
    newMenuItemForm: {
      nameLabel: "Name",
      categoryLabel: "Category",
      priceLabel: "Price (₺)",
      descriptionLabel: "Description",
      specialLabel: "special",
      submit: "Add item",
      genericError: "Could not add the item.",
      // value is the canonical, locale-independent category slug stored in
      // the database; label is what's shown in this locale's dropdown.
      categoryOptions: [
        { value: "starter", label: "starter" },
        { value: "main", label: "main" },
        { value: "dessert", label: "dessert" },
        { value: "drink", label: "drink" },
      ],
    },
    newTableForm: {
      nameLabel: "Name",
      namePlaceholder: "T9",
      capacityLabel: "Capacity",
      submit: "Add table",
      genericError: "Could not add the table.",
    },
    conversations: {
      empty: "No conversations yet.",
      msgsSuffix: "msgs",
      selectPrompt: "Select a conversation to view the transcript.",
    },
    statusLabels: {
      pending: "Pending",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      completed: "Completed",
      no_show: "No-show",
    } satisfies Record<ReservationStatus, string>,
    channelLabels: {
      web: "Web",
      whatsapp: "WhatsApp",
      voice: "Voice",
      staff: "Staff",
    } satisfies Record<Channel, string>,
    whatsapp: {
      title: "WhatsApp",
      description:
        "Connect your own WhatsApp Business number — guests can message it directly and the AI concierge answers, same as web chat.",
      notConfigured:
        "This restaurant's HeyTable account isn't set up for WhatsApp yet. That's a one-time setup on our side (a Meta Tech Provider application), not something you need to do — ask us to enable it for your account.",
      connectButton: "Connect WhatsApp",
      connecting: "Connecting…",
      connectedTo: (phone: string) => `Connected — ${phone}`,
      disconnect: "Disconnect",
      loading: "Loading…",
      popupCancelled: "The connection popup was closed before finishing.",
      missingWabaData:
        "Meta didn't return the business account details — please try again.",
      genericError: "Could not finish connecting WhatsApp.",
    },
  },
};

const tr: typeof en = {
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
  admin: {
    dashboardLabel: "HeyTable paneli",
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
    },
    channelLabels: {
      web: "Web",
      whatsapp: "WhatsApp",
      voice: "Sesli",
      staff: "Personel",
    },
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
  },
};

export const dictionaries = { en, tr };

export type Dictionary = typeof en;

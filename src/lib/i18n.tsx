"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type Language = "uz" | "ru" | "en";

type TranslationSet = {
  // =========================
  // NAVBAR / FOOTER
  // =========================

  home: string;
  locations: string;
  contact: string;
  partnerLogin: string;
  admin: string;
  findStorage: string;

  support: string;
  cityUz: string;

  language: string;
  uzbek: string;
  russian: string;
  english: string;

  footerText: string;

  // =========================
  // COMMON
  // =========================

  common: {
    loading: string;
    error: string;
    tryAgain: string;
    back: string;
    save: string;
    cancel: string;
    close: string;
    refresh: string;
    logout: string;
    search: string;
    viewLocation: string;
    comingSoon: string;
  };

  // =========================
  // HOME
  // =========================

  homePage: {
    liveNow: string;
    heroTitle: string;
    heroDescription: string;
    findStorage: string;
    howItWorks: string;

    searchPlaceholder: string;
    search: string;

    mapTitle: string;
    mapDescription: string;

    whyTitle: string;

    verifiedPartners: string;
    verifiedPartnersText: string;

    qrCheckin: string;
    qrCheckinText: string;

    luggageTags: string;
    luggageTagsText: string;

    securePayment: string;
    securePaymentText: string;

    faqTitle: string;

    citiesTitle: string;
    samarkand: string;
    tashkent: string;
    bukhara: string;
    khiva: string;
    locationsLive: string;
    comingSoon: string;

    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;

    faq1q: string;
    faq1a: string;
    faq2q: string;
    faq2a: string;
    faq3q: string;
    faq3a: string;
    faq4q: string;
    faq4a: string;
  };

  // =========================
  // LOCATIONS
  // =========================

  locationsPage: {
    title: string;
    description: string;
    searchPlaceholder: string;
    search: string;
    noLocations: string;
    loading: string;
    perBagDay: string;
    bagsCapacity: string;
    open: string;
    closed: string;
    viewLocation: string;
    bookNow: string;

    loadErrorTitle: string;
    liveLocations: string;
    chooseCity: string;
    tashkent: string;
    samarkand: string;
    bukhara: string;
    khiva: string;
    locationSingular: string;
    locationPlural: string;
    locationsTitleSuffix: string;
    found: string;
    updatingAvailability: string;
    preparingLocations: string;
    checkBackSoon: string;
    free: string;
    full: string;
    price: string;
    upTo12Hours: string;
    per24Hours: string;
    hours: string;
    daily: string;
    capacity: string;
    bags: string;
    totalStorage: string;
    available: string;
    currentlyFull: string;
    viewDetails: string;
    mapTitle: string;
    locationsOnMap: string;
    live: string;
  };

  // =========================
  // LOCATION DETAIL
  // =========================

  locationDetail: {
    backToLocations: string;
    availableBags: string;
    bagsAvailable: string;
    pricePerBagDay: string;
    openingHours: string;
    amenities: string;
    bookThisLocation: string;
    getDirections: string;
    verifiedPartner: string;

    loadingLocation: string;
    locationNotFound: string;
    locationNotFoundText: string;
    loadError: string;
    availabilityError: string;
    openNow: string;
    closedNow: string;
    from: string;
    upTo12Hours: string;
    hours24: string;
    upTo12HoursShort: string;
    upTo24HoursShort: string;
    totalCapacity: string;
    price: string;
    findUs: string;
    howItWorks: string;
    bookOnline: string;
    bookOnlineText: string;
    dropBags: string;
    dropBagsText: string;
    exploreFreely: string;
    exploreFreelyText: string;
    selectStoragePeriod: string;
    perBag: string;
    priceSummary: string;
    dropOff: string;
    pickup: string;
    date: string;
    time: string;
    availableForYourTime: string;
    checking: string;
    bags: string;
    reserved: string;
    total: string;
    spacesAvailable: string;
    noSpace: string;
    pickupAfterDropoff: string;
    max24Hours: string;
    withinOpeningHours: string;
    nextStep: string;
    verifiedSimple: string;
    verifiedSimpleText: string;
    defaultDescription: string;
  };

  // =========================
  // BOOKING
  // =========================

  booking: {
    chooseDateTime: string;
    openingHours: string;
    openingHoursFor: string;
    dropOff: string;
    pickup: string;
    dropOffDate: string;
    dropOffTime: string;
    pickupDate: string;
    pickupTime: string;
    numberOfBags: string;
    chooseBags: string;
    maximum: string;
    bagsPerBooking: string;
    availabilityForTime: string;
    bagSingular: string;
    bagPlural: string;
    reserved: string;
    totalCapacity: string;
    availabilityAutoUpdate: string;
    decreaseBags: string;
    increaseBags: string;
    availableLimitReached: string;
    noBagsAvailable: string;
    chooseAnotherTime: string;
    customerDetails: string;
    noAccountNeeded: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    telegramOptional: string;
    emailRequired: string;
    reviewPrice: string;
    location: string;
    duration: string;
    rate: string;
    rate12: string;
    rate24: string;
    hours: string;
    bags: string;
    total: string;
    usdApprox: string;
    safetyTitle: string;
    safetyIntro: string;
    passport: string;
    cash: string;
    bankCards: string;
    jewelry: string;
    electronics: string;
    medicines: string;
    documents: string;
    keys: string;
    safetyRecommendation: string;
    safetyAcknowledgement: string;
    bagIs: string;
    bagsAre: string;
    availableForSelectedTime: string;
    confirmBooking: string;
    creatingBooking: string;
    continueButton: string;
    bookingConfirmed: string;
    bookingSaved: string;
    bookingInformation: string;
    bookingNumber: string;
    status: string;
    yourQrCode: string;
    showQr: string;
    qrAlt: string;
    loadingQr: string;
    qrSentEmail: string;
    qrEmailSentTo: string;
    didntReceiveEmail: string;
    checkSpam: string;
    qrActive: string;
    qrWaitingPayment: string;
    qrAfterPayment: string;
    qrEmailAfterPayment: string;
    bagTags: string;
    bagTagsDescription: string;
    paymentRequiredNotice: string;
    preparingPayment: string;
    continuePayment: string;
    paymentTransactionCreated: string;
    backToLocations: string;
    backToLocation: string;
    loadingLocation: string;
    loadLocationError: string;
    locationNotFound: string;
    locationSlugMissing: string;
    availabilityError: string;
    bookingDataMissing: string;
    paymentCreateError: string;
    safetyConfirmError: string;
    max24HoursError: string;
    validEmailError: string;
    notEnoughBagsError: string;
    createBookingError: string;
    max24HoursMessage: string;
    pickupAfterDropoff: string;
    arriveWithinOpeningHours: string;
    bagsAvailableForTime: string;
    checking: string;
    notAvailable: string;
    required: string;
  };

  // =========================
  // CONTACT
  // =========================

  contactPage: {
    title: string;
    description: string;
    support: string;

    email: string;
    phone: string;
    telegram: string;

    message: string;
    send: string;
    name: string;

    success: string;
    error: string;
  };

  // =========================
  // PARTNER
  // =========================

  partnerPage: {
    dashboard: string;
    account: string;

    scanBooking: string;
    bookingNumber: string;
    qrToken: string;
    findBooking: string;

    scanQr: string;
    openingCamera: string;
    closeCamera: string;
    cameraInstruction: string;

    checkIn: string;
    checkOut: string;

    checkedIn: string;
    completed: string;

    upcoming: string;
    activeLuggage: string;
    pickupExpected: string;
    earnings: string;

    bookingNotFound: string;

    checkInSuccess: string;
    checkOutSuccess: string;

    location: string;
    bookings: string;
    status: string;
    customer: string;
    bags: string;
    total: string;
    dropOff: string;
    pickup: string;

    loadingBookings: string;
    noBookings: string;

    loginTitle: string;
    loginDescription: string;
    loginButton: string;
    email: string;
    password: string;
  };

  // =========================
  // ADMIN
  // =========================

  adminPage: {
    dashboard: string;
    liveData: string;

    bookings: string;
    bookingsToday: string;
    revenue: string;
    activeLuggage: string;
    completed: string;
    cancelled: string;

    pendingPayment: string;
    paidWaiting: string;
    checkedIn: string;

    locations: string;

    refresh: string;

    editLocation: string;

    name: string;
    address: string;
    pricePerBag: string;
    capacity: string;
    openingTime: string;
    closingTime: string;

    active: string;

    googleMaps: string;
    yandexMaps: string;

    saveChanges: string;

    couldNotLoad: string;
    noBookings: string;
    allStatuses: string;

    loginTitle: string;
    loginDescription: string;
    loginButton: string;

    email: string;
    password: string;

    locationUpdated: string;
  };
};

// ============================================================
// TRANSLATIONS
// ============================================================

export const translations: Record<
  Language,
  TranslationSet
> = {
  // ==========================================================
  // UZBEK
  // ==========================================================

  uz: {
    home: "Bosh sahifa",
    locations: "Joylar",
    contact: "Aloqa",
    partnerLogin: "Hamkor kirishi",
    admin: "Admin",
    findStorage: "Saqlash joyini topish",

    support: "Qo‘llab-quvvatlash",
    cityUz: "Samarqand, O‘zbekiston",

    language: "Til",
    uzbek: "O‘zbekcha",
    russian: "Русский",
    english: "English",

    footerText:
      "BagDrop — sayohatingizni yuklarsiz davom ettiring.",

    common: {
      loading: "Yuklanmoqda...",
      error: "Xatolik yuz berdi.",
      tryAgain: "Qayta urinish",
      back: "Orqaga",
      save: "Saqlash",
      cancel: "Bekor qilish",
      close: "Yopish",
      refresh: "Yangilash",
      logout: "Chiqish",
      search: "Qidirish",
      viewLocation: "Joyni ko‘rish",
      comingSoon: "Tez orada",
    },

    homePage: {
      liveNow: "Hozir ishlamoqda:",
      heroTitle:
        "Sumkalaringizni qoldiring. O‘zbekistonni kashf eting.",
      heroDescription:
        "O‘zbekistonda tashrif buyurmoqchi bo‘lgan joylaringiz yaqinida xavfsiz yuk saqlash xizmati. Ikki daqiqadan kam vaqtda bron qiling, onlayn to‘lang va QR kodingizni ko‘rsating.",
      findStorage: "Yuk saqlash joyini topish",
      howItWorks: "Qanday ishlaydi?",

      searchPlaceholder:
        'Masalan, "Registan yaqinida" yoki "Samarqand vokzali"',
      search: "Qidirish",

      mapTitle: "Samarqanddagi barcha joylar",
      mapDescription:
        "Manzilingizga yaqin BagDrop joyini toping.",

      whyTitle:
        "Nega sayohatchilar BagDrop'ga ishonishadi?",

      verifiedPartners: "Tekshirilgan hamkorlar",
      verifiedPartnersText:
        "Har bir joy tarmoqqa qo‘shilishidan oldin tekshiriladi va tasdiqlanadi.",

      qrCheckin: "QR orqali qabul qilish",
      qrCheckinText:
        "Qog‘ozbozliksiz — bron va yuk yorlig‘i QR kod orqali boshqariladi.",

      luggageTags: "Yuk yorliqlari",
      luggageTagsText:
        "Har bir yuk alohida yorliqlanadi, shuning uchun yuklar aralashib ketmaydi.",

      securePayment: "Xavfsiz to‘lov",
      securePaymentText:
        "Onlayn to‘lov — bron tasdiqlanishidan oldin tekshiriladi.",

      faqTitle: "Ko‘p beriladigan savollar",

      citiesTitle: "Shaharlar",
      samarkand: "Samarqand",
      locationsLive: "joy · hozir ishlamoqda",
      comingSoon: "Tez orada",
      tashkent: "Toshkent",
      bukhara: "Buxoro",
      khiva: "Xiva",

      step1: "Yo‘lingizdagi joyga yaqin saqlash punktini tanlang",
      step2: "Onlayn bron qiling — topshirish va olib ketish vaqtini tanlang",
      step3: "Xavfsiz to‘lang va QR kodingizni oling",
      step4: "QR kodni ko‘rsating, yukingizni qoldiring va yorliq oling",
      step5: "Yuksiz holda shaharni kashf eting",
      step6: "Qayting, QR kodni yana skanerlang va yukingizni oling",

      faq1q: "Qaysi buyumlarni saqlash mumkin emas?",
      faq1a: "Qurol, portlovchi moddalar, noqonuniy giyohvand moddalar, xavfli materiallar, tirik hayvonlar va boshqa taqiqlangan yoki noqonuniy buyumlarni BagDrop punktlarida saqlash mumkin emas.",
      faq2q: "Yukimni qanday qaytarib olaman?",
      faq2a: "O‘sha punktda bron QR kodingizni ko‘rsating. Xodim yuk yorlig‘ingizni tekshiradi va yuklaringizni qaytaradi.",
      faq3q: "Akkaunt yaratishim kerakmi?",
      faq3a: "Yo‘q — mehmon sifatida ham bron qilishingiz mumkin. Bron tasdig‘i va QR kodingizni bron qilgandan keyin olasiz.",
      faq4q: "Agar punkt to‘liq band bo‘lsa nima qilaman?",
      faq4a: "Mavjudlik har bir punkt sahifasida ko‘rsatiladi. Yaqin punktni yoki boshqa vaqt oralig‘ini tanlab ko‘ring.",
    },

    locationsPage: {
      title: "Yuk saqlash joylari",
      description:
        "Shaharni tanlang va yukingiz uchun qulay BagDrop joyini toping.",
      searchPlaceholder: "Joy yoki manzilni qidiring...",
      search: "Qidirish",
      noLocations: "Hozircha BagDrop joylari yo‘q.",
      loading: "Joylar yuklanmoqda...",
      perBagDay: "sumka / kun",
      bagsCapacity: "sumka sig‘imi",
      open: "Ochiq",
      closed: "Yopiq",
      viewLocation: "Joyni ko‘rish",
      bookNow: "Hozir bron qilish",

      loadErrorTitle: "Joylarni yuklab bo‘lmadi",
      liveLocations: "Faol joylar",
      chooseCity: "Shaharingizni tanlang",
      tashkent: "Toshkent",
      samarkand: "Samarqand",
      bukhara: "Buxoro",
      khiva: "Xiva",
      locationSingular: "joy",
      locationPlural: "joy",
      locationsTitleSuffix: "joylari",
      found: "topildi",
      updatingAvailability: "Mavjudlik yangilanmoqda",
      preparingLocations: "Biz",
      checkBackSoon: "Tez orada yana tekshiring.",
      free: "bo‘sh",
      full: "To‘liq band",
      price: "Narx",
      upTo12Hours: "12 soatgacha",
      per24Hours: "/ 24 soat",
      hours: "Ish vaqti",
      daily: "har kuni",
      capacity: "Sig‘im",
      bags: "sumka",
      totalStorage: "umumiy saqlash sig‘imi",
      available: "Mavjud",
      currentlyFull: "Hozircha to‘liq band",
      viewDetails: "Batafsil ko‘rish →",
      mapTitle: "BagDrop joylari",
      locationsOnMap: "joy xaritada",
      live: "Faol",
    },

    locationDetail: {
      backToLocations: "Joylarga qaytish",
      availableBags: "Mavjud yuklar",
      bagsAvailable: "sumka mavjud",
      pricePerBagDay: "sumka / kun",
      openingHours: "Ish vaqti",
      amenities: "Qulayliklar",
      bookThisLocation: "Shu joyni bron qilish",
      getDirections: "Yo‘nalishni olish",
      verifiedPartner: "Tekshirilgan hamkor",
      loadingLocation: "Joy yuklanmoqda...",
      locationNotFound: "Joy topilmadi",
      locationNotFoundText: "Bu yuk saqlash joyini topib bo‘lmadi.",
      loadError: "Joyni yuklab bo‘lmadi.",
      availabilityError: "Mavjudlikni tekshirib bo‘lmadi.",
      openNow: "Hozir ochiq",
      closedNow: "Hozir yopiq",
      from: "Boshlang‘ich narx",
      upTo12Hours: "12 soatgacha",
      hours24: "24 soat",
      upTo12HoursShort: "12 soatgacha",
      upTo24HoursShort: "24 soatgacha",
      totalCapacity: "Umumiy sig‘im",
      price: "Narx",
      findUs: "Bizni toping",
      howItWorks: "BagDrop qanday ishlaydi",
      bookOnline: "Onlayn bron qiling",
      bookOnlineText: "Sana, vaqt va sumkalar sonini tanlang.",
      dropBags: "Sumkalaringizni topshiring",
      dropBagsText: "QR kodingizni tekshirilgan hamkorimizga ko‘rsating.",
      exploreFreely: "Erkin sayr qiling",
      exploreFreelyText: "Yukingizni ko‘tarmasdan Samarqandni kashf eting.",
      selectStoragePeriod: "Saqlash muddatini tanlang",
      perBag: "har bir sumka uchun",
      priceSummary: "40 000 / 12 soat · 65 000 / 24 soat",
      dropOff: "Topshirish",
      pickup: "Olib ketish",
      date: "Sana",
      time: "Vaqt",
      availableForYourTime: "Siz tanlagan vaqt uchun mavjud",
      checking: "Tekshirilmoqda...",
      bags: "sumka",
      reserved: "band qilingan",
      total: "jami",
      spacesAvailable: "Tanlangan davr uchun joy mavjud.",
      noSpace: "Bu davr uchun bo‘sh joy mavjud emas.",
      pickupAfterDropoff: "Olib ketish vaqti topshirish vaqtidan keyin bo‘lishi kerak.",
      max24Hours: "Saqlash muddati 24 soatdan oshmasligi kerak.",
      withinOpeningHours: "Iltimos, joyning ish vaqti ichidagi vaqtni tanlang.",
      nextStep: "Keyingi bosqichda ma’lumotlaringiz va sumkalar sonini tasdiqlaysiz.",
      verifiedSimple: "Tekshirilgan va oddiy",
      verifiedSimpleText: "Yukingiz BagDrop hamkori tomonidan bron QR kodingiz orqali qabul qilinadi va qaytariladi.",
      defaultDescription: "BagDrop {name} joyida yukingizni xavfsiz saqlang. Sumkalaringizni qoldiring, shaharni kashf eting va tayyor bo‘lganingizda olib keting.",

    },

    booking: {
      chooseDateTime: "Sana va vaqtni tanlang",
      openingHours: "Ish vaqti",
      openingHoursFor: "Ish vaqti:",
      dropOff: "Topshirish",
      pickup: "Olib ketish",
      dropOffDate: "Topshirish sanasi",
      dropOffTime: "Topshirish vaqti",
      pickupDate: "Olib ketish sanasi",
      pickupTime: "Olib ketish vaqti",
      numberOfBags: "Sumkalar soni",
      chooseBags: "Nechta sumka saqlamoqchi ekaningizni tanlang.",
      maximum: "Maksimal",
      bagsPerBooking: "sumka / bron",
      availabilityForTime: "Tanlangan vaqtdagi mavjudlik",
      bagSingular: "sumka",
      bagPlural: "sumka",
      reserved: "band qilingan",
      totalCapacity: "jami sig‘im",
      availabilityAutoUpdate: "Mavjudlik avtomatik yangilanadi.",
      decreaseBags: "Sumkalar sonini kamaytirish",
      increaseBags: "Sumkalar sonini oshirish",
      availableLimitReached: "Ushbu bron uchun mavjud limitga yetdingiz.",
      noBagsAvailable: "Mavjud sumkalar yo‘q",
      chooseAnotherTime: "Boshqa sana yoki vaqtni tanlang.",
      customerDetails: "Mijoz ma’lumotlari",
      noAccountNeeded: "Akkaunt kerak emas — bron qilgandan so‘ng tasdiq emailingizga yuboriladi.",
      firstName: "Ism",
      lastName: "Familiya",
      phone: "Telefon",
      email: "Email",
      telegramOptional: "Telegram username (ixtiyoriy)",
      emailRequired: "Email kiritish shart.",
      reviewPrice: "Bron va narxni tekshirish",
      location: "Joy",
      duration: "Davomiyligi",
      rate: "Tarif",
      rate12: "12 soatgacha · 40 000 UZS / sumka",
      rate24: "24 soatgacha · 65 000 UZS / sumka",
      hours: "soat",
      bags: "Sumkalar",
      total: "Jami",
      usdApprox: "USD miqdori taxminiy ko‘rsatilgan. Yakuniy to‘lov UZSda amalga oshiriladi.",
      safetyTitle: "Muhim xavfsizlik eslatmasi",
      safetyIntro: "Yukingizni topshirishdan oldin quyidagi buyumlarni o‘zingiz bilan olib qoling:",
      passport: "Pasport / ID karta",
      cash: "Naqd pul",
      bankCards: "Bank kartalari",
      jewelry: "Zargarlik buyumlari va qimmatbaho narsalar",
      electronics: "Qimmatbaho elektronika",
      medicines: "Muhim dorilar",
      documents: "Muhim hujjatlar",
      keys: "Kalitlar va boshqa zarur shaxsiy buyumlar",
      safetyRecommendation: "BagDrop ushbu buyumlarni yuk ichida qoldirmaslikni tavsiya qiladi.",
      safetyAcknowledgement: "Muhim hujjatlar, naqd pul, bank kartalari yoki qimmatbaho buyumlarni yukim ichida qoldirmasligim kerakligini tushundim.",
      bagIs: "sumka mavjud",
      bagsAre: "sumka mavjud",
      availableForSelectedTime: "tanlangan vaqt uchun.",
      confirmBooking: "Bronni tasdiqlash",
      creatingBooking: "Bron yaratilmoqda...",
      continueButton: "Davom etish",
      bookingConfirmed: "Bron tasdiqlandi",
      bookingSaved: "Broningiz muvaffaqiyatli saqlandi.",
      bookingInformation: "Bron ma’lumotlari",
      bookingNumber: "Bron raqami",
      status: "Holat",
      yourQrCode: "Sizning QR kodingiz",
      showQr: "Kelganingizda ushbu QR kodni BagDrop hamkoriga ko‘rsating.",
      qrAlt: "BagDrop bron QR kodi",
      loadingQr: "QR kod yuklanmoqda...",
      qrSentEmail: "QR kod emailingizga yuborildi",
      qrEmailSentTo: "Bron ma’lumotlari va QR kod quyidagi manzilga yuborildi:",
      didntReceiveEmail: "Emailni olmadingizmi?",
      checkSpam: "Spam yoki Promotions papkalarini tekshiring.",
      qrActive: "QR kodingiz faol.",
      qrWaitingPayment: "QR kodi to‘lovni kutmoqda",
      qrAfterPayment: "To‘lov muvaffaqiyatli tasdiqlangandan keyin QR kodingiz shu yerda paydo bo‘ladi.",
      qrEmailAfterPayment: "To‘lov tasdiqlangandan keyingina QR kod quyidagi emailga yuboriladi:",
      bagTags: "Yuk yorliqlari",
      bagTagsDescription: "Bu yorliqlar check-in vaqtida yuklaringizga biriktiriladi.",
      paymentRequiredNotice: "QR kod faollashishidan oldin to‘lov talab qilinadi. QR kod va email tasdig‘i to‘lov muvaffaqiyatli tekshirilgandan keyin mavjud bo‘ladi.",
      preparingPayment: "To‘lov tayyorlanmoqda...",
      continuePayment: "To‘lovga o‘tish",
      paymentTransactionCreated: "To‘lov tranzaksiyasi yaratildi. Holat:",
      backToLocations: "Joylarga qaytish",
      backToLocation: "Joyga qaytish",
      loadingLocation: "Joy yuklanmoqda...",
      loadLocationError: "Joyni yuklab bo‘lmadi.",
      locationNotFound: "Joy topilmadi.",
      locationSlugMissing: "Joy slug'i ko‘rsatilmagan.",
      availabilityError: "Mavjudlikni yuklab bo‘lmadi.",
      bookingDataMissing: "Bron ma’lumotlari topilmadi. Iltimos, qayta urinib ko‘ring.",
      paymentCreateError: "To‘lov yaratishda xatolik yuz berdi.",
      safetyConfirmError: "Shaxsiy buyumlar xavfsizligi haqidagi eslatmani tushunganingizni tasdiqlang.",
      max24HoursError: "BagDrop bronlari hozircha maksimal 24 soatga amalga oshiriladi.",
      validEmailError: "To‘g‘ri email manzilini kiriting.",
      notEnoughBagsError: "Tanlangan vaqt uchun yetarli sumka mavjud emas.",
      createBookingError: "Bron yaratib bo‘lmadi.",
      max24HoursMessage: "Saqlashning maksimal muddati 24 soat. Iltimos, ertaroq olib ketish vaqtini tanlang.",
      pickupAfterDropoff: "Olib ketish vaqti topshirish vaqtidan keyin bo‘lishi kerak.",
      arriveWithinOpeningHours: "Iltimos, punktning ish vaqti ichida keling",
      bagsAvailableForTime: "Tanlangan vaqtda mavjud sumkalar",
      checking: "Tekshirilmoqda...",
      notAvailable: "—",
      required: "majburiy",
    },

    contactPage: {
      title: "Biz bilan bog‘laning",
      description:
        "Savolingiz bormi? BagDrop jamoasi bilan bog‘laning.",
      support: "Qo‘llab-quvvatlash",

      email: "Email",
      phone: "Telefon",
      telegram: "Telegram",

      message: "Xabar",
      send: "Yuborish",
      name: "Ism",

      success: "Xabaringiz yuborildi.",
      error: "Xabar yuborilmadi.",
    },

    partnerPage: {
      dashboard: "Hamkor paneli",
      account: "Hamkor akkaunti",

      scanBooking: "Bronni skanerlash",
      bookingNumber: "Bron raqami",
      qrToken: "QR token",
      findBooking: "Bronni topish",

      scanQr: "QR skanerlash",
      openingCamera: "Kamera ochilmoqda...",
      closeCamera: "Kamerani yopish",
      cameraInstruction:
        "Kamerani mijozning BagDrop QR kodiga qarating.",

      checkIn: "Yukni qabul qilish",
      checkOut: "Yukni qaytarish",

      checkedIn: "Qabul qilindi",
      completed: "Yakunlandi",

      upcoming: "Kutilayotgan bronlar",
      activeLuggage: "Saqlanayotgan yuklar",
      pickupExpected: "Kutilayotgan olib ketishlar",
      earnings: "Daromad",

      bookingNotFound: "Bron topilmadi.",

      checkInSuccess: "Yuk muvaffaqiyatli qabul qilindi.",
      checkOutSuccess: "Yuk qaytarildi. Bron yakunlandi.",

      location: "Joy",
      bookings: "Bronlar",
      status: "Holat",
      customer: "Mijoz",
      bags: "Sumkalar",
      total: "Jami",
      dropOff: "Topshirish",
      pickup: "Olib ketish",

      loadingBookings: "Bronlar yuklanmoqda...",
      noBookings: "Bronlar mavjud emas.",

      loginTitle: "Hamkor kirishi",
      loginDescription:
        "Hamkor paneliga kirish uchun email va parolingizni kiriting.",
      loginButton: "Kirish",
      email: "Email",
      password: "Parol",
    },

    adminPage: {
      dashboard: "Admin paneli",
      liveData: "Jonli Supabase ma’lumotlari",

      bookings: "Bronlar",
      bookingsToday: "Bugungi bronlar",
      revenue: "Daromad",
      activeLuggage: "Faol yuklar",
      completed: "Yakunlangan",
      cancelled: "Bekor qilingan",

      pendingPayment: "To‘lov kutilmoqda",
      paidWaiting: "To‘langan / kutilmoqda",
      checkedIn: "Qabul qilingan",

      locations: "Joylar",

      refresh: "Yangilash",

      editLocation: "Joyni tahrirlash",

      name: "Nomi",
      address: "Manzil",
      pricePerBag: "Sumka narxi",
      capacity: "Sig‘im",
      openingTime: "Ochilish vaqti",
      closingTime: "Yopilish vaqti",

      active: "Faol",

      googleMaps: "Google Maps",
      yandexMaps: "Yandex Maps",

      saveChanges: "O‘zgarishlarni saqlash",

      couldNotLoad: "Admin ma’lumotlarini yuklab bo‘lmadi.",
      noBookings: "Bronlar topilmadi.",
      allStatuses: "Barcha holatlar",

      loginTitle: "Admin kirishi",
      loginDescription:
        "Admin panelini boshqarish uchun tizimga kiring.",
      loginButton: "Kirish",

      email: "Email",
      password: "Parol",

      locationUpdated: "Joy muvaffaqiyatli yangilandi.",
    },
  },

  // ==========================================================
  // RUSSIAN
  // ==========================================================

  ru: {
    home: "Главная",
    locations: "Пункты хранения",
    contact: "Контакты",
    partnerLogin: "Вход партнёра",
    admin: "Админ",
    findStorage: "Найти хранение",

    support: "Поддержка",
    cityUz: "Самарканд, Узбекистан",

    language: "Язык",
    uzbek: "O‘zbekcha",
    russian: "Русский",
    english: "English",

    footerText:
      "BagDrop — путешествуйте без багажа.",

    common: {
      loading: "Загрузка...",
      error: "Произошла ошибка.",
      tryAgain: "Попробовать снова",
      back: "Назад",
      save: "Сохранить",
      cancel: "Отмена",
      close: "Закрыть",
      refresh: "Обновить",
      logout: "Выйти",
      search: "Поиск",
      viewLocation: "Посмотреть пункт",
      comingSoon: "Скоро",
    },

    homePage: {
      liveNow: "Сейчас работает:",
      heroTitle:
        "Оставьте багаж. Исследуйте Узбекистан.",
      heroDescription:
        "Безопасное хранение багажа рядом с местами, которые вы хотите посетить в Узбекистане. Забронируйте менее чем за две минуты, оплатите онлайн и покажите QR-код.",
      findStorage: "Найти хранение багажа",
      howItWorks: "Как это работает?",

      searchPlaceholder:
        'Например, "рядом с Регистаном" или "ж/д вокзал Самарканда"',
      search: "Поиск",

      mapTitle: "Все пункты хранения в Самарканде",
      mapDescription:
        "Найдите BagDrop рядом с местом назначения.",

      whyTitle:
        "Почему путешественники доверяют BagDrop?",

      verifiedPartners: "Проверенные партнёры",
      verifiedPartnersText:
        "Каждый пункт проверяется и утверждается перед подключением к сети.",

      qrCheckin: "QR-регистрация",
      qrCheckinText:
        "Без бумажной работы — бронирование и багажная бирка связаны с QR-кодом.",

      luggageTags: "Багажные бирки",
      luggageTagsText:
        "Каждая сумка получает отдельную бирку, чтобы ничего не перепуталось.",

      securePayment: "Безопасная оплата",
      securePaymentText:
        "Онлайн-оплата проверяется до подтверждения бронирования.",

      faqTitle: "Часто задаваемые вопросы",

      citiesTitle: "Города",
      samarkand: "Самарканд",
      locationsLive: "пунктов · работает сейчас",
      comingSoon: "Скоро",
      tashkent: "Ташкент",
      bukhara: "Бухара",
      khiva: "Хива",

      step1: "Выберите пункт хранения рядом с местом назначения",
      step2: "Забронируйте онлайн — выберите время сдачи и получения",
      step3: "Оплатите безопасно и получите QR-код",
      step4: "Покажите QR-код, оставьте багаж и получите бирку",
      step5: "Исследуйте город без багажа",
      step6: "Вернитесь, снова отсканируйте QR-код и заберите багаж",

      faq1q: "Какие вещи нельзя хранить?",
      faq1a: "В пунктах BagDrop нельзя хранить оружие, взрывчатые вещества, запрещённые наркотики, опасные материалы, живых животных и другие запрещённые или незаконные предметы.",
      faq2q: "Как получить багаж обратно?",
      faq2a: "Покажите QR-код бронирования в том же пункте. Сотрудник проверит багажную бирку и вернёт ваши вещи.",
      faq3q: "Нужно ли создавать аккаунт?",
      faq3a: "Нет — можно забронировать услугу как гость. После бронирования вы получите подтверждение и QR-код.",
      faq4q: "Что делать, если пункт полностью забронирован?",
      faq4a: "Доступность указана на странице каждого пункта. Попробуйте ближайший пункт или другое время.",
    },

    locationsPage: {
      title: "Пункты хранения багажа",
      description:
        "Выберите город и найдите удобный пункт BagDrop для багажа.",
      searchPlaceholder: "Поиск по пункту или адресу...",
      search: "Поиск",
      noLocations: "Пунктов BagDrop пока нет.",
      loading: "Загрузка пунктов...",
      perBagDay: "сумка / день",
      bagsCapacity: "вместимость",
      open: "Открыто",
      closed: "Закрыто",
      viewLocation: "Посмотреть пункт",
      bookNow: "Забронировать",

      loadErrorTitle: "Не удалось загрузить пункты",
      liveLocations: "Активные пункты",
      chooseCity: "Выберите город",
      tashkent: "Ташкент",
      samarkand: "Самарканд",
      bukhara: "Бухара",
      khiva: "Хива",
      locationSingular: "пункт",
      locationPlural: "пунктов",
      locationsTitleSuffix: "пункты",
      found: "найдено",
      updatingAvailability: "Обновление доступности",
      preparingLocations: "Мы готовим пункты в городе",
      checkBackSoon: "Проверьте снова позже.",
      free: "свободно",
      full: "Заполнено",
      price: "Цена",
      upTo12Hours: "до 12 часов",
      per24Hours: "/ 24 ч",
      hours: "Часы работы",
      daily: "ежедневно",
      capacity: "Вместимость",
      bags: "сумок",
      totalStorage: "общая вместимость",
      available: "Доступно",
      currentlyFull: "Сейчас заполнено",
      viewDetails: "Подробнее →",
      mapTitle: "Пункты BagDrop",
      locationsOnMap: "пунктов на карте",
      live: "Сейчас",
    },

    locationDetail: {
      backToLocations: "Назад к пунктам",
      availableBags: "Доступный объём",
      bagsAvailable: "сумок доступно",
      pricePerBagDay: "сумка / день",
      openingHours: "Часы работы",
      amenities: "Удобства",
      bookThisLocation: "Забронировать этот пункт",
      getDirections: "Построить маршрут",
      verifiedPartner: "Проверенный партнёр",
      loadingLocation: "Загрузка пункта...",
      locationNotFound: "Пункт не найден",
      locationNotFoundText: "Этот пункт хранения багажа не найден.",
      loadError: "Не удалось загрузить пункт.",
      availabilityError: "Не удалось проверить доступность.",
      openNow: "Сейчас открыт",
      closedNow: "Сейчас закрыт",
      from: "Цена от",
      upTo12Hours: "до 12 часов",
      hours24: "24 часа",
      upTo12HoursShort: "до 12 ч",
      upTo24HoursShort: "до 24 ч",
      totalCapacity: "Общая вместимость",
      price: "Цена",
      findUs: "Как нас найти",
      howItWorks: "Как работает BagDrop",
      bookOnline: "Забронируйте онлайн",
      bookOnlineText: "Выберите дату, время и количество сумок.",
      dropBags: "Оставьте багаж",
      dropBagsText: "Покажите QR-код нашему проверенному партнёру.",
      exploreFreely: "Исследуйте город свободно",
      exploreFreelyText: "Наслаждайтесь Самаркандом без багажа.",
      selectStoragePeriod: "Выберите срок хранения",
      perBag: "за одну сумку",
      priceSummary: "40 000 / 12 ч · 65 000 / 24 ч",
      dropOff: "Сдача",
      pickup: "Получение",
      date: "Дата",
      time: "Время",
      availableForYourTime: "Доступно на выбранное время",
      checking: "Проверяем...",
      bags: "сумок",
      reserved: "забронировано",
      total: "всего",
      spacesAvailable: "На выбранный период есть свободные места.",
      noSpace: "На выбранный период свободных мест нет.",
      pickupAfterDropoff: "Время получения должно быть позже времени сдачи.",
      max24Hours: "Срок хранения не может превышать 24 часа.",
      withinOpeningHours: "Выберите время в пределах часов работы пункта.",
      nextStep: "На следующем шаге вы подтвердите данные и количество сумок.",
      verifiedSimple: "Проверено и просто",
      verifiedSimpleText: "Багаж принимается и выдаётся партнёром BagDrop с помощью QR-кода бронирования.",
      defaultDescription: "Безопасно храните багаж в пункте BagDrop {name}. Оставьте сумки, исследуйте город и заберите их, когда будете готовы.",

    },

    booking: {
      chooseDateTime: "Выберите дату и время",
      openingHours: "Часы работы",
      openingHoursFor: "Часы работы:",
      dropOff: "Сдача",
      pickup: "Получение",
      dropOffDate: "Дата сдачи",
      dropOffTime: "Время сдачи",
      pickupDate: "Дата получения",
      pickupTime: "Время получения",
      numberOfBags: "Количество сумок",
      chooseBags: "Выберите, сколько сумок вы хотите оставить.",
      maximum: "Максимум",
      bagsPerBooking: "сумок / бронирование",
      availabilityForTime: "Доступность на выбранное время",
      bagSingular: "сумка",
      bagPlural: "сумок",
      reserved: "забронировано",
      totalCapacity: "общая вместимость",
      availabilityAutoUpdate: "Доступность обновляется автоматически.",
      decreaseBags: "Уменьшить количество сумок",
      increaseBags: "Увеличить количество сумок",
      availableLimitReached: "Вы достигли доступного лимита для этого бронирования.",
      noBagsAvailable: "Свободных мест для багажа нет",
      chooseAnotherTime: "Выберите другую дату или время.",
      customerDetails: "Данные клиента",
      noAccountNeeded: "Аккаунт не нужен — после бронирования подтверждение будет отправлено на вашу почту.",
      firstName: "Имя",
      lastName: "Фамилия",
      phone: "Телефон",
      email: "Email",
      telegramOptional: "Имя пользователя Telegram (необязательно)",
      emailRequired: "Email обязателен.",
      reviewPrice: "Проверка бронирования и цены",
      location: "Пункт",
      duration: "Продолжительность",
      rate: "Тариф",
      rate12: "до 12 часов · 40 000 UZS / сумка",
      rate24: "до 24 часов · 65 000 UZS / сумка",
      hours: "час.",
      bags: "Сумки",
      total: "Итого",
      usdApprox: "Сумма в USD указана приблизительно. Итоговая оплата производится в UZS.",
      safetyTitle: "Важное предупреждение по безопасности",
      safetyIntro: "Перед сдачей багажа возьмите с собой следующие вещи:",
      passport: "Паспорт / ID-карта",
      cash: "Наличные",
      bankCards: "Банковские карты",
      jewelry: "Украшения и ценные вещи",
      electronics: "Ценная электроника",
      medicines: "Важные лекарства",
      documents: "Важные документы",
      keys: "Ключи и другие необходимые личные вещи",
      safetyRecommendation: "BagDrop рекомендует не оставлять эти вещи внутри багажа.",
      safetyAcknowledgement: "Я понимаю, что не следует оставлять важные документы, наличные, банковские карты или ценные вещи внутри багажа.",
      bagIs: "сумка доступна",
      bagsAre: "сумок доступно",
      availableForSelectedTime: "на выбранное время.",
      confirmBooking: "Подтвердить бронирование",
      creatingBooking: "Создание бронирования...",
      continueButton: "Продолжить",
      bookingConfirmed: "Бронирование подтверждено",
      bookingSaved: "Ваше бронирование успешно сохранено.",
      bookingInformation: "Информация о бронировании",
      bookingNumber: "Номер бронирования",
      status: "Статус",
      yourQrCode: "Ваш QR-код",
      showQr: "Покажите этот QR-код партнёру BagDrop по прибытии.",
      qrAlt: "QR-код бронирования BagDrop",
      loadingQr: "Загрузка QR-кода...",
      qrSentEmail: "QR-код отправлен на вашу почту",
      qrEmailSentTo: "Информация о бронировании и QR-код отправлены на:",
      didntReceiveEmail: "Не получили письмо?",
      checkSpam: "Проверьте папки «Спам» и «Промоакции».",
      qrActive: "Ваш QR-код активен.",
      qrWaitingPayment: "QR-код ожидает оплаты",
      qrAfterPayment: "QR-код появится здесь после успешного подтверждения оплаты.",
      qrEmailAfterPayment: "QR-код будет отправлен на следующий email только после подтверждения оплаты:",
      bagTags: "Багажные бирки",
      bagTagsDescription: "Эти бирки будут прикреплены к вашим сумкам при регистрации.",
      paymentRequiredNotice: "Перед активацией QR-кода необходимо оплатить бронирование. QR-код и подтверждение по email будут доступны только после успешной проверки оплаты.",
      preparingPayment: "Подготовка оплаты...",
      continuePayment: "Перейти к оплате",
      paymentTransactionCreated: "Платёжная транзакция создана. Статус:",
      backToLocations: "Назад к пунктам",
      backToLocation: "Назад к пункту",
      loadingLocation: "Загрузка пункта...",
      loadLocationError: "Не удалось загрузить пункт.",
      locationNotFound: "Пункт не найден.",
      locationSlugMissing: "Не указан slug пункта.",
      availabilityError: "Не удалось загрузить доступность.",
      bookingDataMissing: "Данные бронирования не найдены. Попробуйте ещё раз.",
      paymentCreateError: "Не удалось создать платёж.",
      safetyConfirmError: "Подтвердите, что вы понимаете предупреждение о безопасности личных вещей.",
      max24HoursError: "Сейчас бронирование BagDrop возможно максимум на 24 часа.",
      validEmailError: "Введите корректный email.",
      notEnoughBagsError: "На выбранное время недостаточно свободных мест.",
      createBookingError: "Не удалось создать бронирование.",
      max24HoursMessage: "Максимальная продолжительность хранения — 24 часа. Выберите более раннее время получения.",
      pickupAfterDropoff: "Время получения должно быть позже времени сдачи.",
      arriveWithinOpeningHours: "Пожалуйста, приходите в часы работы пункта",
      bagsAvailableForTime: "Свободный багаж на выбранное время",
      checking: "Проверка...",
      notAvailable: "—",
      required: "обязательно",
    },

    contactPage: {
      title: "Свяжитесь с нами",
      description:
        "Есть вопросы? Свяжитесь с командой BagDrop.",
      support: "Поддержка",

      email: "Email",
      phone: "Телефон",
      telegram: "Telegram",

      message: "Сообщение",
      send: "Отправить",
      name: "Имя",

      success: "Ваше сообщение отправлено.",
      error: "Не удалось отправить сообщение.",
    },

    partnerPage: {
      dashboard: "Панель партнёра",
      account: "Аккаунт партнёра",

      scanBooking: "Сканирование бронирования",
      bookingNumber: "Номер бронирования",
      qrToken: "QR-токен",
      findBooking: "Найти бронирование",

      scanQr: "Сканировать QR",
      openingCamera: "Открытие камеры...",
      closeCamera: "Закрыть камеру",
      cameraInstruction:
        "Наведите камеру на QR-код клиента BagDrop.",

      checkIn: "Принять багаж",
      checkOut: "Выдать багаж",

      checkedIn: "Принят",
      completed: "Завершён",

      upcoming: "Предстоящие бронирования",
      activeLuggage: "Хранящийся багаж",
      pickupExpected: "Ожидается получение",
      earnings: "Доход",

      bookingNotFound: "Бронирование не найдено.",

      checkInSuccess: "Багаж успешно принят.",
      checkOutSuccess:
        "Багаж выдан. Бронирование завершено.",

      location: "Пункт",
      bookings: "Бронирования",
      status: "Статус",
      customer: "Клиент",
      bags: "Сумки",
      total: "Итого",
      dropOff: "Сдача",
      pickup: "Получение",

      loadingBookings: "Загрузка бронирований...",
      noBookings: "Бронирований нет.",

      loginTitle: "Вход партнёра",
      loginDescription:
        "Введите email и пароль для входа в панель партнёра.",
      loginButton: "Войти",
      email: "Email",
      password: "Пароль",
    },

    adminPage: {
      dashboard: "Панель администратора",
      liveData: "Актуальные данные Supabase",

      bookings: "Бронирования",
      bookingsToday: "Бронирования сегодня",
      revenue: "Доход",
      activeLuggage: "Активный багаж",
      completed: "Завершено",
      cancelled: "Отменено",

      pendingPayment: "Ожидается оплата",
      paidWaiting: "Оплачено / ожидание",
      checkedIn: "Принято",

      locations: "Пункты",

      refresh: "Обновить",

      editLocation: "Редактировать пункт",

      name: "Название",
      address: "Адрес",
      pricePerBag: "Цена за сумку",
      capacity: "Вместимость",
      openingTime: "Время открытия",
      closingTime: "Время закрытия",

      active: "Активен",

      googleMaps: "Google Maps",
      yandexMaps: "Yandex Maps",

      saveChanges: "Сохранить изменения",

      couldNotLoad:
        "Не удалось загрузить данные администратора.",
      noBookings: "Бронирования не найдены.",
      allStatuses: "Все статусы",

      loginTitle: "Вход администратора",
      loginDescription:
        "Войдите для управления панелью администратора.",
      loginButton: "Войти",

      email: "Email",
      password: "Пароль",

      locationUpdated: "Пункт успешно обновлён.",
    },
  },

  // ==========================================================
  // ENGLISH
  // ==========================================================

  en: {
    home: "Home",
    locations: "Locations",
    contact: "Contact",
    partnerLogin: "Partner login",
    admin: "Admin",
    findStorage: "Find storage",

    support: "Support",
    cityUz: "Samarkand, Uzbekistan",

    language: "Language",
    uzbek: "O‘zbekcha",
    russian: "Русский",
    english: "English",

    footerText:
      "BagDrop — leave your bags and explore.",

    common: {
      loading: "Loading...",
      error: "Something went wrong.",
      tryAgain: "Try again",
      back: "Back",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      refresh: "Refresh",
      logout: "Logout",
      search: "Search",
      viewLocation: "View location",
      comingSoon: "Coming soon",
    },

    homePage: {
      liveNow: "Now live in:",
      heroTitle:
        "Leave your bags. Explore Uzbekistan.",
      heroDescription:
        "Secure luggage storage near the places you actually want to visit in Uzbekistan. Book in under two minutes, pay online, and show your QR code.",
      findStorage: "Find luggage storage",
      howItWorks: "How it works",

      searchPlaceholder:
        'Try "near Registan" or "Samarkand railway station"',
      search: "Search",

      mapTitle: "All Samarkand locations",
      mapDescription:
        "Find a BagDrop location near your destination.",

      whyTitle:
        "Why travelers trust BagDrop",

      verifiedPartners: "Verified partners",
      verifiedPartnersText:
        "Every location is visited and approved before joining the network.",

      qrCheckin: "QR check-in",
      qrCheckinText:
        "No paperwork — your booking and luggage tag live in one QR code.",

      luggageTags: "Luggage tags",
      luggageTagsText:
        "Every bag is tagged individually so nothing gets mixed up.",

      securePayment: "Secure payment",
      securePaymentText:
        "Pay online — verified before your booking is confirmed.",

      faqTitle: "Frequently asked",

      citiesTitle: "Cities",
      samarkand: "Samarkand",
      locationsLive: "locations · live now",
      comingSoon: "Coming soon",
      tashkent: "Tashkent",
      bukhara: "Bukhara",
      khiva: "Khiva",

      step1: "Choose a storage location near where you're headed",
      step2: "Book online — pick your drop-off and pickup time",
      step3: "Pay securely and get your QR code",
      step4: "Show the QR code, leave your luggage, and get a tag",
      step5: "Explore the city without your bags",
      step6: "Return, scan again, and pick up your luggage",

      faq1q: "What items can't be stored?",
      faq1a: "Weapons, explosives, illegal drugs, hazardous materials, live animals, and other prohibited or illegal items may not be stored at any BagDrop location.",
      faq2q: "How do I get my luggage back?",
      faq2a: "Show your booking QR code at the same location. Staff verify your luggage tag and return your bags.",
      faq3q: "Do I need to create an account?",
      faq3a: "No — you can book as a guest. You'll receive your confirmation and QR code after booking.",
      faq4q: "What if a location is fully booked?",
      faq4a: "Availability is shown on each location page. Try a nearby location or a different time window.",
    },

    locationsPage: {
      title: "Luggage storage locations",
      description:
        "Choose a city and find a convenient BagDrop location for your luggage.",
      searchPlaceholder: "Search by location or address...",
      search: "Search",
      noLocations: "No BagDrop locations yet.",
      loading: "Loading locations...",
      perBagDay: "bag / day",
      bagsCapacity: "bag capacity",
      open: "Open",
      closed: "Closed",
      viewLocation: "View location",
      bookNow: "Book now",

      loadErrorTitle: "Could not load locations",
      liveLocations: "Live locations",
      chooseCity: "Choose your city",
      tashkent: "Tashkent",
      samarkand: "Samarkand",
      bukhara: "Bukhara",
      khiva: "Khiva",
      locationSingular: "location",
      locationPlural: "locations",
      locationsTitleSuffix: "locations",
      found: "found",
      updatingAvailability: "Updating availability",
      preparingLocations: "We are preparing locations in",
      checkBackSoon: "Please check back soon.",
      free: "free",
      full: "Full",
      price: "Price",
      upTo12Hours: "up to 12 hours",
      per24Hours: "/ 24h",
      hours: "Hours",
      daily: "daily",
      capacity: "Capacity",
      bags: "bags",
      totalStorage: "total storage",
      available: "Available",
      currentlyFull: "Currently full",
      viewDetails: "View details →",
      mapTitle: "BagDrop locations",
      locationsOnMap: "locations on map",
      live: "Live",
    },

    locationDetail: {
      backToLocations: "Back to locations",
      availableBags: "Available luggage",
      bagsAvailable: "bags available",
      pricePerBagDay: "bag / day",
      openingHours: "Opening hours",
      amenities: "Amenities",
      bookThisLocation: "Book this location",
      getDirections: "Get directions",
      verifiedPartner: "Verified partner",
      loadingLocation: "Loading location...",
      locationNotFound: "Location not found",
      locationNotFoundText: "This luggage storage location could not be found.",
      loadError: "Could not load location.",
      availabilityError: "Could not check availability.",
      openNow: "Open now",
      closedNow: "Closed now",
      from: "From",
      upTo12Hours: "up to 12 hours",
      hours24: "24 hours",
      upTo12HoursShort: "up to 12h",
      upTo24HoursShort: "up to 24h",
      totalCapacity: "Total capacity",
      price: "Price",
      findUs: "Find us",
      howItWorks: "How BagDrop works",
      bookOnline: "Book online",
      bookOnlineText: "Choose your dates, times and number of bags.",
      dropBags: "Drop your bags",
      dropBagsText: "Show your QR code to our verified partner.",
      exploreFreely: "Explore freely",
      exploreFreelyText: "Enjoy Samarkand without carrying your luggage.",
      selectStoragePeriod: "Select your storage period",
      perBag: "per bag",
      priceSummary: "40,000 / 12h · 65,000 / 24h",
      dropOff: "Drop-off",
      pickup: "Pickup",
      date: "Date",
      time: "Time",
      availableForYourTime: "Available for your time",
      checking: "Checking...",
      bags: "bags",
      reserved: "reserved",
      total: "total",
      spacesAvailable: "Spaces are available for your selected period.",
      noSpace: "No space is available for this period.",
      pickupAfterDropoff: "Pickup must be after drop-off.",
      max24Hours: "Storage period cannot exceed 24 hours.",
      withinOpeningHours: "Please choose times within the location's opening hours.",
      nextStep: "You'll confirm your details and bag count on the next step.",
      verifiedSimple: "Verified & simple",
      verifiedSimpleText: "Your luggage is checked in and checked out by a BagDrop partner using your booking QR code.",
      defaultDescription: "Store your luggage safely at BagDrop {name}. Drop your bags, explore the city and pick them up when you're ready.",

    },

    booking: {
      chooseDateTime: "Choose date & time",
      openingHours: "Opening hours",
      openingHoursFor: "Opening hours for",
      dropOff: "Drop-off",
      pickup: "Pickup",
      dropOffDate: "Drop-off date",
      dropOffTime: "Drop-off time",
      pickupDate: "Pickup date",
      pickupTime: "Pickup time",
      numberOfBags: "Number of bags",
      chooseBags: "Choose how many bags you want to store.",
      maximum: "Maximum",
      bagsPerBooking: "bags per booking",
      availabilityForTime: "Availability for your selected time",
      bagSingular: "bag",
      bagPlural: "bags",
      reserved: "reserved",
      totalCapacity: "total capacity",
      availabilityAutoUpdate: "Availability updates automatically.",
      decreaseBags: "Decrease bags",
      increaseBags: "Increase bags",
      availableLimitReached: "You have reached the available limit for this booking.",
      noBagsAvailable: "No bags are available",
      chooseAnotherTime: "Please choose another date or time.",
      customerDetails: "Your details",
      noAccountNeeded: "No account needed — you'll get your confirmation by email after booking.",
      firstName: "First name",
      lastName: "Last name",
      phone: "Phone",
      email: "Email",
      telegramOptional: "Telegram username (optional)",
      emailRequired: "Email is required.",
      reviewPrice: "Review & price",
      location: "Location",
      duration: "Duration",
      rate: "Rate",
      rate12: "Up to 12 hours · 40,000 UZS / bag",
      rate24: "Up to 24 hours · 65,000 UZS / bag",
      hours: "hours",
      bags: "Bags",
      total: "Total",
      usdApprox: "USD amount is an approximate display value. Final payment will be made in UZS.",
      safetyTitle: "Important safety notice",
      safetyIntro: "Before handing over your luggage, please keep the following items with you:",
      passport: "Passport / ID card",
      cash: "Cash",
      bankCards: "Bank cards",
      jewelry: "Jewelry and valuables",
      electronics: "Valuable electronics",
      medicines: "Important medicines",
      documents: "Important documents",
      keys: "Keys and other essential personal items",
      safetyRecommendation: "BagDrop recommends not leaving these items inside your luggage.",
      safetyAcknowledgement: "I understand that I should not leave important documents, cash, bank cards, or valuables inside my luggage.",
      bagIs: "bag is",
      bagsAre: "bags are",
      availableForSelectedTime: "available for your selected time.",
      confirmBooking: "Confirm booking",
      creatingBooking: "Creating booking...",
      continueButton: "Continue",
      bookingConfirmed: "Booking confirmed",
      bookingSaved: "Your booking has been saved successfully.",
      bookingInformation: "Booking information",
      bookingNumber: "Booking number",
      status: "Status",
      yourQrCode: "Your QR code",
      showQr: "Show this QR code to the BagDrop partner when you arrive.",
      qrAlt: "BagDrop booking QR code",
      loadingQr: "Loading QR code...",
      qrSentEmail: "QR code sent to your email",
      qrEmailSentTo: "Your booking information and QR code were sent to:",
      didntReceiveEmail: "Didn't receive the email?",
      checkSpam: "Please check your Spam or Promotions folder.",
      qrActive: "Your QR code is active.",
      qrWaitingPayment: "QR code is waiting for payment",
      qrAfterPayment: "Your QR code will appear here after the payment is successfully verified.",
      qrEmailAfterPayment: "We will send the QR code to the following email only after your payment is confirmed:",
      bagTags: "Bag tags",
      bagTagsDescription: "These tags will be attached to your bags at check-in.",
      paymentRequiredNotice: "Payment is required before your QR code becomes active. The QR code and email confirmation will be available only after the payment is successfully verified.",
      preparingPayment: "Preparing payment...",
      continuePayment: "Continue to payment",
      paymentTransactionCreated: "Payment transaction created. Status:",
      backToLocations: "Back to locations",
      backToLocation: "Back to location",
      loadingLocation: "Loading location...",
      loadLocationError: "Could not load location.",
      locationNotFound: "Location not found.",
      locationSlugMissing: "Location slug is missing.",
      availabilityError: "Could not load availability.",
      bookingDataMissing: "Booking information was not found. Please try again.",
      paymentCreateError: "Payment creation failed.",
      safetyConfirmError: "Please confirm that you understand the personal items safety notice.",
      max24HoursError: "BagDrop bookings can currently be made for up to 24 hours.",
      validEmailError: "Please enter a valid email address.",
      notEnoughBagsError: "Not enough bags are available for this selected time.",
      createBookingError: "Could not create booking.",
      max24HoursMessage: "Maximum storage duration is 24 hours. Please choose an earlier pickup time.",
      pickupAfterDropoff: "Pickup must be after drop-off.",
      arriveWithinOpeningHours: "Please arrive within the location's opening hours",
      bagsAvailableForTime: "Bags available for this time",
      checking: "Checking...",
      notAvailable: "—",
      required: "required",
    },

    contactPage: {
      title: "Contact us",
      description:
        "Have a question? Get in touch with the BagDrop team.",
      support: "Support",

      email: "Email",
      phone: "Phone",
      telegram: "Telegram",

      message: "Message",
      send: "Send",
      name: "Name",

      success: "Your message has been sent.",
      error: "Could not send your message.",
    },

    partnerPage: {
      dashboard: "Partner dashboard",
      account: "Partner account",

      scanBooking: "Scan booking",
      bookingNumber: "Booking number",
      qrToken: "QR token",
      findBooking: "Find booking",

      scanQr: "Scan QR",
      openingCamera: "Opening camera...",
      closeCamera: "Close camera",
      cameraInstruction:
        "Point the camera at the customer's BagDrop QR code.",

      checkIn: "Check in luggage",
      checkOut: "Check out luggage",

      checkedIn: "Checked in",
      completed: "Completed",

      upcoming: "Upcoming bookings",
      activeLuggage: "Active luggage",
      pickupExpected: "Pickup expected",
      earnings: "Earnings",

      bookingNotFound: "Booking not found.",

      checkInSuccess: "Luggage checked in successfully.",
      checkOutSuccess:
        "Luggage returned. Booking completed.",

      location: "Location",
      bookings: "Bookings",
      status: "Status",
      customer: "Customer",
      bags: "Bags",
      total: "Total",
      dropOff: "Drop-off",
      pickup: "Pickup",

      loadingBookings: "Loading bookings...",
      noBookings: "No bookings.",

      loginTitle: "Partner login",
      loginDescription:
        "Enter your email and password to access the partner panel.",
      loginButton: "Login",
      email: "Email",
      password: "Password",
    },

    adminPage: {
      dashboard: "Admin dashboard",
      liveData: "Live Supabase data",

      bookings: "Bookings",
      bookingsToday: "Bookings today",
      revenue: "Revenue",
      activeLuggage: "Active luggage",
      completed: "Completed",
      cancelled: "Cancelled",

      pendingPayment: "Pending payment",
      paidWaiting: "Paid / waiting",
      checkedIn: "Checked in",

      locations: "Locations",

      refresh: "Refresh",

      editLocation: "Edit location",

      name: "Name",
      address: "Address",
      pricePerBag: "Price per bag",
      capacity: "Capacity",
      openingTime: "Opening time",
      closingTime: "Closing time",

      active: "Active",

      googleMaps: "Google Maps",
      yandexMaps: "Yandex Maps",

      saveChanges: "Save changes",

      couldNotLoad: "Could not load admin data.",
      noBookings: "No bookings found.",
      allStatuses: "All statuses",

      loginTitle: "Admin login",
      loginDescription:
        "Sign in to manage the admin panel.",
      loginButton: "Sign in",

      email: "Email",
      password: "Password",

      locationUpdated: "Location updated successfully.",
    },
  },
};

// ============================================================
// LANGUAGE CONTEXT
// ============================================================

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: TranslationSet;
};

const LanguageContext =
  createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("en");

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        "bagdrop-language"
      ) as Language | null;

    if (
      saved === "uz" ||
      saved === "ru" ||
      saved === "en"
    ) {
      setLanguageState(saved);
    }
  }, []);

  function setLanguage(
    nextLanguage: Language
  ) {
    setLanguageState(nextLanguage);

    window.localStorage.setItem(
      "bagdrop-language",
      nextLanguage
    );
  }

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: translations[language],
    }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}
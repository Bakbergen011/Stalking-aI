/**
 * Interactive Crisis Map of Kazakhstan
 * Vector SVG map controller with interactive city pins, real-time filtering,
 * and direct one-click crisis center emergency dials.
 */
(function () {
  'use strict';

  var lang = (document.documentElement.lang || 'kk').toLowerCase().startsWith('ru') ? 'ru' : 'kk';

  var cityData = {
    almaty: {
      name: lang === 'ru' ? 'Алматы: Кризисный центр «Жан-Сая»' : 'Алматы: «Жан-Сая» дағдарыс орталығы',
      desc: lang === 'ru'
        ? 'Убежище (шелтер) для пострадавших от преследования и бытового насилия, бесплатная психологическая и юридическая помощь.'
        : 'Тұрмыстық зорлық-зомбылық құрбандарына арналған паналау орны (шелтер), тегін психологиялық және заңгерлік көмек.',
      addr: lang === 'ru' ? '📍 пр. Сейфуллина, 506 · Круглосуточно' : '📍 Сейфуллина даңғылы, 506 · Тәулік бойы',
      phone: '+77273974549',
      phoneDisplay: '📞 +7 (727) 397-45-49',
      extraPhone: '150',
      extraDisplay: '📞 150 (Сенім желісі)'
    },
    astana: {
      name: lang === 'ru' ? 'Астана: Кризисный центр «Үміт»' : 'Астана: «Үміт» дағдарыс орталығы',
      desc: lang === 'ru'
        ? 'Безопасный круглосуточный приют для женщин и детей, правовые и психологические консультации.'
        : 'Әйелдер мен балаларға арналған қауіпсіз уақытша баспана, құқықтық кеңес және қолдау.',
      addr: lang === 'ru' ? '📍 пр. Р. Кошкарбаева, 39 · Круглосуточно' : '📍 Р. Қошқарбаев даңғылы, 39 · Тәулік бойы',
      phone: '+77172497889',
      phoneDisplay: '📞 +7 (7172) 49-78-89',
      extraPhone: '111',
      extraDisplay: '📞 111 (Жедел желі)'
    },
    shymkent: {
      name: lang === 'ru' ? 'Шымкент: Центр поддержки семьи «Көмек»' : 'Шымкент: «Көмек» отбасын қолдау орталығы',
      desc: lang === 'ru'
        ? 'Кризисный шелтер, срочная социальная, медицинская и юридическая помощь.'
        : 'Әйелдер мен балаларға арналған дағдарыс шелтері, жедел көмек және заңдық қолдау.',
      addr: lang === 'ru' ? '📍 г. Шымкент · Круглосуточно' : '📍 Шымкент қаласы · Тәулік бойы',
      phone: '+77252530404',
      phoneDisplay: '📞 +7 (7252) 53-04-04'
    },
    karaganda: {
      name: lang === 'ru' ? 'Караганда: Центр реабилитации и адаптации' : 'Қарағанды: Әйелдерді бейімдеу орталығы',
      desc: lang === 'ru'
        ? 'Временное проживание, психологическая поддержка, защита прав пострадавших.'
        : 'Уақытша тұру орындары, заңгерлік және медициналық алғашқы көмек.',
      addr: lang === 'ru' ? '📍 ул. Ермекова · Круглосуточно' : '📍 Ермеков көшесі · Тәулік бойы',
      phone: '+77212510050',
      phoneDisplay: '📞 +7 (7212) 51-00-50'
    },
    aktobe: {
      name: lang === 'ru' ? 'Актобе: Кризисный центр «Мейірім»' : 'Ақтөбе: «Мейірім» дағдарыс орталығы',
      desc: lang === 'ru'
        ? 'Служба защиты и поддержки, безопасное убежище, психологи.'
        : 'Қорғау және қолдау қызметі, уақытша паналау орны.',
      addr: lang === 'ru' ? '📍 пр. Санкибай батыра' : '📍 Сәңкібай батыр даңғылы',
      phone: '+77132548585',
      phoneDisplay: '📞 +7 (7132) 54-85-85'
    },
    oskemen: {
      name: lang === 'ru' ? 'Усть-Каменогорск: Центр помощи женщинам ВКО' : 'Өскемен: Шығыс Қазақстан дағдарыс орталығы',
      desc: lang === 'ru'
        ? 'Надежный приют для женщин в трудной жизненной ситуации, реабилитация.'
        : 'Қиын өмірлік жағдайға тап болған әйелдер мен балаларға арналған сенімді баспана.',
      addr: lang === 'ru' ? '📍 г. Усть-Каменогорск · Круглосуточно' : '📍 Өскемен қаласы · Тәулік бойы',
      phone: '+77232771010',
      phoneDisplay: '📞 +7 (7232) 77-10-10'
    },
    pavlodar: {
      name: lang === 'ru' ? 'Павлодар: Городской шелтер поддержки женщин' : 'Павлодар: Қалалық әйелдерді қолдау шелтері',
      desc: lang === 'ru'
        ? 'Безопасное укрытие для пострадавших от сталкинга и агрессии, социальная адаптация.'
        : 'Тұрмыстық зорлық-зомбылық пен аңдудан жапа шеккендерге уақытша қауіпсіз тұру орны.',
      addr: lang === 'ru' ? '📍 г. Павлодар · Служба доверия' : '📍 Павлодар қаласы · Сенім қызметі',
      phone: '+77182545212',
      phoneDisplay: '📞 +7 (7182) 54-52-12'
    },
    taraz: {
      name: lang === 'ru' ? 'Тараз: Жамбылский кризисный центр' : 'Тараз: Жамбыл облыстық отбасын қолдау орталығы',
      desc: lang === 'ru'
        ? 'Временные комнаты безопасности, юридическая и социальная защита.'
        : 'Қауіпсіз уақытша тұру бөлмелері, заңдық және әлеуметтік қорғау.',
      addr: lang === 'ru' ? '📍 г. Тараз · Круглосуточная линия' : '📍 Тараз қаласы · Тәулік бойы желі',
      phone: '+77262435555',
      phoneDisplay: '📞 +7 (7262) 43-55-55'
    },
    kyzylorda: {
      name: lang === 'ru' ? 'Кызылорда: «Қамқорлық» және «Жан» дағдарыс орталықтары' : 'Қызылорда: «Қамқорлық» және «Жан» дағдарыс орталықтары',
      desc: lang === 'ru'
        ? '1. Кризисный центр «Қамқорлық» · 2. КЦ «Жан» при ОО «Общество женщин-малых предпринимателей». Психологическая, социальная помощь и приют.'
        : '1. «Қамқорлық» дағдарыс орталығы · 2. «Жан» дағдарыс орталығы. Әйелдер мен балаларға арналған көмек, уақытша баспана және қолдау.',
      addr: lang === 'ru' ? '📍 Кызылординская область / г. Кызылорда' : '📍 Қызылорда облысы / Қызылорда қаласы',
      phone: '+77773408734',
      phoneDisplay: '📞 8 777 340 87 34',
      extraPhone: '+77016644791',
      extraDisplay: '📞 8 701 664 47 91',
      email: 'zhandos2@mail.ru',
      extraEmail: 'Sima1982@mail.ru'
    },
    all: {
      name: lang === 'ru' ? 'Экстренная помощь по Казахстану' : 'Қазақстан бойынша жедел көмек',
      desc: lang === 'ru'
        ? 'Круглосуточная бесплатная психологическая, правовая помощь и доступ к убежищам (шелтерам) во всех регионах.'
        : 'Тәулік бойы тегін психологиялық, заңдық қолдау және баспана (шелтер).',
      addr: lang === 'ru' ? '📍 Во всех регионах РК · Круглосуточно' : '📍 Барлық өңірлерде · Тәулік бойы',
      phone: '111',
      phoneDisplay: lang === 'ru' ? '📞 111 — Линия доверия' : '📞 111 — Сенім телефоны',
      extraPhone: '150',
      extraDisplay: lang === 'ru' ? '📞 150 — Национальная линия' : '📞 150 — Ұлттық желі'
    }
  };

  function selectCity(cityKey) {
    if (!cityData[cityKey]) {
      cityKey = 'all';
    }

    var data = cityData[cityKey];

    // 1. Update Buttons
    var buttons = document.querySelectorAll('.city-btn');
    buttons.forEach(function (btn) {
      if (btn.getAttribute('data-city') === cityKey) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // 2. Update City Pins
    var pins = document.querySelectorAll('.kz-city-pin');
    pins.forEach(function (pin) {
      var pCity = pin.getAttribute('data-city');
      if (cityKey === 'all' || pCity === cityKey) {
        pin.classList.toggle('active', pCity === cityKey);
      } else {
        pin.classList.remove('active');
      }
    });

    // 3. Update Vector SVG regions
    var regions = document.querySelectorAll('.kz-region');
    regions.forEach(function (reg) {
      var rSlug = reg.getAttribute('data-slug');
      if (cityKey !== 'all' && rSlug === cityKey) {
        reg.classList.add('active');
      } else {
        reg.classList.remove('active');
      }
    });

    // 4. Update Info Box
    var infoCityEl = document.getElementById('infobox-city');
    var infoDescEl = document.getElementById('infobox-desc');
    var infoAddrEl = document.getElementById('infobox-addr');
    var infoActionsEl = document.getElementById('infobox-actions');

    if (infoCityEl) infoCityEl.textContent = data.name;
    if (infoDescEl) infoDescEl.textContent = data.desc;
    if (infoAddrEl) infoAddrEl.textContent = data.addr;

    if (infoActionsEl) {
      var actionsHtml = '<a href="tel:' + data.phone + '" class="call-mini" id="infobox-call-btn">' + data.phoneDisplay + '</a>';
      if (data.extraPhone && data.extraDisplay) {
        actionsHtml += ' <a href="tel:' + data.extraPhone + '" class="call-mini" style="background:hsl(157, 45%, 40%);">' + data.extraDisplay + '</a>';
      }
      if (data.email) {
        actionsHtml += ' <a href="mailto:' + data.email + '" class="call-mini" style="background:hsl(210, 45%, 45%);">✉️ ' + data.email + '</a>';
      }
      if (data.extraEmail) {
        actionsHtml += ' <a href="mailto:' + data.extraEmail + '" class="call-mini" style="background:hsl(210, 45%, 45%);">✉️ ' + data.extraEmail + '</a>';
      }
      infoActionsEl.innerHTML = actionsHtml;
    }

    // 5. Filter Resource Cards below map
    var cards = document.querySelectorAll('.resource-card');
    cards.forEach(function (card) {
      var cCity = card.getAttribute('data-city');
      if (cityKey === 'all') {
        card.classList.remove('filter-hidden', 'filter-highlight');
      } else if (cCity === cityKey) {
        card.classList.remove('filter-hidden');
        card.classList.add('filter-highlight');
      } else {
        card.classList.add('filter-hidden');
        card.classList.remove('filter-highlight');
      }
    });
  }

  function initMap() {
    var stage = document.getElementById('kz-map-stage');
    if (!stage) return;

    // Attach click listeners to filter buttons
    var buttons = document.querySelectorAll('.city-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var city = btn.getAttribute('data-city') || 'all';
        selectCity(city);
      });
    });

    // Attach click and keyboard listeners to city pins
    var pins = document.querySelectorAll('.kz-city-pin');
    pins.forEach(function (pin) {
      pin.addEventListener('click', function () {
        var city = pin.getAttribute('data-city');
        selectCity(city);
      });
      pin.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var city = pin.getAttribute('data-city');
          selectCity(city);
        }
      });
    });

    // Attach click listeners to SVG regions
    var regions = document.querySelectorAll('.kz-region');
    regions.forEach(function (reg) {
      reg.addEventListener('click', function () {
        var slug = reg.getAttribute('data-slug');
        if (cityData[slug]) {
          selectCity(slug);
        }
      });
    });

    // Default selection
    selectCity('all');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
  } else {
    initMap();
  }
})();

/* ==========================================================================
   GET CABS - Interactive JavaScript Engine
   Company: Get Cabs
   Phone: 9894020156
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  // 1. Mobile Menu Toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const mainMenu = document.querySelector('.main-menu');

  if (mobileToggle && mainMenu) {
    mobileToggle.addEventListener('click', function () {
      mainMenu.classList.toggle('active');
    });
  }

  // 2. Booking Form Tabs Handling (Local Rides, Oneway, Outstation, Hourly Package)
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabPanels = document.querySelectorAll('.tab-content-panel');

  tabLinks.forEach(link => {
    link.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');

      // Update Active Tab Link
      tabLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');

      // Update Active Panel
      tabPanels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `tab-${targetTab}`) {
          panel.classList.add('active');
        }
      });

      // Recalculate fare for the newly active tab
      updateAllEstimates();
    });
  });

  // 3. Get Cabs Coimbatore Fare & Rate Calculation Engine
  // Pricing Rules specified by company (Effective 01/06/2026):
  // 1. Local Rides (Mini/Sedan): Base fare ₹150 for first 2.5 KM; ₹30/KM for subsequent KM.
  // 2. Hourly Package: Min 1 Hour ₹325 (Running KM ₹20-25/KM); 10 Hrs / 100 KM Day Rental ₹3,000 (Extra KM ₹10, Extra Hr ₹150); 12 Hrs / 100 KM Day Rental ₹3,500.
  // 3. Oneway Drop Rates: Fixed rates for popular destinations from Gandhipuram, Ukkadam, Railway Station, Airport.
  // 4. Distance Based: Under 100 KM drop @ ₹17/KM round trip; Over 130 KM drop @ ₹14/KM round trip + ₹400 Batta.

  const HILL_STATIONS = [
    'ooty', 'coonoor', 'munnar', 'kodaikanal', 'kodai', 'valparai',
    'yercaud', 'kotagiri', 'anamalai', 'wayanad', 'palani hills',
    'nilgiris', 'masinagudi', 'pykara', 'gudalur', 'topslip', 'agali'
  ];

  const FIXED_ONEWAY_RATES = {
    'annur': 1100,
    'isha': 1100,
    'anaikatti': 1300,
    'mettupalayam': 1400,
    'palladam': 1500,
    'sirumugai': 1500,
    'avinashi': 1600,
    'pollachi': 1600,
    'vana bathrakaliamman': 1600,
    'airport to tiruppur': 1700,
    'puliyampatti': 1800,
    'palakkad': 1900,
    'tirupur': 1900,
    'tiruppur': 1900,
    'airport to palakkad': 2200,
    'sathyamangalam': 2500,
    'kangeyam': 2500,
    'udumalpet': 2500,
    'perundurai': 2900,
    'gobi': 2900,
    'dharapuram': 2950,
    'kotagiri': 2900,
    'coonoor': 2900,
    'erode': 3500,
    'ooty': 3500,
    'palani': 3900
  };

  function isHillStation(text1 = '', text2 = '') {
    const combined = (String(text1) + ' ' + String(text2)).toLowerCase();
    return HILL_STATIONS.some(kw => combined.includes(kw));
  }

  function isOotyRoute(text1 = '', text2 = '') {
    const combined = (String(text1) + ' ' + String(text2)).toLowerCase();
    return combined.includes('ooty');
  }

  function formatPriceRange(exactPrice) {
    const exact = Math.round(exactPrice);
    return `₹${exact.toLocaleString('en-IN')}`;
  }

  function calculateLocalFare(km, pickup = '', drop = '') {
    const dist = Math.max(0, parseFloat(km) || 0);
    let fare = 75 + (dist * 28);
    const combined = (String(pickup) + ' ' + String(drop)).toLowerCase();
    const borderOutskirts = [
      'karumathampatti', 'karanampettai', 'paapampatti', 'ganeshapuram',
      'kovilpalayam', 'karamadai', 'booluvampatti', 'pooluvapatti',
      'ettimadai', 'kinathukadavu'
    ];
    if (borderOutskirts.some(loc => combined.includes(loc))) {
      fare += 100;
    }
    return Math.round(fare);
  }

  function calculateOnewayFare(km, destName = '', pickupName = '') {
    const normDrop = String(destName).toLowerCase().trim();
    const normPickup = String(pickupName).toLowerCase().trim();
    
    // Check fixed tariff dictionary match
    for (let key in FIXED_ONEWAY_RATES) {
      if (normDrop.includes(key) || normPickup.includes(key)) {
        return FIXED_ONEWAY_RATES[key];
      }
    }

    const dist = Math.max(0, parseFloat(km) || 0);
    if (dist <= 100) {
      return dist * 2 * 17;
    } else {
      return (dist * 2 * 14) + 400;
    }
  }

  function calculateOutstationFare(roundTripKm, isHills) {
    const dist = Math.max(0, parseFloat(roundTripKm) || 0);
    if (dist <= 200) {
      return dist * 17;
    } else {
      return (dist * 14) + 400;
    }
  }

  function calculateHourlyFare(hours) {
    const hrs = parseInt(hours, 10) || 1;
    if (hrs >= 12) return 3500;
    if (hrs >= 10) return 3000;
    return hrs * 350;
  }

  // Update all estimate displays in the booking tabs
  function updateAllEstimates() {
    // 1. Local Ride
    const localDistInputVal = document.getElementById('local-distance')?.value;
    const localDist = localDistInputVal ? parseFloat(localDistInputVal) : 0;
    const localPickup = document.getElementById('local-pickup')?.value || '';
    const localDrop = document.getElementById('local-drop')?.value || '';
    const localFareEl = document.getElementById('local-fare-display');
    if (localFareEl) {
      if (!localDist || localDist <= 0) {
        localFareEl.textContent = '-';
      } else {
        const localPrice = calculateLocalFare(localDist, localPickup, localDrop);
        localFareEl.textContent = formatPriceRange(localPrice);
      }
    }

    // 2. Oneway Ride
    const onewayDistInputVal = document.getElementById('oneway-distance')?.value;
    const onewayPickup = document.getElementById('oneway-pickup')?.value || 'Coimbatore';
    const onewayDrop = document.getElementById('oneway-dest-select')?.value || 'Ooty Bus Stand';
    const onewayFareEl = document.getElementById('oneway-fare-display');
    if (onewayFareEl) {
      let onewayDist = onewayDistInputVal ? parseFloat(onewayDistInputVal) : 0;
      if (!onewayDist) {
        const selectedOpt = onewayDestSelect?.options?.[onewayDestSelect.selectedIndex];
        onewayDist = parseFloat(selectedOpt?.getAttribute('data-km') || 85);
      }
      const onewayPrice = calculateOnewayFare(onewayDist, onewayDrop, onewayPickup);
      onewayFareEl.textContent = formatPriceRange(onewayPrice);
    }

    // 3. Outstation Round Trip
    const outstationPickup = document.getElementById('outstation-pickup')?.value || 'Coimbatore';
    const outstationDrop = document.getElementById('outstation-drop')?.value || 'Ooty';
    const manualHillsSelect = document.getElementById('outstation-is-hills');
    
    let isOutstationHills = isHillStation(outstationPickup, outstationDrop);
    if (manualHillsSelect && isOutstationHills) {
      manualHillsSelect.value = 'yes';
    } else if (manualHillsSelect && manualHillsSelect.value === 'yes') {
      isOutstationHills = true;
    }

    let outstationDist = parseFloat(document.getElementById('outstation-distance')?.value);
    if (isNaN(outstationDist) || outstationDist < 50) {
      outstationDist = isOutstationHills ? 300 : 250;
    }

    const outstationFareEl = document.getElementById('outstation-fare-display');
    if (outstationFareEl) {
      const outstationPrice = calculateOutstationFare(outstationDist, isOutstationHills);
      outstationFareEl.textContent = formatPriceRange(outstationPrice);
    }

    // 4. Hourly Package Rental
    const selectedHours = document.getElementById('hourly-pkg-select')?.value || 10;
    const hourlyFareEl = document.getElementById('hourly-fare-display');
    if (hourlyFareEl) {
      const hourlyPrice = calculateHourlyFare(selectedHours);
      hourlyFareEl.textContent = formatPriceRange(hourlyPrice);
    }
  }

  // Auto-sync distance when user selects a preset destination in Oneway
  const onewayDestSelect = document.getElementById('oneway-dest-select');
  const onewayDistInput = document.getElementById('oneway-distance');
  if (onewayDestSelect && onewayDistInput) {
    onewayDestSelect.addEventListener('change', function () {
      const selectedOpt = this.options[this.selectedIndex];
      const km = selectedOpt.getAttribute('data-km');
      if (km) {
        onewayDistInput.value = km;
      }
      updateAllEstimates();
    });
  }

  // Attach dynamic input event listeners for live price updates & auto hill detection
  const calcInputs = [
    'local-distance', 'local-cab-type',
    'oneway-pickup', 'oneway-distance', 'oneway-dest-select', 'oneway-cab-type',
    'outstation-pickup', 'outstation-drop', 'outstation-distance', 'outstation-is-hills', 'outstation-cab-type',
    'hourly-pkg-select', 'hourly-cab-type'
  ];

  calcInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', updateAllEstimates);
      el.addEventListener('change', updateAllEstimates);
      el.addEventListener('keyup', updateAllEstimates);
    }
  });

  updateAllEstimates();

  // 4. Booking Submission & Modal Popup
  const forms = [
    { id: 'form-local', type: 'Local Ride' },
    { id: 'form-oneway', type: 'Oneway Ride' },
    { id: 'form-outstation', type: 'Outstation Travel' },
    { id: 'form-hourly', type: 'Hourly Package Rental' }
  ];

  const modalOverlay = document.getElementById('booking-modal');
  const modalDetails = document.getElementById('modal-details-body');
  const modalCloseBtn = document.getElementById('modal-close');

  forms.forEach(item => {
    const formEl = document.getElementById(item.id);
    if (formEl) {
      formEl.addEventListener('submit', function (e) {
        e.preventDefault();

        // Extract values dynamically
        let pickup = formEl.querySelector('[data-field="pickup"]')?.value || 'Coimbatore Gandhipuram';
        let drop = formEl.querySelector('[data-field="drop"]')?.value || 'Coimbatore Airport CJB';
        let date = formEl.querySelector('[data-field="date"]')?.value || 'Today';
        let time = formEl.querySelector('[data-field="time"]')?.value || 'Immediate';
        let phone = formEl.querySelector('[data-field="phone"]')?.value || '9894020156';
        let fare = formEl.querySelector('.price-tag')?.textContent || '₹450';

        if (modalDetails) {
          modalDetails.innerHTML = `
            <div style="text-align:left; background:#f9fafb; padding:18px; border-radius:10px; margin:16px 0; border:1px solid #e5e7eb; font-size:0.95rem;">
              <p style="margin-bottom:6px;"><strong>Booking Type:</strong> <span style="color:#d90429; font-weight:700;">${item.type}</span></p>
              <p style="margin-bottom:6px;"><strong>Pickup Location:</strong> ${pickup}</p>
              <p style="margin-bottom:6px;"><strong>Drop Location / Destination:</strong> ${drop}</p>
              <p style="margin-bottom:6px;"><strong>Date & Time:</strong> ${date} at ${time}</p>
              <p style="margin-bottom:6px;"><strong>Customer Phone:</strong> ${phone}</p>
              <p style="margin-top:10px; font-size:1.15rem; color:#d90429;"><strong>Estimated Fare:</strong> ${fare}</p>
            </div>
            <p style="font-size:0.875rem; color:#059669; background:#ecfdf5; padding:12px; border-radius:8px; font-weight:600;">
              ✓ Get Cabs booking confirmation SMS & driver details will be sent to ${phone}. Or call us directly at <strong>9894020156</strong>.
            </p>
          `;
        }

        if (modalOverlay) {
          modalOverlay.classList.add('active');
        }
      });
    }
  });

  if (modalCloseBtn && modalOverlay) {
    modalCloseBtn.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
  }

  // 5. FAQ Accordion Handling
  const faqHeads = document.querySelectorAll('.faq-head');
  faqHeads.forEach(btn => {
    btn.addEventListener('click', function () {
      const parentCard = this.parentElement;
      const isActive = parentCard.classList.contains('active');

      document.querySelectorAll('.faq-card').forEach(card => card.classList.remove('active'));

      if (!isActive) {
        parentCard.classList.add('active');
      }
    });
  });

  // 6. Smooth Scroll Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: 'smooth' });
        if (mainMenu) mainMenu.classList.remove('active');
      }
    });
  });

  // 7. Scroll Reveal Animations Observer
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: '0px 0px -40px 0px',
      threshold: 0.1
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  // 8. Dynamic Ambient Highway Motion Engine (Canvas Fallback & Backdrop)
  const heroCanvas = document.getElementById('hero-canvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let width, height;

    function resizeCanvas() {
      if (!heroCanvas.parentElement) return;
      width = heroCanvas.width = heroCanvas.parentElement.clientWidth || window.innerWidth;
      height = heroCanvas.height = heroCanvas.parentElement.clientHeight || 500;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Highway streaks particles
    const streaks = [];
    const numStreaks = 45;
    for (let i = 0; i < numStreaks; i++) {
      streaks.push({
        x: Math.random() * 2 - 1,
        y: Math.random(),
        z: Math.random() * 0.9 + 0.1,
        speed: Math.random() * 0.015 + 0.008,
        color: Math.random() > 0.4 ? 'rgba(217, 4, 41, ' : (Math.random() > 0.5 ? 'rgba(255, 183, 3, ' : 'rgba(255, 255, 255, '),
        length: Math.random() * 80 + 40
      });
    }

    function renderHighway() {
      if (!ctx || width === 0) return;
      ctx.clearRect(0, 0, width, height);

      // Deep night sky background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#0b1329');
      skyGrad.addColorStop(0.5, '#111827');
      skyGrad.addColorStop(1, '#080d1a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Vanishing point (center horizon)
      const cx = width / 2;
      const cy = height * 0.35;

      // Perspective Road Base
      ctx.beginPath();
      ctx.moveTo(cx - width * 0.1, cy);
      ctx.lineTo(cx + width * 0.1, cy);
      ctx.lineTo(width * 1.2, height);
      ctx.lineTo(-width * 0.2, height);
      ctx.closePath();
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Highway Lane Markings & Glowing Streaks
      streaks.forEach(s => {
        s.y += s.speed;
        if (s.y > 1) {
          s.y = 0;
          s.x = Math.random() * 2 - 1;
        }

        const px = cx + (s.x * (s.y * width * 0.6));
        const py = cy + (s.y * (height - cy));
        const pLength = s.length * s.y;
        const opacity = Math.min(s.y * 1.5, 0.9);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + (s.x * pLength * 0.2), py + pLength);
        ctx.strokeStyle = `${s.color}${opacity})`;
        ctx.lineWidth = Math.max(1, s.y * 5);
        ctx.stroke();
      });

      requestAnimationFrame(renderHighway);
    }
    renderHighway();
  }

  // 9. Ensure Background Video Autoplay & Fallback Handling
  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    heroVideo.muted = true;
    heroVideo.playsInline = true;

    function attemptPlay() {
      const playPromise = heroVideo.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          heroVideo.style.opacity = '1';
        }).catch(() => {
          // If browser restricts unprompted autoplay, fallback poster/canvas runs smoothly
          heroVideo.style.opacity = '0.4';
        });
      }
    }

    heroVideo.addEventListener('loadeddata', attemptPlay);
    heroVideo.addEventListener('canplay', attemptPlay);
    attemptPlay();

    // Re-trigger play on user interaction anywhere on page
    document.addEventListener('click', function playOnInteraction() {
      if (heroVideo.paused) {
        heroVideo.play().then(() => {
          heroVideo.style.opacity = '1';
        }).catch(() => {});
      }
    }, { once: true });
  }

  // 10. Dedicated Sub-Page Router & Dynamic Page Renderer
  const pageOverlay = document.getElementById('dedicated-page-overlay');
  const pageTitleEl = document.getElementById('dedicated-page-title');
  const pageContentEl = document.getElementById('dedicated-page-content');
  const pageCloseBtn = document.getElementById('dedicated-page-close');

  const BLOG_DATA = {
    'ooty-guide': {
      title: 'Top 10 Places to Visit in Ooty from Coimbatore (2026 Cab Guide)',
      category: 'Ooty Hill Guide',
      date: 'July 2026',
      readTime: '5 min read',
      img: '/src/assets/images/blog-ooty.png',
      content: `
        <div class="blog-full-article">
          <div class="blog-hero-header">
            <span class="blog-tag-badge" style="position:static; display:inline-block; margin-bottom:12px;">Ooty Hill Guide</span>
            <h1>Top 10 Places to Visit in Ooty from Coimbatore (2026 Cab Guide)</h1>
            <div class="blog-meta-info" style="font-size:0.9rem;">
              <span>📅 July 2026</span> • <span>⏱️ 5 min read</span> • <span>✍️ Get Cabs Travel Desk</span>
            </div>
          </div>

          <img src="/src/assets/images/blog-ooty.png" alt="Coimbatore to Ooty Cab Travel" class="blog-featured-img" onerror="this.onerror=null; this.src='/src/assets/images/dest-ooty.png';" />

          <p>Ooty, known as the <em>Queen of Hill Stations</em>, is located just 85 KM from Coimbatore city. Traveling by cab from Coimbatore to Ooty gives you the flexibility to enjoy breathtaking viewpoints along the Mettupalayam and Coonoor ghat road with 36 hairpin curves.</p>

          <h3 style="font-size:1.4rem; font-weight:800; margin:24px 0 12px 0; color:var(--brand-dark);">1. Ooty Botanical Gardens</h3>
          <p>Spread over 55 acres on the slopes of Doddabetta peak, the Government Botanical Garden features over 1,000 species of exotic plants, ferns, and a 20-million-year-old fossilized tree trunk.</p>

          <h3 style="font-size:1.4rem; font-weight:800; margin:24px 0 12px 0; color:var(--brand-dark);">2. Ooty Lake & Boating Spot</h3>
          <p>Constructed in 1824 by John Sullivan, Ooty Lake is an iconic destination for pedal boating and motorboat rides surrounded by tall eucalyptus trees.</p>

          <h3 style="font-size:1.4rem; font-weight:800; margin:24px 0 12px 0; color:var(--brand-dark);">3. Doddabetta Peak (2,637 meters)</h3>
          <p>The highest mountain peak in the Nilgiris district. Enjoy panoramic 360-degree views of the valley through the Telescope House observatory.</p>

          <h3 style="font-size:1.4rem; font-weight:800; margin:24px 0 12px 0; color:var(--brand-dark);">4. Rose Garden & Tea Park</h3>
          <p>Home to over 20,000 varieties of roses, making it one of the largest rose collections in India.</p>

          <div class="blog-cta-banner">
            <h3>Ready for an Ooty Trip from Coimbatore?</h3>
            <p style="margin-bottom:16px;">Book a Sedan for ₹2,380 or an Innova SUV for ₹3,800. Driver Batta included with zero hidden costs!</p>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156 to Book Ooty Cab</a>
          </div>

          <h3 style="font-size:1.4rem; font-weight:800; margin:24px 0 12px 0; color:var(--brand-dark);">5. Coonoor Tea Estates & Sim's Park</h3>
          <p>En route from Mettupalayam to Ooty, stop by Coonoor for lush green tea garden photography, fresh factory tea tasting, and Sim's Park botanical displays.</p>

          <h3 style="font-size:1.4rem; font-weight:800; margin:24px 0 12px 0; color:var(--brand-dark);">Cab Fare Breakdown (Coimbatore to Ooty)</h3>
          <ul style="margin-left:20px; line-height:1.8;">
            <li><strong>Oneway Sedan (Dzire / Etios):</strong> ₹2,380 ~ ₹2,560 (85 KM + ₹500 Batta + ₹400 Hill Charge)</li>
            <li><strong>Oneway SUV (Ertiga / Innova):</strong> ₹3,800 ~ ₹4,100</li>
            <li><strong>Round Trip (Day Package):</strong> ₹15/KM + ₹500 Driver Batta</li>
          </ul>
        </div>
      `
    },
    'airport-guide': {
      title: 'Coimbatore Airport Taxi Booking: Fast 24/7 Pickups & Fixed Fares',
      category: 'Airport Taxi',
      date: 'July 2026',
      readTime: '4 min read',
      img: '/src/assets/images/blog-tips.png',
      content: `
        <div class="blog-full-article">
          <div class="blog-hero-header">
            <span class="blog-tag-badge" style="position:static; display:inline-block; margin-bottom:12px;">Airport Taxi</span>
            <h1>Coimbatore Airport Taxi Booking: Fast 24/7 Pickups & Fixed Fares</h1>
            <div class="blog-meta-info" style="font-size:0.9rem;">
              <span>📅 July 2026</span> • <span>⏱️ 4 min read</span> • <span>✍️ Get Cabs Dispatch Desk</span>
            </div>
          </div>

          <img src="/src/assets/images/blog-tips.png" alt="Coimbatore Airport Taxi Service" class="blog-featured-img" onerror="this.onerror=null; this.src='/src/assets/images/dest-ooty.png';" />

          <p>Coimbatore International Airport (CJB) located in Peelamedu connects thousands of business and leisure travelers daily. Getting a reliable taxi with zero surge pricing is crucial for early morning or late night flights.</p>

          <h3>Why Choose Get Cabs for Airport Transfers?</h3>
          <ul style="margin-left:20px; line-height:1.8;">
            <li><strong>10-Minute Instant Dispatch:</strong> Our cabs are stationed near Peelamedu, Hopes College, Gandhipuram, and RS Puram.</li>
            <li><strong>Zero Surge Fees:</strong> Unlike app aggregators, Get Cabs maintains fixed transparent ₹28/KM pricing 24 hours a day.</li>
            <li><strong>Flight Delay Monitoring:</strong> Provide your flight number and our driver waits for you at the CJB arrival gate without extra waiting penalties.</li>
          </ul>

          <div class="blog-cta-banner">
            <h3>Need an Immediate Airport Pickup or Drop?</h3>
            <p style="margin-bottom:16px;">Call our 24/7 hotline <strong>9894020156</strong> for immediate vehicle assignment in under 10 minutes!</p>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156 Now</a>
          </div>
        </div>
      `
    },
    'oneway-vs-round': {
      title: 'Oneway Cabs vs Round Trip Travel: Save Up to 40% On Intercity Travel',
      category: 'Fare Hacks',
      date: 'July 2026',
      readTime: '6 min read',
      img: '/src/assets/images/fleet-sedan.png',
      content: `
        <div class="blog-full-article">
          <div class="blog-hero-header">
            <span class="blog-tag-badge" style="position:static; display:inline-block; margin-bottom:12px;">Fare Hacks</span>
            <h1>Oneway Cabs vs Round Trip Travel: Save Up to 40% On Intercity Travel</h1>
            <div class="blog-meta-info" style="font-size:0.9rem;">
              <span>📅 July 2026</span> • <span>⏱️ 6 min read</span> • <span>✍️ Get Cabs Billing Team</span>
            </div>
          </div>

          <img src="/src/assets/images/fleet-sedan.png" alt="Oneway Cabs Coimbatore" class="blog-featured-img" onerror="this.onerror=null; this.src='/src/assets/images/dest-ooty.png';" />

          <p>Traditional outstation taxis charge return kilometer fares regardless of whether you need the cab for the journey back. Get Cabs Oneway Intercity Service eliminates return charges completely!</p>

          <h3>Cost Comparison Example: Coimbatore to Tirupur (55 KM)</h3>
          <p><strong>Traditional Outstation Taxi (Round Trip Charges):</strong> 110 KM @ ₹15/KM + ₹300 Driver Batta = ₹1,950+</p>
          <p><strong>Get Cabs Oneway Fare:</strong> 55 KM @ ₹28/KM + ₹300 Driver Batta = <strong>₹1,710 ~ ₹1,840</strong> (Save money and pay only for actual distance traveled!)</p>

          <div class="blog-cta-banner">
            <h3>Book Your Oneway Cab Today</h3>
            <p style="margin-bottom:16px;">Oneway drops available from Coimbatore to Chennai, Bangalore, Salem, Erode, Tirupur, Madurai & Kerala.</p>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156 to Book</a>
          </div>
        </div>
      `
    },
    'hill-drives': {
      title: 'Best Hill Station Drives from Coimbatore: Valparai, Kodaikanal & Munnar',
      category: 'Outstation Tours',
      date: 'July 2026',
      readTime: '5 min read',
      img: '/src/assets/images/blog-valparai.png',
      content: `
        <div class="blog-full-article">
          <div class="blog-hero-header">
            <span class="blog-tag-badge" style="position:static; display:inline-block; margin-bottom:12px;">Outstation Tours</span>
            <h1>Best Hill Station Drives from Coimbatore: Valparai, Kodaikanal & Munnar</h1>
            <div class="blog-meta-info" style="font-size:0.9rem;">
              <span>📅 July 2026</span> • <span>⏱️ 5 min read</span> • <span>✍️ Get Cabs Tour Desk</span>
            </div>
          </div>

          <img src="/src/assets/images/blog-valparai.png" alt="Hill Drives Outstation Cabs" class="blog-featured-img" onerror="this.onerror=null; this.src='/src/assets/images/dest-ooty.png';" />

          <p>Coimbatore is surrounded by Western Ghats mountain destinations. Hiring an experienced hill station driver ensures comfort, safety, and smooth navigation through foggy hairpin bends.</p>

          <h3>1. Valparai (105 KM • 40 Hairpin Bends)</h3>
          <p>A serene tea estate sanctuary with Lion-tailed Macaque sightings and Aliyar Dam views.</p>

          <h3>2. Munnar (160 KM • Tea Valley Gateway)</h3>
          <p>Famous for Anamudi Peak, Mattupetty Dam, and sprawling spice plantations.</p>

          <h3>3. Kodaikanal (175 KM • Princess of Hill Stations)</h3>
          <p>Explore Kodai Lake, Pillar Rocks, and Coaker's Walk with family SUV comfort.</p>

          <div class="blog-cta-banner">
            <h3>Book Your Hill Station SUV Tour</h3>
            <p style="margin-bottom:16px;">Innova Crysta & Ertiga Prime SUVs available with veteran hill drivers.</p>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    },
    'red-taxi-comparison': {
      title: 'Red Taxi vs Get Cabs: Why Local Travelers Prefer Get Cabs in 2026',
      category: 'Red Taxi Comparison',
      date: 'July 2026',
      readTime: '4 min read',
      img: '/src/assets/images/blog-munnar-kodai.png',
      content: `
        <div class="blog-full-article">
          <div class="blog-hero-header">
            <span class="blog-tag-badge" style="position:static; display:inline-block; margin-bottom:12px; background:#d90429; color:#fff;">Red Taxi Comparison</span>
            <h1>Red Taxi vs Get Cabs: Why Local Travelers Prefer Get Cabs in 2026</h1>
            <div class="blog-meta-info" style="font-size:0.9rem;">
              <span>📅 July 2026</span> • <span>⏱️ 4 min read</span> • <span>✍️ Get Cabs Editorial Team</span>
            </div>
          </div>

          <img src="/src/assets/images/blog-munnar-kodai.png" alt="Best Call Taxi in Coimbatore: Red Taxi vs Get Cabs" class="blog-featured-img" onerror="this.onerror=null; this.src='/src/assets/images/dest-ooty.png';" />

          <h2>Best Call Taxi in Coimbatore (2026): Red Taxi vs Ola vs Uber vs FastTrack vs Get Cabs</h2>
          
          <p>Whether you need an early-morning drop to Coimbatore International Airport (CJB), a quick commute along Avinashi Road, or an outstation cab from Coimbatore to Ooty, picking the right Coimbatore taxi service can make or break your day.</p>
          
          <p>With several options available—including <strong>Red Taxi Coimbatore</strong>, FastTrack Call Taxi, national aggregators like Ola and Uber, and <strong>Get Cabs</strong>—it helps to know how they stack up in terms of pricing, route knowledge, and overall reliability.</p>
          
          <p>Here is an honest, comprehensive comparison of the top call taxi services in Coimbatore in 2026.</p>

          <h3 style="font-size:1.35rem; font-weight:800; margin:28px 0 12px 0; color:var(--brand-dark);">The Competition Breakdown</h3>

          <h4 style="font-size:1.15rem; font-weight:700; margin:16px 0 8px 0; color:#d90429;">1. FastTrack Call Taxi</h4>
          <p>FastTrack is one of the oldest legacy call taxi networks in Tamil Nadu. They offer standard city cab rides and outstation drop taxi services. However, during peak hours, booking delays can occur due to fleet limitations compared to modern app platforms, and fares vary depending on demand.</p>

          <h4 style="font-size:1.15rem; font-weight:700; margin:16px 0 8px 0; color:#d90429;">2. Ola & Uber</h4>
          <p>Nationwide ride-hailing apps like Ola and Uber offer quick access to hatchbacks and sedans. However, Kovai commuters regularly encounter major drawbacks:</p>
          <ul style="margin-left:20px; line-height:1.8; margin-bottom:16px;">
            <li><strong>Frequent driver cancellations</strong> (especially if the driver doesn't like your drop location).</li>
            <li><strong>Steep surge pricing</strong> during rains, peak office hours, or high demand near TIDEL Park and Peelamedu.</li>
            <li>Drivers unfamiliar with local shortcuts who rely strictly on GPS.</li>
          </ul>

          <h4 style="font-size:1.15rem; font-weight:700; margin:16px 0 8px 0; color:#d90429;">3. Red Taxi Coimbatore</h4>
          <p>Red Taxi built a solid market presence across Kovai, Chennai, and Madurai. However, local riders frequently complain about two key issues:</p>
          <ul style="margin-left:20px; line-height:1.8; margin-bottom:16px;">
            <li><strong>Signal & Traffic Metering Fees:</strong> When your Red Taxi gets caught in traffic near Gandhipuram or waits at a long red light, the running meter charges extra per-minute waiting fees.</li>
            <li><strong>Migrated Drivers:</strong> A large portion of their driver pool consists of drivers migrated from outside regions who lack deep familiarity with Coimbatore's local neighborhoods and shortcuts.</li>
          </ul>

          <h4 style="font-size:1.15rem; font-weight:700; margin:16px 0 8px 0; color:#16a34a;">4. Get Cabs (The Preferred Local Alternative)</h4>
          <p>Get Cabs was designed specifically around what local commuters and frequent travelers actually need: zero traffic hidden fees and true local driver expertise.</p>

          <h3 style="font-size:1.35rem; font-weight:800; margin:28px 0 12px 0; color:var(--brand-dark);">3 Reasons Locals Are Switching to Get Cabs</h3>

          <p><strong>1. 100% Local, Personally Verified Drivers</strong><br>
          Unlike platforms that onboard outstation drivers unfamiliar with Kovai's roads, Get Cabs uses personally verified local Coimbatore drivers. They know every shortcut around Mettupalayam Road, Trichy Road, RS Puram, and Town Hall—getting you to your destination faster without relying blindly on map apps.</p>

          <p><strong>2. Zero Signal & Traffic Metering Charges</strong><br>
          With Red Taxi and other traditional meter-based services, your fare rises even when sitting completely still in a traffic jam. Get Cabs features a Zero-Traffic-Metering policy. You are never penalized for Coimbatore's signal stops or rush-hour traffic.</p>

          <p><strong>3. Fair & Transparent Billing</strong><br>
          Unexpected trip disruptions happen. Automated meters in standard taxis treat every pause—even if a passenger feels motion-sick—as extra billable time. At Get Cabs, our drivers prioritize fair service and customer care over squeezing extra rupees out of every stop.</p>

          <h3 style="font-size:1.35rem; font-weight:800; margin:28px 0 16px 0; color:var(--brand-dark);">Multi-Provider Feature Comparison</h3>

          <div class="price-table-wrap" style="margin-bottom:24px;">
            <table style="width:100%; border-collapse:collapse; font-size:0.92rem;">
              <thead>
                <tr style="background:#1e293b; color:#fff;">
                  <th style="padding:12px;">Feature / Metric</th>
                  <th style="padding:12px; background:#475569;">Red Taxi Coimbatore</th>
                  <th style="padding:12px; background:#475569;">Ola / Uber</th>
                  <th style="padding:12px; background:#475569;">FastTrack</th>
                  <th style="padding:12px; background:#d90429;">Get Cabs</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #cbd5e1;">
                  <td><strong>Driver Background</strong></td>
                  <td>Mostly migrated/outstation drivers</td>
                  <td>Randomly assigned drivers</td>
                  <td>Mixed local drivers</td>
                  <td style="background:#fef2f2; font-weight:700; color:#d90429;">100% Local, verified Kovai drivers</td>
                </tr>
                <tr style="border-bottom:1px solid #cbd5e1;">
                  <td><strong>Traffic / Signal Metering</strong></td>
                  <td>Charges extra when stopped in traffic</td>
                  <td>Dynamic surge algorithms</td>
                  <td>Distance + standard waiting rates</td>
                  <td style="background:#fef2f2; font-weight:700; color:#16a34a;">Zero traffic or signal stop charges</td>
                </tr>
                <tr style="border-bottom:1px solid #cbd5e1;">
                  <td><strong>Driver Cancellation Rate</strong></td>
                  <td>Moderate</td>
                  <td>High (driver-initiated)</td>
                  <td>Moderate</td>
                  <td style="background:#fef2f2; font-weight:700; color:#16a34a;">Guaranteed & Reliable pickups</td>
                </tr>
                <tr style="border-bottom:1px solid #cbd5e1;">
                  <td><strong>Local Shortcut Knowledge</strong></td>
                  <td>Relies strictly on GPS</td>
                  <td>Relies strictly on GPS</td>
                  <td>Decent route knowledge</td>
                  <td style="background:#fef2f2; font-weight:700; color:#d90429;">Expert knowledge of Kovai lanes & landmarks</td>
                </tr>
                <tr style="border-bottom:1px solid #cbd5e1;">
                  <td><strong>Outstation & Drop Taxi</strong></td>
                  <td>Standard outstation rates</td>
                  <td>High long-distance fares</td>
                  <td>Flat outstation packages</td>
                  <td style="background:#fef2f2; font-weight:700; color:#d90429;">Affordable outstation drop taxi packages</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 style="font-size:1.35rem; font-weight:800; margin:28px 0 12px 0; color:var(--brand-dark);">Top Routes Covered by Get Cabs</h3>
          <p>Whether you need a local Kovai call taxi or an outstation taxi from Coimbatore, Get Cabs covers all major routes:</p>
          <ul style="margin-left:20px; line-height:1.8; margin-bottom:20px;">
            <li><strong>Airport Transfers:</strong> Scheduled, guaranteed pickups to and from Coimbatore International Airport (CJB).</li>
            <li><strong>City Commutes:</strong> Quick rides to TIDEL Park, Peelamedu, Saravanampatti, Singanallur, and RS Puram.</li>
            <li><strong>Outstation Routes:</strong> Outstation drop taxi packages to Ooty, Coonoor, Valparai, Pollachi, Isha Yoga Center, Palani, Mysore, and Bangalore.</li>
          </ul>

          <h3 style="font-size:1.35rem; font-weight:800; margin:28px 0 12px 0; color:var(--brand-dark);">Final Verdict</h3>
          <p>While legacy players like FastTrack and Red Taxi Coimbatore paved the way, and apps like Ola/Uber offer basic convenience, <strong>Get Cabs delivers the ultimate balance for 2026:</strong> honest flat-rate pricing, zero traffic fees, and experienced local drivers who know Kovai inside out.</p>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Tired of traffic meters and driver cancellations?</h3>
            <p style="margin-bottom:16px;">Book your next ride with Get Cabs today via 1-click phone call or web booking!</p>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px; font-size:1.05rem;">📞 Call 9894020156 Now to Book Cab</a>
          </div>
        </div>
      `
    }
  };

  const PAGE_TEMPLATES = {
    'privacy-policy': {
      title: 'Privacy Policy',
      content: `
        <div class="policy-doc">
          <h2>Get Cabs Coimbatore Privacy Policy</h2>
          <p style="color:var(--text-muted);">Last Updated: July 2026 • Official Policy Document</p>
          
          <div class="policy-highlight-box">
            🔒 <strong>Commitment to Confidentiality:</strong> Get Cabs respects your personal data. We do NOT share, sell, or disclose your phone numbers, name, or trip locations to external third parties or telemarketing agencies.
          </div>

          <h3>1. Data We Collect</h3>
          <p>To provide accurate taxi dispatch and driver assignment in Coimbatore, Get Cabs collects:</p>
          <ul>
            <li><strong>Customer Contact Details:</strong> Phone number and customer name provided during web booking or phone call to 9894020156.</li>
            <li><strong>Trip Information:</strong> Pickup address, landmark, destination drop point, requested travel date, and preferred vehicle type (Sedan / SUV / Traveller).</li>
            <li><strong>GPS & Route Data:</strong> Live GPS coordinates utilized solely by the assigned driver during active ride navigation.</li>
          </ul>

          <h3>2. How We Use Your Data</h3>
          <p>Your details are strictly used for:</p>
          <ul>
            <li>Dispatching closest driver to your pickup location in Coimbatore.</li>
            <li>Sending booking confirmation SMS, driver contact details, and vehicle registration numbers.</li>
            <li>Customer support resolution and fare calculation transparency.</li>
          </ul>

          <h3>3. Data Protection & Security</h3>
          <p>All online reservation details are stored securely. Payment information handled directly with drivers via cash or UPI is verified immediately with zero stored card details.</p>

          <h3>4. Contact Data Officer</h3>
          <p>For privacy queries or request for data removal, contact Get Cabs Coimbatore at <strong>booking@getcabs.in</strong> or call <strong>9894020156</strong>.</p>
        </div>
      `
    },
    'terms-conditions': {
      title: 'Terms & Conditions',
      content: `
        <div class="policy-doc">
          <h2>Terms & Conditions of Service</h2>
          <p style="color:var(--text-muted);">Effective July 2026 • Get Cabs Coimbatore</p>

          <h3>1. Booking & Fare Structure</h3>
          <ul>
            <li><strong>Local Rides:</strong> Transparent ₹28/KM pricing for local city rides without peak surge charges.</li>
            <li><strong>Oneway Rides:</strong> ₹28/KM + Driver Batta (₹500 for Ooty route, ₹300 for other intercity routes) + ₹400 Hill Charge where applicable.</li>
            <li><strong>Outstation Round Trip:</strong> Charged at ₹15/KM (up & down cumulative mileage) + ₹300-₹500 daily Driver Batta. Minimum daily mileage benchmark is 250 KM per day as per Tamil Nadu commercial rules.</li>
          </ul>

          <h3>2. Tolls, Parking & State Permits</h3>
          <p>Highway toll booth charges, airport entry/parking fees, and inter-state permit taxes (e.g. Kerala / Karnataka permits) are extra at actuals payable by the passenger or added to the final invoice.</p>

          <h3>3. Passenger Luggage & Vehicle Capacity</h3>
          <ul>
            <li><strong>4-Seater Sedan:</strong> Maximum 4 passengers + 3 medium suitcases.</li>
            <li><strong>6-Seater SUV:</strong> Maximum 6 passengers + 4 medium suitcases.</li>
            <li><strong>7-Seater Innova:</strong> Maximum 7 passengers + 4 large suitcases.</li>
          </ul>

          <h3>4. Safety & Conduct</h3>
          <p>Smoking, consumption of alcohol, or illegal substances inside Get Cabs vehicles is strictly prohibited. Drivers hold full rights to terminate rides in cases of unruly behavior.</p>
        </div>
      `
    },
    'cancellation-policy': {
      title: 'Cancellation & Refund Policy',
      content: `
        <div class="policy-doc">
          <h2>Cancellation & Refund Policy</h2>
          <p style="color:var(--text-muted);">Transparent & Customer-Friendly Policy</p>

          <div class="policy-highlight-box">
            ✅ <strong>100% Free Cancellation:</strong> Cancel your booking free of charge anytime prior to driver vehicle dispatch!
          </div>

          <h3>1. Cancellation Guidelines</h3>
          <ul>
            <li><strong>Before Driver Dispatch:</strong> Zero cancellation fee.</li>
            <li><strong>After Driver Arrives at Pickup Location:</strong> If the ride is cancelled after the driver has reached your pickup spot in Coimbatore, a nominal ₹100 driver arrival fee applies.</li>
          </ul>

          <h3>2. Pre-Paid & Advance Booking Refunds</h3>
          <p>For advance outstation or airport reservations where advance payment was made, full refunds are processed within 24 business hours directly to your UPI/Bank account.</p>

          <h3>3. Extreme Weather & Hill Road Closures</h3>
          <p>In case of unexpected weather landslides, government road closures, or Nilgiris ghat road bans on Ooty / Valparai routes, Get Cabs provides 100% fee waiver and immediate re-routing support.</p>
        </div>
      `
    },
    'faq': {
      title: 'Frequently Asked Questions (FAQ)',
      content: `
        <div class="policy-doc">
          <h2>Get Cabs Frequently Asked Questions</h2>
          <p style="margin-bottom:20px; color:var(--text-muted);">Everything you need to know about Coimbatore cab booking, rates, and outstation trips.</p>

          <div class="contact-card-box">
            <h3 style="margin-top:0;">1. How fast can I get a cab in Coimbatore?</h3>
            <p>Our cabs are stationed across Gandhipuram, Peelamedu, RS Puram, Saravanampatti, Singanallur, and Coimbatore Airport. Standard pickup time is 5 to 10 minutes!</p>

            <h3>2. How are Oneway Intercity fares calculated?</h3>
            <p>Oneway fares are billed strictly at ₹28 per KM for actual travel distance plus applicable Driver Batta (₹500 for Ooty, ₹300 for non-hill routes). You pay ZERO return charges.</p>

            <h3>3. Are there extra night surge charges for city local rides?</h3>
            <p>No! Get Cabs does NOT charge night surge multipliers for local city transfers in Coimbatore.</p>

            <h3>4. Can I book an Innova Crysta for an Ooty family trip?</h3>
            <p>Yes! We specialize in Innova Crysta and Ertiga SUV hill station trips with experienced hill mountain drivers.</p>

            <h3>5. How do I book instantly?</h3>
            <p>Call our 24/7 hotline directly at <strong style="color:var(--brand-red);">9894020156</strong> or fill out the booking form on the main page.</p>
          </div>
        </div>
      `
    },
    'contact-us': {
      title: 'Contact Get Cabs Coimbatore',
      content: `
        <div class="policy-doc">
          <h2>Contact Us - Get Cabs Coimbatore</h2>
          <p>We are available 24 hours a day, 7 days a week to assist your travel needs.</p>

          <div class="contact-info-list">
            <div class="contact-item">
              <div class="contact-icon">📞</div>
              <div>
                <strong>24/7 Hotline</strong>
                <div style="font-size:1.1rem; color:var(--brand-red); font-weight:800; margin-top:2px;">9894020156</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">Instant Call Booking</div>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon">📍</div>
              <div>
                <strong>Coimbatore Dispatch Office</strong>
                <div style="font-size:0.9rem; margin-top:2px;">Gandhipuram Taxi Stand & Peelamedu Airport Rd, Coimbatore - 641001</div>
              </div>
            </div>

            <div class="contact-item">
              <div class="contact-icon">✉️</div>
              <div>
                <strong>Email Support</strong>
                <div style="font-size:0.9rem; margin-top:2px;">booking@getcabs.in</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">Quick Email Response</div>
              </div>
            </div>
          </div>

          <div class="contact-card-box" style="margin-top:24px;">
            <h3>Send Direct Message / Query</h3>
            <form id="direct-contact-form" onsubmit="event.preventDefault(); alert('Thank you! Get Cabs Coimbatore team will call you back at 9894020156 shortly.');">
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:12px;">
                <input type="text" placeholder="Your Name" required style="padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.95rem; width:100%;" />
                <input type="tel" placeholder="Your Phone Number" required style="padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.95rem; width:100%;" />
              </div>
              <textarea placeholder="Trip requirements or questions..." rows="4" required style="padding:10px; border:1px solid #cbd5e1; border-radius:6px; font-size:0.95rem; width:100%; margin-bottom:12px;"></textarea>
              <button type="submit" class="btn btn-red" style="padding:10px 24px;">Submit Direct Query</button>
            </form>
          </div>
        </div>
      `
    },
    'tariff': {
      title: 'Get Cabs Official Tariff Card',
      content: `
        <div class="policy-doc">
          <h2>Get Cabs Official Tariff Card</h2>
          <p style="margin-bottom:16px; color:var(--text-muted);">Transparent, fixed fare structure across local city rides, hourly rentals, and outstation drops in Coimbatore.</p>

          <div class="policy-highlight-box" style="margin-bottom:20px;">
            ❄️ <strong>Mandatory AC Comfort:</strong> Air Conditioning is enabled by default for all Mini & Sedan rides (unless specifically requested off by the customer).
          </div>

          <h3 style="color:var(--brand-dark); font-size:1.2rem; margin-bottom:10px;">1. Local City Rides (Mini / Sedan Cabs)</h3>
          <p style="line-height:1.7; margin-bottom:10px;">Instant local city rides and point-to-point drop services within Coimbatore with verified local professional drivers.</p>
          <ul style="line-height:1.8; margin-left:20px; margin-bottom:20px;">
            <li><strong>Guaranteed Standard Rates:</strong> Fixed upfront taxi pricing with zero surge pricing or meter tampering.</li>
            <li><strong>District Border Outskirts Surcharge:</strong> Outer area trips include a standard adjustment (+₹100 to ₹150) for areas including <em>Karumathampatti, Karanampettai, Paapampatti, Ganeshapuram / Kovilpalayam, Karamadai, Booluvampatti / Pooluvapatti, Ettimadai, Kinathukadavu</em>.</li>
          </ul>

          <h3 style="color:var(--brand-dark); font-size:1.2rem; margin-bottom:10px;">2. Hourly & Daily Rental Packages</h3>
          <ul style="line-height:1.8; margin-left:20px; margin-bottom:20px;">
            <li><strong>Hourly Rental Package:</strong> <strong style="color:var(--brand-red);">₹350 / Hour</strong> (Includes 10 KM free per hour; Additional distance @ ₹25/KM).</li>
            <li><strong>Package A (10 Hours / 100 KM Day Package):</strong> <strong style="color:var(--brand-red);">₹3,000 flat</strong> (Extra KM: ₹10/KM).</li>
            <li><strong>Package B (12 Hours / 100 KM Day Package):</strong> <strong style="color:var(--brand-red);">₹3,500 flat</strong> (Extra time: ₹150/hr for time exceeding 10 hours).</li>
          </ul>

          <h3 style="color:var(--brand-dark); font-size:1.2rem; margin-bottom:10px;">3. One-Way Drop Tariffs (From Gandhipuram, Ukkadam & Railway Station)</h3>
          <div style="overflow-x:auto; margin-bottom:20px;">
            <table class="tariff-table" style="width:100%; border-collapse:collapse; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; font-size:0.95rem;">
              <thead>
                <tr style="background:#1e293b; color:#ffffff; text-align:left;">
                  <th style="padding:10px;">Destination Drop Point</th>
                  <th style="padding:10px;">Distance</th>
                  <th style="padding:10px;">Net Drop Fare</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Annur</td><td>30 KM</td><td><strong style="color:var(--brand-red);">₹1,100</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Isha Yoga Center</td><td>33 KM</td><td><strong style="color:var(--brand-red);">₹1,100</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Anaikatti</td><td>30 KM</td><td><strong style="color:var(--brand-red);">₹1,300</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Mettupalayam</td><td>37 KM</td><td><strong style="color:var(--brand-red);">₹1,400</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Palladam / Sirumugai</td><td>39 - 40 KM</td><td><strong style="color:var(--brand-red);">₹1,500</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Avinashi / Pollachi / MTP Vana Bathrakaliamman Kovil</td><td>42 - 43 KM</td><td><strong style="color:var(--brand-red);">₹1,600</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Airport to Tiruppur</td><td>46 KM</td><td><strong style="color:var(--brand-red);">₹1,700</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Puliyampatti</td><td>49 KM</td><td><strong style="color:var(--brand-red);">₹1,800</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Palakkad / Tiruppur Town</td><td>52 - 55 KM</td><td><strong style="color:var(--brand-red);">₹1,900</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Airport to Palakkad</td><td>61 KM</td><td><strong style="color:var(--brand-red);">₹2,200</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Sathyamangalam / Kangeyam / Udumalpet</td><td>70 KM</td><td><strong style="color:var(--brand-red);">₹2,500</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Perundurai / Gobi / Kotagiri / Coonoor</td><td>70 - 83 KM</td><td><strong style="color:var(--brand-red);">₹2,900</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Dharapuram</td><td>85 KM</td><td><strong style="color:var(--brand-red);">₹2,950</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Erode</td><td>100 KM</td><td><strong style="color:var(--brand-red);">₹3,500</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0;"><td>Ooty Bus Stand Only</td><td>87 KM</td><td><strong style="color:var(--brand-red);">₹3,500</strong></td></tr>
                <tr style="border-bottom:1px solid #e2e8f0; background:#f8fafc;"><td>Palani</td><td>110 KM</td><td><strong style="color:var(--brand-red);">₹3,900</strong></td></tr>
              </tbody>
            </table>
          </div>

          <h3 style="color:var(--brand-dark); font-size:1.2rem; margin-bottom:10px;">4. Distance-Based Round Trip & Long Drop Rules</h3>
          <ul style="line-height:1.8; margin-left:20px; margin-bottom:20px;">
            <li><strong>Oneway drops under 100 KM:</strong> Calculated at round-trip mileage @ <strong>₹17 / KM</strong> (Go + Return).</li>
            <li><strong>Oneway drops over 130 KM:</strong> Calculated at round-trip mileage @ <strong>₹14 / KM</strong> (Go + Return) plus <strong>₹400 Driver Batta</strong>.</li>
          </ul>

          <h3 style="color:var(--brand-dark); font-size:1.2rem; margin-bottom:10px;">5. General Exclusions & Rules</h3>
          <ul style="line-height:1.8; margin-left:20px; margin-bottom:20px;">
            <li><strong>Tolls, Parking & State Permits:</strong> Toll gate charges, parking fees, and interstate permit fees are not included and must be paid directly by the customer at actuals.</li>
            <li><strong>Net Driver Rate:</strong> Fares represent net driver earnings with zero driver commissions deducted.</li>
          </ul>

          <div style="text-align:center; margin-top:24px;">
            <a href="tel:9894020156" class="btn btn-red" style="padding:12px 28px; font-size:1rem; display:inline-block;">📞 Call 9894020156 to Book Cab</a>
          </div>
        </div>
      `
    },
    'popular-routes': {
      title: 'Popular Routes from Coimbatore (Fixed Fares)',
      content: `
        <div class="policy-doc">
          <h2>Popular Intercity & Outstation Drop Routes</h2>
          <p style="margin-bottom:16px;">Fixed net drop rates for Mini & Sedan cabs from Coimbatore hubs.</p>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(250px, 1fr)); gap:16px; margin-top:20px;">
            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:8px;">
              <h4 style="font-size:1.1rem; color:var(--brand-dark); margin-bottom:4px;">Coimbatore ➔ Ooty Bus Stand</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">87 KM • Nilgiris Hill Route</p>
              <div style="font-size:1.2rem; color:var(--brand-red); font-weight:800; margin:8px 0;">₹3,500</div>
              <a href="tel:9894020156" class="btn btn-red" style="padding:6px 12px; font-size:0.8rem; display:inline-block;">Book Ooty Cab</a>
            </div>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:8px;">
              <h4 style="font-size:1.1rem; color:var(--brand-dark); margin-bottom:4px;">Coimbatore ➔ Pollachi</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">43 KM • Express Corridor</p>
              <div style="font-size:1.2rem; color:var(--brand-red); font-weight:800; margin:8px 0;">₹1,600</div>
              <a href="tel:9894020156" class="btn btn-red" style="padding:6px 12px; font-size:0.8rem; display:inline-block;">Book Pollachi Cab</a>
            </div>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:8px;">
              <h4 style="font-size:1.1rem; color:var(--brand-dark); margin-bottom:4px;">Coimbatore ➔ Palani</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">110 KM • Temple Highway</p>
              <div style="font-size:1.2rem; color:var(--brand-red); font-weight:800; margin:8px 0;">₹3,900</div>
              <a href="tel:9894020156" class="btn btn-red" style="padding:6px 12px; font-size:0.8rem; display:inline-block;">Book Palani Cab</a>
            </div>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:8px;">
              <h4 style="font-size:1.1rem; color:var(--brand-dark); margin-bottom:4px;">Coimbatore ➔ Erode</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">100 KM • Highway Express</p>
              <div style="font-size:1.2rem; color:var(--brand-red); font-weight:800; margin:8px 0;">₹3,500</div>
              <a href="tel:9894020156" class="btn btn-red" style="padding:6px 12px; font-size:0.8rem; display:inline-block;">Book Erode Cab</a>
            </div>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:8px;">
              <h4 style="font-size:1.1rem; color:var(--brand-dark); margin-bottom:4px;">Coimbatore ➔ Sathyamangalam</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">70 KM • Highway Route</p>
              <div style="font-size:1.2rem; color:var(--brand-red); font-weight:800; margin:8px 0;">₹2,500</div>
              <a href="tel:9894020156" class="btn btn-red" style="padding:6px 12px; font-size:0.8rem; display:inline-block;">Book Sathyamangalam Cab</a>
            </div>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:16px; border-radius:8px;">
              <h4 style="font-size:1.1rem; color:var(--brand-dark); margin-bottom:4px;">Coimbatore ➔ Coonoor</h4>
              <p style="font-size:0.85rem; color:var(--text-muted);">70 KM • Hill Route</p>
              <div style="font-size:1.2rem; color:var(--brand-red); font-weight:800; margin:8px 0;">₹2,900</div>
              <a href="tel:9894020156" class="btn btn-red" style="padding:6px 12px; font-size:0.8rem; display:inline-block;">Book Coonoor Cab</a>
            </div>
          </div>
        </div>
      `
    },
    'oneway-routes': {
      title: 'Discounted Oneway Routes',
      content: `
        <div class="policy-doc">
          <h2>Coimbatore Oneway Taxi Service</h2>
          <p>Pay strictly for distance traveled. Zero return charges guaranteed!</p>
          <div class="policy-highlight-box">
            🚕 All Oneway fares include vehicle rate, driver batta, and toll estimate with zero hidden extras.
          </div>
          <div style="margin-top:20px; text-align:center;">
            <p>Use our main page Oneway Fare Calculator for live instant price estimates.</p>
            <a href="tel:9894020156" class="btn btn-red" style="padding:12px 28px; font-size:1rem; margin-top:10px; display:inline-block;">📞 Call 9894020156 for Instant Oneway Booking</a>
          </div>
        </div>
      `
    },
    'blogs': {
      title: 'Get Cabs Travel Blogs & Articles',
      content: `
        <div class="policy-doc">
          <h2>Coimbatore Travel Blogs & Cab Guides</h2>
          <p style="margin-bottom:24px;">Explore our travel guides, route tips, and money-saving cab hacks.</p>
          <div id="blogs-full-list" class="blogs-grid"></div>
        </div>
      `
    },
    'tour-packages': {
      title: 'Popular Tour Packages & Outstation Trips',
      content: `
        <div class="policy-doc">
          <h2>Coimbatore Outstation Tour Packages</h2>
          <p style="margin-bottom:24px;">Handcrafted holiday packages with on-the-way sightseeing, temple & river stops, road curve advice, hygienic dining hubs, and fixed vehicle pricing.</p>
          <div id="modal-packages-full-list" class="tour-packages-grid"></div>
        </div>
      `
    }
  };

  const TOUR_PACKAGES_DATA = {
    'ooty-coonoor-kotagiri': {
      title: 'Ooty, Coonoor & Kotagiri Nilgiris Package',
      category: 'Nilgiris Hill Special',
      duration: 'Full Day / 2 Days',
      distance: '85 KM to Ooty (3 Hours Drive)',
      startingPrice: '₹2,380',
      img: '/src/assets/images/dest-ooty.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Nilgiris Hill Special</span>
            <h1>Ooty, Coonoor & Kotagiri Nilgiris Tour Package</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Experience 36 Hairpin Curves, sprawling tea gardens, cascading waterfalls, and peak viewpoints from Coimbatore.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Total Distance</span><span>85 KM (One Way)</span></div>
            <div class="tour-spec-item"><span>Est. Drive Time</span><span>2.5 to 3.5 Hours</span></div>
            <div class="tour-spec-item"><span>Ghat Road</span><span>36 Hairpin Bends</span></div>
            <div class="tour-spec-item"><span>Ideal Timing</span><span>6:00 AM Departure</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹2,380 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <p>Your journey from Coimbatore to the Nilgiris passes through rich agricultural plains and lush mountain foothills:</p>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Bhavani River Banks at Mettupalayam:</strong> Beautiful river views at the base of the Western Ghats.</li>
              <li><strong>Burliyar Fruit Stalls:</strong> Famous roadside stops for exotic fresh hill fruits like Mangosteen, Rambutan, Passion Fruit, and fresh Jackfruit.</li>
              <li><strong>Black Bridge (Wellington):</strong> Historic British military cantonment area with manicured gardens and eucalyptus tree avenues.</li>
              <li><strong>Coonoor Tea Estates:</strong> Sprawling green tea carpets along the road. Great for tea tasting and photo stops.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Road Conditions, Curves & Hairpin Bends</h3>
            <div class="road-bends-warning">
              ⚠️ <strong>36 Hairpin Curves Warning:</strong> The Mettupalayam to Coonoor/Ooty ghat road features 36 sharp hairpin bends with steep gradient climbs.
            </div>
            <p><strong>Driving Tips & Road Notes:</strong></p>
            <ul style="margin-left:20px; line-height:1.8;">
              <li>Roads are freshly paved bitumen tar, equipped with convex safety mirrors and reflective cat-eyes.</li>
              <li>Morning mist and afternoon fog are common around Wellington and Doddabetta Peak; all Get Cabs vehicles come equipped with high-intensity fog lamps.</li>
              <li>Our drivers are veteran Nilgiris hill specialists trained in gear braking and mountain right-of-way courtesy.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛕 Popular Temples, Rivers & Waterfalls</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Elk Hill Murugan Temple (Ooty):</strong> Features a grand 40-ft Lord Murugan statue set against lush hill backdrops.</li>
              <li><strong>Catherine Falls (Kotagiri):</strong> A breathtaking double-tiered waterfall cascading from a height of 250 feet.</li>
              <li><strong>Laws Falls (Coonoor):</strong> Scenic waterfall amidst dense forest cover along the Coonoor ghat road.</li>
              <li><strong>Pykara River & Waterfalls:</strong> Pristine river surrounded by pine forests offering speed boat rides and waterfall vistas.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>⏱️ Timings & Operating Hours</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Recommended Departure:</strong> 6:00 AM from Coimbatore to beat Mettupalayam checkpost traffic.</li>
              <li><strong>Ooty Botanical Garden:</strong> 7:00 AM – 6:30 PM</li>
              <li><strong>Doddabetta Peak Viewpoint:</strong> 9:00 AM – 5:30 PM</li>
              <li><strong>Pykara Lake Boating:</strong> 9:30 AM – 5:00 PM</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restroom Facilities:</strong> Clean, well-maintained family restrooms are available at designated stops along the highway.
            </div>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Hilltop Pure Veg (Mettupalayam):</strong> Excellent South Indian breakfast with squeaky clean restrooms and spacious parking.</li>
              <li><strong>Cabbages & Condiments (Coonoor):</strong> Cozy continental dining and organic tea room with clean restroom facilities.</li>
              <li><strong>Hotel Annapoorna (Ooty Main Market):</strong> Traditional vegetarian meals with hygienic washrooms.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Seating</th>
                    <th>Oneway Drop</th>
                    <th>Full Day Tour (220 KM)</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>4 Passengers</td>
                    <td>₹2,380</td>
                    <td>₹3,800</td>
                    <td>Driver Batta + Hill Charges Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>6 Passengers</td>
                    <td>₹3,800</td>
                    <td>₹5,500</td>
                    <td>Spacious Boot Space + AC + Hill Specialist</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>7 Passengers</td>
                    <td>₹4,800</td>
                    <td>₹6,800</td>
                    <td>Reclining Captain Seats + Luxury Suspensions</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style="font-size:0.85rem; color:#64748b; margin-top:10px;">*Tolls, state permits (if applicable), and parking fees paid at actuals. Zero hidden surge fees!</p>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Your Ooty, Coonoor & Kotagiri Cab Tour</h3>
            <p style="margin-bottom:16px;">Call Get Cabs 24/7 hotline or message on WhatsApp for instant booking confirmation!</p>
            <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center;">
              <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
              <a href="https://wa.me/919894020156?text=Hi%20Get%20Cabs,%20I%20want%20to%20book%20Ooty%20Tour%20Package" target="_blank" class="btn btn-red" style="padding:12px 24px; background:#25d366; border-color:#25d366;">💬 WhatsApp Booking</a>
            </div>
          </div>
        </div>
      `
    },
    'munnar-hills': {
      title: 'Munnar Tea Hills & Waterfalls Package',
      category: 'Tea Hills & Waterfalls',
      duration: '2 Days / 1 Night',
      distance: '160 KM (4.5 Hours Drive)',
      startingPrice: '₹3,800',
      img: '/src/assets/images/dest-munnar.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Tea Hills & Waterfalls</span>
            <h1>Munnar Tea Hills & Waterfalls Tour Package</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Discover sprawling spice plantations, Cheeyappara waterfalls, Marayoor sandalwood forests, and Anamudi Peak views from Coimbatore.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Total Distance</span><span>160 KM (One Way)</span></div>
            <div class="tour-spec-item"><span>Est. Drive Time</span><span>4.5 Hours</span></div>
            <div class="tour-spec-item"><span>Route</span><span>via Udumalpet & Marayoor</span></div>
            <div class="tour-spec-item"><span>Ideal Timing</span><span>5:30 AM Departure</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹3,800 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <p>The scenic drive to Munnar via Udumalpet offers incredible ecological diversity:</p>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Udumalpet Cotton Belt & Windmills:</strong> Flat green plains dotted with giant clean-energy wind turbines.</li>
              <li><strong>Amaravathi Dam Crocodile Park:</strong> India's largest mugger crocodile breeding sanctuary near Amaravathi reservoir.</li>
              <li><strong>Chinnar Wildlife Sanctuary:</strong> Border jungle stretch where spotter deer, wild elephants, and giant squirrels are frequently seen crossing the road.</li>
              <li><strong>Marayoor Sandalwood Forests & Jaggery Stalls:</strong> Natural sandalwood forest groves and traditional sugarcane jaggery-making units.</li>
              <li><strong>Lakkam Waterfalls:</strong> Beautiful cascading waterfall right on the Marayoor-Munnar roadside.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Road Conditions, Curves & Bends</h3>
            <div class="road-bends-warning">
              ⚠️ <strong>Forest Checkpost & Tea Estate Curves:</strong> Chinnar forest checkpost operates strictly between 6:00 AM and 9:00 PM. Mountain road features narrow S-bends through Marayoor tea estates.
            </div>
            <p><strong>Driving Tips & Road Notes:</strong></p>
            <ul style="margin-left:20px; line-height:1.8;">
              <li>Excellent single-lane and double-lane tarmac; horn usage recommended on blind estate curves.</li>
              <li>Spacious SUV vehicles (Ertiga / Innova Crysta) are highly recommended for family comfort on this 4.5-hour hill drive.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛕 Popular Temples, Rivers & Waterfalls</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Cheeyappara & Valara Waterfalls:</strong> Seven-step cascading waterfall along the Munnar gap road.</li>
              <li><strong>Subramanya Swamy Temple (Udumalpet):</strong> Revered ancient temple located at the foothills.</li>
              <li><strong>Pamba River Tributaries:</strong> Pristine mountain streams flowing alongside the highway.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>⏱️ Timings & Operating Hours</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Forest Checkpost Hours:</strong> 6:00 AM – 9:00 PM</li>
              <li><strong>Kannan Devan Tea Museum:</strong> 9:00 AM – 5:00 PM</li>
              <li><strong>Eravikulam National Park (Nilgiri Tahr):</strong> 7:30 AM – 4:00 PM</li>
              <li><strong>Mattupetty Dam Boating:</strong> 9:00 AM – 5:30 PM</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restroom Facilities:</strong> Clean washrooms available at Udumalpet highway plazas and Marayoor food hubs.
            </div>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Saravana Bhavan (Udumalpet Highway):</strong> Piping hot South Indian breakfast with clean restrooms.</li>
              <li><strong>Marayoor Highway Food Plaza:</strong> Kerala meals, fresh coconut water, and hygienic restrooms.</li>
              <li><strong>Rapsy Restaurant (Munnar Town):</strong> Authentic Malabar biryani and appam stew.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Oneway Drop</th>
                    <th>2 Days / 1 Night Tour</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹3,800</td>
                    <td>₹6,500</td>
                    <td>Driver Batta + Kerala Border Permit Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹5,800</td>
                    <td>₹9,500</td>
                    <td>Spacious 6-Seater + AC + Mountain Driver</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹7,200</td>
                    <td>₹12,500</td>
                    <td>Captain Seats + Unmatched Comfort</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Your Munnar Hill & Waterfall Tour</h3>
            <p style="margin-bottom:16px;">Speak with Get Cabs Munnar travel desk for customized hotel + cab itineraries!</p>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156 to Book</a>
          </div>
        </div>
      `
    },
    'kodaikanal-hills': {
      title: 'Kodaikanal Lake & Mountain Peak Package',
      category: 'Princess of Hills',
      duration: 'Full Day / 2 Days',
      distance: '175 KM (4.5 Hours Drive)',
      startingPrice: '₹4,200',
      img: '/src/assets/images/dest-kodaikanal.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Princess of Hills</span>
            <h1>Kodaikanal Lake & Mountain Peak Tour Package</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Explore Kodai Lake boating, Pillar Rocks, Coaker's Walk, Pine Forests, and Silver Cascade waterfalls from Coimbatore.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Total Distance</span><span>175 KM (One Way)</span></div>
            <div class="tour-spec-item"><span>Est. Drive Time</span><span>4.5 Hours</span></div>
            <div class="tour-spec-item"><span>Ghat Road</span><span>14 Hairpin Bends</span></div>
            <div class="tour-spec-item"><span>Ideal Timing</span><span>5:30 AM Departure</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹4,200 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Palani Foot Hills & Temple View:</strong> Panoramic views of the sacred Palani Dhandayuthapani temple hill.</li>
              <li><strong>Batlagundu Junction Fruit Market:</strong> Fresh sweet mangoes, bananas, and local organic produce.</li>
              <li><strong>Dum Dum Rock Viewpoint:</strong> Historical rock formation overlooking the Manjalar Dam reservoir.</li>
              <li><strong>Silver Cascade Waterfalls:</strong> Magnificent 180-foot waterfall located right at the entrance of Kodaikanal.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Road Conditions, Curves & Hairpin Bends</h3>
            <div class="road-bends-warning">
              ⚠️ <strong>14 Hairpin Bends Ghat Road:</strong> The Batlagundu to Kodaikanal road ascends smoothly with 14 wide hairpin bends. Safe, wide tar highway.
            </div>
          </div>

          <div class="guide-section-box">
            <h3>🛕 Popular Temples, Rivers & Waterfalls</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Kurinji Andavar Temple:</strong> Dedicated to Lord Murugan, famous for the Kurinji flower that blooms once every 12 years.</li>
              <li><strong>Poombarai Murugan Temple & Village:</strong> Scenic 3000-year-old temple surrounded by stepped garlic farms.</li>
              <li><strong>Bear Shola Falls:</strong> Tranquil waterfall inside a dense reserve forest.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>⏱️ Timings & Operating Hours</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Kodai Lake Boating & Cycling:</strong> 9:00 AM – 6:00 PM</li>
              <li><strong>Bryant Park Botanical Garden:</strong> 9:00 AM – 6:00 PM</li>
              <li><strong>Coaker's Walk & Telescope House:</strong> 7:00 AM – 7:00 PM</li>
              <li><strong>Pillar Rocks Viewpoint:</strong> 9:00 AM – 5:00 PM</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restrooms:</strong> Clean restrooms at Hotel Tamil Nadu Batlagundu and Astoria Veg Kodaikanal.
            </div>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Hotel Tamil Nadu (Batlagundu Bypass):</strong> Hygienic restrooms and delicious South Indian breakfast.</li>
              <li><strong>Astoria Veg Restaurant (Kodai Bus Stand):</strong> Pure vegetarian dining with clean facilities.</li>
              <li><strong>Cloud Street Cafe (Seven Road Junction):</strong> Wood-fired pizzas and hot chocolate.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Oneway Drop</th>
                    <th>Full Day Tour (350 KM)</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹4,200</td>
                    <td>₹6,800</td>
                    <td>Driver Batta + Hill Charges Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹6,200</td>
                    <td>₹9,800</td>
                    <td>6 Passenger Seats + Luggage Carrier</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹7,800</td>
                    <td>₹12,800</td>
                    <td>Luxury Leather Interiors + Smooth Suspension</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Kodaikanal Cab Package</h3>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    },
    'yercaud-hills': {
      title: 'Yercaud Shevaroy Hills Gateway Package',
      category: 'Weekend Hill Gateway',
      duration: 'Full Day Tour',
      distance: '195 KM (4 Hours Drive)',
      startingPrice: '₹4,800',
      img: '/src/assets/images/dest-coonoor.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Weekend Hill Gateway</span>
            <h1>Yercaud Shevaroy Hills Gateway Tour Package</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Ascend the 20 Hairpin Bends to Shevaroy Hills, Emerald Lake, Pagoda Point, and Killiyur Waterfalls.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Total Distance</span><span>195 KM (One Way)</span></div>
            <div class="tour-spec-item"><span>Est. Drive Time</span><span>4 Hours</span></div>
            <div class="tour-spec-item"><span>Ghat Road</span><span>20 Hairpin Bends</span></div>
            <div class="tour-spec-item"><span>Ideal Timing</span><span>6:00 AM Departure</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹4,800 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Sankari Bypass Highway:</strong> Smooth 4-lane expressway via Salem route.</li>
              <li><strong>Salem Steel Plant Corridor:</strong> Industrial township views framed by Shevaroy mountain foothills.</li>
              <li><strong>20 Hairpin Bends Viewpoints:</strong> Scenic pull-over spots overlooking Salem city lights.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Road Conditions, Curves & Hairpin Bends</h3>
            <div class="road-bends-warning">
              ⚠️ <strong>20 Hairpin Bends Ascent:</strong> Well-engineered 30 KM mountain road with well-banked hairpin turns and LED reflectors.
            </div>
          </div>

          <div class="guide-section-box">
            <h3>🛕 Popular Temples, Rivers & Waterfalls</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Shevaroy Cave Temple:</strong> Sacred cave shrine dedicated to Lord Shevaroyan and Goddess Kaveri located at the highest peak (5,326 ft).</li>
              <li><strong>Killiyur Waterfalls:</strong> Spectacular 300-foot waterfall cascading into the Raja Rajeshwari valley.</li>
              <li><strong>Raja Rajeshwari Temple:</strong> Peaceful spiritual temple surrounded by spice orchards.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>⏱️ Timings & Operating Hours</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Emerald Lake Boating:</strong> 8:30 AM – 5:30 PM</li>
              <li><strong>Lady's Seat & Telescope House:</strong> 9:00 AM – 6:00 PM</li>
              <li><strong>Botanical Garden & Orchidarium:</strong> 9:00 AM – 5:00 PM</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restrooms:</strong> Saravana Bhavan Salem Highway Plaza offers clean washrooms and spacious parking.
            </div>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Full Day Tour Rate</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹4,800</td>
                    <td>Driver Batta + Hill Charges Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹6,800</td>
                    <td>6-Seater Family Comfort</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹8,500</td>
                    <td>Executive Comfort + Reclining Seats</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Yercaud Cab Tour</h3>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    },
    'isha-vellingiri': {
      title: 'Isha Yoga Center & Vellingiri Sacred Package',
      category: 'Spiritual & Wellness',
      duration: 'Half Day / Full Day',
      distance: '30 KM from City (45 Mins)',
      startingPrice: '₹1,200',
      img: '/src/assets/images/dest-adiyogi.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Spiritual & Wellness</span>
            <h1>Isha Yoga Center & Vellingiri Hills Sacred Package</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Visit the 112ft Adiyogi Shiva Statue, Dhyanalinga, Perur Pateeswarar Temple, and Kovai Kutralam waterfalls.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Distance</span><span>30 KM from City</span></div>
            <div class="tour-spec-item"><span>Drive Time</span><span>45 Minutes</span></div>
            <div class="tour-spec-item"><span>Road</span><span>Flat Asphalt Road</span></div>
            <div class="tour-spec-item"><span>Ideal Timing</span><span>6 AM or 3 PM</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹1,200 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Perur Pateeswarar Temple:</strong> 1000-year-old ancient Chola temple featuring carved Kanaka Sabha pillars.</li>
              <li><strong>Noyyal River Banks:</strong> Sacred river flowing through the historical agricultural belt of Coimbatore.</li>
              <li><strong>Thondamuthur Coconut Farms:</strong> Lush green countryside road lined with tall coconut palms.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Road Conditions & Drive Profile</h3>
            <p>Smooth double-lane asphalt road via Thondamuthur and Semmedu. Zero hairpin bends or steep climbs. Perfect drive for senior citizens and families.</p>
          </div>

          <div class="guide-section-box">
            <h3>🛕 Popular Temples, Rivers & Waterfalls</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>112-ft Adiyogi Shiva Statue:</strong> Iconic giant steel monument recognized by Guinness World Records. Adiyogi Divya Darshanam 3D Laser Light Show held every evening at 7:00 PM.</li>
              <li><strong>Dhyanalinga & Holy Kunds:</strong> Meditative consecration with Suryakund (for men) and Chandrakund (for women) subterranean holy dip pools.</li>
              <li><strong>Poondi Vellingiri Aandavar Temple:</strong> Foothills temple for the sacred Vellingiri hill pilgrimage.</li>
              <li><strong>Kovai Kutralam Waterfalls:</strong> Pristine Siruvani river waterfall inside reserve forest.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>⏱️ Timings & Operating Hours</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Isha Yoga Gate Open:</strong> 6:00 AM – 8:00 PM</li>
              <li><strong>Adiyogi Light Show:</strong> 7:00 PM – 7:15 PM Daily</li>
              <li><strong>Perur Pateeswarar Temple:</strong> 6:00 AM – 1:00 PM & 4:00 PM – 8:30 PM</li>
              <li><strong>Kovai Kutralam Entry:</strong> 10:00 AM – 3:30 PM (Closed Mondays)</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restrooms:</strong> Isha Visitors Welcome Center provides world-class clean restrooms and baby care rooms.
            </div>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Pepper Vine Eatery (Isha Center):</strong> Organic vegetarian snacks, fresh juices, and herbal teas.</li>
              <li><strong>Saravana Bhavan (Perur Junction):</strong> Traditional South Indian tiffin.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Half-Day Drop & Wait</th>
                    <th>Full Day City + Isha Package</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹1,200</td>
                    <td>₹1,800</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹1,800</td>
                    <td>₹2,600</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹2,400</td>
                    <td>₹3,400</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Isha & Adiyogi Taxi Package</h3>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    },
    'kerala-coastal': {
      title: 'Kerala Coastal Special (Chavakkad, Cherai, Kochi & Alleppey)',
      category: 'Beaches & Backwaters',
      duration: '2 Days / 1 Night',
      distance: '140 KM to 220 KM',
      startingPrice: '₹4,500',
      img: '/src/assets/images/dest-wayanad.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Beaches & Backwaters</span>
            <h1>Kerala Coastal Special (Chavakkad, Cherai, Kochi & Alleppey)</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Golden beaches, Fort Kochi heritage, Chinese fishing nets, and Alleppey backwater houseboat cruises.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Destinations</span><span>Chavakkad, Cherai, Kochi, Alleppey</span></div>
            <div class="tour-spec-item"><span>Drive Time</span><span>3.5 to 5 Hours</span></div>
            <div class="tour-spec-item"><span>Highway</span><span>NH 544 Express Highway</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹4,500 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Palakkad Gap Highway:</strong> Mountain gap in the Western Ghats connecting Tamil Nadu and Kerala.</li>
              <li><strong>Bharatapuzha River (River Nila):</strong> Sacred ancient river crossing at Shoranur / Thrissur route.</li>
              <li><strong>Thrissur Cultural Hub:</strong> Vadakkunnathan Temple grounds & heritage town.</li>
              <li><strong>Fort Kochi Chinese Fishing Nets:</strong> Historic 14th-century Chinese fishing cantilever structures at sunset.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Road Conditions & Highway Profile</h3>
            <p>Pristine 4-lane NH 544 express highway via Walayar checkpost. Smooth flat road with zero hairpin curves. All Get Cabs vehicles carry valid Kerala State Tourist Taxi Entry Permits.</p>
          </div>

          <div class="guide-section-box">
            <h3>🛕 Popular Beaches, Rivers & Backwaters</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Chavakkad Beach & Floating Park:</strong> Famous Azhimukham river-sea confluence beach.</li>
              <li><strong>Cherai Beach:</strong> Golden sand beach where backwaters and sea run side by side.</li>
              <li><strong>Vembanad Lake & Alleppey Backwaters:</strong> Traditional Kerala houseboat cruise through palm-fringed canals.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restrooms:</strong> Kuttanad Highway Plazas & Shell Fuel Stations offer clean washrooms.
            </div>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Oneway Drop</th>
                    <th>2 Days / 1 Night Tour</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹4,500</td>
                    <td>₹8,500</td>
                    <td>Driver Batta + Kerala Tax Permit Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹6,800</td>
                    <td>₹11,800</td>
                    <td>Spacious 6-Seater + AC</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹8,800</td>
                    <td>₹15,200</td>
                    <td>Reclining Captain Chairs + Highway Luxury</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Kerala Coastal & Backwater Tour</h3>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    },
    'pilgrimage-heritage': {
      title: 'Guruvayur, Madurai & Trichy Grand Pilgrimage Package',
      category: 'Heritage Pilgrimage',
      duration: '2 Days / 1 Night',
      distance: '140 KM to 215 KM',
      startingPrice: '₹3,800',
      img: '/src/assets/images/dest-madurai.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Heritage Pilgrimage</span>
            <h1>Guruvayur, Madurai & Trichy Grand Pilgrimage Tour</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Visit Guruvayur Sree Krishna Temple, Madurai Meenakshi Amman Temple, and Trichy Srirangam Ranganathaswamy Temple.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Destinations</span><span>Guruvayur, Madurai, Trichy</span></div>
            <div class="tour-spec-item"><span>Drive Time</span><span>3.5 to 4 Hours per Sector</span></div>
            <div class="tour-spec-item"><span>Highways</span><span>NH 44 & NH 83 Expressways</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹3,800 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 Key Temple Shrines & Sightseeing</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Guruvayur Sree Krishna Temple & Punnathur Kottai:</strong> Holy shrine of Lord Guruvayurappan & Elephant Sanctuary with over 50 temple elephants.</li>
              <li><strong>Madurai Meenakshi Amman Temple & Nayakar Mahal:</strong> World-renowned Dravidian architectural marvel with towering gopurams & Vaigai river banks.</li>
              <li><strong>Trichy Srirangam Ranganathaswamy Temple:</strong> Largest functioning Hindu temple complex in the world on Kaveri River island, plus Rockfort Ucchi Pillayar shrine.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Highway Conditions & Drive Comfort</h3>
            <p>Direct 4-lane high-speed national expressways (NH 44 to Madurai and NH 83 to Trichy). Ultra-smooth flat roads ideal for family pilgrimages.</p>
          </div>

          <div class="guide-section-box">
            <h3>⏱️ Temple Darshan Timings</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Guruvayur Temple:</strong> 3:00 AM – 12:30 PM & 4:30 PM – 9:15 PM</li>
              <li><strong>Madurai Meenakshi Temple:</strong> 5:00 AM – 12:30 PM & 4:00 PM – 10:00 PM</li>
              <li><strong>Srirangam Temple:</strong> 6:00 AM – 1:00 PM & 3:30 PM – 9:00 PM</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restrooms:</strong> Sree Annapoorna Highway Plazas & Murugan Idli Shop provide pristine washrooms.
            </div>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Single Shrine Drop</th>
                    <th>3-City 2-Day Package</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹3,800</td>
                    <td>₹8,800</td>
                    <td>Driver Allowance Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹5,500</td>
                    <td>₹12,500</td>
                    <td>Spacious 6-Seater Family Car</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹7,200</td>
                    <td>₹16,200</td>
                    <td>Executive Comfort + Reclining Seats</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Pilgrimage Temple Tour</h3>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    },
    'kanyakumari-sunrise': {
      title: 'Kanyakumari Sunrise & Southern Coast Package',
      category: 'Southern Coast Special',
      duration: '2 Days / 1 Night',
      distance: '400 KM (6.5 Hours Drive)',
      startingPrice: '₹10,500',
      img: '/src/assets/images/dest-mysore.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Southern Coast Special</span>
            <h1>Kanyakumari Sunrise & Southern Coast Package</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Experience Vivekananda Rock Memorial, 133ft Thiruvalluvar Statue, Kanyakumari Devi Temple, and Triveni Sangam sunrise.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Total Distance</span><span>400 KM (One Way)</span></div>
            <div class="tour-spec-item"><span>Drive Time</span><span>6.5 Hours</span></div>
            <div class="tour-spec-item"><span>Highway</span><span>NH 44 North-South Corridor</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹10,500 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Tirunelveli Thamirabarani River & Iruttukadai:</strong> Stop at Tirunelveli for world-famous hot wheat halwa.</li>
              <li><strong>Aralvaimozhi Windmill Farms:</strong> Hundreds of wind turbines along the mountain pass.</li>
              <li><strong>Suchindram Thanumalayan Temple:</strong> Famous 17th-century temple dedicated to the Trinity (Brahma, Vishnu, Shiva) with 18-ft Hanuman statue.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Highway Conditions</h3>
            <p>Pristine NH 44 4-lane expressway direct from Coimbatore via Karur, Dindigul, Madurai, and Tirunelveli. Smooth high-speed driving.</p>
          </div>

          <div class="guide-section-box">
            <h3>⏱️ Timings & Highlights</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Sunrise at Triveni Sangam:</strong> 6:00 AM</li>
              <li><strong>Ferry to Vivekananda Rock Memorial:</strong> 8:00 AM – 4:00 PM</li>
              <li><strong>Kanyakumari Devi Temple:</strong> 4:30 AM – 12:30 PM & 4:00 PM – 8:30 PM</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>2 Days / 1 Night Package Rate</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹10,500</td>
                    <td>Driver Batta + Toll Assistance Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹14,800</td>
                    <td>6 Passenger Seats + Luggage Carrier</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹18,500</td>
                    <td>Captain Chairs + Highway Comfort</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Kanyakumari Tour Package</h3>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    },
    'wildlife-safari': {
      title: 'Mudumalai, Masinagudi, Wayanad & Calicut Safari Package',
      category: 'Wildlife & Safari',
      duration: '2 Days / 1 Night',
      distance: '115 KM to 200 KM',
      startingPrice: '₹4,200',
      img: '/src/assets/images/dest-valparai.png',
      content: `
        <div class="tour-detail-container">
          <div class="tour-hero-header">
            <span class="blog-tag-badge">Wildlife & Safari</span>
            <h1>Mudumalai, Masinagudi, Wayanad & Calicut Safari Package</h1>
            <p style="color:#e2e8f0; font-size:1.05rem;">Mudumalai Tiger Reserve jeep safaris, Banasura Sagar Dam, Thamarassery Churam 9 hairpin bends, and Calicut Beach.</p>
          </div>

          <div class="tour-specs-strip">
            <div class="tour-spec-item"><span>Destinations</span><span>Mudumalai, Masinagudi, Wayanad, Calicut</span></div>
            <div class="tour-spec-item"><span>Drive Time</span><span>3.5 to 5.5 Hours</span></div>
            <div class="tour-spec-item"><span>Night Ban</span><span>9:00 PM – 6:00 AM (Forest)</span></div>
            <div class="tour-spec-item"><span>Base Fare</span><span>₹4,200 Onwards</span></div>
          </div>

          <div class="guide-section-box">
            <h3>📍 On-The-Way Sightseeing Places</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Pykara Waterfalls & Dam:</strong> Scenic pine-surrounded river and waterfall stop.</li>
              <li><strong>Bandipur Tiger Reserve Border:</strong> Forest drive where spotted deer, peacocks, wild boars, and elephants are frequently spotted.</li>
              <li><strong>Thamarassery Churam (Wayand-Calicut Ghat Pass):</strong> Iconic 9 hairpin bends mountain pass offering dramatic valley vistas down to Kozhikode coast.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🛣️ Forest Checkpost Rules & Curve Guidance</h3>
            <div class="road-bends-warning">
              ⚠️ <strong>Forest Checkpost Night Travel Ban:</strong> Mudumalai and Bandipur forest checkposts are closed between 9:00 PM and 6:00 AM for wildlife safety. Plan departure before 3:00 PM.
            </div>
          </div>

          <div class="guide-section-box">
            <h3>🛕 Key Highlights & Safaris</h3>
            <ul style="margin-left:20px; line-height:1.8;">
              <li><strong>Mudumalai Elephant Safari & Theppakadu Elephant Camp:</strong> Interactive elephant feeding and forest bus safaris.</li>
              <li><strong>Masinagudi Jungle Jeep Drive:</strong> Off-road open jeep safaris along forest buffer zones.</li>
              <li><strong>Wayanad Banasura Sagar Dam & Edakkal Caves:</strong> India's largest earthen dam and ancient Neolithic cave carvings.</li>
              <li><strong>Calicut Beach & Sweet Meat Street (SM Street):</strong> Kozhikode beach sunset, authentic Malabar Halwa, and Paragon restaurant dining.</li>
            </ul>
          </div>

          <div class="guide-section-box">
            <h3>🍽️ Verified Highway Restaurants & Restrooms</h3>
            <div class="restroom-food-box">
              🧼 <strong>Hygienic Restrooms:</strong> Coffee County Wayanad & Paragon Restaurant Calicut offer clean washrooms.
            </div>
          </div>

          <div class="guide-section-box">
            <h3>💰 Complete Vehicle Tariff Breakdown</h3>
            <div class="price-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle Type</th>
                    <th>Oneway Drop</th>
                    <th>2 Days / 1 Night Tour</th>
                    <th>Included Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Sedan (Dzire / Etios)</strong></td>
                    <td>₹4,200</td>
                    <td>₹9,200</td>
                    <td>Driver Batta + Forest Permit Included</td>
                  </tr>
                  <tr>
                    <td><strong>SUV (Maruti Ertiga / XL6)</strong></td>
                    <td>₹6,500</td>
                    <td>₹12,800</td>
                    <td>Spacious 6-Seater + AC + Jungle Driver</td>
                  </tr>
                  <tr>
                    <td><strong>Premium SUV (Innova Crysta)</strong></td>
                    <td>₹8,500</td>
                    <td>₹16,500</td>
                    <td>Executive Comfort + Reclining Seats</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="blog-cta-banner" style="margin-top:24px;">
            <h3>Book Wildlife Safari & Beach Tour</h3>
            <a href="tel:9894020156" class="btn btn-yellow" style="padding:12px 24px;">📞 Call 9894020156</a>
          </div>
        </div>
      `
    }
  };

  function openDedicatedPage(pageKey, blogKey = null, packageKey = null) {
    if (!pageOverlay || !pageTitleEl || !pageContentEl) return;

    if (packageKey && TOUR_PACKAGES_DATA[packageKey]) {
      const pkg = TOUR_PACKAGES_DATA[packageKey];
      pageTitleEl.textContent = 'Tour Package Details';
      pageContentEl.innerHTML = pkg.content;
    } else if (blogKey && BLOG_DATA[blogKey]) {
      const blog = BLOG_DATA[blogKey];
      pageTitleEl.textContent = 'Travel Article';
      pageContentEl.innerHTML = blog.content;
    } else if (PAGE_TEMPLATES[pageKey]) {
      const tpl = PAGE_TEMPLATES[pageKey];
      pageTitleEl.textContent = tpl.title;
      pageContentEl.innerHTML = tpl.content;

      if (pageKey === 'blogs') {
        const blogsContainer = document.getElementById('blogs-full-list');
        if (blogsContainer) {
          let html = '';
          Object.keys(BLOG_DATA).forEach(bKey => {
            const b = BLOG_DATA[bKey];
            html += `
              <article class="blog-card" onclick="window.openBlogArticle('${bKey}')">
                <div class="blog-img-box">
                  <img src="${b.img}" alt="${b.title}" />
                  <span class="blog-tag-badge">${b.category}</span>
                </div>
                <div class="blog-content-box">
                  <div class="blog-meta-info">
                    <span>📅 ${b.date}</span> • <span>⏱️ ${b.readTime}</span>
                  </div>
                  <h3 class="blog-card-title">${b.title}</h3>
                  <div class="blog-read-btn"><span>Read Article</span> <span>→</span></div>
                </div>
              </article>
            `;
          });
          blogsContainer.innerHTML = html;
        }
      } else if (pageKey === 'tour-packages') {
        const modalPackagesContainer = document.getElementById('modal-packages-full-list');
        if (modalPackagesContainer) {
          let html = '';
          Object.keys(TOUR_PACKAGES_DATA).forEach(pkgKey => {
            const p = TOUR_PACKAGES_DATA[pkgKey];
            html += `
              <div class="tour-package-card" onclick="window.openTourPackageDetail('${pkgKey}')">
                <div class="package-img-wrap">
                  <img src="${p.img}" alt="${p.title}" />
                  <span class="package-badge-category">${p.category}</span>
                  <span class="package-duration-pill">⏱️ ${p.duration}</span>
                </div>
                <div class="package-body">
                  <h3 class="package-title">${p.title}</h3>
                  <div class="package-tagline">📍 ${p.distance}</div>
                  <div class="package-footer-bar">
                    <div class="package-price-wrap">
                      <span class="package-price-label">Starting Tariff</span>
                      <span class="package-price-val">${p.startingPrice}</span>
                    </div>
                    <button class="package-view-btn">View Details →</button>
                  </div>
                </div>
              </div>
            `;
          });
          modalPackagesContainer.innerHTML = html;
        }
      }
    } else {
      pageTitleEl.textContent = 'Get Cabs';
      pageContentEl.innerHTML = '<p>Page content under construction. Call 9894020156 for assistance.</p>';
    }

    pageOverlay.classList.add('active');
    pageOverlay.scrollTop = 0;
    if (mainMenu) mainMenu.classList.remove('active');
  }

  window.openBlogArticle = function(blogKey) {
    openDedicatedPage('blogs', blogKey);
  };

  window.openTourPackageDetail = function(packageKey) {
    openDedicatedPage('tour-packages', null, packageKey);
  };

  function closeDedicatedPage() {
    if (pageOverlay) pageOverlay.classList.remove('active');
  }

  if (pageCloseBtn) {
    pageCloseBtn.addEventListener('click', closeDedicatedPage);
  }

  // Bind click handlers to all data-open-page, data-open-blog, and data-open-package elements
  document.body.addEventListener('click', function(e) {
    const pageTarget = e.target.closest('[data-open-page]');
    const blogTarget = e.target.closest('[data-open-blog]');
    const packageTarget = e.target.closest('[data-open-package]');

    if (packageTarget) {
      e.preventDefault();
      const pkgKey = packageTarget.getAttribute('data-open-package');
      openDedicatedPage('tour-packages', null, pkgKey);
    } else if (pageTarget) {
      e.preventDefault();
      const pageKey = pageTarget.getAttribute('data-open-page');
      openDedicatedPage(pageKey);
    } else if (blogTarget) {
      e.preventDefault();
      const blogKey = blogTarget.getAttribute('data-open-blog');
      openDedicatedPage('blogs', blogKey);
    }
  });


  // Close modal on Escape key press
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && pageOverlay && pageOverlay.classList.contains('active')) {
      closeDedicatedPage();
    }
  });

  // 11. App Bottom Dock Navigation
  const dockBookBtn = document.getElementById('dock-book-btn');
  const dockAiBtn = document.getElementById('dock-ai-btn');
  const aiChatWindow = document.getElementById('ai-chat-window');
  const aiChatClose = document.getElementById('ai-chat-close');
  const chatMessagesEl = document.getElementById('chat-messages');
  const chatInputEl = document.getElementById('chat-user-input');
  const chatSendBtn = document.getElementById('chat-send-btn');

  if (dockBookBtn) {
    dockBookBtn.addEventListener('click', function() {
      const bookingSection = document.getElementById('booking-form-section') || document.querySelector('.booking-card');
      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const pickupInput = document.getElementById('pickup');
        if (pickupInput) pickupInput.focus();
      } else {
        window.location.hash = '#booking-form-section';
      }
    });
  }

  function toggleAiChat() {
    if (!aiChatWindow) return;
    aiChatWindow.classList.toggle('active');
    if (aiChatWindow.classList.contains('active')) {
      if (chatInputEl) chatInputEl.focus();
    }
  }

  if (dockAiBtn) dockAiBtn.addEventListener('click', toggleAiChat);
  if (aiChatClose) aiChatClose.addEventListener('click', toggleAiChat);

  // 12. Intelligent AI Chatbot Engine with Gemini & Google Search Grounding
  const aiChatHistory = [];

  function formatMarkdownToHtml(str) {
    if (!str) return '';
    let formatted = str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^### (.*$)/gim, '<h4 style="margin:6px 0; font-size:0.95rem;">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 style="margin:8px 0; font-size:1.05rem;">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 style="margin:10px 0; font-size:1.15rem;">$1</h2>')
      .replace(/^\* (.*$)/gim, '• $1<br>')
      .replace(/^- (.*$)/gim, '• $1<br>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
    return formatted;
  }

  window.sendAiQuery = async function(userText) {
    if (!userText || !userText.trim()) return;
    const text = userText.trim();
    appendChatMessage(text, 'user');
    if (chatInputEl) chatInputEl.value = '';

    // Show typing indicator
    const typingId = appendTypingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: aiChatHistory,
        }),
      });

      removeTypingIndicator(typingId);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server status ${response.status}`);
      }

      const data = await response.json();
      let botHtml = formatMarkdownToHtml(data.text);

      // Append Google Search Grounding Card if sources or search queries exist
      const hasSources = data.sources && Array.isArray(data.sources) && data.sources.length > 0;
      const hasQueries = data.webSearchQueries && Array.isArray(data.webSearchQueries) && data.webSearchQueries.length > 0;

      if (hasSources || hasQueries) {
        botHtml += `<div class="chat-grounding-sources-card">`;
        botHtml += `<div class="chat-grounding-header">`;
        botHtml += `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">`;
        botHtml += `<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>`;
        botHtml += `<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>`;
        botHtml += `<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>`;
        botHtml += `<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>`;
        botHtml += `</svg>`;
        botHtml += `Verified via Live Google Search Data</div>`;

        if (hasQueries) {
          botHtml += `<div class="chat-search-queries-tag">🔍 Searched: ${data.webSearchQueries.map(q => `"${q}"`).join(', ')}</div>`;
        }

        if (hasSources) {
          botHtml += `<ul class="chat-sources-list">`;
          data.sources.slice(0, 4).forEach((src) => {
            botHtml += `<li><a href="${src.url}" target="_blank" rel="noopener noreferrer">${src.title || src.url}</a></li>`;
          });
          botHtml += `</ul>`;
        }
        botHtml += `</div>`;
      }

      appendChatMessage(botHtml, 'bot');

      // Update history for multi-turn conversation
      aiChatHistory.push({ role: 'user', parts: [{ text }] });
      aiChatHistory.push({ role: 'model', parts: [{ text: data.text }] });

    } catch (err) {
      removeTypingIndicator(typingId);
      console.warn("Falling back to local knowledge base:", err);

      const fallbackMsg = generateAiResponse(text);
      appendChatMessage(fallbackMsg, 'bot');
    }
  };

  window.handleAiSend = function() {
    if (!chatInputEl) return;
    const val = chatInputEl.value.trim();
    if (val) {
      window.sendAiQuery(val);
    }
  };

  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', window.handleAiSend);
  }
  if (chatInputEl) {
    chatInputEl.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        window.handleAiSend();
      }
    });
  }

  function appendChatMessage(textOrHtml, sender) {
    if (!chatMessagesEl) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}`;
    msgDiv.innerHTML = textOrHtml;
    chatMessagesEl.appendChild(msgDiv);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  function appendTypingIndicator() {
    if (!chatMessagesEl) return null;
    const id = 'typing-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = 'chat-msg bot';
    msgDiv.id = id;
    msgDiv.innerHTML = '🤖 <em>Get Cabs AI is thinking...</em>';
    chatMessagesEl.appendChild(msgDiv);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    return id;
  }

  function removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function generateAiResponse(input) {
    const query = input.toLowerCase();

    if (query.includes('ooty') || query.includes('nilgiri') || query.includes('coonoor')) {
      return `
        <strong>🚕 Coimbatore to Ooty / Coonoor Cab Details:</strong><br>
        • <strong>Ooty Bus Stand Oneway:</strong> <strong style="color:var(--brand-red);">₹3,500</strong> (87 KM net drop)<br>
        • <strong>Coonoor / Kotagiri Oneway:</strong> <strong style="color:var(--brand-red);">₹2,800</strong> (70 KM net drop)<br>
        • <strong>AC Vehicle:</strong> Mandatory AC enabled for all trips.<br>
        • <strong>Driver:</strong> Expert Nilgiris hill road drivers included.<br><br>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
          <a href="tel:9894020156" class="btn btn-red" style="padding:6px 12px; font-size:0.78rem;">📞 Call 9894020156</a>
          <button class="btn btn-yellow" style="padding:6px 12px; font-size:0.78rem;" onclick="window.prefillForm('Coimbatore', 'Ooty Bus Stand', 'oneway')">🚖 Pre-Fill Booking</button>
        </div>
      `;
    }

    if (query.includes('airport') || query.includes('cjb') || query.includes('peelamedu') || query.includes('flight')) {
      return `
        <strong>✈️ Coimbatore Airport (CJB) Fixed Drop Rates:</strong><br>
        • <strong>Airport to Tiruppur:</strong> ₹1,700 (46 KM)<br>
        • <strong>Airport to Palakkad:</strong> ₹2,200 (61 KM)<br>
        • <strong>Local Airport Drop/Pickup:</strong> Default AC Mini & Sedan cabs available 24/7.<br>
        • <strong>Flight Delay Tracking:</strong> Driver waits at arrival hall with zero extra penalty.<br><br>
        <a href="tel:9894020156" class="btn btn-red" style="padding:6px 14px; font-size:0.8rem; display:inline-block;">📞 Book 24/7 Airport Taxi</a>
      `;
    }

    if (query.includes('tariff') || query.includes('rate') || query.includes('price') || query.includes('cost') || query.includes('charge') || query.includes('local')) {
      return `
        <strong>📊 Get Cabs Official Fare Card:</strong><br>
        • <strong>Local City Cab:</strong> Upfront fixed local taxi packages with mandatory default AC.<br>
        • <strong>1 Hour Rental:</strong> ₹350/hr (includes 10 KM free, extra KM @ ₹25/KM).<br>
        • <strong>10 Hrs / 100 KM Day Package A:</strong> ₹3,000 (Extra KM ₹10).<br>
        • <strong>12 Hrs / 100 KM Day Package B:</strong> ₹3,500 (Extra hr ₹150).<br>
        • <strong>Fixed Oneway Drops:</strong> Annur/Isha ₹1,100, MTP ₹1,400, Pollachi ₹1,600, Tiruppur ₹1,900, Erode ₹3,500, Ooty Bus Stand ₹3,500, Palani ₹3,900.<br><br>
        <button class="btn btn-red" style="padding:6px 12px; font-size:0.78rem;" onclick="openDedicatedPage('tariff')">📋 View Full Tariff Card</button>
      `;
    }

    if (query.includes('pollachi') || query.includes('palani') || query.includes('tirupur') || query.includes('erode') || query.includes('isha') || query.includes('route')) {
      return `
        <strong>🗺️ Official Fixed Drop Rates from Coimbatore:</strong><br>
        • <strong>Annur / Isha Yoga:</strong> ₹1,100 (30-33 KM)<br>
        • <strong>Mettupalayam:</strong> ₹1,400 (37 KM)<br>
        • <strong>Pollachi:</strong> ₹1,600 (43 KM)<br>
        • <strong>Tiruppur / Palakkad:</strong> ₹1,900 (52-55 KM)<br>
        • <strong>Sathyamangalam:</strong> ₹2,500 (70 KM)<br>
        • <strong>Erode:</strong> ₹3,500 (100 KM)<br>
        • <strong>Palani:</strong> ₹3,900 (110 KM)<br><br>
        <button class="btn btn-red" style="padding:6px 12px; font-size:0.78rem;" onclick="openDedicatedPage('popular-routes')">🗺️ Browse All Fixed Routes</button>
      `;
    }

    if (query.includes('discount') || query.includes('spin') || query.includes('coupon') || query.includes('offer')) {
      openDiscountModal();
      return `
        <strong>🎁 Spin & Win Discount Unlocked!</strong><br>
        I have opened our Spin & Win wheel. Spin the wheel to unlock <strong>₹100 Off Coupon Code: GET100</strong> or a Free Airport Upgrade!
      `;
    }

    if (query.includes('contact') || query.includes('number') || query.includes('phone') || query.includes('call') || query.includes('book')) {
      return `
        <strong>📞 Contact Get Cabs Coimbatore 24/7:</strong><br>
        • <strong>Hotline:</strong> <a href="tel:9894020156" style="color:var(--brand-red); font-weight:800;">9894020156</a><br>
        • <strong>WhatsApp:</strong> <a href="https://wa.me/919894020156" target="_blank" style="color:#25d366; font-weight:800;">Chat on WhatsApp</a><br>
        • <strong>Office:</strong> Gandhipuram & Peelamedu Airport Rd, Coimbatore<br><br>
        Call <strong>9894020156</strong> for instant driver dispatch within 10 minutes!
      `;
    }

    // Default friendly response
    return `
      I am Get Cabs AI Assistant! I can tell you about:<br>
      • <strong>Local City Taxi Services (Default AC enabled Mini & Sedan)</strong><br>
      • <strong>Fixed Oneway Drop Rates (Ooty ₹3,500, Pollachi ₹1,600, Palani ₹3,900, Isha ₹1,100, Erode ₹3,500)</strong><br>
      • <strong>Day Rental Packages (10 Hrs / 100 KM @ ₹3,000, 12 Hrs @ ₹3,500)</strong><br>
      • <strong>Hourly Rentals (₹350/hr with 10 KM free)</strong><br><br>
      Need a quick quote? Call <strong>9894020156</strong> or ask me a specific route!
    `;
  }

  window.prefillForm = function(pickup, drop, mode) {
    if (aiChatWindow) aiChatWindow.classList.remove('active');
    const bookingSection = document.getElementById('booking-form-section') || document.querySelector('.booking-card');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const pEl = document.getElementById('pickup');
    const dEl = document.getElementById('drop');
    if (pEl) pEl.value = pickup;
    if (dEl) dEl.value = drop;

    // Trigger tab switch if mode exists
    if (mode === 'oneway') {
      const onewayTab = document.querySelector('.tab-btn[data-tab="oneway"]');
      if (onewayTab) onewayTab.click();
    }
  };

  // 13. Spin & Win Discount Wheel Logic
  const discountModal = document.getElementById('discount-modal');
  const discountModalClose = document.getElementById('discount-modal-close');
  const spinWheelBtn = document.getElementById('spin-wheel-btn');
  const wheelGraphic = document.getElementById('wheel-graphic');
  const wheelResultMsg = document.getElementById('wheel-result-msg');

  function openDiscountModal() {
    if (discountModal) discountModal.classList.add('active');
  }

  if (discountModalClose) {
    discountModalClose.addEventListener('click', function() {
      discountModal.classList.remove('active');
    });
  }

  let hasSpun = false;
  if (spinWheelBtn) {
    spinWheelBtn.addEventListener('click', function() {
      if (hasSpun) {
        if (wheelResultMsg) {
          wheelResultMsg.innerHTML = '🎁 You already won! Use Coupon Code <strong style="color:var(--brand-red);">GET100</strong> for ₹100 Off.';
        }
        return;
      }

      const randomDegrees = 1440 + Math.floor(Math.random() * 360);
      if (wheelGraphic) {
        wheelGraphic.style.transform = `rotate(${randomDegrees}deg)`;
      }

      spinWheelBtn.disabled = true;
      spinWheelBtn.textContent = 'Spinning... 🎰';

      setTimeout(() => {
        hasSpun = true;
        spinWheelBtn.disabled = false;
        spinWheelBtn.textContent = '🎉 Coupon Code: GET100 Applied!';
        if (wheelResultMsg) {
          wheelResultMsg.innerHTML = '🎉 CONGRATS! You unlocked <strong style="color:var(--brand-red);">Coupon: GET100</strong> (Flat ₹100 Off on Oneway Ride!). Call 9894020156 or book now.';
        }
      }, 4000);
    });
  }


});


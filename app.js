/**
 * Newton’s Laws of Motion on Mars — Interactive Drone Flight Scripts
 * NASA Ingenuity Mars Helicopter physical simulations
 * Zero-dependency, accessible vanilla JS
 */

document.addEventListener('DOMContentLoaded', () => {
  initLawOne();
  initLawTwo();
  initDroneSubsystems();
  initCookieBanner();
});

/* ==========================================================================
   LAW ONE: STATE TRANSITION DIAGRAM (INERTIA & FLIGHT STATES)
   ========================================================================== */

function initLawOne() {
  const phaseButtons = document.querySelectorAll('.phase-btn');
  const stateLabel = document.getElementById('law1-state-label');
  const explanationEl = document.getElementById('law1-phase-explanation');

  // SVG Elements
  const droneChassis = document.getElementById('law1-drone-chassis');
  const vecNormal = document.getElementById('law1-vec-normal');
  const vecThrust = document.getElementById('law1-vec-thrust');
  const thrustLabel = document.getElementById('law1-thrust-label');
  const velText = document.getElementById('law1-vel-text');

  const phases = {
    rest: {
      label: 'STATE A: REST ON SURFACE',
      explanation: '<strong>Phase A (Static Equilibrium on Ground):</strong> Normal force from the Martian bedrock balances gravity exactly (<span class="code">N = W = 6.70 N</span>). Rotors are idle (<span class="code">Thrust = 0 N</span>). Net force <span class="code">ΣF = 0</span>, so the drone remains stationary at rest on its landing legs.',
      droneTransform: 'translate(270, 205)',
      normalOpacity: '1',
      thrustOpacity: '0',
      velText: 'VELOCITY v = 0.00 m/s (ΣF = 0)'
    },
    climb: {
      label: 'STATE B: THRUST EXCEEDS WEIGHT',
      explanation: '<strong>Phase B (Unbalanced Vertical Force):</strong> Counter-rotating carbon-fiber blades spin past 2,400 RPM, producing <span class="rust font-bold">Thrust = 9.50 N</span> upward. Because upward thrust exceeds downward Mars gravity (<span class="code">W = 6.70 N</span>), an unbalanced net force exists (<span class="code">ΣF_y = +2.80 N</span>), accelerating the 1.8 kg drone upward into the thin Martian sky.',
      droneTransform: 'translate(270, 140)',
      normalOpacity: '0',
      thrustOpacity: '1',
      thrustText: 'Thrust T = 9.5 N',
      velText: 'CLIMBING ACCELERATION (ΣF = +2.80 N > 0)'
    },
    hover: {
      label: 'STATE C: STEADY HOVER EQUILIBRIUM',
      explanation: '<strong>Phase C (Dynamic Equilibrium / Hover):</strong> At cruising altitude (e.g., 5 meters), the flight computer throttles rotor RPM until aerodynamic thrust matches Martian gravity (<span class="code">Thrust = W = 6.70 N</span>). Net vertical force is again zero (<span class="code">ΣF_y = 0</span>). Under Newton’s First Law, zero net force means constant velocity—in this case, zero vertical velocity, locking in a steady hover.',
      droneTransform: 'translate(270, 100)',
      normalOpacity: '0',
      thrustOpacity: '1',
      thrustText: 'Thrust T = 6.7 N (T = W)',
      velText: 'HOVERING AT CONSTANT ALTITUDE (ΣF = 0)'
    }
  };

  phaseButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const phaseKey = btn.dataset.phase;
      if (!phases[phaseKey]) return;

      phaseButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const data = phases[phaseKey];
      stateLabel.textContent = data.label;
      explanationEl.innerHTML = data.explanation;

      if (droneChassis) droneChassis.setAttribute('transform', data.droneTransform);
      if (vecNormal) vecNormal.setAttribute('opacity', data.normalOpacity);
      if (vecThrust) vecThrust.setAttribute('opacity', data.thrustOpacity);
      if (thrustLabel && data.thrustText) thrustLabel.textContent = data.thrustText;
      if (velText) velText.textContent = data.velText;
    });
  });
}

/* ==========================================================================
   LAW TWO: F = ma INTERACTIVE LAB & FLIGHT SIMULATOR
   ========================================================================== */

function initLawTwo() {
  const DRONE_MASS = 1.8; // kg (NASA Ingenuity specification)
  const MARS_GRAVITY = 3.72; // m/s^2
  const DRONE_WEIGHT = DRONE_MASS * MARS_GRAVITY; // 6.696 N ≈ 6.70 N

  const slider = document.getElementById('force-slider');
  const sliderReadout = document.getElementById('slider-val-readout');
  const forceDisplay = document.getElementById('val-force-display');
  const accelDisplay = document.getElementById('val-accel-display');
  const presetBtns = document.querySelectorAll('.preset-btn');

  // SVG Elements
  const thrustLine = document.getElementById('sim-thrust-line');
  const thrustText = document.getElementById('sim-thrust-text');
  const droneGroup = document.getElementById('sim-drone-group');
  const accelBadgeText = document.getElementById('sim-accel-badge-text');
  const telemetry = document.getElementById('sim-telemetry');

  // Sim Buttons
  const btnRun = document.getElementById('btn-run-sim');
  const btnReset = document.getElementById('btn-reset-sim');

  let currentThrust = 8.5;
  let isSimulating = false;
  let simAnimId = null;
  const initialDroneY = 150; // SVG surface altitude baseline

  function updatePhysics(thrustValue) {
    currentThrust = Number(thrustValue);
    const netForce = currentThrust - DRONE_WEIGHT; // F_net = Thrust - Weight
    const accel = netForce / DRONE_MASS; // a = F_net / m in m/s^2

    // Update Numerical Text Displays
    sliderReadout.textContent = `${currentThrust.toFixed(2)} Newtons`;
    
    const signPrefix = netForce > 0 ? '+' : '';
    forceDisplay.innerHTML = `${signPrefix}${netForce.toFixed(2)} <span class="unit">N</span>`;
    accelDisplay.innerHTML = `${signPrefix}${accel.toFixed(3)} <span class="unit">m/s²</span>`;

    // Update Slider Attributes
    slider.value = currentThrust;
    slider.setAttribute('aria-valuenow', currentThrust);

    // Vector lengths for Thrust Arrow:
    // Base line: origin y1 = -46, y2 = -46 - (thrust / 14) * 90
    const maxThrustLength = 95;
    const thrustLength = (currentThrust / 14) * maxThrustLength;
    if (thrustLine) {
      if (currentThrust === 0) {
        thrustLine.setAttribute('opacity', '0');
        thrustText.setAttribute('opacity', '0');
      } else {
        thrustLine.setAttribute('opacity', '1');
        thrustText.setAttribute('opacity', '1');
        thrustLine.setAttribute('y2', (-46 - thrustLength).toString());
        thrustText.setAttribute('y', (-46 - thrustLength / 2).toString());
        thrustText.textContent = `T = ${currentThrust.toFixed(1)} N`;
      }
    }

    // Acceleration Badge Text
    if (accelBadgeText) {
      accelBadgeText.textContent = `${signPrefix}${accel.toFixed(2)} m/s²`;
    }

    // Update Active Preset Highlight
    presetBtns.forEach((btn) => {
      if (Math.abs(Number(btn.dataset.force) - currentThrust) < 0.05) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Slider Input Listener
  slider.addEventListener('input', (e) => {
    updatePhysics(e.target.value);
  });

  // Preset Buttons Listener
  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const forceVal = btn.dataset.force;
      slider.value = forceVal;
      updatePhysics(forceVal);
    });
  });

  // Drone Flight Simulation
  function resetDroneAltitude() {
    if (simAnimId) cancelAnimationFrame(simAnimId);
    isSimulating = false;
    if (droneGroup) {
      droneGroup.setAttribute('transform', `translate(270, ${initialDroneY})`);
    }
    telemetry.innerHTML = `<span>STATUS: READY</span> · <span>ALTITUDE: 0.00 m</span>`;
    btnRun.innerHTML = `<span class="btn-icon" aria-hidden="true">▶</span> <span class="btn-text">Test Fly Vertical Ascent</span>`;
  }

  function runSimulation() {
    if (isSimulating) {
      resetDroneAltitude();
      return;
    }

    const netForce = currentThrust - DRONE_WEIGHT;
    const accel = netForce / DRONE_MASS;

    if (accel <= 0) {
      telemetry.innerHTML = `<span class="rust">CANNOT CLIMB: THRUST ≤ WEIGHT (${currentThrust.toFixed(1)} N ≤ 6.7 N)</span>`;
      return;
    }

    isSimulating = true;
    btnRun.innerHTML = `<span class="btn-icon" aria-hidden="true">■</span> <span class="btn-text">Stop Flight</span>`;

    const startTimestamp = performance.now();
    const maxAltitudeMeters = 10.0;
    const maxPixelDisplacement = 110; // Travel up from y=150 to y=40

    function step(timestamp) {
      if (!isSimulating) return;

      const elapsedSeconds = (timestamp - startTimestamp) / 1000;
      // Motion formula: d = 0.5 * a * t^2
      // Using an educational time-scale multiplier
      const simTime = elapsedSeconds * 1.5;
      const altitudeMeters = 0.5 * accel * (simTime * simTime);
      const currentVelocity = accel * simTime;

      // Fraction of target ceiling completed
      const progress = Math.min(altitudeMeters / maxAltitudeMeters, 1);
      const currentPixelY = initialDroneY - progress * maxPixelDisplacement;

      droneGroup.setAttribute('transform', `translate(270, ${currentPixelY})`);
      telemetry.innerHTML = `<span>STATUS: CLIMBING</span> · <span>v_y: ${currentVelocity.toFixed(2)} m/s</span> · <span>ALT: ${altitudeMeters.toFixed(2)} m</span>`;

      if (progress < 1) {
        simAnimId = requestAnimationFrame(step);
      } else {
        isSimulating = false;
        telemetry.innerHTML = `<span>STATUS: TARGET CEILING REACHED (10.00 m)</span> · <span>HOVER COMMENCED</span>`;
        btnRun.innerHTML = `<span class="btn-icon" aria-hidden="true">↺</span> <span class="btn-text">Fly Again</span>`;
      }
    }

    simAnimId = requestAnimationFrame(step);
  }

  btnRun.addEventListener('click', runSimulation);
  btnReset.addEventListener('click', resetDroneAltitude);

  // Initial Calculation
  updatePhysics(slider.value);
}

/* ==========================================================================
   MARS DRONE SYSTEMS: INTERACTIVE SUBSYSTEM INSPECTOR
   ========================================================================== */

function initDroneSubsystems() {
  const subsystems = {
    rotors: {
      tag: 'SUBSYSTEM 01 / AERODYNAMIC LIFT',
      title: 'Coaxial Rotor Blades (Dual 1.2 m Disks)',
      law: 'PRIMARY CONNECTION: <strong>NEWTON’S THIRD LAW (ACTION & REACTION)</strong>',
      desc: 'Ingenuity employs two counter-rotating 1.2-meter diameter rotors made of carbon-fiber skins wrapped around a lightweight foam core. Spinning at 2,400 to 2,700 RPM, they force thin carbon-dioxide molecules downward (Action) so the air pushes the blades upward (Reaction). The counter-rotating design cancels torque reaction so the drone does not spin out of control.',
      metrics: [
        { name: 'Rotor Span', val: '1.2 meters' },
        { name: 'Spin Rate', val: '2,400–2,700 RPM' },
        { name: 'Construction', val: 'Carbon-fiber composite' }
      ]
    },
    motors: {
      tag: 'SUBSYSTEM 02 / ACTUATION & CONTROL',
      title: 'Brushless DC Motors & Collective Swashplates',
      law: 'PRIMARY CONNECTIONS: <strong>NEWTON’S FIRST & SECOND LAWS (F = ma)</strong>',
      desc: 'Independent brushless DC motors power each rotor through collective and cyclic swashplate linkages. Altering collective blade angle adjusts total upward thrust to break equilibrium for climbing (Law 1) and meter acceleration (Law 2). Altering cyclic pitch tilts the rotor disk forward or laterally, creating horizontal thrust to sprint across Jezero Crater.',
      metrics: [
        { name: 'Drive Motors', val: '2 Brushless DC' },
        { name: 'Control Loop', val: '500 Hz Auto-pilot' },
        { name: 'Pitch Control', val: 'Cyclic & Collective' }
      ]
    },
    fuselage: {
      tag: 'SUBSYSTEM 03 / ULTRALIGHT MASS BUDGET',
      title: 'Fuselage & Avionics Chassis (1.8 kg Mass Budget)',
      law: 'PRIMARY CONNECTION: <strong>NEWTON’S SECOND LAW (INERTIAL MASS)</strong>',
      desc: 'The insulated cube fuselage houses six Sony lithium-ion battery cells, a Qualcomm Snapdragon processor, an IMU, laser altimeter, and downward navigation camera. To keep inertia low enough that aerodynamic forces in thin air can accelerate the vehicle (a = F/m), every single component was stripped to bare grams, achieving an unprecedented 1.8 kg flight-ready mass.',
      metrics: [
        { name: 'Total Mass', val: '1.8 kg (4.0 lb)' },
        { name: 'Energy Storage', val: '35–43 Wh (6 Li-ion)' },
        { name: 'Core Computer', val: 'Snapdragon 801 Linux' }
      ]
    },
    legs: {
      tag: 'SUBSYSTEM 04 / TOUCHDOWN DAMPING',
      title: 'Landing Legs & Carbon Composite Struts',
      law: 'PRIMARY CONNECTIONS: <strong>NEWTON’S FIRST & THIRD LAWS</strong>',
      desc: 'Four slender carbon-fiber composite legs span outward at a wide stance for tipping stability. When Ingenuity cuts motor thrust over its landing site and descends, the legs strike the Martian regolith. Under Newton’s Third Law, the ground exerts an upward impact reaction force on the footpads, which the flexible carbon struts flex and damp to bring downward momentum safely to rest.',
      metrics: [
        { name: 'Leg Material', val: 'Carbon-fiber composite' },
        { name: 'Stance Width', val: '~38.4 cm stance' },
        { name: 'Damping', val: 'Elastic structural flex' }
      ]
    }
  };

  const tagEl = document.getElementById('part-tag');
  const titleEl = document.getElementById('part-title');
  const lawEl = document.getElementById('part-law-link');
  const descEl = document.getElementById('part-description');
  const metricsEl = document.getElementById('part-metrics');

  const tabs = document.querySelectorAll('.part-tab-btn');
  const callouts = document.querySelectorAll('.callout-group');
  const hotspots = document.querySelectorAll('.hotspot-target');

  function selectPart(partKey) {
    const data = subsystems[partKey];
    if (!data) return;

    // Update Text Content
    tagEl.textContent = data.tag;
    titleEl.textContent = data.title;
    lawEl.innerHTML = data.law;
    descEl.textContent = data.desc;

    // Update Metrics Grid
    metricsEl.innerHTML = data.metrics.map(m => `
      <div class="metric-cell">
        <span class="metric-name">${m.name}</span>
        <span class="metric-val">${m.val}</span>
      </div>
    `).join('');

    // Update Tab Selection
    tabs.forEach(tab => {
      const isSelected = tab.dataset.target === partKey;
      tab.classList.toggle('active', isSelected);
      tab.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });

    // Update SVG Callout Highlight
    callouts.forEach(callout => {
      const match = callout.id === `callout-${partKey}`;
      callout.classList.toggle('active', match);
    });
  }

  // Event Listeners for Tabs
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      selectPart(tab.dataset.target);
    });
  });

  // Event Listeners for SVG Callout Markers
  callouts.forEach(callout => {
    const partKey = callout.id.replace('callout-', '');
    callout.addEventListener('click', () => selectPart(partKey));
    callout.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectPart(partKey);
      }
    });
  });

  // Event Listeners for Direct Hotspots on Drone Diagram
  hotspots.forEach(hotspot => {
    hotspot.addEventListener('click', () => {
      selectPart(hotspot.dataset.part);
    });
  });
}

/* ==========================================================================
   COOKIE & TELEMETRY CONSENT BANNER
   ========================================================================== */

function initCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  const btnAccept = document.getElementById('btn-cookie-accept');
  const btnEssential = document.getElementById('btn-cookie-essential');
  const btnClose = document.getElementById('btn-cookie-close');
  const linkPrefs = document.getElementById('link-cookie-preferences');

  if (!banner) return;

  // Check if previously dismissed
  const consentStored = localStorage.getItem('mars_newton_cookie_consent');
  if (consentStored) {
    banner.classList.add('hidden');
    banner.style.display = 'none';
  } else {
    // Show with slight entrance delay
    setTimeout(() => {
      banner.classList.remove('hidden');
    }, 400);
  }

  function dismissBanner(choice) {
    localStorage.setItem('mars_newton_cookie_consent', choice || 'accepted');
    banner.classList.add('hidden');
    setTimeout(() => {
      banner.style.display = 'none';
    }, 280);
  }

  if (btnAccept) {
    btnAccept.addEventListener('click', () => dismissBanner('all'));
  }
  if (btnEssential) {
    btnEssential.addEventListener('click', () => dismissBanner('essential'));
  }
  if (btnClose) {
    btnClose.addEventListener('click', () => dismissBanner('dismissed'));
  }

  // Allow reopening from footer link
  if (linkPrefs) {
    linkPrefs.addEventListener('click', (e) => {
      e.preventDefault();
      banner.style.display = 'block';
      // Force layout reflow before removing hidden class for smooth transition
      void banner.offsetHeight;
      banner.classList.remove('hidden');
    });
  }
}

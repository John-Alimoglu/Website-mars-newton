/**
 * Newton’s Laws of Motion on Mars — Interactive Museum Scripts
 * Accessible, zero-dependency vanilla JS for physical simulations
 */

document.addEventListener('DOMContentLoaded', () => {
  initLawOne();
  initLawTwo();
  initRoverSubsystems();
});

/* ==========================================================================
   LAW ONE: STATE TRANSITION DIAGRAM (INERTIA & FORCES)
   ========================================================================== */

function initLawOne() {
  const phaseButtons = document.querySelectorAll('.phase-btn');
  const stateLabel = document.getElementById('law1-state-label');
  const explanationEl = document.getElementById('law1-phase-explanation');
  const vecDrive = document.getElementById('law1-vec-drive');
  const vecResist = document.getElementById('law1-vec-resist');
  const velText = document.getElementById('law1-vel-text');

  const phases = {
    rest: {
      label: 'STATE A: REST',
      explanation: '<strong>Phase A (Static Equilibrium):</strong> Vertical forces balance exactly (<span class="code">N = W = 3,813 N</span>). No horizontal driving force exists. Net force <span class="code">ΣF = 0</span>, so the rover remains indefinitely at rest.',
      driveOpacity: '0',
      resistOpacity: '0',
      velText: 'VELOCITY v = 0.00 m/s (ΣF = 0)'
    },
    drive: {
      label: 'STATE B: MOTOR FORCE APPLIED',
      explanation: '<strong>Phase B (Unbalanced Driving Force):</strong> In-wheel hub motors apply torque, generating <span class="rust font-bold">F_motor = +350 N</span> forward, exceeding the static ground resistance (<span class="code">f_resist ≈ 50 N</span>). An unbalanced net horizontal force exists (<span class="code">ΣF = +300 N</span>), changing the rover’s state of motion from rest to acceleration.',
      driveOpacity: '1',
      resistOpacity: '0.4',
      velText: 'ACCELERATING (ΣF = +300 N > 0)'
    },
    moving: {
      label: 'STATE C: MOTORS IDLE & TERRAIN RESISTANCE',
      explanation: '<strong>Phase C (Opposing External Resistance):</strong> When motors disengage (<span class="code">F_motor = 0</span>), the rover does not continue rolling forever. Contact forces from the loose Martian regolith, slope inclines, and wheel bearing drag exert an opposing backward resistance. This unbalanced external force decelerates the rover back to a complete stop.',
      driveOpacity: '0',
      resistOpacity: '1',
      velText: 'DECELERATING (ΣF = -60 N < 0)'
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

      if (vecDrive) vecDrive.setAttribute('opacity', data.driveOpacity);
      if (vecResist) vecResist.setAttribute('opacity', data.resistOpacity);
      if (velText) velText.textContent = data.velText;
    });
  });
}

/* ==========================================================================
   LAW TWO: F = ma INTERACTIVE LAB & SIMULATOR
   ========================================================================== */

function initLawTwo() {
  const ROVER_MASS = 1025; // kg (NASA Perseverance specification)

  const slider = document.getElementById('force-slider');
  const sliderReadout = document.getElementById('slider-val-readout');
  const forceDisplay = document.getElementById('val-force-display');
  const accelDisplay = document.getElementById('val-accel-display');
  const presetBtns = document.querySelectorAll('.preset-btn');

  // SVG Elements
  const forceLine = document.getElementById('sim-force-line');
  const forceText = document.getElementById('sim-force-text');
  const accelLine = document.getElementById('sim-accel-line');
  const accelText = document.getElementById('sim-accel-text');
  const roverGroup = document.getElementById('sim-rover-group');
  const telemetry = document.getElementById('sim-telemetry');

  // Sim Buttons
  const btnRun = document.getElementById('btn-run-sim');
  const btnReset = document.getElementById('btn-reset-sim');

  let currentForce = 250;
  let isSimulating = false;
  let simAnimId = null;
  const initialRoverX = 60;

  function updatePhysics(forceValue) {
    currentForce = Number(forceValue);
    const accel = currentForce / ROVER_MASS; // a = F / m in m/s^2

    // Update Numerical Text Displays
    sliderReadout.textContent = `${currentForce} Newtons`;
    forceDisplay.innerHTML = `${currentForce} <span class="unit">N</span>`;
    accelDisplay.innerHTML = `${accel.toFixed(3)} <span class="unit">m/s²</span>`;

    // Update Slider Attributes
    slider.value = currentForce;
    slider.setAttribute('aria-valuenow', currentForce);

    // Vector lengths:
    // Base force arrow: origin x1=105, x2 = 105 + (force / 600) * 110
    const maxForceLength = 100;
    const forceLength = (currentForce / 600) * maxForceLength;
    if (forceLine) {
      forceLine.setAttribute('x2', (105 + forceLength).toString());
      if (currentForce === 0) {
        forceLine.setAttribute('opacity', '0');
        forceText.setAttribute('opacity', '0');
      } else {
        forceLine.setAttribute('opacity', '1');
        forceText.setAttribute('opacity', '1');
        forceText.setAttribute('x', (105 + forceLength / 2).toString());
        forceText.textContent = `F = ${currentForce} N`;
      }
    }

    // Acceleration arrow: origin x1=65, x2 = 65 + (accel / 0.585) * 80
    const maxAccelLength = 80;
    const accelLength = (accel / 0.585) * maxAccelLength;
    if (accelLine) {
      accelLine.setAttribute('x2', (65 + accelLength).toString());
      if (accel === 0) {
        accelLine.setAttribute('opacity', '0');
        accelText.setAttribute('opacity', '0');
      } else {
        accelLine.setAttribute('opacity', '1');
        accelText.setAttribute('opacity', '1');
        accelText.setAttribute('x', (65 + accelLength / 2).toString());
        accelText.textContent = `a = ${accel.toFixed(2)} m/s²`;
      }
    }

    // Update Active Preset Highlight
    presetBtns.forEach((btn) => {
      if (Number(btn.dataset.force) === currentForce) {
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

  // Rover Motion Simulation
  function resetRoverPosition() {
    if (simAnimId) cancelAnimationFrame(simAnimId);
    isSimulating = false;
    if (roverGroup) {
      roverGroup.setAttribute('transform', `translate(${initialRoverX}, 50)`);
    }
    telemetry.innerHTML = `<span>STATUS: READY</span> · <span>POSITION: 0.00 m</span>`;
    btnRun.innerHTML = `<span class="btn-icon" aria-hidden="true">▶</span> <span class="btn-text">Test Accelerate Across Regolith</span>`;
  }

  function runSimulation() {
    if (isSimulating) {
      resetRoverPosition();
      return;
    }

    const accel = currentForce / ROVER_MASS;
    if (accel <= 0) {
      telemetry.innerHTML = `<span class="rust">CANNOT ACCELERATE: F = 0 N (LAW 1)</span>`;
      return;
    }

    isSimulating = true;
    btnRun.innerHTML = `<span class="btn-icon" aria-hidden="true">■</span> <span class="btn-text">Stop Simulation</span>`;

    const startTimestamp = performance.now();
    const maxTrackDistanceMeters = 10.0;
    const maxPixelDisplacement = 340; // Max SVG travel distance before boundary

    function step(timestamp) {
      if (!isSimulating) return;

      const elapsedSeconds = (timestamp - startTimestamp) / 1000;
      // Physics motion formula: d = 0.5 * a * t^2
      // Using a time scale multiplier so motion is pleasant to watch
      const simTime = elapsedSeconds * 2.2;
      const distanceMeters = 0.5 * accel * (simTime * simTime);
      const currentVelocity = accel * simTime;

      // Fraction of track completed
      const progress = Math.min(distanceMeters / maxTrackDistanceMeters, 1);
      const currentPixelX = initialRoverX + progress * maxPixelDisplacement;

      roverGroup.setAttribute('transform', `translate(${currentPixelX}, 50)`);
      telemetry.innerHTML = `<span>STATUS: CRAWLING</span> · <span>v: ${(currentVelocity * 100).toFixed(1)} cm/s</span> · <span>DIST: ${distanceMeters.toFixed(2)} m</span>`;

      if (progress < 1) {
        simAnimId = requestAnimationFrame(step);
      } else {
        isSimulating = false;
        telemetry.innerHTML = `<span>STATUS: CRUISE SPEED REACHED</span> · <span>DIST: 10.00 m</span>`;
        btnRun.innerHTML = `<span class="btn-icon" aria-hidden="true">↺</span> <span class="btn-text">Repeat Run</span>`;
      }
    }

    simAnimId = requestAnimationFrame(step);
  }

  btnRun.addEventListener('click', runSimulation);
  btnReset.addEventListener('click', resetRoverPosition);

  // Initial Calculation
  updatePhysics(slider.value);
}

/* ==========================================================================
   MARS ROVER SYSTEMS: INTERACTIVE SUBSYSTEM INSPECTOR
   ========================================================================== */

function initRoverSubsystems() {
  const subsystems = {
    wheels: {
      tag: 'SUBSYSTEM 01 / TRACTION & INTERFACE',
      title: 'Wheels (Machined Aluminum Rims & Grousers)',
      law: 'PRIMARY CONNECTION: <strong>NEWTON’S THIRD LAW (ACTION & REACTION)</strong>',
      desc: 'Perseverance carries six 52.5 cm diameter wheels machined from solid aircraft-grade aluminum, reinforced with curved titanium spokes to absorb terrain shock. Forty-eight curved cleats (grousers) bite into the regolith. Each cleat pushes backward into the sand (Action) so that the Martian surface pushes forward on the wheel (Reaction) to generate traction.',
      metrics: [
        { name: 'Diameter', val: '52.5 cm' },
        { name: 'Material', val: 'Aircraft Al 7075-T73' },
        { name: 'Cleats', val: '48 Curved Grousers' }
      ]
    },
    motors: {
      tag: 'SUBSYSTEM 02 / ACTUATION & TORQUE',
      title: 'Drive & Steering Actuators (Brushless DC Motors)',
      law: 'PRIMARY CONNECTIONS: <strong>NEWTON’S FIRST & SECOND LAWS (F = ma)</strong>',
      desc: 'Each of the six wheels houses an independent brushless DC gearmotor inside its sealed hub, with separate steering motors on the four corner wheels. The motors supply the torque needed to generate an unbalanced external driving force (Law 1) and calibrate output according to F = ma to accelerate the 1,025 kg rover safely without blowing fuses or inducing excessive wheel spin (Law 2).',
      metrics: [
        { name: 'Drive Motors', val: '6 In-Wheel Hubs' },
        { name: 'Steering Motors', val: '4 Corner Pivots' },
        { name: 'Gear Ratio', val: '~298:1 Planetary' }
      ]
    },
    suspension: {
      tag: 'SUBSYSTEM 03 / WEIGHT DISTRIBUTION',
      title: 'Rocker-Bogie Articulated Suspension',
      law: 'PRIMARY CONNECTIONS: <strong>NEWTON’S FIRST & SECOND LAWS (FORCE BALANCE)</strong>',
      desc: 'A passive mechanical linkage without traditional springs. The rocker-bogie mechanism connects left and right wheel assemblies through a top-mounted differential pivot. As the rover climbs over rocks up to 40 cm tall, the suspension ensures all six wheels maintain equal normal force (N = mg/6) against the ground, preventing rollover and preserving continuous forward tractive contact.',
      metrics: [
        { name: 'Rock Clearance', val: 'Up to 40 cm' },
        { name: 'Tilt Stability', val: 'Up to 45° slope' },
        { name: 'Mechanism', val: 'Springless Rocker-Bogie' }
      ]
    },
    ground: {
      tag: 'SUBSYSTEM 04 / REACTIVE MEDIUM',
      title: 'Ground Contact & Martian Regolith Mechanics',
      law: 'PRIMARY CONNECTION: <strong>NEWTON’S THIRD LAW & FRICTION THRESHOLDS</strong>',
      desc: 'The rover cannot move without the ground pushing back. Because Mars gravity is only 3.72 m/s², the total normal force on the soil is 3,813 N (compared to 10,055 N on Earth). This reduced normal force lowers the shear threshold of loose powdery sand, making terramechanics and soil reaction forces the single greatest operational constraint for Perseverance.',
      metrics: [
        { name: 'Gravity (Mars)', val: '3.72 m/s² (~38% g)' },
        { name: 'Normal Force', val: '3,813 N Total' },
        { name: 'Friction Coeff (μ)', val: '0.35–0.55 typical' }
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

  // Event Listeners for Direct Hotspots on Rover Diagram
  hotspots.forEach(hotspot => {
    hotspot.addEventListener('click', () => {
      selectPart(hotspot.dataset.part);
    });
  });
}

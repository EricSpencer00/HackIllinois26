/**
 * AsciiScene — Full-viewport Three.js scene rendered through the ASCII effect.
 *
 * Phases:
 *   idle       – 13 category planets orbit gently
 *   loading    – same as idle (planets keep orbiting while API loads)
 *   animating  – roulette spin → selection → explosion (driven by progress 0→1)
 *   interactive – same visuals as animating, but progress is wheel-controlled
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
// @ts-ignore — types may not be bundled for the examples addon
import { AsciiEffect } from 'three/examples/jsm/effects/AsciiEffect.js';
import { CATEGORIES, SUBCATEGORIES } from '../lib/categories';

export type Phase = 'idle' | 'loading' | 'animating' | 'interactive';

interface Props {
  progress: number;
  selectedCategory: number;
  phase: Phase;
}

type DebrisUserData = {
  velocity: THREE.Vector3;
  rotSpeed: number;
};

/* ── Easing helpers ─────────────────────────────────── */

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}

/* ── Geometry factory — all spheres with varying detail ─── */

function createGeometry(_type: string, scale = 1): THREE.BufferGeometry {
  // All shapes are spheres for a clean unified look
  return new THREE.SphereGeometry(1.2 * scale, 32, 32);
}

/* ── Component ──────────────────────────────────────── */

export default function AsciiScene({ progress, selectedCategory, phase }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  /* live refs so the RAF loop reads current values without re-mounting */
  const progressRef = useRef(progress);
  const selectedRef = useRef(selectedCategory);
  const phaseRef = useRef(phase);
  progressRef.current = progress;
  selectedRef.current = selectedCategory;
  phaseRef.current = phase;

  /* roulette config captured once when 'animating' begins */
  const rouletteRef = useRef({ baseRotation: 0, totalSpin: 0, captured: false });

  /* mouse position for subtle parallax */
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current!;

    /* ── Scene ─── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 1.5, 14);
    camera.lookAt(0, -1, 0);

    /* ── Lighting (strong for punchy ASCII gradients) ─── */
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(5, 10, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.8);
    fillLight.position.set(-8, -3, -5);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xffffff, 1.2, 80);
    rimLight.position.set(0, -8, 14);
    scene.add(rimLight);

    const topLight = new THREE.PointLight(0xffffff, 0.6, 60);
    topLight.position.set(0, 12, 0);
    scene.add(topLight);

    /* ── Renderer + ASCII effect ─── */
    const renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(1); // keep it crisp for ASCII

    const charSet = ' .:-=+*#%@';
    const effect = new AsciiEffect(renderer, charSet, {
      invert: false,
      resolution: 0.15,
    });
    effect.setSize(window.innerWidth, window.innerHeight);
    effect.domElement.style.color = '#e0e0e0';
    effect.domElement.style.background = '#000000';
    effect.domElement.style.position = 'absolute';
    effect.domElement.style.inset = '0';
    effect.domElement.style.width = '100%';
    effect.domElement.style.height = '100%';
    effect.domElement.style.overflow = 'hidden';
    container.appendChild(effect.domElement);

    /* ── Category planets (ring group) ─── */
    const RING_RADIUS = 9;
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const planetMeshes: THREE.Mesh[] = [];
    const planetMaterials: THREE.MeshPhongMaterial[] = [];

    CATEGORIES.forEach((cat, i) => {
      const angle = (i / CATEGORIES.length) * Math.PI * 2;
      const geo = createGeometry(cat.geometry);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = Math.cos(angle) * RING_RADIUS;
      mesh.position.z = Math.sin(angle) * RING_RADIUS;
      mesh.position.y = Math.sin(angle * 3) * 0.6;
      ringGroup.add(mesh);
      planetMeshes.push(mesh);
      planetMaterials.push(mat);
    });

    // Tilt ring for visual depth
    ringGroup.rotation.x = 0.15;

    /* ── Subcategory shapes (for explosion) ─── */
    const subGroup = new THREE.Group();
    scene.add(subGroup);

    const explosionCenter = new THREE.Vector3();
    const debrisDirection = new THREE.Vector3();
    const explosionDebris: THREE.Mesh[] = [];
    const DEBRIS_COUNT = 70;
    let debrisLaunched = false;

    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const size = Math.random() * 0.18 + 0.08;
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const mat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(0xffca7c).lerp(new THREE.Color(0xff5b8a), Math.random()),
        flatShading: true,
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      mesh.userData = {
        velocity: new THREE.Vector3(),
        rotSpeed: 0,
      } as DebrisUserData;
      scene.add(mesh);
      explosionDebris.push(mesh);
    }

    const subMeshes: THREE.Mesh[] = [];
    SUBCATEGORIES.forEach((sub) => {
      const geo = createGeometry(sub.geometry, 1.0);
      const mat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        flatShading: true,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      subGroup.add(mesh);
      subMeshes.push(mesh);
    });

    /* ── Ambient particles (floating spheres) ─── */
    const particles: THREE.Mesh[] = [];
    for (let i = 0; i < 60; i++) {
      const size = Math.random() * 0.25 + 0.06;
      const geo = new THREE.SphereGeometry(size, 12, 12);
      const mat = new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        (Math.random() - 0.5) * 35,
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 35,
      );
      mesh.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.004,
        (Math.random() - 0.5) * 0.003,
        (Math.random() - 0.5) * 0.004,
      );
      mesh.userData.rotSpeed = (Math.random() - 0.5) * 0.02;
      scene.add(mesh);
      particles.push(mesh);
    }

    /* ── Mouse tracking ─── */
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    /* ── Resize handler ─── */
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      effect.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    /* ── Animation loop ─── */
    const clock = new THREE.Clock();
    let raf: number;

    function animate() {
      raf = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const p = progressRef.current;
      const sel = selectedRef.current;
      const ph = phaseRef.current;
      const numCats = CATEGORIES.length;

      /* ── Subtle camera parallax ─── */
      const targetCamX = mouseRef.current.x * 1.2;
      const targetCamY = 1.5 + mouseRef.current.y * -0.6 + Math.sin(elapsed * 0.25) * 0.3;
      camera.position.x += (targetCamX - camera.position.x) * 0.03;
      camera.position.y += (targetCamY - camera.position.y) * 0.03;
      camera.lookAt(0, -1, 0);

      const cursorX = (mouseRef.current.x * 0.5 + 0.5) * 100;
      const cursorY = (mouseRef.current.y * 0.5 + 0.5) * 100;
      const ripple = 180 + Math.sin(elapsed * 3.2) * 50;
      effect.domElement.style.background = `radial-gradient(circle ${ripple}px at ${cursorX}% ${cursorY}%, rgba(255,255,255,0.2), rgba(0,0,0,0) 90%), #000000`;

      /* ── Particles always drift ─── */
      for (const pt of particles) {
        pt.position.add(pt.userData.vel as THREE.Vector3);
        pt.rotation.x += pt.userData.rotSpeed;
        pt.rotation.y += pt.userData.rotSpeed * 0.7;
        // Wrap-around
        if (Math.abs(pt.position.x) > 20) pt.position.x *= -0.9;
        if (Math.abs(pt.position.y) > 12) pt.position.y *= -0.9;
        if (Math.abs(pt.position.z) > 20) pt.position.z *= -0.9;
      }

      /* ── Phase: idle / loading ─── */
      if (ph === 'idle' || ph === 'loading') {
        rouletteRef.current.captured = false;

        // Gentle continuous orbit
        ringGroup.rotation.y += 0.004;
        ringGroup.visible = true;

        // Self-rotation + breathing
        for (let i = 0; i < planetMeshes.length; i++) {
          const m = planetMeshes[i];
          m.visible = true;
          m.scale.setScalar(1 + Math.sin(elapsed * 0.8 + i * 0.7) * 0.05);
          m.rotation.y += 0.008;
          m.rotation.x = Math.sin(elapsed * 0.5 + i * 1.2) * 0.2;
          planetMaterials[i].opacity = 1;
        }

        // Hide sub-shapes
        for (const sm of subMeshes) sm.visible = false;
        subGroup.visible = false;
      }

      /* ── Phase: animating / interactive ─── */
      if (ph === 'animating' || ph === 'interactive') {

        // Capture roulette config on first frame
        if (!rouletteRef.current.captured) {
          const baseRot = ringGroup.rotation.y;
          const alphaI = (sel / numCats) * Math.PI * 2;
          // Target: bring selected planet to front (z=+R → angle π/2)
          let targetOffset = Math.PI / 2 - alphaI - (baseRot % (Math.PI * 2));
          while (targetOffset < 0) targetOffset += Math.PI * 2;
          rouletteRef.current = {
            baseRotation: baseRot,
            totalSpin: 5 * Math.PI * 2 + targetOffset,
            captured: true,
          };
        }

        const { baseRotation, totalSpin } = rouletteRef.current;

        /* ── Phase 1: Roulette spin (progress 0 → 0.35) ─── */
        if (p < 0.35) {
          if (debrisLaunched) {
            debrisLaunched = false;
            explosionDebris.forEach((deb) => {
              deb.visible = false;
            });
          }
          subGroup.visible = false;
          subGroup.position.set(0, 0, 0);
          const spinP = Math.min(p / 0.35, 1);
          ringGroup.rotation.y = baseRotation + easeOutQuart(spinP) * totalSpin;
          ringGroup.visible = true;

          for (let i = 0; i < planetMeshes.length; i++) {
            const m = planetMeshes[i];
            m.visible = true;
            m.rotation.y += 0.04 * (1 + spinP * 2);
            m.rotation.x += 0.01;
            m.scale.setScalar(1);
            planetMaterials[i].opacity = 1;
          }

          for (const sm of subMeshes) sm.visible = false;
          subGroup.visible = false;
        }

        /* ── Phase 2: Selection (progress 0.35 → 0.6) ─── */
        else if (p < 0.6) {
          if (debrisLaunched) {
            debrisLaunched = false;
            explosionDebris.forEach((deb) => {
              deb.visible = false;
            });
          }
          subGroup.visible = false;
          subGroup.position.set(0, 0, 0);
          const selP = (p - 0.35) / 0.25;
          ringGroup.visible = true;

          for (let i = 0; i < planetMeshes.length; i++) {
            const m = planetMeshes[i];
            m.visible = true;
            if (i === sel) {
              // Selected planet grows + pulses
              const pulse = 1 + Math.sin(elapsed * 3) * 0.08;
              m.scale.setScalar((1 + selP * 1.8) * pulse);
              m.rotation.y += 0.02;
              planetMaterials[i].opacity = 1;
            } else {
              // Others shrink and fade
              const shrink = Math.max(0.05, 1 - selP * 1.1);
              m.scale.setScalar(shrink);
              planetMaterials[i].opacity = Math.max(0, 1 - selP * 1.2);
            }
          }

          for (const sm of subMeshes) sm.visible = false;
          subGroup.visible = false;
        }

        /* ── Phase 3: Explosion (progress 0.6 → 1.0) ─── */
        else {
          const exP = (p - 0.6) / 0.4;

          const selectedMesh = planetMeshes[sel];
          if (selectedMesh) {
            selectedMesh.getWorldPosition(explosionCenter);
            subGroup.position.copy(explosionCenter);
          } else {
            subGroup.position.set(0, 0, 0);
          }

          // Dissolve the ring
          ringGroup.visible = exP < 0.5;
          for (let i = 0; i < planetMeshes.length; i++) {
            const m = planetMeshes[i];
            if (i === sel) {
              m.scale.setScalar(Math.max(0.01, (1 - exP * 2) * 2.8));
            } else {
              m.scale.setScalar(0.05);
              planetMaterials[i].opacity = 0;
            }
          }

          // Reveal sub-shapes in a radial burst
          subGroup.visible = true;
          const SUB_RADIUS = 7;
          if (!debrisLaunched) {
            debrisLaunched = true;
            explosionDebris.forEach((deb) => {
              const data = deb.userData as DebrisUserData;
              deb.visible = true;
              deb.position.copy(explosionCenter);
              debrisDirection.set(
                (Math.random() - 0.5) * 2,
                Math.random() * 0.8 + 0.2,
                (Math.random() - 0.5) * 2,
              );
              data.velocity.copy(debrisDirection.normalize()).multiplyScalar(0.25 + Math.random() * 0.45);
              data.rotSpeed = 0.3 + Math.random() * 0.6;
            });
          }

          for (let i = 0; i < subMeshes.length; i++) {
            const sm = subMeshes[i];
            sm.visible = exP > 0.02;

            // Layout: radial circle, confidence (#4) in center
            if (i === 4) {
              // Center: confidence shape
              sm.position.set(0, 0, 0);
              sm.scale.setScalar(easeOutElastic(Math.min(exP * 1.3, 1)) * 1.6);
            } else {
              const idx = i < 4 ? i : i - 1; // skip center slot
              const angle = (idx / 8) * Math.PI * 2 - Math.PI / 2;
              const radius = easeOutBack(Math.min(exP * 1.2, 1)) * SUB_RADIUS;
              sm.position.x = Math.cos(angle) * radius;
              sm.position.z = Math.sin(angle) * radius;
              sm.position.y = Math.sin(angle * 2) * 0.6;
              sm.scale.setScalar(easeOutElastic(Math.min(exP * 1.5, 1)) * 0.9);
            }

            sm.rotation.y = elapsed * 0.4 + i * 0.8;
            sm.rotation.x = elapsed * 0.2 + i * 0.5;
          }

          const debrisFade = Math.max(0.15, 1 - exP * 1.6);
          for (const deb of explosionDebris) {
            const data = deb.userData as DebrisUserData;
            deb.position.add(data.velocity);
            data.velocity.multiplyScalar(0.97);
            deb.rotation.x += data.rotSpeed;
            deb.rotation.y += data.rotSpeed * 0.6;
            (deb.material as THREE.MeshPhongMaterial).opacity = debrisFade;
          }
        }
      }

      effect.render(scene, camera);
    }

    animate();

    /* ── Cleanup ─── */
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      if (container.contains(effect.domElement)) {
        container.removeChild(effect.domElement);
      }
      renderer.dispose();
      // Dispose geometries and materials
      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
        if ((obj as THREE.Mesh).material) {
          const mat = (obj as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else (mat as THREE.Material).dispose();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="ascii-scene" />;
}

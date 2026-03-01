import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import AsciiScene from '../../components/AsciiScene';
import type { Phase } from '../../components/AsciiScene';

// Mock Three.js and the AsciiEffect — they require WebGL which jsdom doesn't support
vi.mock('three', () => {
  class Vector3 {
    x: number; y: number; z: number;
    constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; }
    set() { return this; }
    add() { return this; }
    setScalar() { return this; }
  }

  class Scene {
    add() {}
    traverse(fn: any) {}
  }

  class PerspectiveCamera {
    position = { x: 0, y: 3, z: 14, set() {} };
    aspect = 1;
    lookAt() {}
    updateProjectionMatrix() {}
    constructor() {}
  }

  class WebGLRenderer {
    domElement = document.createElement('canvas');
    setSize() {}
    setPixelRatio() {}
    dispose() {}
    constructor() {}
  }

  class AmbientLight { constructor() {} }
  class DirectionalLight {
    position = { set() {} };
    constructor() {}
  }
  class PointLight {
    position = { set() {} };
    constructor() {}
  }

  class Group {
    rotation = { x: 0, y: 0, z: 0 };
    visible = true;
    add() {}
  }

  class MeshPhongMaterial {
    color = { set() {} };
    opacity = 1;
    transparent = true;
    dispose() {}
    constructor() {}
  }

  class SphereGeometry {
    dispose() {}
    constructor() {}
  }

  class Mesh {
    position = { x: 0, y: 0, z: 0, set() {}, add() {} };
    rotation = { x: 0, y: 0, z: 0 };
    scale = { setScalar() {} };
    geometry = { dispose() {} };
    material = new MeshPhongMaterial();
    visible = true;
    userData: any = {};
    add() {}
    constructor() {}
  }

  class Clock {
    getElapsedTime() { return 0; }
    constructor() {}
  }

  class BufferGeometry {
    dispose() {}
    constructor() {}
  }

  return {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    AmbientLight,
    DirectionalLight,
    PointLight,
    Group,
    Mesh,
    MeshPhongMaterial,
    SphereGeometry,
    Clock,
    BufferGeometry,
    Vector3,
  };
});

vi.mock('three/examples/jsm/effects/AsciiEffect.js', () => ({
  AsciiEffect: class AsciiEffect {
    domElement: HTMLElement;
    constructor() {
      this.domElement = document.createElement('div');
      this.domElement.style.position = 'absolute';
    }
    setSize() {}
    render() {}
  },
}));

describe('AsciiScene', () => {
  it('renders a container div with the ascii-scene class', () => {
    const { container } = render(
      <AsciiScene progress={0} selectedCategory={0} phase="idle" />,
    );
    expect(container.querySelector('.ascii-scene')).toBeInTheDocument();
  });

  it('accepts all valid phases without crashing', () => {
    const phases: Phase[] = ['idle', 'loading', 'animating', 'interactive'];
    for (const phase of phases) {
      const { unmount } = render(
        <AsciiScene progress={0.5} selectedCategory={3} phase={phase} />,
      );
      unmount();
    }
  });

  it('accepts progress values from 0 to 1', () => {
    const progressValues = [0, 0.25, 0.5, 0.75, 1];
    for (const p of progressValues) {
      const { unmount } = render(
        <AsciiScene progress={p} selectedCategory={0} phase="animating" />,
      );
      unmount();
    }
  });

  it('handles all category indices', () => {
    for (let i = 0; i < 13; i++) {
      const { unmount } = render(
        <AsciiScene progress={0} selectedCategory={i} phase="idle" />,
      );
      unmount();
    }
  });
});

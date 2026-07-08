// Player: First-Person-Steuerung mit Pointer-Lock, Kollision und Interaktions-Raycast.

import * as THREE from 'three';

const PLAYER_RADIUS = 0.3;
const PLAYER_HEIGHT = 1.7;
const SPEED = 3.4;

export class Player {
  constructor(camera, canvas, colliders) {
    this.camera = camera;
    this.canvas = canvas;
    this.colliders = colliders;
    this.position = new THREE.Vector3(0, PLAYER_HEIGHT, 3.8);
    this.yaw = 0; // Blick in den Laden (-z)
    this.pitch = 0;
    this.keys = {};
    this.locked = false;
    this.enabled = false;
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 3.2;

    document.addEventListener('keydown', e => { this.keys[e.code] = true; });
    document.addEventListener('keyup', e => { this.keys[e.code] = false; });
    document.addEventListener('mousemove', e => {
      if (!this.locked || !this.enabled) return;
      this.yaw -= e.movementX * 0.0022;
      this.pitch -= e.movementY * 0.0022;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
    });
  }

  requestLock() {
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock?.();
    }
  }

  releaseLock() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
  }

  update(dt) {
    if (!this.enabled) return;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(-forward.z, 0, forward.x);
    const move = new THREE.Vector3();
    if (this.keys['KeyW']) move.add(forward);
    if (this.keys['KeyS']) move.sub(forward);
    if (this.keys['KeyD']) move.add(right);
    if (this.keys['KeyA']) move.sub(right);
    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(SPEED * dt);
      this.tryMove(move.x, 0);
      this.tryMove(0, move.z);
    }
    this.camera.position.copy(this.position);
    const dir = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
    this.camera.lookAt(this.position.clone().add(dir));
  }

  tryMove(dx, dz) {
    const nx = this.position.x + dx;
    const nz = this.position.z + dz;
    // Weltgrenzen (Laden + kleiner Außenbereich)
    if (nx < -6.6 || nx > 6.6) return;
    if (nz < -4.6 || nz > 8.5) return;
    // Südwand: Durchgang nur an der Tür (|x| < 0.55)
    const wasInside = this.position.z < 4.9;
    const willInside = nz < 4.9;
    if (wasInside !== willInside && Math.abs(nx) > 0.55) return;
    const p = new THREE.Vector3(nx, 0.9, nz);
    for (const b of this.colliders) {
      if (
        p.x > b.min.x - PLAYER_RADIUS && p.x < b.max.x + PLAYER_RADIUS &&
        p.z > b.min.z - PLAYER_RADIUS && p.z < b.max.z + PLAYER_RADIUS &&
        b.min.y < 1.6 && b.max.y > 0.2
      ) return;
    }
    this.position.x = nx;
    this.position.z = nz;
  }

  /** Interaktions-Raycast auf Objekte mit userData.interact */
  getInteractTarget(interactables) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const hits = this.raycaster.intersectObjects(interactables, true);
    for (const hit of hits) {
      let o = hit.object;
      while (o) {
        if (o.userData.interact) return o;
        o = o.parent;
      }
    }
    return null;
  }

  serialize() {
    return { x: this.position.x, z: this.position.z, yaw: this.yaw };
  }

  deserialize(d) {
    if (!d) return;
    this.position.set(d.x ?? 0, PLAYER_HEIGHT, d.z ?? 3.8);
    this.yaw = d.yaw ?? 0;
  }
}

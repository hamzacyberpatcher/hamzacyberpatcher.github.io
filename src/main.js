import * as THREE from 'three';

const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000008, 0.008);

/* camera */
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 2000);
camera.position.set(0, 0, 8);

/* renderer */
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector('#bg')
});
renderer.setSize(w, h);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

/* loader */
const loader = new THREE.TextureLoader();

// ─── SCROLL CAMERA KEYFRAMES ────────────────────────────────────────────────
// Each keyframe: { scrollY: 0–1, camPos, camTarget, fov }
const keyframes = [
    {
        t: 0,
        camPos: new THREE.Vector3(0, 0, 8),
        camTarget: new THREE.Vector3(3, 0, 0),
        fov: 75,
    },
    {
        t: 0.15,
        camPos: new THREE.Vector3(5, 2, 4),
        camTarget: new THREE.Vector3(3, 0, 0),
        fov: 55,
    },
    {
        t: 0.3,
        camPos: new THREE.Vector3(3, 4, 9),
        camTarget: new THREE.Vector3(3, 0, 0),
        fov: 50,
    },
    {
        t: 0.45,
        camPos: new THREE.Vector3(-2, 3, 10),
        camTarget: new THREE.Vector3(0, 0, 0),
        fov: 90,
    },
    {
        t: 0.6,
        camPos: new THREE.Vector3(-25, 6, 12),
        camTarget: new THREE.Vector3(-28, 0, 0),
        fov: 60,
    },
    {
        t: 0.75,
        camPos: new THREE.Vector3(-26, 14, 6),
        camTarget: new THREE.Vector3(-28, 0, 0),
        fov: 45,
    },
    {
        t: 1.0,
        camPos: new THREE.Vector3(-10, 5, 20),
        camTarget: new THREE.Vector3(0, 0, 0),
        fov: 80,
    },
];

function lerpKeyframe(t) {
    let a = keyframes[0], b = keyframes[keyframes.length - 1];
    for (let i = 0; i < keyframes.length - 1; i++) {
        if (t >= keyframes[i].t && t <= keyframes[i + 1].t) {
            a = keyframes[i]; b = keyframes[i + 1]; break;
        }
    }
    const span = b.t - a.t;
    const local = span === 0 ? 0 : (t - a.t) / span;
    // smooth easing
    const s = local * local * (3 - 2 * local);
    const pos = a.camPos.clone().lerp(b.camPos, s);

    // Pre-clamp: push interpolated position out of Earth before it feeds into smoothing
    const EARTH_CENTER = new THREE.Vector3();
    earthGroup.getWorldPosition(EARTH_CENTER);
    const EARTH_SAFE = 4.5;
    const d = pos.distanceTo(EARTH_CENTER);
    if (d < EARTH_SAFE) {
        pos.sub(EARTH_CENTER).normalize().multiplyScalar(EARTH_SAFE).add(EARTH_CENTER);
    }

    return {
        camPos: pos,
        camTarget: a.camTarget.clone().lerp(b.camTarget, s),
        fov: a.fov + (b.fov - a.fov) * s,
    };
}

// ─── EARTH ────────────────────────────────────────────────────────────────────
const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
earthGroup.position.x = 3;
scene.add(earthGroup);

const geoEarth = new THREE.IcosahedronGeometry(2.5, 16);

const earthMat = new THREE.MeshPhongMaterial({
    map: loader.load('./assets/earthmap1k.jpg'),
    bumpMap: loader.load('./assets/bump.jpg'),
    bumpScale: 0.25,
    specularMap: loader.load('./assets/spec.jpg'),
    specular: new THREE.Color('grey'),
    shininess: 15,
});
const earthMesh = new THREE.Mesh(geoEarth, earthMat);
earthGroup.add(earthMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load('./assets/clouds.jpg'),
    transparent: true, opacity: 0.4,
    alphaMap: loader.load('./assets/cloudtrans.jpg'),
    depthWrite: false,
});
const cloudsMesh = new THREE.Mesh(geoEarth, cloudsMat);
cloudsMesh.scale.setScalar(1.01);
earthGroup.add(cloudsMesh);

const lightsMat = new THREE.MeshBasicMaterial({
    map: loader.load('./assets/lights.jpg'),
    blending: THREE.AdditiveBlending, transparent: true, opacity: 0.7,
});
const lightsMesh = new THREE.Mesh(geoEarth, lightsMat);
earthGroup.add(lightsMesh);

const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x3cf0ff, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
});
earthGroup.add(new THREE.Mesh(new THREE.IcosahedronGeometry(2.7, 16), atmosphereMat));

// Moon
const moonGroup = new THREE.Group();
earthGroup.add(moonGroup);
const moonMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 16),
    new THREE.MeshPhongMaterial({
        map: loader.load('./assets/moon.jpg'),
        bumpMap: loader.load('./assets/moon.jpg'),
        bumpScale: 0.08,
        shininess: 5,
    })
);
moonMesh.position.set(4.5, 0.8, 0);
moonGroup.add(moonMesh);

// ─── MARS ─────────────────────────────────────────────────────────────────────
const marsGroup = new THREE.Group();
marsGroup.position.set(-8, -2, -5);
marsGroup.rotation.z = -25 * Math.PI / 180;
scene.add(marsGroup);

const marsMat = new THREE.MeshPhongMaterial({
    map: loader.load('./assets/mars.jpg'),
    bumpMap: loader.load('./assets/mars.jpg'),
    bumpScale: 0.12,
    shininess: 5,
});
const marsMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.4, 12), marsMat);
marsGroup.add(marsMesh);

// Mars atmosphere
const marsAtmoMat = new THREE.MeshBasicMaterial({
    color: 0xff6633, transparent: true, opacity: 0.08,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
});
marsGroup.add(new THREE.Mesh(new THREE.IcosahedronGeometry(1.55, 12), marsAtmoMat));

// Polar ice cap on Mars
const polarCapMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });
const polarCap = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 8, 0, Math.PI * 2, 0, 0.4), polarCapMat);
polarCap.position.set(0, 1.35, 0);
marsGroup.add(polarCap);

// ─── SATURN ────────────────────────────────────────────────────────────────────
const saturnGroup = new THREE.Group();
saturnGroup.position.set(-28, 0, -8);
saturnGroup.rotation.z = -27 * Math.PI / 180;
scene.add(saturnGroup);

const saturnMat = new THREE.MeshPhongMaterial({
    map: loader.load('./assets/saturn.jpg'),
    shininess: 8,
    emissive: 0x2a1800,
    emissiveIntensity: 0.1,
});
const saturnMesh = new THREE.Mesh(new THREE.SphereGeometry(4, 32, 32), saturnMat);
saturnGroup.add(saturnMesh);

// Saturn bands (overlay)
const bandMat = new THREE.MeshBasicMaterial({ color: 0xc8a85a, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
for (let i = 0; i < 5; i++) {
    const bandGeo = new THREE.TorusGeometry(4.02 + i * 0.15, 0.05, 4, 80);
    bandGeo.rotateX(Math.PI / 2);
    saturnGroup.add(new THREE.Mesh(bandGeo, bandMat));
}

// Saturn rings
function makeRing(inner, outer, color, opacity) {
    const geo = new THREE.RingGeometry(inner, outer, 128);
    // fix UV so texture maps radially
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i), y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        uv.setXY(i, (r - inner) / (outer - inner), Math.atan2(y, x) / (2 * Math.PI));
    }
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
    });
    return new THREE.Mesh(geo, mat);
}
saturnGroup.add(makeRing(5.0, 6.2, 0xd4b896, 0.55));
saturnGroup.add(makeRing(6.4, 7.5, 0xc8a070, 0.4));
saturnGroup.add(makeRing(7.7, 9.0, 0xb89060, 0.25));
saturnGroup.add(makeRing(9.2, 9.8, 0xa07848, 0.15));

// Saturn atmosphere
const satAtmoMat = new THREE.MeshBasicMaterial({
    color: 0xffe0a0, transparent: true, opacity: 0.1,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
});
saturnGroup.add(new THREE.Mesh(new THREE.SphereGeometry(4.3, 32, 32), satAtmoMat));

// Saturn moons
function addSaturnMoon(dist, size, color, angle) {
    const m = new THREE.Mesh(
        new THREE.SphereGeometry(size, 10, 10),
        new THREE.MeshPhongMaterial({ color })
    );
    m.position.set(Math.cos(angle) * dist, 0.5, Math.sin(angle) * dist);
    saturnGroup.add(m);
    return m;
}
const titan = addSaturnMoon(12, 0.6, 0xe09040, 1.2);
const rhea = addSaturnMoon(10, 0.35, 0xbbbbbb, 3.5);
const tethys = addSaturnMoon(8.5, 0.25, 0xdddddd, 5.8);

// ─── NEBULA / DUST CLOUDS ─────────────────────────────────────────────────────
function makeNebula(x, y, z, color, size, opacity) {
    const geo = new THREE.SphereGeometry(size, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity,
        blending: THREE.AdditiveBlending, wireframe: false,
        depthWrite: false,
        side: THREE.BackSide,
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    scene.add(m);
}
makeNebula(-15, 8, -30, 0x1a0a4a, 25, 0.12);
makeNebula(10, -10, -40, 0x0a1a2a, 20, 0.08);
makeNebula(-35, -5, -20, 0x1a0510, 18, 0.1);
makeNebula(5, 12, -50, 0x0a2010, 30, 0.06);
makeNebula(-50, 2, -35, 0x200a00, 22, 0.09);

// ─── STARFIELD ────────────────────────────────────────────────────────────────
const starField = new THREE.Group();
scene.add(starField);

// Dense background stars via Points for performance
const starCount = 8000;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;
    starPositions[i3] = THREE.MathUtils.randFloatSpread(800);
    starPositions[i3 + 1] = THREE.MathUtils.randFloatSpread(800);
    starPositions[i3 + 2] = THREE.MathUtils.randFloatSpread(800);
    const hue = Math.random() < 0.15 ? Math.random() * 0.15 : (Math.random() < 0.1 ? 0.55 + Math.random() * 0.1 : 0);
    const c = new THREE.Color().setHSL(hue, 0.5, 0.7 + Math.random() * 0.3);
    starColors[i3] = c.r; starColors[i3 + 1] = c.g; starColors[i3 + 2] = c.b;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const starMat = new THREE.PointsMaterial({ size: 0.35, vertexColors: true, sizeAttenuation: true });
starField.add(new THREE.Points(starGeo, starMat));

// Bright foreground feature stars
for (let i = 0; i < 80; i++) {
    const size = THREE.MathUtils.randFloat(0.06, 0.2);
    const s = new THREE.Mesh(
        new THREE.SphereGeometry(size, 6, 6),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    s.position.set(...Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(300)));
    starField.add(s);
}

// ─── LIGHTING ─────────────────────────────────────────────────────────────────
scene.add(new THREE.AmbientLight(0x101020, 0.8));
const sunLight = new THREE.DirectionalLight(0xfff5e0, 3.0);
sunLight.position.set(-5, 2, 3);
scene.add(sunLight);

// Rim light from the other side
const rimLight = new THREE.DirectionalLight(0x002244, 0.5);
rimLight.position.set(5, -1, -4);
scene.add(rimLight);

// Saturn key light
const saturnLight = new THREE.PointLight(0xffeedd, 2, 80);
saturnLight.position.set(-20, 5, 5);
scene.add(saturnLight);

// ─── SCROLL STATE ─────────────────────────────────────────────────────────────
let scrollT = 0;
let targetScrollT = 0;

function getMaxScroll() {
    return document.documentElement.scrollHeight - window.innerHeight;
}

document.addEventListener('scroll', () => {
    const max = getMaxScroll();
    targetScrollT = max > 0 ? window.scrollY / max : 0;
});

// Smooth camera targets
let smoothCamPos = camera.position.clone();
let smoothCamTarget = new THREE.Vector3(3, 0, 0);
let smoothFov = 75;

// ─── ANIMATION ────────────────────────────────────────────────────────────────
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // smooth scroll interpolation
    scrollT += (targetScrollT - scrollT) * 0.04;

    // interpolate camera
    const kf = lerpKeyframe(scrollT);
    smoothCamPos.lerp(kf.camPos, 0.06);
    smoothCamTarget.lerp(kf.camTarget, 0.06);
    smoothFov += (kf.fov - smoothFov) * 0.06;

    camera.position.copy(smoothCamPos);
    camera.lookAt(smoothCamTarget);
    camera.fov = smoothFov;
    camera.updateProjectionMatrix();

    // Clamp camera so it never enters Earth — compute actual world position each frame
    const earthWorldPos = new THREE.Vector3();
    earthGroup.getWorldPosition(earthWorldPos);
    const EARTH_SAFE_DIST = 4.5; // well outside atmosphere (radius 2.7)
    const toCamera = camera.position.clone().sub(earthWorldPos);
    if (toCamera.length() < EARTH_SAFE_DIST) {
        toCamera.normalize().multiplyScalar(EARTH_SAFE_DIST);
        camera.position.copy(earthWorldPos).add(toCamera);
        smoothCamPos.copy(camera.position);
        // re-orient after position correction
        camera.lookAt(smoothCamTarget);
    }

    // Earth
    earthMesh.rotateY(0.0006);
    cloudsMesh.rotateY(0.0008);
    lightsMesh.rotateY(0.0006);
    moonGroup.rotation.y = t * 0.12;

    // Mars
    marsMesh.rotateY(0.0007);

    // Saturn
    saturnMesh.rotateY(0.0003);
    titan.position.set(Math.cos(t * 0.15) * 12, 0.5, Math.sin(t * 0.15) * 12);
    rhea.position.set(Math.cos(t * 0.28 + 2) * 10, 0.5, Math.sin(t * 0.28 + 2) * 10);
    tethys.position.set(Math.cos(t * 0.44 + 4) * 8.5, 0.5, Math.sin(t * 0.44 + 4) * 8.5);

    // Starfield subtle drift
    starField.rotation.x += 0.00004;
    starField.rotation.y += 0.00006;

    renderer.render(scene, camera);
}

animate();

// ─── RESPONSIVE ───────────────────────────────────────────────────────────────
function handleWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    if (width < 768) {
        earthGroup.position.x = 0;
        earthGroup.scale.setScalar(0.7);
        // Re-aim camera and smooth target at centered Earth
        smoothCamTarget.set(0, 0, 0);
        camera.lookAt(0, 0, 0);
        // Patch the Earth-facing keyframe targets to centre
        keyframes[0].camTarget.set(0, 0, 0);
        keyframes[1].camTarget.set(0, 0, 0);
        keyframes[2].camTarget.set(0, 0, 0);
        // Shift cam positions for Earth keyframes inward
        keyframes[0].camPos.set(-3, 0, 8);
        keyframes[1].camPos.set(2, 2, 4);
        keyframes[2].camPos.set(0, 4, 9);
    } else {
        earthGroup.position.x = 3;
        earthGroup.scale.setScalar(1);
        // Restore desktop keyframes
        keyframes[0].camPos.set(0, 0, 8);   keyframes[0].camTarget.set(3, 0, 0);
        keyframes[1].camPos.set(5, 2, 4);   keyframes[1].camTarget.set(3, 0, 0);
        keyframes[2].camPos.set(3, 4, 9);   keyframes[2].camTarget.set(3, 0, 0);
        smoothCamTarget.set(3, 0, 0);
    }
}

handleWindowResize();
window.addEventListener('resize', handleWindowResize);
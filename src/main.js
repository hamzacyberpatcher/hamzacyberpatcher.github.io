import * as THREE from 'three';

const w = window.innerWidth;
const h = window.innerHeight;

const scene = new THREE.Scene();

/* camera */
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.set(0, 0, 8);

/* renderer */
const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas: document.querySelector('#bg')
});
renderer.setSize(w, h);
renderer.setPixelRatio(window.devicePixelRatio);

/* loader */
const loader = new THREE.TextureLoader();

/* Earth group */
const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
earthGroup.position.x = 3;
scene.add(earthGroup);

/* Earth */
const geometry = new THREE.IcosahedronGeometry(2.5, 16);

const earthMat = new THREE.MeshPhongMaterial({
    map: loader.load('./src/earthmap1k.jpg'),
    bumpMap: loader.load('./src/bump.jpg'),
    bumpScale: 0.25,
    specularMap: loader.load('./src/spec.jpg'),
    specular: new THREE.Color('grey'),
    shininess: 15
});

const earthMesh = new THREE.Mesh(geometry, earthMat);
earthGroup.add(earthMesh);

/* clouds */
const cloudsMat = new THREE.MeshStandardMaterial({
    map: loader.load('./src/clouds.jpg'),
    transparent: true,
    opacity: 0.4,
    alphaMap: loader.load('./src/cloudtrans.jpg'),
    depthWrite: false
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.01);
earthGroup.add(cloudsMesh);

/* city lights */
const lightsMat = new THREE.MeshBasicMaterial({
    map: loader.load('./src/lights.jpg'),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.7
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

/* atmosphere */
const atmosphereGeo = new THREE.IcosahedronGeometry(2.7, 16);
const atmosphereMat = new THREE.MeshBasicMaterial({
    color: 0x3cf0ff,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide
});
const atmosphere = new THREE.Mesh(atmosphereGeo, atmosphereMat);
earthGroup.add(atmosphere);

/* lighting */
scene.add(new THREE.AmbientLight(0x404040, 0.6));
const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
sunLight.position.set(-5, 2, 3);
scene.add(sunLight);

/* STARFIELD GROUP */
const starField = new THREE.Group();
scene.add(starField);

function addStar() {
    const size = THREE.MathUtils.randFloat(0.08, 0.15);

    const starGeo = new THREE.SphereGeometry(size, 6, 6);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const star = new THREE.Mesh(starGeo, starMat);

    const [x, y, z] = Array(3)
        .fill()
        .map(() => THREE.MathUtils.randFloatSpread(300));

    star.position.set(x, y, z);

    starField.add(star);
}

Array(1500).fill().forEach(addStar);

/* SCROLL STATE */
let previousScrollY = window.scrollY;

let targetEarthRotation = 0;
let targetStarRotation = 0;

document.addEventListener('scroll', () => {

    const delta = window.scrollY - previousScrollY;
    previousScrollY = window.scrollY;

    targetEarthRotation += delta * 0.004;
    targetStarRotation += delta * 0.0008;

});

/* animation */
function animate() {

    requestAnimationFrame(animate);

    /* smooth scroll easing */

    earthGroup.rotation.y += (targetEarthRotation - earthGroup.rotation.y) * 0.05;

    starField.rotation.y += (targetStarRotation - starField.rotation.y) * 0.05;

    /* natural spinning */

    earthMesh.rotateY(0.012);
    cloudsMesh.rotateY(0.015);
    lightsMesh.rotateY(0.012);

    /* constant starfield drift */

    starField.rotation.x += 0.00015;
    starField.rotation.y += 0.00025;

    renderer.render(scene, camera);
}

animate();

/* responsive */
function handleWindowResize() {

    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);

    if (width < 768) {
        earthGroup.position.x = 0;
        earthGroup.scale.setScalar(0.7);
    } else {
        earthGroup.position.x = 3;
        earthGroup.scale.setScalar(1);
    }
}

handleWindowResize();
window.addEventListener('resize', handleWindowResize);
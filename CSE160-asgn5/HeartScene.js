import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
import { FilmPass } from 'three/addons/postprocessing/FilmPass.js';
import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

let canvas;
let renderer;

let composer;
let pixelPass;
let filmPass;
let afterimagePass;
let outputPass;

let camera;
let scene;

// DYNAMIC OBJECTS
let shapes = [];
let rocks = [];

let gemGroup;
let gemCore;
let gemShell;
let gemShards = [];
let gemLight;

const gemBaseY = 4.2;
const gemBaseScale = 1.0;

function main() {
    // CANVAS & RENDERER
    canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;

    // CAMERA DATA
    const fov = 75;
    const aspect = 2;
    const near = 0.1;
    const far = 1000;

    // CREATE CAMERA
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    // CREATE CONTROLS
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    // SCENE
    scene = new THREE.Scene();

    /// POSTPROCESSING ///

    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    pixelPass = new RenderPixelatedPass(
        3,
        scene,
        camera
    );
    composer.addPass(pixelPass);

    filmPass = new FilmPass(
        1,
        false
    );
    composer.addPass(filmPass);

    afterimagePass = new AfterimagePass(0.75);
    composer.addPass(afterimagePass);

    outputPass = new OutputPass();
    composer.addPass(outputPass);

    // FOG
    {
        const near = 25;
        const far = 150;
        const color = 'black';
        scene.fog = new THREE.Fog(color, near, far);
        scene.background = new THREE.Color(color);
    }

    // SKYBOX
    {
        const loader = new THREE.CubeTextureLoader();
        const texture = loader.load([
            'Assets/Skybox/posx.jpg',
            'Assets/Skybox/negx.jpg',
            'Assets/Skybox/posy.jpg',
            'Assets/Skybox/negy.jpg',
            'Assets/Skybox/posz.jpg',
            'Assets/Skybox/negz.jpg',
        ]);
        scene.background = texture;
    }

    /// LIGHTS ///

    // WARM CAVE LIGHT
    {
        const color = 0xFFF1A8;
        const intensity = 100;
        const distance = 10;

        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(-1, 4, 4);
        scene.add(light);
    }

    // CENTRAL GEM LIGHT
    {
        const color = 0x4DA6FF;
        const intensity = 900;
        const distance = 100;

        gemLight = new THREE.PointLight(color, intensity, distance);
        gemLight.castShadow = true;
        gemLight.near = 0.1;
        gemLight.far = 1000;
        gemLight.position.set(0, 6, 0);
        scene.add(gemLight);
    }

    // SKYLIGHT
    {
        const skyColor = 0xB1E1FF;
        const groundColor = 0x5A4636;
        const intensity = 0.55;
        const light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    // SUNLIGHT
    {
        const color = 0xFFFFFF;
        const intensity = 0.5;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(5, 10, 2);
        scene.add(light);
        scene.add(light.target);
    }

    /// PRIMITIVES ///

    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    const sphereDiameter = 0.70;
    const sphereGeometry = new THREE.SphereGeometry(sphereDiameter);

    const coneGeometry = new THREE.ConeGeometry(sphereDiameter, boxHeight);

    shapes = [
        makeShapeInstance(geometry, 0x4E7CA1, -2),
        makeShapeInstance(sphereGeometry, 0x7FB7E6, 0),
        makeShapeInstance(coneGeometry, 0x7A5C43, 2),
    ];

    // CAVE ENTRANCE CONES
    {
        const coneHeight = 3;
        const coneDiameter = 2;
        const coneRockGeometry = new THREE.ConeGeometry(coneDiameter, coneHeight);

        const loader = new THREE.TextureLoader();
        const coneRockTexture = loader.load('Assets/Rock/lichen_rock_diff_1k.jpg');
        const coneRockBumpMap = loader.load('Assets/Rock/lichen_rock_disp_1k.png');
        coneRockTexture.colorSpace = THREE.SRGBColorSpace;

        let coneCount = 9;
        let conesDistance = 20;
        let conesScale = 5;

        let entrancePosition = [0, 9, -90];

        for (let i = 0; i < coneCount; i++) {
            let rock = makeRockInstance(coneRockGeometry, coneRockTexture, coneRockBumpMap);
            rock.position.set(
                entrancePosition[0] + (Math.cos((6.28 / coneCount) * i) * conesDistance),
                entrancePosition[1] + (Math.sin((6.28 / coneCount) * i) * conesDistance),
                entrancePosition[2]
            );
            rock.rotateZ((6.28 / coneCount) * i + 3.14 / 2 + (Math.random() - 0.5));
            rock.scale.set(conesScale, 1.5 * conesScale, conesScale);
            rocks.push(rock);
        }

        coneCount = 9;
        conesDistance = 25;
        conesScale = 5;

        entrancePosition = [0, 9, 75];

        for (let i = 0; i < coneCount; i++) {
            let rock = makeRockInstance(coneRockGeometry, coneRockTexture, coneRockBumpMap);
            rock.position.set(
                entrancePosition[0] + (Math.cos((6.28 / coneCount) * i) * conesDistance),
                entrancePosition[1] + (Math.sin((6.28 / coneCount) * i) * conesDistance),
                entrancePosition[2]
            );
            rock.rotateZ((6.28 / coneCount) * i + 3.14 / 2 + (Math.random() - 0.5));
            rock.scale.set(conesScale, 1.5 * conesScale, conesScale);
            rocks.push(rock);
        }
    }

    /// OBJECTS ///

    // CAVE MESH
    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('Assets/Cave/materials.mtl', (mtl) => {
            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('Assets/Cave/model.obj', (cave_obj) => {
                cave_obj.scale.set(45, 45, 45);
                cave_obj.position.set(0, 5.5, 0);
                cave_obj.traverse(function (child) {
                    child.receiveShadow = true;
                });
                scene.add(cave_obj);
            });
        });
    }

    // CAGE MESH
    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('Assets/Cage/Cage.mtl', (mtl) => {
            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('Assets/Cage/Cage.obj', (cage_obj) => {
                cage_obj.scale.set(2, 2, 2);
                cage_obj.position.set(0, 5.5, 0);
                cage_obj.traverse(function (child) {
                    child.castShadow = true;
                });
                scene.add(cage_obj);
            });
        });
    }

    // FLOATING GEM
    createGem();

    // Set Window Size & Aspect
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Listen for Window Resize
    window.addEventListener('resize', onWindowResize);

    // Render
    requestAnimationFrame(render);
}

function createGem() {
    gemGroup = new THREE.Group();
    gemGroup.position.set(0, gemBaseY, 0);

    const coreGeometry = new THREE.OctahedronGeometry(0.95, 0);
    const shellGeometry = new THREE.OctahedronGeometry(1.2, 0);

    const coreMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x78C8FF,
        emissive: 0x1E5EFF,
        emissiveIntensity: 1.5,
        roughness: 0.12,
        metalness: 0.15,
        transparent: true,
        opacity: 0.92,
        transmission: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08
    });

    const shellMaterial = new THREE.MeshPhongMaterial({
        color: 0xAEE6FF,
        emissive: 0x103A88,
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.28,
        shininess: 120
    });

    gemCore = new THREE.Mesh(coreGeometry, coreMaterial);
    gemCore.castShadow = true;
    gemCore.receiveShadow = true;

    gemShell = new THREE.Mesh(shellGeometry, shellMaterial);
    gemShell.castShadow = true;

    gemGroup.add(gemCore);
    gemGroup.add(gemShell);

    const shardMaterial = new THREE.MeshPhongMaterial({
        color: 0xA8E7FF,
        emissive: 0x245DCC,
        emissiveIntensity: 0.55,
        shininess: 110,
        transparent: true,
        opacity: 0.9
    });

    const shardCount = 5;
    for (let i = 0; i < shardCount; i++) {
        const shardGeometry = new THREE.TetrahedronGeometry(0.22 + Math.random() * 0.12);
        const shard = new THREE.Mesh(shardGeometry, shardMaterial);

        const angle = (Math.PI * 2 * i) / shardCount;
        const radius = 1.7 + Math.random() * 0.35;
        const yOffset = -0.1 + Math.random() * 1.0;

        shard.userData = {
            angle,
            radius,
            yOffset,
            speed: 0.35 + Math.random() * 0.35,
            bobOffset: Math.random() * Math.PI * 2
        };

        shard.position.set(
            Math.cos(angle) * radius,
            yOffset,
            Math.sin(angle) * radius
        );

        shard.castShadow = true;
        gemGroup.add(shard);
        gemShards.push(shard);
    }

    const innerGlow = new THREE.PointLight(0x6FC7FF, 35, 8);
    innerGlow.position.set(0, 0, 0);
    gemGroup.add(innerGlow);

    scene.add(gemGroup);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    composer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function makeShapeInstance(geometry, color, x) {
    const material = new THREE.MeshPhongMaterial({ color });

    const shape = new THREE.Mesh(geometry, material);
    shape.castShadow = true;
    scene.add(shape);

    shape.position.x = x;
    shape.position.y = 1;

    return shape;
}

function makeRockInstance(geometry, texture, bump) {
    const material = new THREE.MeshPhongMaterial({
        map: texture,
        bumpMap: bump
    });

    const cone = new THREE.Mesh(geometry, material);
    scene.add(cone);

    return cone;
}

let lastTime = 0;
function render(time) {
    time *= 0.001;
    const deltaTime = time - lastTime;
    lastTime = time;

    shapes.forEach((shape, ndx) => {
        const speed = 1 + ndx * 0.1;
        const rot = time * speed;
        shape.rotation.x = rot;
        shape.rotation.y = rot;
    });

    // GEM ANIMATION
    if (gemGroup) {
        const pulse = 1 + Math.sin(time * 3.2) * 0.08 + Math.sin(time * 6.4) * 0.03;
        gemGroup.position.y = gemBaseY + Math.sin(time * 1.8) * 0.35;

        gemCore.scale.setScalar(gemBaseScale * pulse);
        gemCore.rotation.y = time * 1.25;
        gemCore.rotation.x = Math.sin(time * 0.8) * 0.18;

        gemShell.scale.setScalar(1.02 + Math.sin(time * 2.1) * 0.03);
        gemShell.rotation.y = -time * 0.65;
        gemShell.rotation.z = time * 0.45;

        gemShards.forEach((shard, index) => {
            const data = shard.userData;
            const angle = data.angle + time * data.speed;
            shard.position.x = Math.cos(angle) * data.radius;
            shard.position.z = Math.sin(angle) * data.radius;
            shard.position.y = data.yOffset + Math.sin(time * 2.4 + data.bobOffset) * 0.22;

            shard.rotation.x += 0.02 + index * 0.002;
            shard.rotation.y += 0.018 + index * 0.002;
            shard.rotation.z += 0.015;
        });

        if (gemLight) {
            gemLight.position.set(
                gemGroup.position.x,
                gemGroup.position.y + 1.1,
                gemGroup.position.z
            );
            gemLight.intensity = 850 + Math.sin(time * 4.0) * 120;
        }
    }

    composer.render(deltaTime);
    requestAnimationFrame(render);
}

main();
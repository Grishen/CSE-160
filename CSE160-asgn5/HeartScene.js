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

import { getParticleSystem } from "./Assets/Simple-Particle-Effects-main/getParticleSystem.js";



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
let heart;
let defaultHeartScale = 0.05;
let fireEffect;

function main() {
    // CANVAS & RENDERER
    canvas = document.querySelector('#c');
    renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;

    // CAMERA DATA
    const fov = 75;
    const aspect = 2;  // the canvas default
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

    // COMPOSER
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    // PIXELATE
    pixelPass = new RenderPixelatedPass(
        3,     // pixel size
        scene,
        camera
    );
    composer.addPass(pixelPass);

    // FILMIC
    filmPass = new FilmPass(
        1,   // intensity
        false,  // grayscale
    );
    composer.addPass(filmPass);

    // AFTERIMAGE
    afterimagePass = new AfterimagePass(0.75
    );
    composer.addPass(afterimagePass);

    // OUTPUT
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

    // YELLOW POINT LIGHT
    {
        // Light Data
        const color = 0xFFF11F;
        const intensity = 100;
        const distance = 10;

        // Create Light
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(-1, 4, 4);
        scene.add(light);
    }

    // HEART POINT LIGHT
    {
        // Light Data
        const color = 0xFF1111;
        const intensity = 1000;
        const distance = 100;

        // Create Light
        const light = new THREE.PointLight(color, intensity, distance);
        light.castShadow = true;
        light.near = 0.1;
        light.far = 1000;
        light.position.set(0, 6, 0);
        scene.add(light);
    }



    // SKYLIGHT
    {

        const skyColor = 0xB1E1FF; // light blue
        const groundColor = 0xB97A20; // brownish orange
        const intensity = 0.5;
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

    // SHAPE ARRAY 

    // Cube 
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // Sphere 
    const sphereDiameter = 0.70;
    const sphereGeometry = new THREE.SphereGeometry(sphereDiameter);

    // Cone
    const coneGeometry = new THREE.ConeGeometry(sphereDiameter, boxHeight);

    // Create Multiple Shapes
    shapes = [
        makeShapeInstance(geometry, 0x44aa88, -2),
        makeShapeInstance(sphereGeometry, 0x88141a, 0),
        makeShapeInstance(coneGeometry, 0xaa8844, 2),
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
        // Create Multiple Cones Around Entrance
        for (let i = 0; i < coneCount; i++) {
            // Create Rock Cone
            let rock = makeRockInstance(coneRockGeometry, coneRockTexture, coneRockBumpMap);
            // Place it in a circle around entrance
            rock.position.set(entrancePosition[0] + (Math.cos((6.28 / coneCount) * i) * conesDistance), entrancePosition[1] + (Math.sin((6.28 / coneCount) * i) * conesDistance), entrancePosition[2]);
            // Rotate it to face inwards with some random deviation
            rock.rotateZ((6.28 / coneCount) * i + 3.14 / 2 + (Math.random() - 0.5));
            // Scale it up
            rock.scale.set(conesScale, 1.5 * conesScale, conesScale);
            rocks.push(rock);
        }

        coneCount = 9;
        conesDistance = 25;
        conesScale = 5;

        entrancePosition = [0, 9, 75];
        // Create Multiple Cones Around Entrance
        for (let i = 0; i < coneCount; i++) {
            // Create Rock Cone
            let rock = makeRockInstance(coneRockGeometry, coneRockTexture, coneRockBumpMap);
            // Place it in a circle around entrance
            rock.position.set(entrancePosition[0] + (Math.cos((6.28 / coneCount) * i) * conesDistance), entrancePosition[1] + (Math.sin((6.28 / coneCount) * i) * conesDistance), entrancePosition[2]);
            // Rotate it to face inwards with some random deviation
            rock.rotateZ((6.28 / coneCount) * i + 3.14 / 2 + (Math.random() - 0.5));
            // Scale it up
            rock.scale.set(conesScale, 1.5 * conesScale, conesScale);
            rocks.push(rock);
        }
    }

    /// OBJECTS ///

    // CAVE MESH
    // Cave (Part 1 of 3) by Danni Bittman [CC-BY] (https://creativecommons.org/licenses/by/3.0/) via Poly Pizza (https://poly.pizza/m/5RlkbcRZiP1)
    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('Assets/Cave/materials.mtl', (mtl) => {

            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('Assets/Cave/model.obj', (cave_obj) => {
                cave_obj.scale.set(45, 45, 45);
                cave_obj.position.set(0, 5.5, 0);
                cave_obj.traverse(function (child) { child.receiveShadow = true; });
                scene.add(cave_obj);
            });

        });
    }


    // CAGE MESH
    // Cage Medieval by hat_my_guy (https://poly.pizza/m/mybhRIyuL9)
    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('Assets/Cage/Cage.mtl', (mtl) => {

            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('Assets/Cage/Cage.obj', (cage_obj) => {
                cage_obj.scale.set(2, 2, 2);
                cage_obj.position.set(0, 5.5, 0);
                cage_obj.traverse(function (child) { child.castShadow = true; });
                scene.add(cage_obj);
            });

        });
    }

    // HEART MESH (From Google Poly)
    {
        const mtlLoader = new MTLLoader();
        mtlLoader.load('Assets/Heart/1410 Heart.mtl', (mtl) => {

            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('Assets/Heart/1410 Heart.obj', (heart_obj) => {
                heart = heart_obj;
                heart.scale.set(0.05, 0.05, 0.05);
                heart.position.set(0, 4, 0);
                scene.add(heart);

                /// PARTICLES 

                fireEffect = getParticleSystem({
                    camera,
                    emitter: heart,
                    parent: scene,
                    rate: 10.0,
                    texture: 'Assets/Simple-Particle-Effects-main/img/circle.png',
                });
            });

        });
    }


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
    const material = new THREE.MeshPhongMaterial({ map: texture, bumpMap: bump });

    const cone = new THREE.Mesh(geometry, material);
    scene.add(cone);

    return cone;
}

let lastTime = 0;
function render(time) {
    time *= 0.001;  // convert time to seconds
    const deltaTime = time - lastTime;
    lastTime = time;

    shapes.forEach((shape, ndx) => {
        const speed = 1 + ndx * .1;
        const rot = time * speed;
        shape.rotation.x = rot;
        shape.rotation.y = rot;
    });

    /// HEART ANIMATION ///
    // Change heart scale over time
    let heartScale = (Math.sin(time * 4) + Math.sin(time * 8) + 2.5);
    // Shrink it to be appropriately sized
    heartScale *= defaultHeartScale;
    // Average it's changing scale to make it smoother and less extreme
    heartScale = (heartScale + 7 * defaultHeartScale) / 8;
    // Set scale if heart asset is loaded
    if (heart) {
        if (heartScale) { heart.scale.set(heartScale, (heartScale + 0.15) / 4, heartScale); }
        fireEffect.update(deltaTime);
    }



    composer.render(deltaTime);

    requestAnimationFrame(render);
}

main();
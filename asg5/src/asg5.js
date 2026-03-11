import * as THREE from 'three';
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js';
import {MTLLoader} from 'three/addons/loaders/MTLLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { Sky } from "./sky.js";


let canvas;
let renderer;
let scene;
let camera;
let loader;
let cubeLoader;
let objLoader;
let controls;
let mtlloader;
let sky;
let cubeCamera, cubeRenderTarget;
let reflectMaterial;
let parameters;
let gui;

function setUpScene() {
    canvas = document.querySelector('#c');

    scene = new THREE.Scene();

    parameters = {
        performanceMode: true,
        // reflectionMode: true,
        speed: 1.0,
    };

    gui = new GUI();
    gui.add(parameters, 'performanceMode').name('Performance Mode').onChange((value) => {
        performanceMode = value;
        console.log("Performance Mode: " + parameters.performanceMode);
    });
    // gui.add(parameters, 'reflectionMode').name('Reflection Mode').onChange((value) => {
    //     reflectionMode = value;
    //     console.log("Reflection Mode: " + parameters.reflectionMode);
    // });

    gui.add(parameters, 'speed', 1.0, 10.0);

    loader = new THREE.TextureLoader();
    cubeLoader = new THREE.CubeTextureLoader();
    objLoader = new OBJLoader();
    mtlloader = new MTLLoader();

    sky = new Sky();
    sky.scale.setScalar(1000);
    scene.add(sky);

    loader.load('./../textures/scenery/SM_DiffJPG2.jpg', (texture) => {
        // texture.preload();
        objLoader.load('./../textures/scenery/SnowyMountainMesh.obj', (root) => {
            // root.position.x = 4;
            root.position.y = -40;
            // root.position.z = 0;
            root.rotateOnAxis(new THREE.Vector3(1, 0, 0), -Math.PI/2);
            root.scale.set(1000, 1000, 1000);
            root.traverse((child) => {
                if (child.isMesh) {
                    child.material.map = texture;
                    child.material.needsUpdate = true;
                }
            });
            scene.add(root);
            // scene_items.push(root);
        });
    });

    renderer = new THREE.WebGLRenderer({antialias: true, canvas});
    renderer.setSize( window.innerWidth*0.98, window.innerHeight*0.95 );

    // renderTarget = new THREE.WebGLRenderTarget( window.innerWidth, window.innerHeight );
    // document.body.appendChild( renderer.domElement );
    cubeRenderTarget =  new THREE.WebGLCubeRenderTarget( 512 ); 
    cubeRenderTarget.texture.type = THREE.HalfFloatType;

    cubeCamera = new THREE.CubeCamera( 1, 5000, cubeRenderTarget );

    let fov = 100;
    let aspect = 2;  // the canvas default
    let near = 0.1;
    let far = 2000; 
    camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
    camera.position.set(-85, 30, -155);

    let color = 0xFFFFFF;
    let intensity = 2;
    let light = new THREE.SpotLight(color, 100);
    light.distance = 50;
    light.position.set(-75, 18, -133);
    light.target.position.set(-300, 18, -1);
    scene.add(light);
    scene.add( light.target ); 

    // const spotLightHelper = new THREE.SpotLightHelper( light );
    // scene.add( spotLightHelper );


    color = 0x2d6e7a;
    intensity = 5;
    let light2 = new THREE.AmbientLight(color, intensity);
    scene.add(light2);

    color = 0x51ad8f;
    intensity = 2;
    let light3 = new THREE.DirectionalLight(color, intensity);
    light3.position.set(4, 10, 4);
    scene.add(light3);

    // camera.position.set(-300, 500, -300);
    controls = new OrbitControls( camera, canvas );
	controls.target.set(-90, 30, -142);
    // controls.target.set(-500, 50, -500);
	controls.update();
}

function loadColorTexture( path ) {
    let texture = loader.load( path );
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createMaterials(files) {
    let materials = [];
    for(let i = 0; i < files.length; i++) {
        materials.push(new THREE.MeshPhongMaterial({map: loadColorTexture(files[i])}));
    }
    return materials;
}

function makeInstance(geometry, files, position) {
    // add object to scene
    let materials = createMaterials(files);
    let obj = new THREE.Mesh(geometry, materials);
    scene.add(obj);

    obj.position.x = position[0];
    obj.position.y = position[1];
    obj.position.z = position[2];

    return obj;
  }

function createTree(location) {
    let trunk_geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
    let trunk_material = new THREE.MeshPhongMaterial({color: 0x6b5700});
    let trunk = new THREE.Mesh(trunk_geometry, trunk_material);
    trunk.position.set(location[0], location[1], location[2]);
    trunk.scale.set(2, 2, 2);
    scene.add(trunk);

    let leaves_material = new THREE.MeshPhongMaterial({color: 0xddf0e2});

    let leaf = new THREE.ConeGeometry(0.75, 1, 6);
    let leaf1 = new THREE.Mesh(leaf, leaves_material);
    leaf1.position.set(location[0], location[1] + 8, location[2]);
    leaf1.scale.set(2, 2, 2);

    leaf = new THREE.ConeGeometry(1, 1, 6);
    let leaf2 = new THREE.Mesh(leaf, leaves_material);
    leaf2.position.set(location[0], location[1] + 7, location[2]);
    leaf2.scale.set(2, 2, 2);

    leaf = new THREE.ConeGeometry(1.25, 1, 6);
    let leaf3 = new THREE.Mesh(leaf, leaves_material);
    leaf3.position.set(location[0], location[1] + 5.8, location[2]);
    leaf3.scale.set(2, 2, 2);

    leaf = new THREE.ConeGeometry(1.5, 1, 6);
    let leaf4 = new THREE.Mesh(leaf, leaves_material);
    leaf4.position.set(location[0], location[1] + 4.6, location[2]);
    leaf4.scale.set(2, 2, 2);
    
    leaf = new THREE.ConeGeometry(1.75, 1, 6);
    let leaf5 = new THREE.Mesh(leaf, leaves_material);
    leaf5.position.set(location[0], location[1] + 3.4, location[2]);
    leaf5.scale.set(2, 2, 2);
    
    leaf = new THREE.ConeGeometry(2, 1, 6);
    let leaf6 = new THREE.Mesh(leaf, leaves_material);
    leaf6.position.set(location[0], location[1] + 2.2, location[2]);
    leaf6.scale.set(2, 2, 2);

    scene.add(leaf1);
    scene.add(leaf2);   
    scene.add(leaf3);
    scene.add(leaf4);
    scene.add(leaf5);
    scene.add(leaf6);
}

function createObjects() {
    let sphere_geometry = new THREE.SphereGeometry(2, 30, 14);

    createTree([12, 0, 0]);
    createTree([0, 0, 5]);
    createTree([40, 4, 30]);
    createTree([60, -2, -50]);
    createTree([-65, 9, 102]);
    createTree([-90, 16, -142]);
    createTree([-20, 0, -49]);
    createTree([30, -3, -49]);
    createTree([40, -3, -49]);
    createTree([55, -3, -59]);
    createTree([24, -2, -23]);
    createTree([52, -3, -54]);
    createTree([-55, -3, -59]);
    createTree([55, -3, -59]);

    createTree([-25, 5, 5]);
    createTree([-74, 15, -115]);
    createTree([-95, 13, -145]);
    
    createTree([-115, 6, -105]);
    // createTree([-95, 13, -145]);
    // createTree([-95, 13, -145]);    

    mtlloader.load("./../textures/models/Lowpoly_Helicopter.mtl", (mtl) => {
        // mtl.preload();
        objLoader.setMaterials(mtl);
        objLoader.load('./../textures/models/Lowpoly_Helicopter.obj', (root) => {
            root.scale.set(0.005, 0.005, 0.005);
            root.position.set(-75, 18, -133);
            root.rotateOnAxis(new THREE.Vector3(0, 1, 0), Math.PI/6);
            scene.add(root);
            // scene_items.push(root);
        });
    });

    let waterMap = loader.load('./../textures/scenery/waterNormalMap.jpg');
    reflectMaterial = new THREE.MeshStandardMaterial( {
        color: 0x0011ab,
        normalMap: waterMap,
        envMap: cubeRenderTarget.texture,
        roughness: 0.05,
        metalness: 1,
    } );

    gui.add(reflectMaterial, 'roughness', 0, 1);
    gui.add(reflectMaterial, 'metalness', 0, 1);

    let lake = new THREE.Mesh(new THREE.BoxGeometry(160, 1, 160), reflectMaterial);
    lake.position.set(-180, 3, -150);
    scene.add(lake);

    let lake2 = new THREE.Mesh(new THREE.BoxGeometry(250, 1, 350), reflectMaterial);
    lake2.position.set(-375, -2.5, -250);
    scene.add(lake2);

    scene.fog = new THREE.Fog(0x2d6e7a, 1, 500);
    THREE.ShaderChunk.fog_vertex = "#ifdef USE_FOG\n\tvFogDepth = length( mvPosition );\n#endif";


}

function main() {
    setUpScene();

    createObjects();
    
    function render(time) {
        time *= 0.001;  // convert time to seconds
        if(parameters.performanceMode) {
            console.log("Performance Mode on");
            if(Math.abs(time % 0.500) < 0.040) { //update reflections
                cubeCamera.update( renderer, scene );
            }
        } else {
            console.log("Performance mode off");
            cubeCamera.update( renderer, scene );
        }
        
        sky.material.uniforms["iTime"].value = time * parameters.speed;
        
        cubeCamera.position.copy(camera.position);
        
        renderer.render(scene, camera);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

main();
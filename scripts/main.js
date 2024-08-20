import { GUI } from 'dat.gui'; // Import dat.GUI
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import ImagePlane from './imagePlane';


let controls;
let scene, camera, renderer;
const mouse = new THREE.Vector2();

let images = []

const checkCompatibility = () => {
    if (WebGL.isWebGL2Available()) {
        return true;
    } else {
        const warning = WebGL.getWebGL2ErrorMessage();
        document.getElementById('container').appendChild(warning);
        return false;
    }
}

const createCamera = () => {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    let max = Math.max(window.innerWidth, window.innerHeight);
    camera.position.z = max/2;
}

const createScene = () => {
    scene = new THREE.Scene();
}

const createRenderer = () => {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);
}

const createControls = () => {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.enableZoom = false;
    controls.enableRotate = false;
};

const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

const animate = () => {
    requestAnimationFrame(animate);

    scene.traverse((object) => {
        if (object === null || typeof object === 'undefined') {
            console.error('Null or undefined object found in the scene:', object);
        }
    });
    
    images.forEach(img => {
        img.updatePosition(mouse);
    });
    
    controls.update();
    renderer.render(scene, camera);
}

const setMousePosition = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

const toggleGuidelines = () => {
    document.getElementById('guidelines').classList.toggle('show');
}

const addEventListeners = () => {
    window.addEventListener('keydown', (event) => {
        if (event.key === 'b') {
            event.preventDefault();
            images.forEach(img => img.toggleWireframe());
        }
        if (event.key === 'a') {
            event.preventDefault();
            toggleGuidelines();
        }
    });

    window.addEventListener('resize', () => onWindowResize());


    window.addEventListener('mousemove', (event) => {
        images.forEach(img => {
            if (img.moveOnMouseMove) {
                setMousePosition(event)
            }
        })
    });
    
    window.addEventListener('click', (event) => images.forEach(img => {
        if (img.moveOnClick) {
            setMousePosition(event)
        }
    })); 
}

const initGUI = () => {
    const guiOptions = {
        showGuidelines: true
    };


    const gui = new GUI();
    images.forEach((img, index) => {
        const folder = gui.addFolder(`Image ${index + 1}`);
        folder.add(img.mesh.position, 'x', -window.innerWidth, window.innerWidth).name('X Position');
        folder.add(img.mesh.position, 'y', -window.innerHeight, window.innerHeight).name('Y Position');
        folder.add(img.mesh.position, 'z', -10, 10).name('Z Position');
        folder.add(img, 'moveOnMouseMove').name('MoveOnMouseMove');
        folder.add(img, 'moveOnClick').name('MoveOnClick');
        folder.add(img, 'strength', 0, 0.1).name('Distortion Strength');
        folder.add(img, 'lerpFactor', 0.01, 0.2).name('Lerp Factor');
        folder.add(img, 'showWireframe').name('Wireframe').onChange(() =>
            img.toggleWireframe()
        );
        folder.add(guiOptions, 'showGuidelines').name('Guidelines').onChange(()=>{
            toggleGuidelines()
        });
        folder.open();
    });
}


const init = () => {

    if (checkCompatibility()) {
        createCamera();
        createScene();
        createRenderer();
        createControls();

        images.push(new ImagePlane(scene, camera, './assets/earth.jpg', undefined, undefined,  { x: 0, y: 1000 })) 
        
        addEventListeners();
        setTimeout(() => {
            initGUI();    
        }, 100);
        animate();
    }
}

document.addEventListener('DOMContentLoaded', init);
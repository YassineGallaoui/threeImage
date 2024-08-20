import * as THREE from 'three';

class ImagePlane {
    constructor(scene, camera, texturePath, maxPlaneWidthRatio = 0.35, maxPlaneHeightRatio = 0.6, initialPosition = { x: 0, y: 0 }) {
        this.scene = scene;
        this.camera = camera;
        this.texturePath = texturePath;
        this.maxPlaneWidthRatio = maxPlaneWidthRatio;
        this.maxPlaneHeightRatio = maxPlaneHeightRatio;
        this.initialPosition = initialPosition;

        this.geometry = null;
        this.material = null;
        this.mesh = null;
        this.originalPositions = null;
        this.wireframeMaterial = null;
        this.showWireframe = false;
        this.moveOnMouseMove = true;
        this.moveOnClick = true;
        this.strength = 0.02;
        this.lerpFactor = 0.04;

        this.init();
    }

    init() {
        this.loadTexture(this.texturePath, async (texture) => {
            this.createMaterial(texture);
            this.createWireframeMaterial();
            this.createGeometry(texture);
            this.createMesh();
            if (this.mesh) {
                this.setInitialPosition();
                this.scene.add(this.mesh);
            } else {
                console.error("Mesh not created properly.");
            }
        });
    }

    loadTexture(path, callback) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(path, (texture) => {
            texture.minFilter = THREE.LinearMipMapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            callback(texture);
        }, undefined, (err) => console.error('An error occurred loading the texture:', err));
    }

    createGeometry(texture) {
        const maxPlaneHeight = window.innerHeight * this.maxPlaneHeightRatio;
        const maxPlaneWidth = window.innerWidth * this.maxPlaneWidthRatio;
        const imageAspectRatio = texture.image.width / texture.image.height;

        let planeWidth, planeHeight;

        if (maxPlaneWidth / maxPlaneHeight > imageAspectRatio) {
            planeHeight = Math.min(maxPlaneHeight, texture.image.height);
            planeWidth = planeHeight * imageAspectRatio;
        } else {
            planeWidth = Math.min(maxPlaneWidth, texture.image.width);
            planeHeight = planeWidth / imageAspectRatio;
        }
        
        this.geometry = new THREE.PlaneGeometry(planeWidth, planeHeight, maxPlaneWidth / 30, maxPlaneHeight / 30);
        this.originalPositions = this.geometry.attributes.position.array.slice();
    }

    createMaterial(texture) {
        this.material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            wireframe: false,
        });
    }

    createWireframeMaterial() {
        this.wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide,
            wireframe: true,
        });
    }

    createMesh() {
        this.mesh = new THREE.Mesh(this.geometry, this.showWireframe ? this.wireframeMaterial : this.material);
        this.mesh.position.z = 0;
    }

    setInitialPosition() {
        this.mesh.position.set(
            this.initialPosition.x,
            this.initialPosition.y,
            0
        );
    }
     
    resizePlane() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.createGeometry(this.material.map);
            this.createMesh();
            this.scene.add(this.mesh);
        }
    }

    updatePosition(targetPosition) {
        if (targetPosition.x != null && targetPosition.y != null && this.mesh?.position != null) {
            const mouseVector = new THREE.Vector3(targetPosition.x, targetPosition.y, 0);
            mouseVector.unproject(this.camera);

            const direction = mouseVector.sub(this.camera.position).normalize();
            const distance = -this.camera.position.z / mouseVector.z;

            const newPosition = this.camera.position.clone().add(direction.multiplyScalar(distance));
            
            if (this.mesh.position) {
                const offset = new THREE.Vector3().subVectors(mouseVector, this.mesh.position);
                this.distort(offset)
            }

            this.mesh.position.x = this.lerp(this.mesh.position.x, newPosition.x, this.lerpFactor);
            this.mesh.position.y = this.lerp(this.mesh.position.y, newPosition.y, this.lerpFactor);
        };
    }

    distort(offset) {
        const position = this.geometry.attributes.position.array;
        const uv = this.geometry.attributes.uv.array;

        for (let i = 0; i < position.length; i += 3) {
            const u = uv[(i / 3) * 2];
            const v = uv[(i / 3) * 2 + 1];

            position[i] += offset.x * Math.sin(v * Math.PI) * this.strength;
            position[i + 1] += offset.y * Math.sin(u * Math.PI) * this.strength;
        }

        this.geometry.attributes.position.needsUpdate = true;

        this.lerpBackToOriginalPositions();
    }

    lerpBackToOriginalPositions() {
        const position = this.geometry.attributes.position.array;
        const length = position.length;

        for (let i = 0; i < length; i += 3) {
            position[i] = this.lerp(position[i], this.originalPositions[i], this.lerpFactor * 3);
            position[i + 1] = this.lerp(position[i + 1], this.originalPositions[i + 1], this.lerpFactor * 3);
        }

        this.geometry.attributes.position.needsUpdate = true;
    }
    
    deleteMesh() {
        if (this.mesh) {
            this.scene.remove(this.mesh);

            if (this.mesh.geometry) {
                this.mesh.geometry.dispose();
            }

            if (this.mesh.material) {
                if (this.mesh.material.map) {
                    this.mesh.material.map.dispose();
                }
                this.mesh.material.dispose();
            }

            this.mesh = null;
        }
    }


    toggleWireframe() {
        if(this.showWireframe) {
            this.mesh.material = this.material;
            this.showWireframe = false;  
        } else {
            this.mesh.material = this.wireframeMaterial;
            this.showWireframe = true;
        }
    }

    lerp(start, end, t) {
        return start * (1 - t) + end * t;
    }
}

export default ImagePlane;

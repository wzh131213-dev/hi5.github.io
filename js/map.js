/**
 * Map.js - High-Detail DNF Gothic Dungeon Architecture
 */

class DungeonMap {
    constructor(scene, stage = 1, currentRoom = 1, maxRooms = 3) {
        this.scene = scene;
        this.stage = stage;
        this.currentRoom = currentRoom;
        this.maxRooms = maxRooms;

        this.roomWidth = 36;
        this.roomDepth = 14;

        this.obstacles = [];
        this.chests = [];
        this.doorPortal = null;
        this.mapGroup = new THREE.Group();
        this.scene.add(this.mapGroup);

        this.generateRoom();
    }

    generateRoom() {
        while (this.mapGroup.children.length > 0) {
            const obj = this.mapGroup.children[0];
            this.mapGroup.remove(obj);
        }
        this.obstacles = [];
        this.chests = [];

        // Carved Stone Floor Tiles with Specular Metalness
        const floorGeo = new THREE.PlaneGeometry(this.roomWidth, this.roomDepth);
        const floorMat = new THREE.MeshStandardMaterial({
            color: (this.currentRoom === this.maxRooms) ? 0x281628 : 0x1a2238,
            roughness: 0.5,
            metalness: 0.3
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.mapGroup.add(floor);

        // Floor Grid Pattern
        const gridHelper = new THREE.GridHelper(this.roomWidth, 24, 0x4a5d8e, 0x2b3859);
        gridHelper.position.y = 0.02;
        gridHelper.scale.set(1, 1, this.roomDepth / this.roomWidth);
        this.mapGroup.add(gridHelper);

        // Gothic Rear Stone Wall
        const backWallGeo = new THREE.BoxGeometry(this.roomWidth + 2, 8.5, 1);
        const backWallMat = new THREE.MeshStandardMaterial({ color: 0x1a2136, roughness: 0.7 });
        const backWall = new THREE.Mesh(backWallGeo, backWallMat);
        backWall.position.set(0, 4.25, -this.roomDepth / 2 - 0.5);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.mapGroup.add(backWall);

        // Decorative Pillars with Glowing Rune Crystals
        for (let x = -this.roomWidth / 2 + 4; x <= this.roomWidth / 2 - 4; x += 8) {
            this.createWallPillar(x, -this.roomDepth / 2 + 0.8);
        }

        // Side Boundaries
        const leftWallGeo = new THREE.BoxGeometry(1, 6, this.roomDepth);
        const leftWallMat = new THREE.MeshStandardMaterial({ color: 0x151b2c, roughness: 0.8 });
        const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
        leftWall.position.set(-this.roomWidth / 2 - 0.5, 3, 0);
        this.mapGroup.add(leftWall);

        const rightWallGeo = new THREE.BoxGeometry(1, 6, this.roomDepth);
        const rightWallMat = new THREE.MeshStandardMaterial({ color: 0x151b2c, roughness: 0.8 });
        const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
        rightWall.position.set(this.roomWidth / 2 + 0.5, 3, 0);
        this.mapGroup.add(rightWall);

        // Ornate Golden Treasure Chests
        if (Math.random() < 0.75) {
            this.createChest(-this.roomWidth / 3, -this.roomDepth / 3);
        }

        this.obstacles.push({ type: 'wall_top', z: -this.roomDepth / 2 + 0.5 });
        this.obstacles.push({ type: 'wall_bottom', z: this.roomDepth / 2 - 0.5 });
        this.obstacles.push({ type: 'wall_left', x: -this.roomWidth / 2 + 0.8 });
        this.obstacles.push({ type: 'wall_right', x: this.roomWidth / 2 - 0.8 });

        this.createAmbientDust();
    }

    createWallPillar(x, z) {
        const pillarGeo = new THREE.BoxGeometry(1.3, 7.5, 1.3);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2b3859, roughness: 0.4, metalness: 0.2 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, 3.75, z);
        pillar.castShadow = true;
        this.mapGroup.add(pillar);

        // Torch Light
        const torchLight = new THREE.PointLight(0xffaa00, 1.4, 12);
        torchLight.position.set(x, 4.8, z + 0.85);
        this.mapGroup.add(torchLight);

        // Flame Mesh
        const flameGeo = new THREE.OctahedronGeometry(0.25);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(x, 4.8, z + 0.85);
        this.mapGroup.add(flame);
    }

    createChest(x, z) {
        const chestGroup = new THREE.Group();
        const baseGeo = new THREE.BoxGeometry(1.5, 0.95, 1.1);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.3 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.48;
        base.castShadow = true;
        chestGroup.add(base);

        const trimGeo = new THREE.BoxGeometry(1.55, 0.28, 1.15);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95, roughness: 0.1 });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = 0.75;
        chestGroup.add(trim);

        chestGroup.position.set(x, 0, z);
        this.mapGroup.add(chestGroup);

        this.chests.push({
            mesh: chestGroup,
            pos: new THREE.Vector3(x, 0, z),
            opened: false
        });
    }

    spawnNextRoomDoor() {
        if (this.doorPortal) {
            this.mapGroup.remove(this.doorPortal.mesh);
        }

        const doorGroup = new THREE.Group();

        const doorGeo = new THREE.RingGeometry(2.0, 2.6, 20);
        const doorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(this.roomWidth / 2 - 1.5, 2.5, 0);
        door.rotation.y = Math.PI / 2;
        doorGroup.add(door);

        const vortexGeo = new THREE.CircleGeometry(1.9, 20);
        const vortexMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
        const vortex = new THREE.Mesh(vortexGeo, vortexMat);
        vortex.position.set(this.roomWidth / 2 - 1.4, 2.5, 0);
        vortex.rotation.y = Math.PI / 2;
        doorGroup.add(vortex);

        this.mapGroup.add(doorGroup);

        this.doorPortal = {
            mesh: doorGroup,
            vortex: vortex,
            pos: new THREE.Vector3(this.roomWidth / 2 - 2, 0, 0)
        };
    }

    updatePortalAnimation() {
        if (this.doorPortal) {
            this.doorPortal.vortex.rotation.z += 0.05;
        }
    }

    createAmbientDust() {
        const particleCount = 120;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * this.roomWidth;
            positions[i + 1] = Math.random() * 5;
            positions[i + 2] = (Math.random() - 0.5) * this.roomDepth;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x00f0ff,
            size: 0.14,
            transparent: true,
            opacity: 0.55
        });

        const dust = new THREE.Points(geometry, material);
        this.mapGroup.add(dust);
    }

    destroy() {
        if (this.mapGroup && this.scene) {
            this.scene.remove(this.mapGroup);
        }
    }
}

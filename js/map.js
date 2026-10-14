/**
 * Map.js - DNF Style Sequential Room Belt-Scroll Stage Generator
 */

class DungeonMap {
    constructor(scene, stage = 1, currentRoom = 1, maxRooms = 3) {
        this.scene = scene;
        this.stage = stage;
        this.currentRoom = currentRoom;
        this.maxRooms = maxRooms;

        // Belt-scroll room dimensions (Length along X, Depth along Z)
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
        // Clear old meshes
        while (this.mapGroup.children.length > 0) {
            const obj = this.mapGroup.children[0];
            this.mapGroup.remove(obj);
        }
        this.obstacles = [];
        this.chests = [];

        // Floor Tiles & DNF Dark Dungeon Aesthetics
        const floorGeo = new THREE.PlaneGeometry(this.roomWidth, this.roomDepth);
        const floorMat = new THREE.MeshStandardMaterial({
            color: (this.currentRoom === this.maxRooms) ? 0x22121e : 0x181e2e,
            roughness: 0.7,
            metalness: 0.2
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.mapGroup.add(floor);

        // Floor Grid Lines Texture Effect
        const gridHelper = new THREE.GridHelper(this.roomWidth, 18, 0x3d4b70, 0x232d47);
        gridHelper.position.y = 0.02;
        gridHelper.scale.set(1, 1, this.roomDepth / this.roomWidth);
        this.mapGroup.add(gridHelper);

        // Top Back Wall (Dungeon stone wall with decorative arches/torches)
        const backWallGeo = new THREE.BoxGeometry(this.roomWidth + 2, 8, 1);
        const backWallMat = new THREE.MeshStandardMaterial({ color: 0x1c2338, roughness: 0.8 });
        const backWall = new THREE.Mesh(backWallGeo, backWallMat);
        backWall.position.set(0, 4, -this.roomDepth / 2 - 0.5);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.mapGroup.add(backWall);

        // Front Lower Boundary Wall
        const frontWallGeo = new THREE.BoxGeometry(this.roomWidth + 2, 2, 1);
        const frontWallMat = new THREE.MeshStandardMaterial({ color: 0x111522, roughness: 0.9 });
        const frontWall = new THREE.Mesh(frontWallGeo, frontWallMat);
        frontWall.position.set(0, 1, this.roomDepth / 2 + 0.5);
        this.mapGroup.add(frontWall);

        // Left Boundary Wall
        const leftWallGeo = new THREE.BoxGeometry(1, 6, this.roomDepth);
        const leftWallMat = new THREE.MeshStandardMaterial({ color: 0x181e2e, roughness: 0.8 });
        const leftWall = new THREE.Mesh(leftWallGeo, leftWallMat);
        leftWall.position.set(-this.roomWidth / 2 - 0.5, 3, 0);
        this.mapGroup.add(leftWall);

        // Right Boundary Wall / Exit Doorway
        const rightWallGeo = new THREE.BoxGeometry(1, 6, this.roomDepth);
        const rightWallMat = new THREE.MeshStandardMaterial({ color: 0x181e2e, roughness: 0.8 });
        const rightWall = new THREE.Mesh(rightWallGeo, rightWallMat);
        rightWall.position.set(this.roomWidth / 2 + 0.5, 3, 0);
        this.mapGroup.add(rightWall);

        // Decorative Pillars along back wall
        for (let x = -this.roomWidth / 2 + 4; x <= this.roomWidth / 2 - 4; x += 8) {
            this.createWallPillar(x, -this.roomDepth / 2 + 0.8);
        }

        // Spawn Chests in room
        if (Math.random() < 0.7) {
            this.createChest(-this.roomWidth / 3, -this.roomDepth / 3);
        }

        // Add Boundary Obstacles into physics check
        this.obstacles.push({ type: 'wall_top', z: -this.roomDepth / 2 + 0.5 });
        this.obstacles.push({ type: 'wall_bottom', z: this.roomDepth / 2 - 0.5 });
        this.obstacles.push({ type: 'wall_left', x: -this.roomWidth / 2 + 0.8 });
        this.obstacles.push({ type: 'wall_right', x: this.roomWidth / 2 - 0.8 });

        // Atmospheric Dust Particles
        this.createAmbientDust();
    }

    createWallPillar(x, z) {
        const pillarGeo = new THREE.BoxGeometry(1.2, 7, 1.2);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2d3752, roughness: 0.5 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, 3.5, z);
        pillar.castShadow = true;
        this.mapGroup.add(pillar);

        // Torch light atop pillar
        const torchLight = new THREE.PointLight(0xffaa00, 1.2, 10);
        torchLight.position.set(x, 4.5, z + 0.8);
        this.mapGroup.add(torchLight);

        // Torch flame particle
        const flameGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const flameMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(x, 4.5, z + 0.8);
        this.mapGroup.add(flame);
    }

    createChest(x, z) {
        const chestGroup = new THREE.Group();
        const baseGeo = new THREE.BoxGeometry(1.4, 0.9, 1.0);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.4 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.45;
        base.castShadow = true;
        chestGroup.add(base);

        const trimGeo = new THREE.BoxGeometry(1.45, 0.25, 1.05);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9 });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = 0.7;
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

        // Glowing "GO ➡️" Right Doorway Frame
        const doorGeo = new THREE.RingGeometry(1.8, 2.4, 16);
        const doorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide });
        const door = new THREE.Mesh(doorGeo, doorMat);
        door.position.set(this.roomWidth / 2 - 1.5, 2.2, 0);
        door.rotation.y = Math.PI / 2;
        doorGroup.add(door);

        // Inner glowing vortex
        const vortexGeo = new THREE.CircleGeometry(1.7, 16);
        const vortexMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const vortex = new THREE.Mesh(vortexGeo, vortexMat);
        vortex.position.set(this.roomWidth / 2 - 1.4, 2.2, 0);
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
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * this.roomWidth;
            positions[i + 1] = Math.random() * 5;
            positions[i + 2] = (Math.random() - 0.5) * this.roomDepth;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.12,
            transparent: true,
            opacity: 0.5
        });

        const dust = new THREE.Points(geometry, material);
        this.mapGroup.add(dust);
    }
}

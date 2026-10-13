/**
 * Map.js - Isometric Dungeon Floor & Props Generator
 */

class DungeonMap {
    constructor(scene, stage = 1) {
        this.scene = scene;
        this.stage = stage;
        this.mapSize = 32; // Grid 32x32 tiles
        this.tileSize = 2.0;
        this.obstacles = [];
        this.chests = [];
        this.portal = null;
        this.mapGroup = new THREE.Group();
        this.scene.add(this.mapGroup);

        this.generateMap();
    }

    generateMap() {
        // Clear old meshes
        while (this.mapGroup.children.length > 0) {
            const obj = this.mapGroup.children[0];
            this.mapGroup.remove(obj);
        }
        this.obstacles = [];
        this.chests = [];

        // Geometries and Materials for Tiles
        const tileGeo = new THREE.BoxGeometry(this.tileSize - 0.05, 0.4, this.tileSize - 0.05);

        // Floor tile colors depending on stage environment
        const floorColors = [0x1e2638, 0x182030, 0x221c33]; // Dark Slate, Deep Blue, Nether Purple
        const altColors = [0x253047, 0x1d293d, 0x2c2342];

        const matA = new THREE.MeshStandardMaterial({ color: floorColors[(this.stage - 1) % 3], roughness: 0.8 });
        const matB = new THREE.MeshStandardMaterial({ color: altColors[(this.stage - 1) % 3], roughness: 0.7 });

        const half = this.mapSize / 2;

        // Ground Grid Construction
        for (let x = -half; x < half; x++) {
            for (let z = -half; z < half; z++) {
                const isEdge = Math.abs(x) === half || Math.abs(x) === half - 1 || Math.abs(z) === half || Math.abs(z) === half - 1;
                const tileMat = (Math.abs(x + z) % 2 === 0) ? matA : matB;

                const tile = new THREE.Mesh(tileGeo, tileMat);
                tile.position.set(x * this.tileSize, -0.2, z * this.tileSize);
                tile.receiveShadow = true;
                this.mapGroup.add(tile);

                // Boundary Walls & Obstacles
                if (isEdge) {
                    this.createWall(x * this.tileSize, z * this.tileSize);
                } else if (Math.random() < 0.06 && Math.abs(x) > 3 && Math.abs(z) > 3) {
                    // Random Pillar / Rock Obstacles
                    this.createPillar(x * this.tileSize, z * this.tileSize);
                }
            }
        }

        // Spawn Treasure Chests
        for (let i = 0; i < 4; i++) {
            const rx = (Math.floor(Math.random() * (this.mapSize - 8)) - (this.mapSize / 2 - 4)) * this.tileSize;
            const rz = (Math.floor(Math.random() * (this.mapSize - 8)) - (this.mapSize / 2 - 4)) * this.tileSize;
            this.createChest(rx, rz);
        }

        // Ambient Floating Particles
        this.createAmbientDust();
    }

    createWall(x, z) {
        const wallHeight = 2.5 + Math.random() * 0.5;
        const wallGeo = new THREE.BoxGeometry(this.tileSize, wallHeight, this.tileSize);
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x2b334d, roughness: 0.6, metalness: 0.2 });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(x, wallHeight / 2, z);
        wall.castShadow = true;
        wall.receiveShadow = true;
        this.mapGroup.add(wall);

        this.obstacles.push({
            pos: new THREE.Vector3(x, 0, z),
            radius: this.tileSize * 0.7
        });
    }

    createPillar(x, z) {
        const pillarGeo = new THREE.CylinderGeometry(0.7, 0.9, 3, 8);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3d4768, roughness: 0.5 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(x, 1.5, z);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        this.mapGroup.add(pillar);

        // Glowing crystal atop pillar
        const crystalGeo = new THREE.OctahedronGeometry(0.4);
        const crystalMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.set(x, 3.3, z);
        this.mapGroup.add(crystal);

        this.obstacles.push({
            pos: new THREE.Vector3(x, 0, z),
            radius: 1.0
        });
    }

    createChest(x, z) {
        const chestGroup = new THREE.Group();
        const baseGeo = new THREE.BoxGeometry(1.2, 0.8, 0.9);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.4 });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.y = 0.4;
        base.castShadow = true;
        chestGroup.add(base);

        const trimGeo = new THREE.BoxGeometry(1.25, 0.2, 0.95);
        const trimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
        const trim = new THREE.Mesh(trimGeo, trimMat);
        trim.position.y = 0.6;
        chestGroup.add(trim);

        chestGroup.position.set(x, 0, z);
        this.mapGroup.add(chestGroup);

        this.chests.push({
            mesh: chestGroup,
            pos: new THREE.Vector3(x, 0, z),
            opened: false
        });
    }

    spawnPortal(x, z) {
        if (this.portal) {
            this.mapGroup.remove(this.portal.mesh);
        }

        const portalGroup = new THREE.Group();

        // Portal Base Ring
        const ringGeo = new THREE.TorusGeometry(1.8, 0.2, 16, 32);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00aaaa, metalness: 0.9 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.2;
        portalGroup.add(ring);

        // Vortex swirling disc
        const vortexGeo = new THREE.CircleGeometry(1.6, 32);
        const vortexMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
        const vortex = new THREE.Mesh(vortexGeo, vortexMat);
        vortex.rotation.x = Math.PI / 2;
        vortex.position.y = 0.25;
        portalGroup.add(vortex);

        portalGroup.position.set(x, 0, z);
        this.mapGroup.add(portalGroup);

        this.portal = {
            mesh: portalGroup,
            vortex: vortex,
            pos: new THREE.Vector3(x, 0, z)
        };
    }

    updatePortalAnimation() {
        if (this.portal) {
            this.portal.vortex.rotation.z += 0.03;
        }
    }

    createAmbientDust() {
        const particleCount = 120;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 50;
            positions[i + 1] = Math.random() * 6;
            positions[i + 2] = (Math.random() - 0.5) * 50;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x88ccff,
            size: 0.15,
            transparent: true,
            opacity: 0.6
        });

        const dust = new THREE.Points(geometry, material);
        this.mapGroup.add(dust);
    }
}

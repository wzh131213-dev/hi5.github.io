/**
 * Enemy.js - Monster AI Types, Wave Manager, and Loot Drop System
 */

class Enemy {
    constructor(scene, type = 'slime', x = 0, z = 0, level = 1) {
        this.scene = scene;
        this.type = type;
        this.isAlive = true;
        this.level = level;
        this.attackTimer = 0;

        // Base Enemy Parameters by Type
        const configs = {
            slime: {
                hp: 40 + level * 10,
                damage: 8 + level * 2,
                speed: 0.05 + Math.random() * 0.02,
                color: 0x30d158,
                radius: 0.6,
                exp: 30,
                coins: 10
            },
            skeleton: {
                hp: 80 + level * 20,
                damage: 16 + level * 4,
                speed: 0.08 + Math.random() * 0.02,
                color: 0xe2e8f0,
                radius: 0.8,
                exp: 65,
                coins: 25
            },
            boss: {
                hp: 400 + level * 120,
                damage: 30 + level * 8,
                speed: 0.06,
                color: 0xff2d55,
                radius: 1.8,
                exp: 300,
                coins: 120
            }
        };

        const cfg = configs[type] || configs.slime;
        this.maxHp = cfg.hp;
        this.hp = cfg.hp;
        this.damage = cfg.damage;
        this.speed = cfg.speed;
        this.radius = cfg.radius;
        this.expVal = cfg.exp;
        this.coinVal = cfg.coins;

        // Mesh Construction
        this.mesh = new THREE.Group();

        if (this.type === 'slime') {
            const bodyGeo = new THREE.SphereGeometry(this.radius, 16, 12);
            bodyGeo.scale(1, 0.7, 1);
            const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.2, transparent: true, opacity: 0.85 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = this.radius * 0.7;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Eyes
            const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const eye1 = new THREE.Mesh(eyeGeo, eyeMat);
            eye1.position.set(-0.2, this.radius * 0.7 + 0.1, 0.45);
            const eye2 = new THREE.Mesh(eyeGeo, eyeMat);
            eye2.position.set(0.2, this.radius * 0.7 + 0.1, 0.45);
            this.mesh.add(eye1);
            this.mesh.add(eye2);
        } else if (this.type === 'skeleton') {
            const bodyGeo = new THREE.CylinderGeometry(0.3, 0.25, 1.3, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.6 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 0.65;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            const skullGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const skullMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const skull = new THREE.Mesh(skullGeo, skullMat);
            skull.position.y = 1.5;
            skull.castShadow = true;
            this.mesh.add(skull);

            // Red glowing eyes
            const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.1);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const e1 = new THREE.Mesh(eyeGeo, eyeMat);
            e1.position.set(-0.1, 1.52, 0.2);
            const e2 = new THREE.Mesh(eyeGeo, eyeMat);
            e2.position.set(0.1, 1.52, 0.2);
            this.mesh.add(e1);
            this.mesh.add(e2);
        } else if (this.type === 'boss') {
            const bodyGeo = new THREE.ConeGeometry(this.radius, 3.2, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: 0x800020, roughness: 0.3, metalness: 0.5 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 1.6;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Horns
            const hornGeo = new THREE.ConeGeometry(0.2, 0.8, 6);
            const hornMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
            const h1 = new THREE.Mesh(hornGeo, hornMat);
            h1.position.set(-0.6, 2.8, 0);
            h1.rotation.z = 0.4;
            const h2 = new THREE.Mesh(hornGeo, hornMat);
            h2.position.set(0.6, 2.8, 0);
            h2.rotation.z = -0.4;
            this.mesh.add(h1);
            this.mesh.add(h2);
        }

        // World Position
        this.mesh.position.set(x, 0, z);
        this.scene.add(this.mesh);
    }

    update(dt, playerPos, onAttackPlayerCallback) {
        if (!this.isAlive) return;

        // Distance to Player
        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        // Aggro Range check (18 units)
        if (dist < 18) {
            const angle = Math.atan2(dx, dz);
            this.mesh.rotation.y = angle;

            // Attack Distance Threshold
            const attackDist = (this.type === 'boss') ? 2.5 : 1.4;

            if (dist > attackDist) {
                // Chase movement
                this.mesh.position.x += Math.sin(angle) * this.speed;
                this.mesh.position.z += Math.cos(angle) * this.speed;

                // Slime squish / walking animation
                if (this.type === 'slime') {
                    this.bodyMesh.scale.y = 0.7 + Math.sin(Date.now() * 0.01) * 0.15;
                }
            } else {
                // Attack Cooldown Check
                if (this.attackTimer <= 0) {
                    this.attackTimer = (this.type === 'boss') ? 1.5 : 1.0;
                    if (onAttackPlayerCallback) {
                        onAttackPlayerCallback(this.damage);
                    }
                }
            }
        }

        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
        }
    }

    takeDamage(amount) {
        this.hp -= amount;

        // Damage flash highlight
        if (this.bodyMesh && this.bodyMesh.material) {
            const originalHex = this.bodyMesh.material.color.getHex();
            this.bodyMesh.material.color.setHex(0xffffff);
            setTimeout(() => {
                if (this.bodyMesh && this.bodyMesh.material) {
                    this.bodyMesh.material.color.setHex(originalHex);
                }
            }, 100);
        }

        if (this.hp <= 0) {
            this.isAlive = false;
            this.destroy();
            return true; // Enemy defeated
        }
        return false;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

class WaveManager {
    constructor(scene, stage = 1) {
        this.scene = scene;
        this.stage = stage;
        this.currentWave = 1;
        this.maxWaves = 3;
        this.enemies = [];
        this.isWaveInProgress = false;
        this.totalKillsInStage = 0;
    }

    startWave() {
        this.enemies = [];
        this.isWaveInProgress = true;

        const count = 4 + this.stage * 2 + this.currentWave * 2;
        const radius = 12 + Math.random() * 6;

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const spawnX = Math.sin(angle) * radius;
            const spawnZ = Math.cos(angle) * radius;

            let type = 'slime';
            const roll = Math.random();
            if (this.currentWave === this.maxWaves && i === 0) {
                type = 'boss';
            } else if (roll > 0.5) {
                type = 'skeleton';
            }

            const enemy = new Enemy(this.scene, type, spawnX, spawnZ, this.stage);
            this.enemies.push(enemy);
        }
    }

    update(dt, playerPos, onAttackPlayer) {
        let activeEnemies = 0;

        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.isAlive) {
                enemy.update(dt, playerPos, onAttackPlayer);
                activeEnemies++;
            }
        }

        // Check if current wave is cleared
        if (this.isWaveInProgress && activeEnemies === 0) {
            this.isWaveInProgress = false;
            if (this.currentWave < this.maxWaves) {
                this.currentWave++;
                setTimeout(() => this.startWave(), 2000);
            }
        }

        return {
            waveCleared: !this.isWaveInProgress && activeEnemies === 0,
            allWavesCleared: this.currentWave >= this.maxWaves && activeEnemies === 0,
            remainingEnemies: activeEnemies
        };
    }
}

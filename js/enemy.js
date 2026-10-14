/**
 * Enemy.js - High-Detail DNF Monsters & Bosses
 */

class Enemy {
    constructor(scene, type = 'goblin', x = 0, z = 0, level = 1) {
        this.scene = scene;
        this.type = type;
        this.isAlive = true;
        this.level = level;
        this.attackTimer = 0;

        // Knockback & Floating Physics Variables
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.airHeight = 0;
        this.gravity = 0.018;
        this.isStaggered = false;
        this.staggerTimer = 0;

        const configs = {
            goblin: {
                name: '哥布林精锐',
                hp: 70 + level * 18,
                damage: 12 + level * 3,
                speed: 0.08 + Math.random() * 0.02,
                color: 0x2e8b57,
                radius: 0.65,
                exp: 40,
                coins: 15
            },
            tau: {
                name: '牛头巨兽领主',
                hp: 220 + level * 50,
                damage: 25 + level * 6,
                speed: 0.065,
                color: 0x8b4513,
                radius: 1.25,
                exp: 100,
                coins: 40
            },
            boss: {
                name: '深渊魔王·卡赞',
                hp: 1500 + level * 400,
                damage: 42 + level * 12,
                speed: 0.075,
                color: 0x800020,
                radius: 1.9,
                exp: 600,
                coins: 250,
                hpBars: 5
            }
        };

        const cfg = configs[type] || configs.goblin;
        this.name = cfg.name;
        this.maxHp = cfg.hp;
        this.hp = cfg.hp;
        this.damage = cfg.damage;
        this.speed = cfg.speed;
        this.radius = cfg.radius;
        this.expVal = cfg.exp;
        this.coinVal = cfg.coins;
        this.hpBars = cfg.hpBars || 1;

        // Mesh Construction
        this.mesh = new THREE.Group();

        if (this.type === 'goblin') {
            // High-detail Goblin Warrior with Leather Armor
            const bodyGeo = new THREE.CylinderGeometry(0.38, 0.28, 1.2, 10);
            const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.35 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 0.6;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Spiked Wooden Shield
            const shieldGeo = new THREE.BoxGeometry(0.1, 0.7, 0.5);
            const shieldMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 });
            const shield = new THREE.Mesh(shieldGeo, shieldMat);
            shield.position.set(-0.45, 0.6, 0.2);
            shield.castShadow = true;
            this.mesh.add(shield);

            // Pointed Ears & Glowing Eyes
            const earGeo = new THREE.ConeGeometry(0.14, 0.45, 5);
            const earMat = new THREE.MeshStandardMaterial({ color: 0x1e7b1e });
            const earL = new THREE.Mesh(earGeo, earMat);
            earL.position.set(-0.38, 1.0, 0);
            earL.rotation.z = 0.8;
            const earR = new THREE.Mesh(earGeo, earMat);
            earR.position.set(0.38, 1.0, 0);
            earR.rotation.z = -0.8;
            this.mesh.add(earL);
            this.mesh.add(earR);

            const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
            const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
            const e1 = new THREE.Mesh(eyeGeo, eyeMat);
            e1.position.set(-0.12, 1.0, 0.3);
            const e2 = new THREE.Mesh(eyeGeo, eyeMat);
            e2.position.set(0.12, 1.0, 0.3);
            this.mesh.add(e1);
            this.mesh.add(e2);

        } else if (this.type === 'tau') {
            // High-detail Tau Warrior with Iron Guards & Curved Horns
            const bodyGeo = new THREE.BoxGeometry(1.3, 1.9, 1.0);
            const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.5, metalness: 0.3 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 0.95;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Metallic Shoulder Guards
            const guardGeo = new THREE.BoxGeometry(0.4, 0.5, 0.6);
            const guardMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.8, roughness: 0.2 });
            const g1 = new THREE.Mesh(guardGeo, guardMat);
            g1.position.set(-0.75, 1.5, 0);
            const g2 = new THREE.Mesh(guardGeo, guardMat);
            g2.position.set(0.75, 1.5, 0);
            this.mesh.add(g1);
            this.mesh.add(g2);

            // Massive Horns
            const hornGeo = new THREE.ConeGeometry(0.24, 0.95, 8);
            const hornMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
            const h1 = new THREE.Mesh(hornGeo, hornMat);
            h1.position.set(-0.55, 2.05, 0);
            h1.rotation.z = 0.55;
            const h2 = new THREE.Mesh(hornGeo, hornMat);
            h2.position.set(0.55, 2.05, 0);
            h2.rotation.z = -0.55;
            this.mesh.add(h1);
            this.mesh.add(h2);

        } else if (this.type === 'boss') {
            // High-detail Boss Abyss Demon Lord
            const bodyGeo = new THREE.CylinderGeometry(1.2, 0.85, 3.0, 12);
            const bodyMat = new THREE.MeshStandardMaterial({
                color: cfg.color,
                roughness: 0.2,
                metalness: 0.7,
                emissive: 0x330000,
                emissiveIntensity: 0.6
            });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 1.5;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Crowned Horned Skull Helmet
            const crownGeo = new THREE.ConeGeometry(0.6, 1.2, 6);
            const crownMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.95 });
            const crown = new THREE.Mesh(crownGeo, crownMat);
            crown.position.set(0, 3.4, 0);
            this.mesh.add(crown);

            // Giant Animated Demon Wings
            const wingGeo = new THREE.BoxGeometry(2.2, 1.4, 0.12);
            const wingMat = new THREE.MeshStandardMaterial({ color: 0x220008, roughness: 0.2, metalness: 0.8 });
            this.w1 = new THREE.Mesh(wingGeo, wingMat);
            this.w1.position.set(-1.4, 2.2, -0.4);
            this.w1.rotation.y = 0.45;
            this.w2 = new THREE.Mesh(wingGeo, wingMat);
            this.w2.position.set(1.4, 2.2, -0.4);
            this.w2.rotation.y = -0.45;
            this.mesh.add(this.w1);
            this.mesh.add(this.w2);
        }

        this.mesh.position.set(x, 0, z);
        this.scene.add(this.mesh);
    }

    update(dt, playerPos, onAttackPlayerCallback) {
        if (!this.isAlive) return;

        if (this.type === 'boss' && this.w1 && this.w2) {
            this.w1.rotation.y = 0.45 + Math.sin(Date.now() * 0.005) * 0.15;
            this.w2.rotation.y = -0.45 - Math.sin(Date.now() * 0.005) * 0.15;
        }

        if (this.velocity.lengthSq() > 0.0001) {
            this.mesh.position.add(this.velocity);
            this.velocity.multiplyScalar(0.85);
        }

        if (this.airHeight > 0 || this.velocity.y > 0) {
            this.airHeight += this.velocity.y;
            this.velocity.y -= this.gravity;

            if (this.airHeight <= 0) {
                this.airHeight = 0;
                this.velocity.y = 0;
            }
            this.mesh.position.y = this.airHeight;
        }

        if (this.isStaggered) {
            this.staggerTimer -= dt;
            if (this.staggerTimer <= 0 && this.airHeight <= 0) {
                this.isStaggered = false;
            }
            return;
        }

        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        this.mesh.rotation.y = Math.atan2(dx, dz);

        const attackRange = (this.type === 'boss') ? 2.8 : 1.5;

        if (dist > attackRange) {
            const angle = Math.atan2(dx, dz);
            this.mesh.position.x += Math.sin(angle) * this.speed;
            this.mesh.position.z += Math.cos(angle) * this.speed;
        } else {
            if (this.attackTimer <= 0) {
                this.attackTimer = (this.type === 'boss') ? 1.4 : 1.1;
                if (onAttackPlayerCallback) {
                    onAttackPlayerCallback(this.damage);
                }
            }
        }

        if (this.attackTimer > 0) {
            this.attackTimer -= dt;
        }

        this.mesh.position.x = Math.max(-16.5, Math.min(16.5, this.mesh.position.x));
        this.mesh.position.z = Math.max(-5.5, Math.min(5.5, this.mesh.position.z));
    }

    takeHit(amount, knockbackVal = 1.0, launchVal = 0.0, hitDirSign = 1) {
        this.hp -= amount;

        this.isStaggered = true;
        this.staggerTimer = 0.35;
        this.velocity.x = hitDirSign * knockbackVal * 0.18;
        this.velocity.z = (Math.random() - 0.5) * 0.05;

        if (launchVal > 0) {
            this.velocity.y = launchVal * 0.12;
        }

        if (this.bodyMesh && this.bodyMesh.material) {
            const origHex = this.bodyMesh.material.color.getHex();
            this.bodyMesh.material.color.setHex(0xffffff);
            setTimeout(() => {
                if (this.bodyMesh && this.bodyMesh.material) {
                    this.bodyMesh.material.color.setHex(origHex);
                }
            }, 100);
        }

        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
            this.destroy();
            return true;
        }
        return false;
    }

    destroy() {
        this.scene.remove(this.mesh);
    }
}

class WaveManager {
    constructor(scene, stage = 1, currentRoom = 1, maxRooms = 3) {
        this.scene = scene;
        this.stage = stage;
        this.currentRoom = currentRoom;
        this.maxRooms = maxRooms;
        this.enemies = [];
        this.roomCleared = false;

        this.spawnRoomEnemies();
    }

    spawnRoomEnemies() {
        this.enemies = [];
        this.roomCleared = false;

        const isBossRoom = (this.currentRoom === this.maxRooms);

        if (isBossRoom) {
            const boss = new Enemy(this.scene, 'boss', 8, 0, this.stage);
            this.enemies.push(boss);

            for (let i = 0; i < 3; i++) {
                const mob = new Enemy(this.scene, 'goblin', 6 + i * 2, (i - 1) * 3, this.stage);
                this.enemies.push(mob);
            }
        } else {
            const count = 4 + this.currentRoom * 2;
            for (let i = 0; i < count; i++) {
                const type = (Math.random() < 0.6) ? 'goblin' : 'tau';
                const spawnX = (Math.random() * 16) - 2;
                const spawnZ = (Math.random() * 8) - 4;
                const mob = new Enemy(this.scene, type, spawnX, spawnZ, this.stage);
                this.enemies.push(mob);
            }
        }
    }

    update(dt, playerPos, onAttackPlayer) {
        let activeEnemies = 0;
        let activeBoss = null;

        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.isAlive) {
                enemy.update(dt, playerPos, onAttackPlayer);
                activeEnemies++;
                if (enemy.type === 'boss') activeBoss = enemy;
            }
        }

        if (activeEnemies === 0 && !this.roomCleared) {
            this.roomCleared = true;
        }

        return {
            roomCleared: this.roomCleared,
            remainingEnemies: activeEnemies,
            bossEnemy: activeBoss
        };
    }
}

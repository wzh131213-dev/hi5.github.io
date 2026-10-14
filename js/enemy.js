/**
 * Enemy.js - DNF Style Monsters with Stagger, Knockback, Floating Air Physics, and Multi-HP Bosses
 */

class Enemy {
    constructor(scene, type = 'goblin', x = 0, z = 0, level = 1) {
        this.scene = scene;
        this.type = type;
        this.isAlive = true;
        this.level = level;
        this.attackTimer = 0;

        // Knockback & Floating Physics Variables (受击与击退/浮空物理)
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.airHeight = 0;
        this.gravity = 0.018;
        this.isStaggered = false;
        this.staggerTimer = 0;

        // DNF Monster Configs
        const configs = {
            goblin: {
                name: '哥布林',
                hp: 60 + level * 15,
                damage: 10 + level * 3,
                speed: 0.08 + Math.random() * 0.02,
                color: 0x228b22,
                radius: 0.6,
                exp: 35,
                coins: 12
            },
            tau: {
                name: '牛头巨兽',
                hp: 180 + level * 40,
                damage: 22 + level * 5,
                speed: 0.06,
                color: 0x8b4513,
                radius: 1.1,
                exp: 90,
                coins: 35
            },
            boss: {
                name: '深渊魔王',
                hp: 1200 + level * 300,
                damage: 38 + level * 10,
                speed: 0.07,
                color: 0x800020,
                radius: 1.8,
                exp: 500,
                coins: 200,
                hpBars: 5 // 5-layer DNF Boss HP Bar
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
            const bodyGeo = new THREE.CylinderGeometry(0.35, 0.25, 1.1, 8);
            const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.4 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 0.55;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Pointed Ears
            const earGeo = new THREE.ConeGeometry(0.12, 0.4, 4);
            const earMat = new THREE.MeshStandardMaterial({ color: 0x1e7b1e });
            const earL = new THREE.Mesh(earGeo, earMat);
            earL.position.set(-0.35, 0.9, 0);
            earL.rotation.z = 0.8;
            const earR = new THREE.Mesh(earGeo, earMat);
            earR.position.set(0.35, 0.9, 0);
            earR.rotation.z = -0.8;
            this.mesh.add(earL);
            this.mesh.add(earR);
        } else if (this.type === 'tau') {
            const bodyGeo = new THREE.BoxGeometry(1.2, 1.8, 0.9);
            const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 0.9;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Tau Horns
            const hornGeo = new THREE.ConeGeometry(0.2, 0.8, 6);
            const hornMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.8 });
            const h1 = new THREE.Mesh(hornGeo, hornMat);
            h1.position.set(-0.5, 1.9, 0);
            h1.rotation.z = 0.5;
            const h2 = new THREE.Mesh(hornGeo, hornMat);
            h2.position.set(0.5, 1.9, 0);
            h2.rotation.z = -0.5;
            this.mesh.add(h1);
            this.mesh.add(h2);
        } else if (this.type === 'boss') {
            const bodyGeo = new THREE.CylinderGeometry(1.1, 0.8, 2.8, 10);
            const bodyMat = new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.2, metalness: 0.6 });
            this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            this.bodyMesh.position.y = 1.4;
            this.bodyMesh.castShadow = true;
            this.mesh.add(this.bodyMesh);

            // Giant Demon Wings
            const wingGeo = new THREE.BoxGeometry(1.8, 1.2, 0.1);
            const wingMat = new THREE.MeshBasicMaterial({ color: 0x330011 });
            const w1 = new THREE.Mesh(wingGeo, wingMat);
            w1.position.set(-1.2, 2.0, -0.4);
            w1.rotation.y = 0.4;
            const w2 = new THREE.Mesh(wingGeo, wingMat);
            w2.position.set(1.2, 2.0, -0.4);
            w2.rotation.y = -0.4;
            this.mesh.add(w1);
            this.mesh.add(w2);
        }

        this.mesh.position.set(x, 0, z);
        this.scene.add(this.mesh);
    }

    update(dt, playerPos, onAttackPlayerCallback) {
        if (!this.isAlive) return;

        // Apply Knockback Velocity
        if (this.velocity.lengthSq() > 0.0001) {
            this.mesh.position.add(this.velocity);
            this.velocity.multiplyScalar(0.85); // Friction
        }

        // Apply Launch Floating Physics (受击浮空)
        if (this.airHeight > 0 || this.velocity.y > 0) {
            this.airHeight += this.velocity.y;
            this.velocity.y -= this.gravity;

            if (this.airHeight <= 0) {
                this.airHeight = 0;
                this.velocity.y = 0;
            }
            this.mesh.position.y = this.airHeight;
        }

        // Stagger Recovery
        if (this.isStaggered) {
            this.staggerTimer -= dt;
            if (this.staggerTimer <= 0 && this.airHeight <= 0) {
                this.isStaggered = false;
            }
            return; // Cannot act while staggered in air or hit stun
        }

        // Distance & AI Movement to Player
        const dx = playerPos.x - this.mesh.position.x;
        const dz = playerPos.z - this.mesh.position.z;
        const dist = Math.hypot(dx, dz);

        // Face player
        this.mesh.rotation.y = Math.atan2(dx, dz);

        const attackRange = (this.type === 'boss') ? 2.6 : 1.5;

        if (dist > attackRange) {
            // Move towards player
            const angle = Math.atan2(dx, dz);
            this.mesh.position.x += Math.sin(angle) * this.speed;
            this.mesh.position.z += Math.cos(angle) * this.speed;
        } else {
            // Attack Player
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

        // Room boundary constraints
        this.mesh.position.x = Math.max(-16.5, Math.min(16.5, this.mesh.position.x));
        this.mesh.position.z = Math.max(-5.5, Math.min(5.5, this.mesh.position.z));
    }

    takeHit(amount, knockbackVal = 1.0, launchVal = 0.0, hitDirSign = 1) {
        this.hp -= amount;

        // Apply Knockback & Stagger
        this.isStaggered = true;
        this.staggerTimer = 0.35;
        this.velocity.x = hitDirSign * knockbackVal * 0.18;
        this.velocity.z = (Math.random() - 0.5) * 0.05;

        // Apply Air Launch
        if (launchVal > 0) {
            this.velocity.y = launchVal * 0.12;
        }

        // Hit Flash
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
            return true; // Defeated
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
            // Boss Room
            const boss = new Enemy(this.scene, 'boss', 8, 0, this.stage);
            this.enemies.push(boss);

            // Minions
            for (let i = 0; i < 3; i++) {
                const mob = new Enemy(this.scene, 'goblin', 6 + i * 2, (i - 1) * 3, this.stage);
                this.enemies.push(mob);
            }
        } else {
            // Mob Room
            const count = 4 + this.currentRoom * 2;
            for (let i = 0; i < count; i++) {
                const type = (Math.random() < 0.6) ? 'goblin' : 'tau';
                const spawnX = (Math.random() * 16) - 2; // Right half of room
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

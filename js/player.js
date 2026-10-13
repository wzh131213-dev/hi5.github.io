/**
 * Player.js - Player Character Entity with 2.5D Isometric Movement, Stats, and Skills
 */

class Player {
    constructor(scene) {
        this.scene = scene;

        // Base Stats
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.maxHp = 100;
        this.hp = 100;
        this.maxMp = 50;
        this.mp = 50;
        this.attackPower = 25;
        this.defense = 5;
        this.moveSpeed = 0.16;

        // State Flags
        this.isDashing = false;
        this.isAttacking = false;
        this.isInvulnerable = false;
        this.dashCooldown = 0;
        this.spellCooldown = 0;
        this.healCooldown = 0;
        this.attackCooldown = 0;

        // Visual Mesh Creation (Hero Character)
        this.mesh = new THREE.Group();

        // Body (Armor Core)
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.4, 1.4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2b5ce7, roughness: 0.3, metalness: 0.6 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.7;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.mesh.add(this.bodyMesh);

        // Head & Helmet
        const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xe0e6ed, roughness: 0.2, metalness: 0.8 });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 1.6;
        headMesh.castShadow = true;
        this.mesh.add(headMesh);

        // Glowing Visor/Eyes
        const visorGeo = new THREE.BoxGeometry(0.3, 0.1, 0.2);
        const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 1.62, 0.22);
        this.mesh.add(visor);

        // Sword Weapon Mesh
        this.weaponGroup = new THREE.Group();
        const bladeGeo = new THREE.BoxGeometry(0.1, 1.2, 0.2);
        const bladeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.9, emissive: 0x113355 });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 0.6;
        blade.castShadow = true;
        this.weaponGroup.add(blade);

        const hiltGeo = new THREE.BoxGeometry(0.4, 0.08, 0.15);
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.4 });
        const hilt = new THREE.Mesh(hiltGeo, hiltMat);
        this.weaponGroup.add(hilt);

        this.weaponGroup.position.set(0.6, 0.7, 0.2);
        this.weaponGroup.rotation.z = -Math.PI / 6;
        this.mesh.add(this.weaponGroup);

        // Player Shadow Ring / Base Glow
        const ringGeo = new THREE.RingGeometry(0.4, 0.6, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02;
        this.mesh.add(ring);

        // Position & Adding to Scene
        this.mesh.position.set(0, 0, 0);
        this.scene.add(this.mesh);

        // Skill Timers Setup
        this.skills = {
            attack: { cooldown: 0.35, currentCd: 0 },
            dash: { cooldown: 2.0, currentCd: 0 },
            spell: { cooldown: 5.0, currentCd: 0 },
            heal: { cooldown: 10.0, currentCd: 0 }
        };
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    update(dt, inputDir, mouseWorldPos) {
        // Cooldown tick down
        for (let key in this.skills) {
            if (this.skills[key].currentCd > 0) {
                this.skills[key].currentCd -= dt;
                if (this.skills[key].currentCd < 0) this.skills[key].currentCd = 0;
            }
        }

        // Mana regeneration over time
        if (this.mp < this.maxMp) {
            this.mp = Math.min(this.maxMp, this.mp + 3 * dt);
        }

        // Handle Movement in 2.5D Isometric Space
        // Note: Isometric view rotates movement vectors by 45 degrees relative to screen
        if ((inputDir.x !== 0 || inputDir.z !== 0) && !this.isAttacking) {
            // Isometric dir transform
            const isoX = (inputDir.x - inputDir.z) * 0.7071;
            const isoZ = (inputDir.x + inputDir.z) * 0.7071;

            const speed = this.isDashing ? this.moveSpeed * 3.2 : this.moveSpeed;
            this.mesh.position.x += isoX * speed;
            this.mesh.position.z += isoZ * speed;

            // Rotation towards movement direction when not aiming specifically
            if (!mouseWorldPos) {
                const targetAngle = Math.atan2(isoX, isoZ);
                this.mesh.rotation.y = targetAngle;
            }

            // Running bobbing animation
            this.bodyMesh.position.y = 0.7 + Math.sin(Date.now() * 0.015) * 0.08;
        } else {
            this.bodyMesh.position.y = 0.7;
        }

        // Mouse aiming orientation
        if (mouseWorldPos) {
            const dx = mouseWorldPos.x - this.mesh.position.x;
            const dz = mouseWorldPos.z - this.mesh.position.z;
            this.mesh.rotation.y = Math.atan2(dx, dz);
        }

        // Dash decay
        if (this.isDashing) {
            this.dashTimer -= dt;
            if (this.dashTimer <= 0) {
                this.isDashing = false;
                this.isInvulnerable = false;
            }
        }
    }

    performBasicAttack(onHitEnemiesCallback) {
        if (this.skills.attack.currentCd > 0) return false;

        this.skills.attack.currentCd = this.skills.attack.cooldown;
        this.isAttacking = true;
        SoundEngine.playSlashSound();

        // Slash Animation
        const startRot = this.weaponGroup.rotation.y;
        let animProgress = 0;

        const slashInterval = setInterval(() => {
            animProgress += 0.2;
            this.weaponGroup.rotation.y = Math.sin(animProgress * Math.PI) * 1.8;
            if (animProgress >= 1) {
                clearInterval(slashInterval);
                this.weaponGroup.rotation.y = startRot;
                this.isAttacking = false;
            }
        }, 16);

        // Visual Slash Arc Effect
        this.createSlashArc();

        // Hit Detection Arc (Forward 2.5 units cone)
        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, this.mesh.rotation.y, 3.2, Math.PI * 0.7, this.attackPower);
        }

        return true;
    }

    createSlashArc() {
        const arcGeo = new THREE.RingGeometry(1.2, 2.8, 16, 1, 0, Math.PI * 0.6);
        const arcMat = new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const arcMesh = new THREE.Mesh(arcGeo, arcMat);
        arcMesh.rotation.x = Math.PI / 2;
        arcMesh.rotation.z = -Math.PI / 3;
        arcMesh.position.set(0, 0.8, 0.5);
        this.mesh.add(arcMesh);

        let op = 0.8;
        const fade = setInterval(() => {
            op -= 0.15;
            arcMat.opacity = op;
            if (op <= 0) {
                clearInterval(fade);
                this.mesh.remove(arcMesh);
                arcGeo.dispose();
                arcMat.dispose();
            }
        }, 30);
    }

    performDash() {
        if (this.skills.dash.currentCd > 0) return false;

        this.skills.dash.currentCd = this.skills.dash.cooldown;
        this.isDashing = true;
        this.isInvulnerable = true;
        this.dashTimer = 0.25;
        SoundEngine.playDashSound();

        // Ghost trail effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ghostMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4 });
                const ghost = new THREE.Mesh(this.bodyMesh.geometry.clone(), ghostMat);
                ghost.position.copy(this.mesh.position);
                ghost.position.y += 0.7;
                ghost.rotation.copy(this.mesh.rotation);
                this.scene.add(ghost);

                setTimeout(() => {
                    this.scene.remove(ghost);
                    ghostMat.dispose();
                }, 200);
            }, i * 60);
        }

        return true;
    }

    performSpell(onHitEnemiesCallback) {
        if (this.skills.spell.currentCd > 0 || this.mp < 20) return false;

        this.mp -= 20;
        this.skills.spell.currentCd = this.skills.spell.cooldown;
        SoundEngine.playSpellSound();

        // Fire Nova AOE Ring Effect
        const ringGeo = new THREE.RingGeometry(0.5, 1.0, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3300, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.copy(this.mesh.position);
        ringMesh.position.y = 0.2;
        this.scene.add(ringMesh);

        let scale = 1.0;
        const expand = setInterval(() => {
            scale += 0.8;
            ringMesh.scale.set(scale, scale, 1);
            ringMat.opacity -= 0.08;

            if (ringMat.opacity <= 0) {
                clearInterval(expand);
                this.scene.remove(ringMesh);
                ringGeo.dispose();
                ringMat.dispose();
            }
        }, 20);

        // AOE Damage hit callback (Radius 6.5 units full circle)
        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, 0, 6.5, Math.PI * 2, this.attackPower * 2.2);
        }

        return true;
    }

    performHeal() {
        if (this.skills.heal.currentCd > 0 || this.mp < 15) return false;

        this.mp -= 15;
        this.skills.heal.currentCd = this.skills.heal.cooldown;
        const healAmt = Math.round(this.maxHp * 0.4);
        this.hp = Math.min(this.maxHp, this.hp + healAmt);
        SoundEngine.playCoinSound();

        // Green healing pillar effect
        const pillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 4, 16);
        const pillarMat = new THREE.MeshBasicMaterial({ color: 0x30d158, transparent: true, opacity: 0.6 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.copy(this.mesh.position);
        pillar.position.y += 2;
        this.scene.add(pillar);

        setTimeout(() => {
            this.scene.remove(pillar);
            pillarGeo.dispose();
            pillarMat.dispose();
        }, 400);

        return healAmt;
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return 0;

        const damageTaken = Math.max(1, amount - this.defense);
        this.hp -= damageTaken;
        SoundEngine.playHitSound();

        // Brief damage flash
        this.bodyMesh.material.emissive.setHex(0xff0000);
        setTimeout(() => {
            this.bodyMesh.material.emissive.setHex(0x000000);
        }, 120);

        if (this.hp <= 0) {
            this.hp = 0;
        }
        return damageTaken;
    }

    gainExp(amount) {
        this.xp += amount;
        let leveledUp = false;
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.5);
            this.maxHp += 20;
            this.hp = this.maxHp;
            this.maxMp += 10;
            this.mp = this.maxMp;
            this.attackPower += 6;
            this.defense += 2;
            leveledUp = true;
            SoundEngine.playLevelUpSound();
        }
        return leveledUp;
    }
}

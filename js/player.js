/**
 * Player.js - High-Detail 3D DNF Ghost Knight Hero (鬼剑士)
 */

class Player {
    constructor(scene) {
        this.scene = scene;

        // Base Stats
        this.level = 1;
        this.xp = 0;
        this.xpToNextLevel = 100;
        this.maxHp = 120;
        this.hp = 120;
        this.maxMp = 80;
        this.mp = 80;
        this.attackPower = 32;
        this.defense = 8;
        this.moveSpeed = 0.18;
        this.facingRight = true;

        // State Flags
        this.isAttacking = false;
        this.isInvulnerable = false;
        this.comboIndex = 0;
        this.comboResetTimer = null;

        // Visual Mesh Creation
        this.mesh = new THREE.Group();

        // 1. Torso & Steel Plate Armor Core
        const torsoGeo = new THREE.CylinderGeometry(0.48, 0.38, 1.3, 12);
        const torsoMat = new THREE.MeshStandardMaterial({
            color: 0x1a233a,
            roughness: 0.25,
            metalness: 0.8,
            emissive: 0x050a18
        });
        this.bodyMesh = new THREE.Mesh(torsoGeo, torsoMat);
        this.bodyMesh.position.y = 0.65;
        this.bodyMesh.castShadow = true;
        this.bodyMesh.receiveShadow = true;
        this.mesh.add(this.bodyMesh);

        // Gold Trimmed Chestplate Emblem
        const chestEmblemGeo = new THREE.BoxGeometry(0.4, 0.4, 0.1);
        const chestEmblemMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        const chestEmblem = new THREE.Mesh(chestEmblemGeo, chestEmblemMat);
        chestEmblem.position.set(0, 0.8, 0.3);
        this.mesh.add(chestEmblem);

        // Ornate Shoulder Pauldrons
        const pauldronGeo = new THREE.ConeGeometry(0.35, 0.6, 6);
        const pauldronMat = new THREE.MeshStandardMaterial({ color: 0x2b3859, metalness: 0.85, roughness: 0.2 });
        const shoulderL = new THREE.Mesh(pauldronGeo, pauldronMat);
        shoulderL.position.set(-0.55, 1.1, 0);
        shoulderL.rotation.z = 0.6;
        shoulderL.castShadow = true;
        const shoulderR = new THREE.Mesh(pauldronGeo, pauldronMat);
        shoulderR.position.set(0.55, 1.1, 0);
        shoulderR.rotation.z = -0.6;
        shoulderR.castShadow = true;
        this.mesh.add(shoulderL);
        this.mesh.add(shoulderR);

        // 2. Demon Arm (Kazan Left Arm with glowing demonic veins)
        const ghostArmGeo = new THREE.CylinderGeometry(0.2, 0.16, 0.95, 10);
        const ghostArmMat = new THREE.MeshStandardMaterial({
            color: 0xa80022,
            roughness: 0.3,
            metalness: 0.3,
            emissive: 0x660011,
            emissiveIntensity: 0.8
        });
        const ghostArm = new THREE.Mesh(ghostArmGeo, ghostArmMat);
        ghostArm.position.set(-0.55, 0.75, 0);
        ghostArm.rotation.z = 0.35;
        ghostArm.castShadow = true;
        this.mesh.add(ghostArm);

        // 3. Head, Spiked Hair & Red Scarf
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdfc4, roughness: 0.4 });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 1.5;
        headMesh.castShadow = true;
        this.mesh.add(headMesh);

        // Flowing Wild Red Hair Spikes
        const hairGroup = new THREE.Group();
        for (let i = 0; i < 5; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.18, 0.75, 5);
            const spikeMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.3 });
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set((i - 2) * 0.1, 1.85, -0.15);
            spike.rotation.x = -0.5 - i * 0.05;
            hairGroup.add(spike);
        }
        this.mesh.add(hairGroup);

        // Red Tattered Scarf / Cape
        const scarfGeo = new THREE.BoxGeometry(0.7, 0.2, 0.3);
        const scarfMat = new THREE.MeshStandardMaterial({ color: 0x990000, roughness: 0.6 });
        const scarf = new THREE.Mesh(scarfGeo, scarfMat);
        scarf.position.set(0, 1.35, -0.2);
        this.mesh.add(scarf);

        // 4. High-Detail Zanbato Greatsword (斩马刀)
        this.weaponGroup = new THREE.Group();

        // Blade
        const bladeGeo = new THREE.BoxGeometry(0.14, 2.2, 0.32);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xf0f4f8,
            roughness: 0.1,
            metalness: 0.98,
            emissive: 0x113366,
            emissiveIntensity: 0.5
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 1.1;
        blade.castShadow = true;
        this.weaponGroup.add(blade);

        // Blade Blood Groove Line
        const grooveGeo = new THREE.BoxGeometry(0.04, 1.8, 0.08);
        const grooveMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const groove = new THREE.Mesh(grooveGeo, grooveMat);
        groove.position.set(0, 1.1, 0.13);
        this.weaponGroup.add(groove);

        // Gold Dragon Guard Hilt
        const hiltGeo = new THREE.BoxGeometry(0.65, 0.14, 0.25);
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 });
        const hilt = new THREE.Mesh(hiltGeo, hiltMat);
        this.weaponGroup.add(hilt);

        this.weaponGroup.position.set(0.55, 0.7, 0.2);
        this.weaponGroup.rotation.z = -Math.PI / 4;
        this.mesh.add(this.weaponGroup);

        // Shadow Ring
        const ringGeo = new THREE.RingGeometry(0.45, 0.8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02;
        this.mesh.add(ring);

        this.mesh.position.set(-12, 0, 0);
        this.scene.add(this.mesh);

        // Skills Hotbar Timers
        this.skills = {
            attack: { cooldown: 0.18, currentCd: 0 },
            upper: { cooldown: 2.0, currentCd: 0 },
            ghost: { cooldown: 4.0, currentCd: 0 },
            triple: { cooldown: 5.0, currentCd: 0 },
            wave: { cooldown: 6.0, currentCd: 0 },
            backstep: { cooldown: 1.5, currentCd: 0 }
        };
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    update(dt, inputDir) {
        for (let key in this.skills) {
            if (this.skills[key].currentCd > 0) {
                this.skills[key].currentCd -= dt;
                if (this.skills[key].currentCd < 0) this.skills[key].currentCd = 0;
            }
        }

        if (this.mp < this.maxMp) {
            this.mp = Math.min(this.maxMp, this.mp + 4.5 * dt);
        }

        if ((inputDir.x !== 0 || inputDir.z !== 0) && !this.isAttacking) {
            this.mesh.position.x += inputDir.x * this.moveSpeed;
            this.mesh.position.z += inputDir.z * this.moveSpeed;

            if (inputDir.x > 0) {
                this.facingRight = true;
                this.mesh.rotation.y = Math.PI / 2;
            } else if (inputDir.x < 0) {
                this.facingRight = false;
                this.mesh.rotation.y = -Math.PI / 2;
            }

            this.bodyMesh.position.y = 0.65 + Math.sin(Date.now() * 0.018) * 0.08;
        } else {
            this.bodyMesh.position.y = 0.65;
        }

        this.mesh.position.x = Math.max(-16.5, Math.min(16.5, this.mesh.position.x));
        this.mesh.position.z = Math.max(-5.5, Math.min(5.5, this.mesh.position.z));
    }

    performBasicCombo(onHitEnemiesCallback) {
        if (this.skills.attack.currentCd > 0) return false;

        this.skills.attack.currentCd = this.skills.attack.cooldown;
        this.isAttacking = true;
        SoundEngine.playSlashSound();

        this.comboIndex = (this.comboIndex + 1) % 3;
        clearTimeout(this.comboResetTimer);
        this.comboResetTimer = setTimeout(() => { this.comboIndex = 0; }, 1200);

        const dirSign = this.facingRight ? 1 : -1;
        const targetRot = (this.comboIndex === 2) ? Math.PI * 1.3 * dirSign : Math.PI * 0.85 * dirSign;

        let animProgress = 0;
        const slashInterval = setInterval(() => {
            animProgress += 0.25;
            this.weaponGroup.rotation.y = Math.sin(animProgress * Math.PI) * targetRot;
            if (animProgress >= 1) {
                clearInterval(slashInterval);
                this.weaponGroup.rotation.y = -Math.PI / 4;
                this.isAttacking = false;
            }
        }, 16);

        this.createSlashArc((this.comboIndex === 2) ? 0xff2200 : 0x00f0ff, 1.2);
        Engine.triggerSkillLight((this.comboIndex === 2) ? 0xff2200 : 0x00f0ff, 1.8, 150);

        if (onHitEnemiesCallback) {
            const damageMult = (this.comboIndex === 2) ? 1.7 : 1.0;
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 4.0, this.attackPower * damageMult, {
                knockback: (this.comboIndex === 2) ? 2.8 : 1.2,
                launch: (this.comboIndex === 2) ? 1.6 : 0.2,
                comboCount: 1
            });
        }

        return true;
    }

    performUpperSlash(onHitEnemiesCallback) {
        if (this.skills.upper.currentCd > 0 || this.mp < 10) return false;

        this.mp -= 10;
        this.skills.upper.currentCd = this.skills.upper.cooldown;
        this.isAttacking = true;
        SoundEngine.playLaunchSound();

        let progress = 0;
        const sweep = setInterval(() => {
            progress += 0.2;
            this.weaponGroup.rotation.x = Math.sin(progress * Math.PI) * Math.PI;
            if (progress >= 1) {
                clearInterval(sweep);
                this.weaponGroup.rotation.x = 0;
                this.isAttacking = false;
            }
        }, 16);

        this.createSlashArc(0xffd700, 1.5);
        Engine.triggerSkillLight(0xffd700, 2.5, 250);

        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 3.8, this.attackPower * 1.6, {
                knockback: 0.8,
                launch: 4.8,
                comboCount: 2
            });
        }

        return true;
    }

    performGhostSlash(onHitEnemiesCallback) {
        if (this.skills.ghost.currentCd > 0 || this.mp < 20) return false;

        this.mp -= 20;
        this.skills.ghost.currentCd = this.skills.ghost.cooldown;
        this.isAttacking = true;
        SoundEngine.playGhostSlashSound();

        const waveGeo = new THREE.RingGeometry(1.0, 4.0, 24, 1, 0, Math.PI);
        const waveMat = new THREE.MeshBasicMaterial({ color: 0xaa0033, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.position.copy(this.mesh.position);
        wave.position.y += 1.2;
        wave.rotation.y = this.facingRight ? Math.PI / 2 : -Math.PI / 2;
        this.scene.add(wave);

        Engine.triggerSkillLight(0xff0044, 3.5, 400);

        let scale = 1.0;
        const anim = setInterval(() => {
            scale += 0.16;
            wave.scale.set(scale, scale, 1);
            waveMat.opacity -= 0.09;
            if (waveMat.opacity <= 0) {
                clearInterval(anim);
                this.scene.remove(wave);
                waveGeo.dispose();
                waveMat.dispose();
                this.isAttacking = false;
            }
        }, 20);

        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 5.5, this.attackPower * 3.0, {
                knockback: 4.5,
                launch: 1.2,
                comboCount: 3
            });
        }

        return true;
    }

    performTripleDashSlash(onHitEnemiesCallback) {
        if (this.skills.triple.currentCd > 0 || this.mp < 25) return false;

        this.mp -= 25;
        this.skills.triple.currentCd = this.skills.triple.cooldown;
        SoundEngine.playDashSound();

        const dirX = this.facingRight ? 1 : -1;
        let step = 0;

        const dashInterval = setInterval(() => {
            step++;
            this.mesh.position.x += dirX * 3.4;
            SoundEngine.playSlashSound();
            this.createSlashArc(0x00ffff, 1.3);
            Engine.triggerSkillLight(0x00ffff, 2.0, 150);

            if (onHitEnemiesCallback) {
                onHitEnemiesCallback(this.mesh.position, this.facingRight, 3.5, this.attackPower * 1.3, {
                    knockback: 1.8,
                    launch: 0.6,
                    comboCount: 1
                });
            }

            if (step >= 3) {
                clearInterval(dashInterval);
            }
        }, 120);

        return true;
    }

    performWaveSword(onHitEnemiesCallback) {
        if (this.skills.wave.currentCd > 0 || this.mp < 20) return false;

        this.mp -= 20;
        this.skills.wave.currentCd = this.skills.wave.cooldown;
        SoundEngine.playWaveSound();

        const dirX = this.facingRight ? 1 : -1;
        Engine.triggerSkillLight(0xffaa00, 3.0, 350);

        for (let i = 1; i <= 4; i++) {
            setTimeout(() => {
                const ringGeo = new THREE.RingGeometry(0.6 * i, 1.2 * i, 20);
                const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.set(this.mesh.position.x + dirX * i * 2.0, 0.1, this.mesh.position.z);
                this.scene.add(ring);

                setTimeout(() => {
                    this.scene.remove(ring);
                    ringGeo.dispose();
                    ringMat.dispose();
                }, 250);
            }, i * 60);
        }

        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 8.0, this.attackPower * 2.2, {
                knockback: 3.8,
                launch: 0.8,
                comboCount: 2
            });
        }

        return true;
    }

    performBackstep() {
        if (this.skills.backstep.currentCd > 0) return false;

        this.skills.backstep.currentCd = this.skills.backstep.cooldown;
        this.isInvulnerable = true;
        SoundEngine.playDashSound();

        const backDirX = this.facingRight ? -1 : 1;
        let airTime = 0;

        const hop = setInterval(() => {
            airTime += 0.2;
            this.mesh.position.x += backDirX * 0.45;
            this.mesh.position.y = Math.sin(airTime * Math.PI) * 1.3;

            if (airTime >= 1) {
                clearInterval(hop);
                this.mesh.position.y = 0;
                this.isInvulnerable = false;
            }
        }, 16);

        return true;
    }

    createSlashArc(colorHex = 0x00f0ff, scaleMult = 1.0) {
        const arcGeo = new THREE.RingGeometry(1.3 * scaleMult, 2.8 * scaleMult, 20, 1, 0, Math.PI * 0.75);
        const arcMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
        const arcMesh = new THREE.Mesh(arcGeo, arcMat);
        arcMesh.rotation.x = Math.PI / 2;
        arcMesh.rotation.z = this.facingRight ? -Math.PI / 4 : Math.PI * 0.75;
        arcMesh.position.set(0, 0.9, 0.5);
        this.mesh.add(arcMesh);

        let op = 0.95;
        const fade = setInterval(() => {
            op -= 0.18;
            arcMat.opacity = op;
            if (op <= 0) {
                clearInterval(fade);
                this.mesh.remove(arcMesh);
                arcGeo.dispose();
                arcMat.dispose();
            }
        }, 20);
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return 0;

        const damageTaken = Math.max(1, amount - this.defense);
        this.hp -= damageTaken;
        SoundEngine.playHitSound();

        this.bodyMesh.material.emissive.setHex(0xff0000);
        setTimeout(() => {
            this.bodyMesh.material.emissive.setHex(0x050a18);
        }, 120);

        if (this.hp <= 0) this.hp = 0;
        return damageTaken;
    }

    gainExp(amount) {
        this.xp += amount;
        let leveledUp = false;
        if (this.xp >= this.xpToNextLevel) {
            this.xp -= this.xpToNextLevel;
            this.level++;
            this.xpToNextLevel = Math.round(this.xpToNextLevel * 1.5);
            this.maxHp += 25;
            this.hp = this.maxHp;
            this.maxMp += 15;
            this.mp = this.maxMp;
            this.attackPower += 8;
            this.defense += 3;
            leveledUp = true;
            SoundEngine.playLevelUpSound();
        }
        return leveledUp;
    }
}

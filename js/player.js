/**
 * Player.js - DNF Ghost Knight (鬼剑士) Hero Entity with Skill Combos & Belt-Scroll Movement
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
        this.attackPower = 30;
        this.defense = 8;
        this.moveSpeed = 0.18;
        this.facingRight = true; // Belt-scroll facing direction

        // State Flags & Animation States
        this.isAttacking = false;
        this.isInvulnerable = false;
        this.comboIndex = 0; // 0, 1, 2 (X-X-X 3-hit combo)
        this.comboResetTimer = null;

        // Visual Mesh Creation (Ghost Knight - 鬼剑士)
        this.mesh = new THREE.Group();

        // Ghost Arm (Left arm with dark demon aura)
        const ghostArmGeo = new THREE.CylinderGeometry(0.18, 0.15, 0.9, 8);
        const ghostArmMat = new THREE.MeshStandardMaterial({ color: 0x990022, roughness: 0.2, emissive: 0x440011 });
        const ghostArm = new THREE.Mesh(ghostArmGeo, ghostArmMat);
        ghostArm.position.set(-0.5, 0.8, 0);
        ghostArm.rotation.z = 0.3;
        this.mesh.add(ghostArm);

        // Armor Body Core
        const bodyGeo = new THREE.CylinderGeometry(0.45, 0.35, 1.3, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, roughness: 0.3, metalness: 0.7 });
        this.bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
        this.bodyMesh.position.y = 0.65;
        this.bodyMesh.castShadow = true;
        this.mesh.add(this.bodyMesh);

        // Head & Hair
        const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.y = 1.5;
        this.mesh.add(headMesh);

        // Red Hair Spikes
        const hairGeo = new THREE.ConeGeometry(0.4, 0.7, 6);
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, roughness: 0.4 });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.set(0, 1.8, -0.1);
        hair.rotation.x = -0.4;
        this.mesh.add(hair);

        // Katana Greatsword (Zanbato)
        this.weaponGroup = new THREE.Group();
        const bladeGeo = new THREE.BoxGeometry(0.12, 1.8, 0.25);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xe6edf3,
            roughness: 0.1,
            metalness: 0.95,
            emissive: 0x224488
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.y = 0.9;
        blade.castShadow = true;
        this.weaponGroup.add(blade);

        const hiltGeo = new THREE.BoxGeometry(0.5, 0.1, 0.2);
        const hiltMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3 });
        const hilt = new THREE.Mesh(hiltGeo, hiltMat);
        this.weaponGroup.add(hilt);

        this.weaponGroup.position.set(0.5, 0.7, 0.2);
        this.weaponGroup.rotation.z = -Math.PI / 4;
        this.mesh.add(this.weaponGroup);

        // Shadow Ring
        const ringGeo = new THREE.RingGeometry(0.4, 0.7, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 0.02;
        this.mesh.add(ring);

        // Position & Scene Adding
        this.mesh.position.set(-12, 0, 0); // Start left side of belt-scroll room
        this.scene.add(this.mesh);

        // DNF Skill Hotbar Timers
        this.skills = {
            attack: { cooldown: 0.2, currentCd: 0 },
            upper: { cooldown: 2.0, currentCd: 0 },     // 上挑 (Launch)
            ghost: { cooldown: 4.0, currentCd: 0 },     // 鬼斩 (Dark Ghost Wave)
            triple: { cooldown: 5.0, currentCd: 0 },    // 三段斩 (Triple Dash Slash)
            wave: { cooldown: 6.0, currentCd: 0 },      // 地裂·波动剑 (Ground Shockwave)
            backstep: { cooldown: 1.5, currentCd: 0 }   // 后跳 (Backstep Evasion)
        };
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    update(dt, inputDir) {
        // Cooldown tick
        for (let key in this.skills) {
            if (this.skills[key].currentCd > 0) {
                this.skills[key].currentCd -= dt;
                if (this.skills[key].currentCd < 0) this.skills[key].currentCd = 0;
            }
        }

        // Mana regen
        if (this.mp < this.maxMp) {
            this.mp = Math.min(this.maxMp, this.mp + 4 * dt);
        }

        // Movement in 2.5D Belt-Scroll Space (X: horizontal left/right, Z: depth forward/backward)
        if ((inputDir.x !== 0 || inputDir.z !== 0) && !this.isAttacking) {
            this.mesh.position.x += inputDir.x * this.moveSpeed;
            this.mesh.position.z += inputDir.z * this.moveSpeed;

            // Facing Direction Update
            if (inputDir.x > 0) {
                this.facingRight = true;
                this.mesh.rotation.y = Math.PI / 2;
            } else if (inputDir.x < 0) {
                this.facingRight = false;
                this.mesh.rotation.y = -Math.PI / 2;
            }

            // Running bobbing
            this.bodyMesh.position.y = 0.65 + Math.sin(Date.now() * 0.018) * 0.08;
        } else {
            this.bodyMesh.position.y = 0.65;
        }

        // Room boundary constraints (Belt-scroll stage limits: X[-16, 16], Z[-5.5, 5.5])
        this.mesh.position.x = Math.max(-16.5, Math.min(16.5, this.mesh.position.x));
        this.mesh.position.z = Math.max(-5.5, Math.min(5.5, this.mesh.position.z));
    }

    performBasicCombo(onHitEnemiesCallback) {
        if (this.skills.attack.currentCd > 0) return false;

        this.skills.attack.currentCd = this.skills.attack.cooldown;
        this.isAttacking = true;
        SoundEngine.playSlashSound();

        // 3-hit combo logic (X-X-X)
        this.comboIndex = (this.comboIndex + 1) % 3;
        clearTimeout(this.comboResetTimer);
        this.comboResetTimer = setTimeout(() => { this.comboIndex = 0; }, 1200);

        // Sword Slash Animation based on combo hit stage
        const dirSign = this.facingRight ? 1 : -1;
        const targetRot = (this.comboIndex === 2) ? Math.PI * 1.2 * dirSign : Math.PI * 0.8 * dirSign;

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

        // Visual Slash Arc
        this.createSlashArc((this.comboIndex === 2) ? 0xff2200 : 0x00f0ff);

        // Hit Detection Arc (Forward 3.5 units)
        if (onHitEnemiesCallback) {
            const damageMult = (this.comboIndex === 2) ? 1.6 : 1.0;
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 3.8, this.attackPower * damageMult, {
                knockback: (this.comboIndex === 2) ? 2.5 : 1.0,
                launch: (this.comboIndex === 2) ? 1.5 : 0.2,
                comboCount: 1
            });
        }

        return true;
    }

    // Skill 1: Upper Slash (上挑 - Launches Enemies)
    performUpperSlash(onHitEnemiesCallback) {
        if (this.skills.upper.currentCd > 0 || this.mp < 10) return false;

        this.mp -= 10;
        this.skills.upper.currentCd = this.skills.upper.cooldown;
        this.isAttacking = true;
        SoundEngine.playLaunchSound();

        // Upward Sword Sweep Animation
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

        // Upward energy crescent visual
        this.createSlashArc(0xffd700, 1.4);

        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 3.5, this.attackPower * 1.5, {
                knockback: 0.8,
                launch: 4.5, // High Launch Float
                comboCount: 2
            });
        }

        return true;
    }

    // Skill 2: Ghost Slash (鬼斩 - High Damage Ghost Wave)
    performGhostSlash(onHitEnemiesCallback) {
        if (this.skills.ghost.currentCd > 0 || this.mp < 20) return false;

        this.mp -= 20;
        this.skills.ghost.currentCd = this.skills.ghost.cooldown;
        this.isAttacking = true;
        SoundEngine.playGhostSlashSound();

        // Giant Dark Ghost Wave Crescent
        const waveGeo = new THREE.RingGeometry(0.8, 3.5, 16, 1, 0, Math.PI);
        const waveMat = new THREE.MeshBasicMaterial({ color: 0x990033, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.position.copy(this.mesh.position);
        wave.position.y += 1.0;
        wave.rotation.y = this.facingRight ? Math.PI / 2 : -Math.PI / 2;
        this.scene.add(wave);

        let scale = 1.0;
        const anim = setInterval(() => {
            scale += 0.15;
            wave.scale.set(scale, scale, 1);
            waveMat.opacity -= 0.1;
            if (waveMat.opacity <= 0) {
                clearInterval(anim);
                this.scene.remove(wave);
                waveGeo.dispose();
                waveMat.dispose();
                this.isAttacking = false;
            }
        }, 20);

        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 5.0, this.attackPower * 2.8, {
                knockback: 4.0,
                launch: 1.0,
                comboCount: 3
            });
        }

        return true;
    }

    // Skill 3: Triple Dash Slash (三段斩 - Multi-dash sword thrust)
    performTripleDashSlash(onHitEnemiesCallback) {
        if (this.skills.triple.currentCd > 0 || this.mp < 25) return false;

        this.mp -= 25;
        this.skills.triple.currentCd = this.skills.triple.cooldown;
        SoundEngine.playDashSound();

        const dirX = this.facingRight ? 1 : -1;
        let step = 0;

        const dashInterval = setInterval(() => {
            step++;
            this.mesh.position.x += dirX * 3.2;
            SoundEngine.playSlashSound();
            this.createSlashArc(0x00ffff, 1.2);

            if (onHitEnemiesCallback) {
                onHitEnemiesCallback(this.mesh.position, this.facingRight, 3.2, this.attackPower * 1.2, {
                    knockback: 1.5,
                    launch: 0.5,
                    comboCount: 1
                });
            }

            if (step >= 3) {
                clearInterval(dashInterval);
            }
        }, 120);

        return true;
    }

    // Skill 4: Wave Sword (地裂·波动剑 - Ground Shockwave)
    performWaveSword(onHitEnemiesCallback) {
        if (this.skills.wave.currentCd > 0 || this.mp < 20) return false;

        this.mp -= 20;
        this.skills.wave.currentCd = this.skills.wave.cooldown;
        SoundEngine.playWaveSound();

        const dirX = this.facingRight ? 1 : -1;

        // Ground shockwave rings advancing forward
        for (let i = 1; i <= 4; i++) {
            setTimeout(() => {
                const ringGeo = new THREE.RingGeometry(0.5 * i, 1.0 * i, 16);
                const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.set(this.mesh.position.x + dirX * i * 1.8, 0.1, this.mesh.position.z);
                this.scene.add(ring);

                setTimeout(() => {
                    this.scene.remove(ring);
                    ringGeo.dispose();
                    ringMat.dispose();
                }, 250);
            }, i * 60);
        }

        if (onHitEnemiesCallback) {
            onHitEnemiesCallback(this.mesh.position, this.facingRight, 7.5, this.attackPower * 2.0, {
                knockback: 3.5,
                launch: 0.8,
                comboCount: 2
            });
        }

        return true;
    }

    // Skill 5: Backstep Evasion (后跳 - Back Hop)
    performBackstep() {
        if (this.skills.backstep.currentCd > 0) return false;

        this.skills.backstep.currentCd = this.skills.backstep.cooldown;
        this.isInvulnerable = true;
        SoundEngine.playDashSound();

        const backDirX = this.facingRight ? -1 : 1;
        let airTime = 0;

        const hop = setInterval(() => {
            airTime += 0.2;
            this.mesh.position.x += backDirX * 0.4;
            this.mesh.position.y = Math.sin(airTime * Math.PI) * 1.2;

            if (airTime >= 1) {
                clearInterval(hop);
                this.mesh.position.y = 0;
                this.isInvulnerable = false;
            }
        }, 16);

        return true;
    }

    createSlashArc(colorHex = 0x00f0ff, scaleMult = 1.0) {
        const arcGeo = new THREE.RingGeometry(1.2 * scaleMult, 2.5 * scaleMult, 16, 1, 0, Math.PI * 0.7);
        const arcMat = new THREE.MeshBasicMaterial({ color: colorHex, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
        const arcMesh = new THREE.Mesh(arcGeo, arcMat);
        arcMesh.rotation.x = Math.PI / 2;
        arcMesh.rotation.z = this.facingRight ? -Math.PI / 4 : Math.PI * 0.75;
        arcMesh.position.set(0, 0.8, 0.5);
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

        // Red flash
        this.bodyMesh.material.emissive.setHex(0xff0000);
        setTimeout(() => {
            this.bodyMesh.material.emissive.setHex(0x000000);
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

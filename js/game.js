/**
 * Game.js - DNF Style Action Loop, Room Transitions, Combo Physics, and Event Binding
 */

const Game = (() => {
    const STATES = {
        START: 'START',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        UPGRADE: 'UPGRADE',
        VICTORY: 'VICTORY',
        GAMEOVER: 'GAMEOVER'
    };

    let currentState = STATES.START;
    let player = null;
    let dungeonMap = null;
    let waveManager = null;

    let stage = 1;
    let currentRoom = 1;
    const maxRooms = 3;

    let coins = 0;
    let score = 0;
    let totalKills = 0;
    let comboCount = 0;
    let comboTimer = null;

    let lastTime = 0;

    function init() {
        Engine.init();
        SoundEngine.init();

        setupUIEvents();

        dungeonMap = new DungeonMap(Engine.scene, stage, currentRoom, maxRooms);
        player = new Player(Engine.scene);

        Controls.init({
            onAttack: handlePlayerAttack,
            onUpper: handlePlayerUpper,
            onGhost: handlePlayerGhost,
            onTriple: handlePlayerTriple,
            onWave: handlePlayerWave,
            onBackstep: handlePlayerBackstep,
            onPause: togglePause
        });

        requestAnimationFrame(gameLoop);
    }

    function setupUIEvents() {
        document.getElementById('start-btn').addEventListener('click', startGame);
        document.getElementById('resume-btn').addEventListener('click', resumeGame);
        document.getElementById('restart-from-pause-btn').addEventListener('click', restartGame);
        document.getElementById('next-stage-btn').addEventListener('click', nextStage);
        document.getElementById('restart-btn').addEventListener('click', restartGame);

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Skill hotbar slot clicks
        const bindClick = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('click', fn);
        };
        bindClick('skill-attack', handlePlayerAttack);
        bindClick('skill-upper', handlePlayerUpper);
        bindClick('skill-ghost', handlePlayerGhost);
        bindClick('skill-triple', handlePlayerTriple);
        bindClick('skill-wave', handlePlayerWave);
        bindClick('skill-backstep', handlePlayerBackstep);
    }

    function startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');

        currentState = STATES.PLAYING;
        SoundEngine.startBGM();

        waveManager = new WaveManager(Engine.scene, stage, currentRoom, maxRooms);
    }

    function gameLoop(time) {
        const dt = Math.min((time - lastTime) / 1000, 0.1) || 0.016;
        lastTime = time;

        if (currentState === STATES.PLAYING) {
            update(dt);
        }

        Engine.render();
        requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        const inputDir = Controls.getMovementVector();

        player.update(dt, inputDir);
        Engine.updateCameraTarget(player.mesh.position);
        dungeonMap.updatePortalAnimation();

        if (waveManager) {
            const waveStatus = waveManager.update(dt, player.mesh.position, (damage) => {
                const taken = player.takeDamage(damage);
                if (taken > 0) {
                    showScreenDamageText(taken, '#ff2d55');
                }
                if (player.hp <= 0) {
                    triggerGameOver();
                }
            });

            // UI Update
            UI.updatePlayerStats(player);
            UI.updateStageInfo(stage, currentRoom, maxRooms, coins, score);
            UI.updateBossHPBar(waveStatus.bossEnemy);

            // Room Clear & Doorway Transition Logic
            if (waveStatus.roomCleared) {
                if (!dungeonMap.doorPortal) {
                    dungeonMap.spawnNextRoomDoor();
                    SoundEngine.playLevelUpSound();
                    UI.showRoomClearBanner();
                }

                // Distance to Exit Doorway (Right side of room)
                const distToDoor = Math.hypot(
                    player.mesh.position.x - dungeonMap.doorPortal.pos.x,
                    player.mesh.position.z - dungeonMap.doorPortal.pos.z
                );

                if (distToDoor < 2.5) {
                    if (currentRoom < maxRooms) {
                        // Advance to Next Room
                        currentRoom++;
                        player.setPosition(-14, 0, 0);
                        dungeonMap = new DungeonMap(Engine.scene, stage, currentRoom, maxRooms);
                        waveManager = new WaveManager(Engine.scene, stage, currentRoom, maxRooms);
                        UI.hideRoomClearBanner();
                    } else {
                        // Stage Victory
                        triggerVictory();
                    }
                }
            }
        }

        // Chest Collision
        dungeonMap.chests.forEach(chest => {
            if (!chest.opened && player.mesh.position.distanceTo(chest.pos) < 1.8) {
                chest.opened = true;
                chest.mesh.position.y += 0.3;
                coins += 60;
                score += 250;
                SoundEngine.playCoinSound();
                showScreenDamageText('+60 🪙', '#ffd700');
            }
        });
    }

    function addComboHit(count = 1) {
        comboCount += count;
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
            comboCount = 0;
            UI.updateComboCounter(0);
        }, 1800);
        UI.updateComboCounter(comboCount);
    }

    function handlePlayerAttack() {
        if (currentState !== STATES.PLAYING) return;
        player.performBasicCombo((pos, facingRight, range, damage, physics) => {
            checkLineHit(pos, facingRight, range, damage, physics);
        });
    }

    function handlePlayerUpper() {
        if (currentState !== STATES.PLAYING) return;
        player.performUpperSlash((pos, facingRight, range, damage, physics) => {
            checkLineHit(pos, facingRight, range, damage, physics);
        });
    }

    function handlePlayerGhost() {
        if (currentState !== STATES.PLAYING) return;
        player.performGhostSlash((pos, facingRight, range, damage, physics) => {
            checkLineHit(pos, facingRight, range, damage, physics);
        });
    }

    function handlePlayerTriple() {
        if (currentState !== STATES.PLAYING) return;
        player.performTripleDashSlash((pos, facingRight, range, damage, physics) => {
            checkLineHit(pos, facingRight, range, damage, physics);
        });
    }

    function handlePlayerWave() {
        if (currentState !== STATES.PLAYING) return;
        player.performWaveSword((pos, facingRight, range, damage, physics) => {
            checkLineHit(pos, facingRight, range, damage, physics);
        });
    }

    function handlePlayerBackstep() {
        if (currentState !== STATES.PLAYING) return;
        player.performBackstep();
    }

    function checkLineHit(pos, facingRight, range, damage, physics = {}) {
        if (!waveManager) return;

        const dirX = facingRight ? 1 : -1;

        waveManager.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const dx = enemy.mesh.position.x - pos.x;
            const dz = enemy.mesh.position.z - pos.z;

            // Check directional range box along X belt-scroll
            const inFront = (dirX > 0) ? (dx >= -0.5 && dx <= range) : (dx <= 0.5 && dx >= -range);
            const inDepth = Math.abs(dz) <= 2.2;

            if (inFront && inDepth) {
                const isDead = enemy.takeHit(
                    damage,
                    physics.knockback || 1.0,
                    physics.launch || 0.0,
                    dirX
                );

                addComboHit(physics.comboCount || 1);
                showScreenDamageText(`-${Math.round(damage)}`, '#ffcc00');

                if (isDead) {
                    totalKills++;
                    coins += enemy.coinVal;
                    score += enemy.expVal * 2;

                    const leveledUp = player.gainExp(enemy.expVal);
                    if (leveledUp) showUpgradeModal();
                }
            }
        });
    }

    function showScreenDamageText(text, color) {
        const screenX = window.innerWidth / 2 + (Math.random() - 0.5) * 120;
        const screenY = window.innerHeight / 2 - 50 + (Math.random() - 0.5) * 60;
        UI.showFloatingText(screenX, screenY, text, color);
    }

    function showUpgradeModal() {
        currentState = STATES.UPGRADE;
        const modal = document.getElementById('upgrade-modal');
        const container = document.getElementById('upgrade-options');
        container.innerHTML = '';

        const upgrades = [
            { id: 'atk', icon: '⚔️', title: '鬼剑之力', desc: '物理攻击力提升 +15%' },
            { id: 'hp', icon: '❤️', title: '极速复苏', desc: '最大生命值 +35，恢复满血' },
            { id: 'speed', icon: '⚡', title: '迅捷步伐', desc: '移动速度 +12%' }
        ];

        upgrades.forEach(up => {
            const card = document.createElement('div');
            card.className = 'upgrade-option';
            card.innerHTML = `
                <div class="upgrade-icon">${up.icon}</div>
                <div class="upgrade-title">${up.title}</div>
                <div class="upgrade-desc">${up.desc}</div>
            `;
            card.addEventListener('click', () => {
                applyUpgrade(up.id);
                modal.classList.add('hidden');
                currentState = STATES.PLAYING;
            });
            container.appendChild(card);
        });

        modal.classList.remove('hidden');
    }

    function applyUpgrade(id) {
        if (id === 'atk') player.attackPower += 10;
        if (id === 'hp') { player.maxHp += 35; player.hp = player.maxHp; }
        if (id === 'speed') player.moveSpeed += 0.02;
    }

    function togglePause() {
        if (currentState === STATES.PLAYING) {
            currentState = STATES.PAUSED;
            document.getElementById('pause-kills').innerText = totalKills;
            document.getElementById('pause-coins').innerText = coins;
            document.getElementById('pause-score').innerText = score;
            document.getElementById('pause-screen').classList.remove('hidden');
        } else if (currentState === STATES.PAUSED) {
            resumeGame();
        }
    }

    function resumeGame() {
        document.getElementById('pause-screen').classList.add('hidden');
        currentState = STATES.PLAYING;
    }

    function triggerVictory() {
        currentState = STATES.VICTORY;
        document.getElementById('stage-coins').innerText = coins;
        document.getElementById('stage-score').innerText = score;
        document.getElementById('victory-modal').classList.remove('hidden');
    }

    function nextStage() {
        document.getElementById('victory-modal').classList.add('hidden');
        stage++;
        currentRoom = 1;
        UI.hideRoomClearBanner();

        player.setPosition(-14, 0, 0);
        dungeonMap = new DungeonMap(Engine.scene, stage, currentRoom, maxRooms);
        waveManager = new WaveManager(Engine.scene, stage, currentRoom, maxRooms);

        currentState = STATES.PLAYING;
    }

    function triggerGameOver() {
        currentState = STATES.GAMEOVER;
        SoundEngine.stopBGM();

        document.getElementById('final-stage').innerText = stage;
        document.getElementById('final-kills').innerText = totalKills;
        document.getElementById('final-coins').innerText = coins;
        document.getElementById('final-score').innerText = score;

        document.getElementById('game-over-screen').classList.remove('hidden');
    }

    function restartGame() {
        location.reload();
    }

    return {
        init
    };
})();

window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

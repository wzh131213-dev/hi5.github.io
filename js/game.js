/**
 * Game.js - Main Game Loop, State Controller, Upgrade System & Event Binding
 */

const Game = (() => {
    // Game States
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
    let coins = 0;
    let score = 0;
    let totalKills = 0;

    let lastTime = 0;

    function init() {
        Engine.init();
        SoundEngine.init();

        setupUIEvents();

        // Initial setup
        dungeonMap = new DungeonMap(Engine.scene, stage);
        player = new Player(Engine.scene);

        Controls.init({
            onAttack: handlePlayerAttack,
            onDash: handlePlayerDash,
            onSpell: handlePlayerSpell,
            onHeal: handlePlayerHeal,
            onPause: togglePause
        });

        // Start animation loop
        requestAnimationFrame(gameLoop);
    }

    function setupUIEvents() {
        // Start Button
        document.getElementById('start-btn').addEventListener('click', () => {
            startGame();
        });

        // Resume Button
        document.getElementById('resume-btn').addEventListener('click', () => {
            resumeGame();
        });

        // Restart from Pause
        document.getElementById('restart-from-pause-btn').addEventListener('click', () => {
            restartGame();
        });

        // Next Stage Button
        document.getElementById('next-stage-btn').addEventListener('click', () => {
            nextStage();
        });

        // Game Over Restart Button
        document.getElementById('restart-btn').addEventListener('click', () => {
            restartGame();
        });

        // Difficulty Buttons
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Hotbar Slot Click Events for Mobile / Mouse users
        document.getElementById('skill-attack').addEventListener('click', handlePlayerAttack);
        document.getElementById('skill-dash').addEventListener('click', handlePlayerDash);
        document.getElementById('skill-spell').addEventListener('click', handlePlayerSpell);
        document.getElementById('skill-heal').addEventListener('click', handlePlayerHeal);
    }

    function startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');

        currentState = STATES.PLAYING;
        SoundEngine.startBGM();

        waveManager = new WaveManager(Engine.scene, stage);
        waveManager.startWave();
    }

    function gameLoop(time) {
        const dt = Math.min((time - lastTime) / 1000, 0.1) || 0.016;
        lastTime = time;

        if (currentState === STATES.PLAYING) {
            update(dt);
        }

        // Render Three.js Scene
        Engine.render();

        requestAnimationFrame(gameLoop);
    }

    function update(dt) {
        const inputDir = Controls.getMovementVector();
        const mouseWorldPos = Controls.getMouseWorldPos();

        // Player Update
        player.update(dt, inputDir, mouseWorldPos);

        // Camera Follow Target Smooth Lerp
        Engine.updateCameraTarget(player.mesh.position);

        // Map Portal Animation
        dungeonMap.updatePortalAnimation();

        // Wave & Enemy AI Update
        if (waveManager) {
            const waveStatus = waveManager.update(dt, player.mesh.position, (damage) => {
                // Enemy attacks player
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
            UI.updateStageInfo(stage, waveManager.currentWave, waveManager.maxWaves, coins, score);
            UI.renderMinimap(player, waveManager.enemies, dungeonMap.mapSize);

            // Stage Cleared & Portal Condition
            if (waveStatus.allWavesCleared) {
                if (!dungeonMap.portal) {
                    dungeonMap.spawnPortal(0, -10);
                    SoundEngine.playLevelUpSound();
                }

                // Check distance to portal
                const distToPortal = player.mesh.position.distanceTo(dungeonMap.portal.pos);
                if (distToPortal < 2.0) {
                    triggerVictory();
                }
            }
        }

        // Chest Collision Pickups
        dungeonMap.chests.forEach(chest => {
            if (!chest.opened && player.mesh.position.distanceTo(chest.pos) < 1.8) {
                chest.opened = true;
                chest.mesh.position.y += 0.3;
                coins += 50;
                score += 200;
                SoundEngine.playCoinSound();
                showScreenDamageText('+50 🪙', '#ffd700');
            }
        });
    }

    function handlePlayerAttack() {
        if (currentState !== STATES.PLAYING) return;
        player.performBasicAttack((pos, rotY, radius, arcAngle, damage) => {
            checkAreaDamageHit(pos, rotY, radius, arcAngle, damage);
        });
    }

    function handlePlayerDash() {
        if (currentState !== STATES.PLAYING) return;
        player.performDash();
    }

    function handlePlayerSpell() {
        if (currentState !== STATES.PLAYING) return;
        player.performSpell((pos, rotY, radius, arcAngle, damage) => {
            checkAreaDamageHit(pos, rotY, radius, arcAngle, damage);
        });
    }

    function handlePlayerHeal() {
        if (currentState !== STATES.PLAYING) return;
        const healed = player.performHeal();
        if (healed) {
            showScreenDamageText(`+${healed} HP`, '#30d158');
        }
    }

    function checkAreaDamageHit(pos, rotY, radius, arcAngle, damage) {
        if (!waveManager) return;

        waveManager.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const dx = enemy.mesh.position.x - pos.x;
            const dz = enemy.mesh.position.z - pos.z;
            const dist = Math.hypot(dx, dz);

            if (dist <= radius + enemy.radius) {
                let inAngle = true;
                if (arcAngle < Math.PI * 2) {
                    const angleToEnemy = Math.atan2(dx, dz);
                    let diff = angleToEnemy - rotY;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    inAngle = Math.abs(diff) <= arcAngle / 2;
                }

                if (inAngle) {
                    const isDead = enemy.takeDamage(damage);
                    showScreenDamageText(`-${Math.round(damage)}`, '#ffcc00');

                    if (isDead) {
                        totalKills++;
                        coins += enemy.coinVal;
                        score += enemy.expVal * 2;

                        const leveledUp = player.gainExp(enemy.expVal);
                        if (leveledUp) {
                            showUpgradeModal();
                        }
                    }
                }
            }
        });
    }

    function showScreenDamageText(text, color) {
        // Project center of screen for popups
        const screenX = window.innerWidth / 2 + (Math.random() - 0.5) * 100;
        const screenY = window.innerHeight / 2 - 40 + (Math.random() - 0.5) * 60;
        UI.showFloatingText(screenX, screenY, text, color);
    }

    function showUpgradeModal() {
        currentState = STATES.UPGRADE;
        const modal = document.getElementById('upgrade-modal');
        const container = document.getElementById('upgrade-options');
        container.innerHTML = '';

        const upgrades = [
            { id: 'atk', icon: '⚔️', title: '力量突破', desc: '攻击力提升 +15%' },
            { id: 'hp', icon: '❤️', title: '生命强化', desc: '最大生命值 +30，并恢复全部生命' },
            { id: 'speed', icon: '⚡', title: '疾风步', desc: '移动速度提升 +12%' }
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
        if (id === 'atk') player.attackPower += 8;
        if (id === 'hp') { player.maxHp += 30; player.hp = player.maxHp; }
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

        // Regenerate map & position player
        dungeonMap.generateMap();
        player.setPosition(0, 0, 0);

        waveManager = new WaveManager(Engine.scene, stage);
        waveManager.startWave();

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

// Launch game when window DOM content is loaded
window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});

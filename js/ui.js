/**
 * UI.js - Heads-Up Display, Floating Damage/XP Popups, Minimap, and Modals
 */

const UI = (() => {
    // DOM Elements
    const hpBar = document.getElementById('hp-bar');
    const hpText = document.getElementById('hp-text');
    const mpBar = document.getElementById('mp-bar');
    const mpText = document.getElementById('mp-text');
    const expBar = document.getElementById('exp-bar');
    const expText = document.getElementById('exp-text');
    const hudLevel = document.getElementById('hud-level');
    const stageTitle = document.getElementById('stage-title');
    const waveText = document.getElementById('wave-text');
    const coinCount = document.getElementById('coin-count');
    const scoreCount = document.getElementById('score-count');
    const floatingContainer = document.getElementById('floating-text-container');

    // Cooldown overlays
    const cdAttack = document.getElementById('cd-attack');
    const cdDash = document.getElementById('cd-dash');
    const cdSpell = document.getElementById('cd-spell');
    const cdHeal = document.getElementById('cd-heal');

    // Minimap Context
    const minimapCanvas = document.getElementById('minimap');
    const minimapCtx = minimapCanvas.getContext('2d');

    function updatePlayerStats(player) {
        if (!player) return;

        // HP
        const hpPct = Math.max(0, (player.hp / player.maxHp) * 100);
        hpBar.style.width = `${hpPct}%`;
        hpText.innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;

        // MP
        const mpPct = Math.max(0, (player.mp / player.maxMp) * 100);
        mpBar.style.width = `${mpPct}%`;
        mpText.innerText = `${Math.ceil(player.mp)} / ${player.maxMp}`;

        // EXP
        const expPct = Math.min(100, (player.xp / player.xpToNextLevel) * 100);
        expBar.style.width = `${expPct}%`;
        expText.innerText = `${Math.floor(expPct)}%`;

        hudLevel.innerText = `LV ${player.level}`;

        // Cooldown Overlays
        updateCooldownOverlay(cdAttack, player.skills.attack);
        updateCooldownOverlay(cdDash, player.skills.dash);
        updateCooldownOverlay(cdSpell, player.skills.spell);
        updateCooldownOverlay(cdHeal, player.skills.heal);
    }

    function updateCooldownOverlay(element, skill) {
        if (skill.currentCd > 0) {
            const pct = (skill.currentCd / skill.cooldown) * 100;
            element.style.height = `${pct}%`;
        } else {
            element.style.height = '0%';
        }
    }

    function updateStageInfo(stage, wave, maxWaves, coins, score) {
        stageTitle.innerText = `第 ${stage} 关: 深渊地窟`;
        waveText.innerText = `波次: ${wave} / ${maxWaves}`;
        coinCount.innerText = coins;
        scoreCount.innerText = score;
    }

    function showFloatingText(x, y, text, color = '#ff2d55', size = '20px') {
        const el = document.createElement('div');
        el.className = 'floating-text';
        el.innerText = text;
        el.style.color = color;
        el.style.fontSize = size;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        floatingContainer.appendChild(el);

        setTimeout(() => {
            if (floatingContainer.contains(el)) {
                floatingContainer.removeChild(el);
            }
        }, 800);
    }

    function renderMinimap(player, enemies, mapSize = 32) {
        if (!minimapCtx) return;

        const w = minimapCanvas.width;
        const h = minimapCanvas.height;
        minimapCtx.clearRect(0, 0, w, h);

        // Map background grid
        minimapCtx.fillStyle = 'rgba(15, 20, 32, 0.9)';
        minimapCtx.fillRect(0, 0, w, h);

        const center = w / 2;
        const scale = w / (mapSize * 2.5);

        // Draw Player (Green dot with directional arrow)
        if (player) {
            const px = center + player.mesh.position.x * scale;
            const pz = center + player.mesh.position.z * scale;

            minimapCtx.fillStyle = '#00f0ff';
            minimapCtx.beginPath();
            minimapCtx.arc(px, pz, 4, 0, Math.PI * 2);
            minimapCtx.fill();
        }

        // Draw Enemies (Red dots)
        if (enemies) {
            minimapCtx.fillStyle = '#ff2d55';
            enemies.forEach(e => {
                if (e.isAlive) {
                    const ex = center + e.mesh.position.x * scale;
                    const ez = center + e.mesh.position.z * scale;
                    minimapCtx.beginPath();
                    minimapCtx.arc(ex, ez, (e.type === 'boss') ? 5 : 3, 0, Math.PI * 2);
                    minimapCtx.fill();
                }
            });
        }
    }

    return {
        updatePlayerStats,
        updateStageInfo,
        showFloatingText,
        renderMinimap
    };
})();

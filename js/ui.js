/**
 * UI.js - DNF Style Arcade HUD Controller, Combo Counters, and Floating Combat Text
 */

const UI = (() => {
    function updatePlayerStats(player) {
        if (!player) return;

        // HP Bar
        const hpPercent = Math.max(0, (player.hp / player.maxHp) * 100);
        document.getElementById('hp-bar').style.width = `${hpPercent}%`;
        document.getElementById('hp-text').innerText = `${Math.round(player.hp)} / ${player.maxHp}`;

        // MP Bar
        const mpPercent = Math.max(0, (player.mp / player.maxMp) * 100);
        document.getElementById('mp-bar').style.width = `${mpPercent}%`;
        document.getElementById('mp-text').innerText = `${Math.round(player.mp)} / ${player.maxMp}`;

        // EXP Bar
        const expPercent = Math.min(100, (player.xp / player.xpToNextLevel) * 100);
        document.getElementById('exp-bar').style.width = `${expPercent}%`;
        document.getElementById('exp-text').innerText = `${Math.round(expPercent)}%`;

        // Level
        document.getElementById('hud-level').innerText = `LV ${player.level}`;

        // Cooldown overlays
        updateCooldownOverlay('cd-attack', player.skills.attack);
        updateCooldownOverlay('cd-upper', player.skills.upper);
        updateCooldownOverlay('cd-ghost', player.skills.ghost);
        updateCooldownOverlay('cd-triple', player.skills.triple);
        updateCooldownOverlay('cd-wave', player.skills.wave);
        updateCooldownOverlay('cd-backstep', player.skills.backstep);
    }

    function updateCooldownOverlay(overlayId, skill) {
        const overlay = document.getElementById(overlayId);
        if (!overlay || !skill) return;

        if (skill.currentCd > 0) {
            const cdPercent = (skill.currentCd / skill.cooldown) * 100;
            overlay.style.height = `${cdPercent}%`;
        } else {
            overlay.style.height = '0%';
        }
    }

    function updateStageInfo(stage, currentRoom, maxRooms, coins, score) {
        document.getElementById('stage-title').innerText = `格兰之森 - 格朗密斯 (第${stage}关)`;
        document.getElementById('room-text').innerText = `房间: ${currentRoom} / ${maxRooms}`;
        document.getElementById('coin-count').innerText = coins;
        document.getElementById('score-count').innerText = score;
    }

    function updateBossHPBar(bossEnemy) {
        const container = document.getElementById('boss-hp-container');
        if (!container) return;

        if (bossEnemy && bossEnemy.isAlive) {
            container.classList.remove('hidden');
            document.getElementById('boss-name').innerText = bossEnemy.name;

            const totalBars = bossEnemy.hpBars || 5;
            const hpRatio = bossEnemy.hp / bossEnemy.maxHp;
            const remainingBars = Math.ceil(hpRatio * totalBars);

            document.getElementById('boss-hp-bars').innerText = `x${remainingBars}`;

            // Single bar fill fraction relative to current active layer
            const barFraction = (hpRatio * totalBars) - Math.floor(hpRatio * totalBars);
            const fillWidth = (hpRatio <= 0) ? 0 : ((barFraction === 0) ? 100 : barFraction * 100);

            document.getElementById('boss-hp-bar').style.width = `${fillWidth}%`;
        } else {
            container.classList.add('hidden');
        }
    }

    function updateComboCounter(count) {
        const container = document.getElementById('combo-container');
        if (!container) return;

        if (count > 1) {
            container.classList.remove('hidden');
            document.getElementById('combo-count').innerText = count;

            let rank = 'EXCELLENT!';
            if (count > 30) rank = 'UNSTOPPABLE!!';
            else if (count > 15) rank = 'GREAT COMBOS!!';
            else if (count > 8) rank = 'GOOD!';

            document.getElementById('combo-rank').innerText = rank;
        } else {
            container.classList.add('hidden');
        }
    }

    function showRoomClearBanner() {
        const banner = document.getElementById('room-clear-banner');
        if (banner) banner.classList.remove('hidden');
    }

    function hideRoomClearBanner() {
        const banner = document.getElementById('room-clear-banner');
        if (banner) banner.classList.add('hidden');
    }

    function showFloatingText(x, y, text, color = '#ffffff') {
        const container = document.getElementById('floating-text-container');
        if (!container) return;

        const el = document.createElement('div');
        el.className = 'floating-text';
        el.innerText = text;
        el.style.color = color;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        container.appendChild(el);

        setTimeout(() => {
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        }, 750);
    }

    return {
        updatePlayerStats,
        updateStageInfo,
        updateBossHPBar,
        updateComboCounter,
        showRoomClearBanner,
        hideRoomClearBanner,
        showFloatingText
    };
})();

/**
 * Controls.js - Keyboard, Mouse, and Touch Input Handler for 2.5D ARPG Movement and Combat
 */

const Controls = (() => {
    const keys = {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false,
        Space: false,
        j: false, k: false, l: false, h: false,
        Key1: false, Key2: false
    };

    let mouseWorldPos = null;
    let onAttackTriggered = null;
    let onDashTriggered = null;
    let onSpellTriggered = null;
    let onHealTriggered = null;
    let onPauseTriggered = null;

    function init(callbacks = {}) {
        onAttackTriggered = callbacks.onAttack;
        onDashTriggered = callbacks.onDash;
        onSpellTriggered = callbacks.onSpell;
        onHealTriggered = callbacks.onHeal;
        onPauseTriggered = callbacks.onPause;

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
    }

    function onKeyDown(e) {
        const key = e.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') keys.w = true;
        if (key === 'a' || key === 'arrowleft') keys.a = true;
        if (key === 's' || key === 'arrowdown') keys.s = true;
        if (key === 'd' || key === 'arrowright') keys.d = true;

        if (key === 'j' && onAttackTriggered) onAttackTriggered();
        if ((key === 'k' || e.code === 'Space') && onDashTriggered) onDashTriggered();
        if ((key === 'l' || key === '1') && onSpellTriggered) onSpellTriggered();
        if ((key === 'h' || key === '2') && onHealTriggered) onHealTriggered();
        if ((key === 'p' || key === 'escape') && onPauseTriggered) onPauseTriggered();
    }

    function onKeyUp(e) {
        const key = e.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') keys.w = false;
        if (key === 'a' || key === 'arrowleft') keys.a = false;
        if (key === 's' || key === 'arrowdown') keys.s = false;
        if (key === 'd' || key === 'arrowright') keys.d = false;
    }

    function onMouseMove(e) {
        mouseWorldPos = Engine.screenToWorldIso(e.clientX, e.clientY);
    }

    function onMouseDown(e) {
        if (e.button === 0 && onAttackTriggered) {
            onAttackTriggered();
        }
    }

    function getMovementVector() {
        let vx = 0;
        let vz = 0;

        if (keys.w || keys.ArrowUp) vz -= 1;
        if (keys.s || keys.ArrowDown) vz += 1;
        if (keys.a || keys.ArrowLeft) vx -= 1;
        if (keys.d || keys.ArrowRight) vx += 1;

        // Normalize diagonal vector
        if (vx !== 0 && vz !== 0) {
            vx *= 0.7071;
            vz *= 0.7071;
        }

        return { x: vx, z: vz };
    }

    function getMouseWorldPos() {
        return mouseWorldPos;
    }

    return {
        init,
        getMovementVector,
        getMouseWorldPos
    };
})();

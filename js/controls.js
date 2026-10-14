/**
 * Controls.js - DNF Style Arcade Keybindings & Virtual Joystick Handler
 */

const Controls = (() => {
    const keys = {
        w: false, a: false, s: false, d: false,
        ArrowUp: false, ArrowLeft: false, ArrowDown: false, ArrowRight: false
    };

    let onAttackTriggered = null;
    let onUpperTriggered = null;
    let onGhostTriggered = null;
    let onTripleTriggered = null;
    let onWaveTriggered = null;
    let onBackstepTriggered = null;
    let onPauseTriggered = null;

    // Virtual Joystick State
    const joystickVector = { x: 0, z: 0 };
    let joystickActive = false;
    let joystickTouchId = null;

    function init(callbacks = {}) {
        onAttackTriggered = callbacks.onAttack;
        onUpperTriggered = callbacks.onUpper;
        onGhostTriggered = callbacks.onGhost;
        onTripleTriggered = callbacks.onTriple;
        onWaveTriggered = callbacks.onWave;
        onBackstepTriggered = callbacks.onBackstep;
        onPauseTriggered = callbacks.onPause;

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('mousedown', onMouseDown);

        setupVirtualJoystick();
    }

    function setupVirtualJoystick() {
        const zone = document.getElementById('joystick-zone');
        const stick = document.getElementById('joystick-stick');
        if (!zone || !stick) return;

        const maxRadius = 45;

        function processJoystick(clientX, clientY, rect) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            let deltaX = clientX - centerX;
            let deltaY = clientY - centerY;
            const dist = Math.hypot(deltaX, deltaY);

            if (dist > maxRadius) {
                deltaX = (deltaX / dist) * maxRadius;
                deltaY = (deltaY / dist) * maxRadius;
            }

            stick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            joystickVector.x = deltaX / maxRadius;
            joystickVector.z = deltaY / maxRadius;
        }

        function resetJoystick() {
            joystickActive = false;
            joystickTouchId = null;
            joystickVector.x = 0;
            joystickVector.z = 0;
            stick.style.transform = 'translate(0px, 0px)';
        }

        zone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (joystickActive) return;

            const touch = e.changedTouches[0];
            joystickActive = true;
            joystickTouchId = touch.identifier;
            const rect = zone.getBoundingClientRect();
            processJoystick(touch.clientX, touch.clientY, rect);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (!joystickActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === joystickTouchId) {
                    const rect = zone.getBoundingClientRect();
                    processJoystick(touch.clientX, touch.clientY, rect);
                    break;
                }
            }
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (!joystickActive) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joystickTouchId) {
                    resetJoystick();
                    break;
                }
            }
        });

        window.addEventListener('touchcancel', () => resetJoystick());

        let isMouseDownOnJoystick = false;

        zone.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isMouseDownOnJoystick = true;
            joystickActive = true;
            const rect = zone.getBoundingClientRect();
            processJoystick(e.clientX, e.clientY, rect);
        });

        window.addEventListener('mousemove', (e) => {
            if (isMouseDownOnJoystick && joystickActive) {
                const rect = zone.getBoundingClientRect();
                processJoystick(e.clientX, e.clientY, rect);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isMouseDownOnJoystick) {
                isMouseDownOnJoystick = false;
                resetJoystick();
            }
        });
    }

    function onKeyDown(e) {
        const key = e.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') keys.w = true;
        if (key === 'a' || key === 'arrowleft') keys.a = true;
        if (key === 's' || key === 'arrowdown') keys.s = true;
        if (key === 'd' || key === 'arrowright') keys.d = true;

        // DNF Classic Action Keybindings
        if ((key === 'x' || key === 'j') && onAttackTriggered) onAttackTriggered();
        if ((key === 'z' || key === 'u') && onUpperTriggered) onUpperTriggered();
        if ((key === 'q' || key === '1') && onGhostTriggered) onGhostTriggered();
        if ((key === 'e' || key === '2') && onTripleTriggered) onTripleTriggered();
        if ((key === 'r' || key === '3') && onWaveTriggered) onWaveTriggered();
        if ((key === 'c' || e.code === 'Space') && onBackstepTriggered) onBackstepTriggered();
        if ((key === 'p' || key === 'escape') && onPauseTriggered) onPauseTriggered();
    }

    function onKeyUp(e) {
        const key = e.key.toLowerCase();

        if (key === 'w' || key === 'arrowup') keys.w = false;
        if (key === 'a' || key === 'arrowleft') keys.a = false;
        if (key === 's' || key === 'arrowdown') keys.s = false;
        if (key === 'd' || key === 'arrowright') keys.d = false;
    }

    function onMouseDown(e) {
        if (e.button === 0 && e.target.tagName === 'CANVAS' && onAttackTriggered) {
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

        if (joystickActive) {
            vx += joystickVector.x;
            vz += joystickVector.z;
        }

        const mag = Math.hypot(vx, vz);
        if (mag > 1) {
            vx /= mag;
            vz /= mag;
        }

        return { x: vx, z: vz };
    }

    return {
        init,
        getMovementVector
    };
})();

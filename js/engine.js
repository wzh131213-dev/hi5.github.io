/**
 * Engine.js - Enhanced High-Detail 2.5D Renderer with Dynamic Lighting & Atmospheric Effects
 */

const Engine = (() => {
    let scene, camera, renderer;
    let ambientLight, dirLight, rimLight, skillPointLight;
    let aspect = window.innerWidth / window.innerHeight;
    const d = 11; // Camera height scale for intimate action framing

    function init() {
        const container = document.getElementById('game-container');

        // 1. Scene setup with dark gothic haze fog
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x070a14);
        scene.fog = new THREE.FogExp2(0x070a14, 0.015);

        // 2. Orthographic Camera for crisp 2.5D Belt-Scroll View
        camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
        camera.position.set(0, 13, 20);
        camera.lookAt(0, 0, 0);

        // 3. WebGL Renderer with High-DPI, Tone Mapping & Soft Shadows
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.45;

        container.appendChild(renderer.domElement);

        // 4. Advanced Multi-Light Setup
        // Fill Ambient
        ambientLight = new THREE.AmbientLight(0x323e66, 0.9);
        scene.add(ambientLight);

        // Sun / Key Directional Light
        dirLight = new THREE.DirectionalLight(0xfffaee, 1.5);
        dirLight.position.set(18, 32, 22);
        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 140;
        const shadowSize = 28;
        dirLight.shadow.camera.left = -shadowSize;
        dirLight.shadow.camera.right = shadowSize;
        dirLight.shadow.camera.top = shadowSize;
        dirLight.shadow.camera.bottom = -shadowSize;
        dirLight.shadow.bias = -0.0003;

        scene.add(dirLight);

        // Rim / Backlight (Gold/Cyan specular contour rim)
        rimLight = new THREE.DirectionalLight(0x00d8ff, 0.8);
        rimLight.position.set(-20, 15, -20);
        scene.add(rimLight);

        // Dynamic Skill Cast Point Light
        skillPointLight = new THREE.PointLight(0xff3300, 0, 25);
        skillPointLight.position.set(0, 3, 0);
        scene.add(skillPointLight);

        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        aspect = window.innerWidth / window.innerHeight;
        camera.left = -d * aspect;
        camera.right = d * aspect;
        camera.top = d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function updateCameraTarget(targetPos, lerpFactor = 0.09) {
        if (!targetPos) return;

        // Clamp camera X bounds within map arena limits [-8.5, 8.5]
        const clampedX = Math.max(-8.5, Math.min(8.5, targetPos.x));
        const targetCamX = clampedX;
        const targetCamY = targetPos.y + 13;
        const targetCamZ = targetPos.z + 20;

        camera.position.x += (targetCamX - camera.position.x) * lerpFactor;
        camera.position.y += (targetCamY - camera.position.y) * lerpFactor;
        camera.position.z += (targetCamZ - camera.position.z) * lerpFactor;

        camera.lookAt(camera.position.x, targetPos.y, targetCamZ - 20);

        dirLight.position.set(clampedX + 18, targetPos.y + 32, targetPos.z + 22);
        dirLight.target.position.set(clampedX, targetPos.y, targetPos.z);
        dirLight.target.updateMatrixWorld();
    }

    function triggerSkillLight(colorHex, intensity = 2.5, duration = 300) {
        if (!skillPointLight) return;
        skillPointLight.color.setHex(colorHex);
        skillPointLight.intensity = intensity;

        let cur = intensity;
        const fade = setInterval(() => {
            cur -= intensity / 10;
            if (cur <= 0) {
                cur = 0;
                clearInterval(fade);
            }
            skillPointLight.intensity = cur;
        }, duration / 10);
    }

    function render() {
        renderer.render(scene, camera);
    }

    return {
        init,
        render,
        updateCameraTarget,
        triggerSkillLight,
        get scene() { return scene; },
        get camera() { return camera; },
        get renderer() { return renderer; }
    };
})();

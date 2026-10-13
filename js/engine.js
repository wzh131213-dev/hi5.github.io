/**
 * Engine.js - 2.5D Isometric Rendering Engine using Three.js
 */

const Engine = (() => {
    let scene, camera, renderer;
    let ambientLight, dirLight, pointLight;
    const aspect = window.innerWidth / window.innerHeight;
    const d = 18; // Camera orthographic viewport size

    function init() {
        const container = document.getElementById('game-container');

        // 1. Create Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0c0f1d);
        scene.fog = new THREE.FogExp2(0x0c0f1d, 0.018);

        // 2. Create Orthographic Camera for true 2.5D Isometric View
        camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

        // Classic Isometric Camera Position & Rotation Angle (35.264° pitch down, 45° yaw rotation)
        camera.position.set(30, 35, 30);
        camera.lookAt(0, 0, 0);

        // 3. Renderer Setup
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        container.appendChild(renderer.domElement);

        // 4. Lighting Configuration
        // Ambient soft fill light
        ambientLight = new THREE.AmbientLight(0x4a5d8e, 0.7);
        scene.add(ambientLight);

        // Sun / Main Directional Shadow Casting Light
        dirLight = new THREE.DirectionalLight(0xfffaed, 1.2);
        dirLight.position.set(25, 40, 20);
        dirLight.castShadow = true;

        // Shadow quality settings
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 150;
        const shadowSize = 35;
        dirLight.shadow.camera.left = -shadowSize;
        dirLight.shadow.camera.right = shadowSize;
        dirLight.shadow.camera.top = shadowSize;
        dirLight.shadow.camera.bottom = -shadowSize;
        dirLight.shadow.bias = -0.0005;

        scene.add(dirLight);

        // Point light for dramatic warm center glow
        pointLight = new THREE.PointLight(0xff7700, 0.8, 40);
        pointLight.position.set(0, 5, 0);
        scene.add(pointLight);

        // Window resize event handler
        window.addEventListener('resize', onWindowResize, false);
    }

    function onWindowResize() {
        const aspect = window.innerWidth / window.innerHeight;
        camera.left = -d * aspect;
        camera.right = d * aspect;
        camera.top = d;
        camera.bottom = -d;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function updateCameraTarget(targetPos, lerpFactor = 0.08) {
        if (!targetPos) return;
        // Maintain fixed isometric offset: (30, 35, 30) relative to player
        const targetCamX = targetPos.x + 30;
        const targetCamY = targetPos.y + 35;
        const targetCamZ = targetPos.z + 30;

        camera.position.x += (targetCamX - camera.position.x) * lerpFactor;
        camera.position.y += (targetCamY - camera.position.y) * lerpFactor;
        camera.position.z += (targetCamZ - camera.position.z) * lerpFactor;

        const targetLookX = camera.position.x - 30;
        const targetLookY = camera.position.y - 35;
        const targetLookZ = camera.position.z - 30;

        camera.lookAt(targetLookX, targetLookY, targetLookZ);

        // Keep directional light aligned with player position for optimal shadows
        dirLight.position.set(targetPos.x + 25, targetPos.y + 40, targetPos.z + 20);
        dirLight.target.position.set(targetPos.x, targetPos.y, targetPos.z);
        dirLight.target.updateMatrixWorld();
    }

    function render() {
        renderer.render(scene, camera);
    }

    function screenToWorldIso(screenX, screenY, planeY = 0) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(
            (screenX / window.innerWidth) * 2 - 1,
            -(screenY / window.innerHeight) * 2 + 1
        );
        raycaster.setFromCamera(mouse, camera);
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
        const target = new THREE.Vector3();
        raycaster.ray.intersectPlane(plane, target);
        return target;
    }

    return {
        init,
        render,
        updateCameraTarget,
        screenToWorldIso,
        get scene() { return scene; },
        get camera() { return camera; },
        get renderer() { return renderer; }
    };
})();

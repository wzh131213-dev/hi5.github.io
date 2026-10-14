/**
 * Engine.js - 2.5D Belt-Scroll Action Engine using Three.js (DNF Arcade View)
 */

const Engine = (() => {
    let scene, camera, renderer;
    let ambientLight, dirLight, pointLight;
    let aspect = window.innerWidth / window.innerHeight;
    const d = 12; // Camera viewport height scale

    function init() {
        const container = document.getElementById('game-container');

        // 1. Create Scene
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0c16);
        scene.fog = new THREE.FogExp2(0x0a0c16, 0.012);

        // 2. Create Orthographic Camera for 2.5D Belt-Scroll View (横版卷轴视角)
        camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);

        // 2.5D Belt-scroll side-angled camera position relative to origin (X=0, Y=14, Z=22)
        camera.position.set(0, 14, 22);
        camera.lookAt(0, 0, 0);

        // 3. Renderer Setup
        renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.35;

        container.appendChild(renderer.domElement);

        // 4. Lighting Configuration
        // Dark fantasy ambient light
        ambientLight = new THREE.AmbientLight(0x404e7a, 0.85);
        scene.add(ambientLight);

        // Main Stage Light
        dirLight = new THREE.DirectionalLight(0xffeedd, 1.3);
        dirLight.position.set(15, 30, 20);
        dirLight.castShadow = true;

        // Shadow quality settings
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 120;
        const shadowSize = 30;
        dirLight.shadow.camera.left = -shadowSize;
        dirLight.shadow.camera.right = shadowSize;
        dirLight.shadow.camera.top = shadowSize;
        dirLight.shadow.camera.bottom = -shadowSize;
        dirLight.shadow.bias = -0.0005;

        scene.add(dirLight);

        // Center Point Light for spell/impact glow
        pointLight = new THREE.PointLight(0xff5500, 1.0, 30);
        pointLight.position.set(0, 4, 0);
        scene.add(pointLight);

        // Window resize event handler
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

    function updateCameraTarget(targetPos, lerpFactor = 0.08) {
        if (!targetPos) return;
        // Maintain 2.5D belt-scroll offset: (0, 14, 22) relative to target
        const targetCamX = targetPos.x;
        const targetCamY = targetPos.y + 14;
        const targetCamZ = targetPos.z + 22;

        camera.position.x += (targetCamX - camera.position.x) * lerpFactor;
        camera.position.y += (targetCamY - camera.position.y) * lerpFactor;
        camera.position.z += (targetCamZ - camera.position.z) * lerpFactor;

        camera.lookAt(camera.position.x, targetPos.y, targetCamZ - 22);

        // Keep light aligned with player for optimal shadows
        dirLight.position.set(targetPos.x + 15, targetPos.y + 30, targetPos.z + 20);
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

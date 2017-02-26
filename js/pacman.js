/*======================================
=            Main functions            =
======================================*/

function init() {

    debugMode = window.location.search.indexOf("debug") > -1;

    if(!debugMode){
        $(".stats").css("display", "none");
    }

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    scene = new THREE.Scene();

    set_text("FIRST PERSON PACMAN", "Controls: WASD To Move, Mouse to look around");

    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    pos = controls.getObject().position;
    pos.x = 75;
    pos.y = 10;
    pos.z = -5;

    raycaster = new THREE.Raycaster(pos, controls.getObject().getWorldDirection(), 0, len);

    controls.cell = controls.prevCoords = get_cell(pos);

    setup_map();
    setup_ghosts();

    //initialize Three.js canvas
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor("#000000");
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    //add all event listeners
    document.addEventListener('keydown', on_key_down, false);
    document.addEventListener('keyup', on_key_up, false);
    document.addEventListener('click', on_click, false);
    document.addEventListener('pointerlockchange', pointerlockchange, false);
    document.addEventListener('mozpointerlockchange', pointerlockchange, false);
    document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
    document.addEventListener('pointerlockerror', pointerlockerror, false);
    document.addEventListener('mozpointerlockerror', pointerlockerror, false);
    window.addEventListener('resize', onWindowResize, false);
}

function animate() {
    animationFrameId = requestAnimationFrame(animate);
    stats.begin();
    stats2.begin();

    if (controls.enabled) {
        draw_2d(controls.cell, controls.prevCoords, "#FFEE00");

        controls.worldDir = controls.getObject().getWorldDirection();
        controls.worldDir.x = Math.round(controls.worldDir.x);
        controls.worldDir.z = Math.round(controls.worldDir.z);

        dotIntersects = [];
        ghostIntersects = [];

        time = performance.now();
        delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;


        draw = test_keys("1") && debugMode;
        toggleFloor = test_keys("2") && debugMode;

        if (test_keys("W")) {
            velocity.z -= accel * delta;
        }
        if (test_keys("S")) {
            velocity.z += accel * delta;
        }
        if (test_keys("A")) {
            velocity.x -= accel * delta;
        }
        if (test_keys("D")) {
            velocity.x += accel * delta;
        }
        if (test_keys("3") && debugMode) {
            pos.y = 10;
        }
        if (test_keys("SHIFT") && debugMode) velocity.y += accel * delta;

        if (test_keys("SPACE") && debugMode) velocity.y -= accel * delta;

        if (test_keys("SPACE") && pos.y <= 10 && !toggleFloor && debugMode) {
            velocity.y = 0;
        }


        vectors = getComponents(velocity);

        //check collisions with walls, dots, and ghosts
        for (var i = 0; i < 8; i++) {
            wallIntersects[i] = testRay(controls.rays[i], wall);
            dotIntersects = dotIntersects.concat(testRay(controls.rays[i], dots));
            ghostIntersects = ghostIntersects.concat(testRay(controls.rays[i], ghosts));
        }

        //move player
        if ((wallIntersects[1].length == 0 && vectors.x > 0) || (wallIntersects[3].length == 0 && vectors.x < 0)) {
            pos.x += vectors.x * delta;
        }
        if ((wallIntersects[0].length == 0 && vectors.z > 1) || (wallIntersects[2].length == 0 && vectors.z < -1)) {
            pos.z += vectors.z * delta;
        }

        if (pos.z < -145) {
            pos.z = 130;
        }

        if (pos.z > 135) {
            pos.z = -140;
        }

        controls.getObject().translateY(velocity.y * delta);

        controls.prevCoords = controls.cell;
        controls.cell = get_cell(pos);

        //eat dots
        if (dotIntersects.length > 0) {
            //delete dot from the scene
            scene.remove(dotIntersects[0].object);
            dots = dots.filter(function(e) {
                return e !== dotIntersects[0].object
            });


            dots.lastDotEaten = dotIntersects[0].object.dotType;
            //delete dot from the map
            var coords = get_cell(dotIntersects[0].object.position);
            map[coords[0]][coords[1]] = " ";

            delete dotIntersects[0].object;
        }

        //if player has collided with a ghost
        if (ghostIntersects.length > 0) {

            var ghostObj = ghostIntersects[0].object;
            if (ghostObj.mode == "frightened") {
                ghostObj.mode = "eaten";
                ghostObj.geometry = dead_ghost_geometry;
                ghostObj.activeColor = "#d3d3d3";
                ghostObj.velocity = 40;
            } else if (ghostObj.mode != "eaten") {
                document.exitPointerLock();
                cancelAnimationFrame(animationFrameId);
                gameHasEnded = true;
                set_text("GAME OVER", "You've lost! If you're interested in contributing, visit <a>https://github.com/Broshen/webGLgames</a>");
            }
        }

        if (dots.length == 0) {
            //game is over, player wins
            document.exitPointerLock();
            cancelAnimationFrame(animationFrameId);
            gameHasEnded = true;
            set_text("GAME OVER", "You've won! If you're interested in contributing, visit <a>https://github.com/Broshen/webGLgames</a>");
        }



        ghosts[0].tick(dots, delta);
        ghosts[1].tick(dots, delta);
        ghosts[2].tick(dots, delta);
        ghosts[3].tick(dots, delta);

        prevTime = time;
    }

    renderer.render(scene, camera);

    stats.end();
    stats2.end();
}



init();
animate();

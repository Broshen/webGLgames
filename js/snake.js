/*================================================
=            Event Listener Functions            =
================================================*/

var on_key_down = on_key_up = function(e) {
    e = e || event; // to deal with IE
    key_map[e.keyCode] = e.type == 'keydown';
}

var pointerlockchange = function() {
    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        controls.enabled = true;
        $(".overlay").hide();
        //unpause the game
        prevTime = performance.now();
    } else {
        controls.enabled = false;
        $(".overlay").show();
    }
};

var pointerlockerror = function(event) {
    alert("pointerlockerror", event);
};

var on_click = function(event) {
    if (event.target != $(".btn")[0] && event.target != $(".description")[0] && !gameHasEnded) {
        // Ask the browser to lock the pointer
        element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
        element.requestPointerLock();
    }
}

var onWindowResize = function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/*=========================================
=            Keyboard functions           =
=========================================*/

var test_key = function(selkey) {
    return key_map[selkey] || key_map[alias[selkey]];
}

var test_keys = function() {
    var keylist = arguments;

    for (var i = 0; i < keylist.length; i++)
        if (!test_key(keylist[i]))
            return false;

    return true;
}

/*========================================================
=            Object collision helper functions           =
========================================================*/
//tests a vector against a group of three.js objects for collisions
//d     :       vector3D object (ray)
//group :       array of object3Ds
var testRay = function(d, group) {

    raycaster.set(pos, d);

    if (draw) {
        arrow[2] = new THREE.ArrowHelper(d, pos, len, "#FFF000");
        arrow[2].name = "ArrowHelper";
        scene.add(arrow[2]);
    }

    return raycaster.intersectObjects(group);
}

//deletes any arrows drawn in the scene
var deleteAllArrows = function() {
    var toBeDeleted = [];
    scene.children.map(function(c) {
        if (c.name == "ArrowHelper") {
            toBeDeleted.push(c);
        }
    });

    toBeDeleted.map(function(c) {
        scene.remove(c);
        delete c;
    })
    console.log("geometries=" + this.renderer.info.memory.geometries + " programs=" + this.renderer.info.memory.programs + " textures=" + this.renderer.info.memory.textures);
}

/*============================
=            Misc            =
============================*/

//sets the title and description of the pause screen
var set_text = function(title, desc) {
    $(".title").html(title);
    $(".description").html(desc);
}

//adds to the total length of the snake
//snake     :       array of Objects
var addToSnake = function(snake) { 
    var newSnake = new THREE.Mesh(dot_geometry, dot_material.clone());
    var i = snake.length - 1;
    newSnake.position.copy(snake[i].lastPosition);
    newSnake.lastPosition = new THREE.Vector3(0, 0, 0)
    newSnake.name = "snake" + i;
    snake.push(newSnake);
    scene.add(newSnake)
}


/*======================================
=            Main functions            =
======================================*/

function init() {

    debugMode = window.location.search.indexOf("debug") > -1;

    if (!debugMode) {
        $(".stats").css("display", "none");
        set_text("FIRST PERSON SNAKE", "Controls: Use the mouse to steer. <br>To enable debug mode, append ?debug to the URL.");
    } else {

        set_text("FIRST PERSON SNAKE", "Controls: Use the mouse to steer. <br>Shift to move up. Space to move down.<br> Hold 1 to draw intersection vectors.<br> Hold 2 to pass through floors. <br>Press 3 to land on floor.<br> Press 4 to delete all drawn vectors.");
    }

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

    camera2 = new THREE.PerspectiveCamera(75, 1, 1, 1000);
    camera2.layers.enable(1)

    camera2.position.y = 200;
    camera2.rotation.x = -Math.PI / 2;

    scene = new THREE.Scene();

    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    pos = controls.getObject().position;
    pos.y = 10;

    var snakeHead = new THREE.Mesh(dot_geometry, dot_material);
    snakeHead.position.y = 10;
    snakeHead.layers.set(1);
    snake.push(snakeHead);

    snake[0].lastPosition = new THREE.Vector3(0, 0, 0);

    scene.add(snakeHead);


    dots[0] = new THREE.Mesh(dot_geometry, dot_material);
    dots[0].position.y = 10;
    dots[0].position.x = Math.random() * floorW - floorW / 2;
    dots[0].position.z = Math.random() * floorH - floorW / 2;
    scene.add(dots[0])

    raycaster = new THREE.Raycaster(pos, controls.getObject().getWorldDirection(), 0, len);


    // floor
    var floor_geometry = new THREE.PlaneGeometry(floorW, floorH);
    floor_geometry.rotateX(-Math.PI / 2);

    var floor_material = new THREE.MeshBasicMaterial({ color: "#000000" });
    floor = new THREE.Mesh(floor_geometry, floor_material);
    floor.position.y = 5;
    scene.add(floor);

    var wall_geometry = new THREE.BoxGeometry(315, 50, 5);
    var wall_material = new THREE.MeshBasicMaterial({color: "#333333"});


    wall[0] = new THREE.Mesh(wall_geometry, wall_material);
    wall[1] = new THREE.Mesh(wall_geometry, wall_material);
    wall[2] = new THREE.Mesh(wall_geometry, wall_material);
    wall[3] = new THREE.Mesh(wall_geometry, wall_material);


    wall[0].position.copy(new THREE.Vector3(0, 10, 155));
    wall[1].position.copy(new THREE.Vector3(0, 10, -155));
    wall[2].position.copy(new THREE.Vector3(155, 10, 0));
    wall[3].position.copy(new THREE.Vector3(-155, 10, 0));

    wall[2].rotateY(Math.PI/2);
    wall[3].rotateY(Math.PI/2);


    scene.add(wall[0]);
    scene.add(wall[1]);
    scene.add(wall[2]);
    scene.add(wall[3]);

    //initialize Three.js canvas
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor("#d3d3d3");
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
        snake[0].position.copy(pos)

        if (snake[0].position.distanceToSquared(snake[0].lastPosition) >= 15 && !test_keys("W")) {

            for (var i = snake.length - 1; i >= 1; i--) {
                snake[i].lastPosition.copy(snake[i].position)
                snake[i].position.copy(snake[i - 1].lastPosition);
            }

            snake[0].lastPosition.copy(snake[0].position);
        }

        controls.worldDir = controls.getObject().getWorldDirection();
        controls.worldDir.x = Math.round(controls.worldDir.x);
        controls.worldDir.z = Math.round(controls.worldDir.z);

        dotIntersects = [];
        snakeIntersects = [];

        time = performance.now();
        delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;

        draw = test_keys("1") && debugMode;
        toggleFloor = test_keys("2") && debugMode;

        velocity.z -= accel * delta;

        if (test_keys("3") && debugMode) {
            pos.y = 10;
        }
        if (test_keys("4") && debugMode) {
            deleteAllArrows();
        }
        if (test_keys("SHIFT") && debugMode) velocity.y += accel * delta;

        if (test_keys("SPACE") && debugMode) velocity.y -= accel * delta;

        if (test_keys("SPACE") && pos.y <= 10 && !toggleFloor && debugMode) {
            velocity.y = 0;
        }

        //check collisions with walls, dots, and ghosts
        for (var i = 0; i < 8; i++) {
            wallIntersects[i] = testRay(controls.rays[i], wall);
            dotIntersects = dotIntersects.concat(testRay(controls.rays[i], dots));
            snakeIntersects = snakeIntersects.concat(testRay(controls.rays[i], snake))
        }


        if (!snakeIntersects.every(function(snake) {
                return snake.object.name <= "snake2" 
            }) 
            || pos.x > 150 || pos.x < -150 || pos.z > 150 || pos.z < -150) {
            //game over
            document.exitPointerLock();
            cancelAnimationFrame(animationFrameId);
            gameHasEnded = true;
            set_text("GAME OVER", "You've lost! <br> If you're interested in contributing, visit <a href='https://github.com/Broshen/webGLgames'>https://github.com/Broshen/webGLgames</a> <br> To restart the game, refresh the page.");
        }

        controls.getObject().translateZ(velocity.z * delta);
        controls.getObject().translateY(velocity.y * delta);


        if (dotIntersects.length > 0) {
            dots[0].position.x = Math.random() * (floorW - 1) - (floorW - 1)/ 2;
            dots[0].position.z = Math.random() * (floorH - 1) - (floorH - 1) / 2;
            
            addToSnake(snake)
            
            //speed of the snake is a function of how many dots eaten
            //function is https://www.wolframalpha.com/input/?i=graph+y+%3D+(x%2F(x%2B1))+*+800+from+1+to+50
            //asymptotically approaches 800
            accel = snake.length / (snake.length + 1) * 800;    

        }

        prevTime = time;
    }


    renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    renderer.setScissorTest(true);
    renderer.render(scene, camera);
    renderer.setViewport(window.innerWidth - camera2size, window.innerHeight - camera2size, camera2size, camera2size);
    renderer.setScissor(window.innerWidth - camera2size, window.innerHeight - camera2size, camera2size, camera2size);
    renderer.setScissorTest(true);
    renderer.render(scene, camera2);

    stats.end();
    stats2.end();
}



init();
animate();

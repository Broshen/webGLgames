on_key_down = on_key_up = function(e) {
    e = e || event; // to deal with IE
    key_map[e.keyCode] = e.type == 'keydown';
    /* insert conditional here */
}

test_key = function(selkey) {
    return key_map[selkey] || key_map[alias[selkey]];
}

test_keys = function() {
    var keylist = arguments;

    for (var i = 0; i < keylist.length; i++)
        if (!test_key(keylist[i]))
            return false;

    return true;
}


setup_map = function() {
    var canvas = document.getElementById("map-2d");
    var ctx = canvas.getContext("2d");

    map_2d.canvas = canvas;
    map_2d.ctx = ctx;

    canvas.height = map_2d.px * map[0].length;
    canvas.width = map_2d.px * map.length;


    // floor
    floor_geometry = new THREE.PlaneGeometry(map.length * 10, map[0].length * 10);
    floor_geometry.rotateX(-Math.PI / 2);

    floor_material = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    floor = new THREE.Mesh(floor_geometry, floor_material);
    floor.position.y = 5;
    floor.position.z = -5;
    floor.position.x = -5;
    scene.add(floor);



    wall_geometry = new THREE.BoxGeometry(10, 10, 10);
    wall_material = new THREE.MeshBasicMaterial({ color: "#1a237e", side: THREE.DoubleSide });

    dot_geometry = new THREE.SphereGeometry(1, 10, 10);
    dot_material = new THREE.MeshBasicMaterial({ color: "#fff000", side: THREE.DoubleSide });

    powerPellet_geometry = new THREE.SphereGeometry(3, 10, 10);
    powerPellet_material = new THREE.MeshBasicMaterial({ color: "#ffa500", side: THREE.DoubleSide });



    for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {

            var type = map[i][j];
            var x = (i - map.length / 2) * 10;
            var y = 10;
            var z = (j - map[i].length / 2) * 10;
            if (type == '0') {
                wallUnit = new THREE.Mesh(wall_geometry, wall_material);
                wall.push(wallUnit);

                scene.add(wallUnit);
                wallUnit.position.x = x;
                wallUnit.position.y = y;
                wallUnit.position.z = z;

                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);
            } else if (type == '*') {

                dotUnit = new THREE.Mesh(dot_geometry, dot_material);
                dotUnit.dotType = "normal";

                dots.push(dotUnit);
                scene.add(dotUnit);
                dotUnit.position.x = x;
                dotUnit.position.y = y;
                dotUnit.position.z = z;


                ctx.fillStyle = "#000000";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);

                draw_circle((i + 0.5) * map_2d.px, (j + 0.5) * map_2d.px, (map_2d.px-4)/2, "#fff000");
            } else if (type == 'X') {

                dotUnit = new THREE.Mesh(powerPellet_geometry, powerPellet_material);
                dotUnit.dotType = "powerPellet";

                dots.push(dotUnit);
                scene.add(dotUnit);

                dotUnit.position.x = x;
                dotUnit.position.y = y;
                dotUnit.position.z = z;



                ctx.fillStyle = "#000000";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);

                draw_circle((i + 0.5) * map_2d.px, (j + 0.5)* map_2d.px, (map_2d.px-2)/2, "#ffa500");
            } else {
                ctx.fillStyle = "#000000";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);
            }



        }
    }

    totalDots = dots.length;
}



document.addEventListener('keydown', on_key_down, false);
document.addEventListener('keyup', on_key_up, false);


THREE.PointerLockControls = function(camera) {

    var scope = this;

    camera.rotation.set(0, 0, 0);

    var pitchObject = new THREE.Object3D();
    pitchObject.add(camera);

    var yawObject = new THREE.Object3D();
    yawObject.position.y = 10;
    yawObject.add(pitchObject);

    var PI_2 = Math.PI / 2;

    this.rays = [
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(-1, 0, -1),
        new THREE.Vector3(-1, 0, 1),
    ];

    this.prevCoords = [0, 0];

    var onMouseMove = function(event) {

        if (scope.enabled === false) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
    };

    this.dispose = function() {

        document.removeEventListener('mousemove', onMouseMove, false);

    };

    document.addEventListener('mousemove', onMouseMove, false);

    this.enabled = false;

    this.getObject = function() {

        return yawObject;

    };

    this.getPitchObject = function() {

        return pitchObject;
    }

    this.getDirection = function() {

        // assumes the camera itself is not rotated

        var direction = new THREE.Vector3(0, 0, -1);
        var rotation = new THREE.Euler(0, 0, 0, "YXZ");

        return function(v) {

            rotation.set(pitchObject.rotation.x, yawObject.rotation.y, 0);

            v.copy(direction).applyEuler(rotation);

            return v;

        };

    }();



};


var pointerlockchange = function(event) {
    if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        controls.enabled = true;
    } else {
        controls.enabled = false;
    }

    prevTime = performance.now();
};

var pointerlockerror = function(event) {
    alert("pointerlockerror", event);
};


document.addEventListener('click', function(event) {
    // Ask the browser to lock the pointer
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    element.requestPointerLock();
}, false);


// Hook pointer lock state change events
document.addEventListener('pointerlockchange', pointerlockchange, false);
document.addEventListener('mozpointerlockchange', pointerlockchange, false);
document.addEventListener('webkitpointerlockchange', pointerlockchange, false);
document.addEventListener('pointerlockerror', pointerlockerror, false);
document.addEventListener('mozpointerlockerror', pointerlockerror, false);

init();
animate();

function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    scene = new THREE.Scene();

    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    pos = controls.getObject().position;
    pos.x = 75;
    pos.y = 10;
    pos.z = -5;

    setup_map();

    setup_ghosts();
    //
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor("#000000");
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    //
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


var wallIntersects = [],
    dotIntersects = [],
    ghostIntersects = [],
    arrow = [];
var len = 4;
var toggleFloor = false;
var animationFrameId;


var draw = false;

function testRay(d, group) {

    var raycaster = new THREE.Raycaster(pos, d, 0, len);

    if (draw) {
        arrow[2] = new THREE.ArrowHelper(d, pos, len, "#FFF000");
        arrow[2].name = "ArrowHelper";
        scene.add(arrow[2]);
    }

    return raycaster.intersectObjects(group);
}

function deleteAllArrows() {
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


function getComponents(d) {
    var v = new THREE.Vector3();
    var r = new THREE.Euler(0, 0, 0, "YXZ");

    r.set(controls.getPitchObject().rotation.x, controls.getObject().rotation.y, 0);
    var dd = v.copy(d).applyEuler(r);
    dd.y = 0;

    x = new THREE.Vector3(dd.x, 0, 0);
    z = new THREE.Vector3(0, 0, dd.z);

    if (draw) {
        arrow[0] = new THREE.ArrowHelper(dd, pos, len, "#FAC123");
        arrow[0].name = "ArrowHelper";
        scene.add(arrow[0])

        arrow[1] = new THREE.ArrowHelper(x, pos, Math.max(dd.x, 3), "#FF0000");
        arrow[1].name = "ArrowHelper";
        scene.add(arrow[1]);

        arrow[2] = new THREE.ArrowHelper(z, pos, Math.max(dd.z, 3), "#0000FF");
        arrow[2].name = "ArrowHelper";
        scene.add(arrow[2]);
    }
    return dd;
}

function animate() {
    animiationFrameId = requestAnimationFrame(animate);
    stats.begin();
    stats2.begin();

    if (controls.enabled) {
        draw_2d(pos, controls.prevCoords, "#FFEE00", false);

        dotIntersects = [];

        time = performance.now();
        delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;


        draw = test_keys("1");
        toggleFloor = test_keys("2");

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
        if (test_keys("3")) {
            pos.y = 10;
        }
        if (test_keys("SHIFT")) velocity.y += accel * delta;

        if (test_keys("SPACE")) velocity.y -= accel * delta;

        if (test_keys("SPACE") && pos.y <= 10 && !toggleFloor) {
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

        //eat dots
        if (dotIntersects.length > 0) {

            dots.lastDotEaten = dotIntersects[0].object.dotType;

            //delete dot from the scene
            scene.remove(dotIntersects[0].object);
            dots = dots.filter(function(e) {
                return e !== dotIntersects[0].object });
            //delete dot from the map
            var coords = get_cell(dotIntersects[0].object.position);
            map[coords[0]][coords[1]] = " ";

            delete dotIntersects[0].object;
        }

        //if player has collided with a ghost, game is over
        if(ghostIntersects.length > 0){
            document.exitPointerLock();
            cancelAnimationFrame(animiationFrameId);
        }

        ghost_tick(pos, dots, delta);
        prevTime = time;
    }

    renderer.render(scene, camera);

    stats.end();
    stats2.end();
}

var key_map = {};
var camera, scene, renderer;
var geometry, material, mesh;
var controls;
var accel = 400.0;
var wall = [];
var raycaster;
var element = document.body;

var prevTime = performance.now();
var time = performance.now();
var delta;
var pos;

var velocity = new THREE.Vector3();

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

var map_2d = {};
map_2d.px = 5;

setup_2d = function() {
    var canvas = document.getElementById("map-2d");
    var ctx = canvas.getContext("2d");

    canvas.height = map_2d.px * map[0].length;
    canvas.width = map_2d.px * map.length;
    for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {
            if (map[i][j] == '0') {
                ctx.fillStyle = "#FFFFFF";
            } else
                ctx.fillStyle = "#000000";

            ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);

            console.log(i * map_2d.px, j * map_2d.px)
        }
    }

    map_2d.canvas = canvas;
    map_2d.ctx = ctx;
}

prevCoords = [0, 0];

draw_2d = function(pos, color) {
    try {
        if (map[prevCoords[0]][prevCoords[1]] == "0")
            map_2d.ctx.fillStyle = "#ffffff";
        else
            map_2d.ctx.fillStyle = "#000000";
        map_2d.ctx.fillRect(prevCoords[0] * map_2d.px, prevCoords[1] * map_2d.px, map_2d.px, map_2d.px);

        var coords = get_cell(pos);
        map_2d.ctx.fillStyle = color;
        map_2d.ctx.fillRect(coords[0] * map_2d.px, coords[1] * map_2d.px, map_2d.px, map_2d.px);
        prevCoords = coords;
    } catch (err) {}

}

get_cell = function(pos) {

    var x = Math.round(pos.x / 10 + map.length / 2);
    var y = Math.round(pos.z / 10 + map[0].length / 2);

    return [x, y]
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
    ];

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
    setup_2d();
    scene = new THREE.Scene();

    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    pos = controls.getObject().position;
    pos.x = 140;
    pos.y = 10;
    pos.z = -5;


    // floor
    floor_geometry = new THREE.PlaneGeometry(2000, 2000);
    floor_geometry.rotateX(-Math.PI / 2);

    wall_geometry = new THREE.BoxGeometry(10, 10, 10);


    floor_material = new THREE.MeshBasicMaterial({ color: "#1a237e" });
    floor = new THREE.Mesh(floor_geometry, floor_material);
    scene.add(floor);

    for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {
            if (map[i][j] == '0') {
                wall_material = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
                wallUnit = new THREE.Mesh(wall_geometry, wall_material);

                wall.push(wallUnit);

                scene.add(wallUnit);
                wallUnit.position.x = (i - map.length / 2) * 10;
                wallUnit.position.y = 10;
                wallUnit.position.z = (j - map[i].length / 2) * 10;
            }
        }
    }
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


var intersects = [],
    arrow = [];
var len = 4;


var draw = false;

function testRay(d) {

    var raycaster = new THREE.Raycaster(pos, d, 0, len);

    if (draw) {
        arrow[2] = new THREE.ArrowHelper(d, pos, len, "#FFF000");
        scene.add(arrow[2]);
    }

    return raycaster.intersectObjects(wall);
}

function getComponents(d) {
    var v = new THREE.Vector3();
    var r = new THREE.Euler(0, 0, 0, "YXZ");

    r.set(controls.getPitchObject().rotation.x, controls.getObject().rotation.y, 0);
    var dd = v.copy(d).applyEuler(r);
    dd.y = 0;

    x = new THREE.Vector3(dd.x, 0, 0);
    z = new THREE.Vector3(0, 0, dd.z);

    if(draw){
        arrow[0] = new THREE.ArrowHelper(dd, pos, len, "#FAC123");
        scene.add(arrow[0])

        arrow[1] = new THREE.ArrowHelper(x, pos, Math.max(dd.x, 3), "#FF0000");
        scene.add(arrow[1]);
    
        arrow[2] = new THREE.ArrowHelper(z, pos, Math.max(dd.z, 3), "#0000FF");
        scene.add(arrow[2]);
    }
    return dd;
}

function animate() {
    requestAnimationFrame(animate);
    if (controls.enabled) {
        draw_2d(pos, "#FAC123");


        time = performance.now();
        delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;

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
        if( test_keys("1")){
            draw = !draw;
        }


        if (test_keys("SHIFT")) velocity.y += accel * delta;
        if (test_keys("SPACE") && pos.y > 10) velocity.y -= accel * delta;
        if (test_keys("SPACE") && pos.y <= 10) velocity.y = 0;


        vectors = getComponents(velocity);

        for (var i = 0; i < 4; i++) {
            intersects[i] = testRay(controls.rays[i]);
        }

        if ((intersects[1].length == 0 && vectors.x > 0) || (intersects[3].length == 0 && vectors.x < 0) ) {
            pos.x += vectors.x * delta;
        } 
        if ((intersects[0].length == 0 && vectors.z > 1) || (intersects[2].length == 0 && vectors.z < -1)) {
            pos.z += vectors.z * delta;
        }

        controls.getObject().translateY(velocity.y * delta);

        prevTime = time;
    }

    renderer.render(scene, camera);
}

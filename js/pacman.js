var key_map = {};
var camera, camera2, scene, renderer;
var geometry, material, mesh;
var controls;
var speed = 400.0;
var wall = [];
var raycaster;
var element = document.body;
var mouse = new THREE.Vector2();

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
var debug;

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

//map_2d.camera  = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

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


draw_2d = function() {
    pos = controls.getObject().position;

    map_2d.x = pos.x / 10 + map.length / 2;
    map_2d.y = pos.z / 10 + map[0].length / 2;
    map_2d.ctx.fillStyle = "#FAC123";
    map_2d.ctx.fillRect(map_2d.x * map_2d.px, map_2d.y * map_2d.px, map_2d.px, map_2d.px);


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
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(-1, 0, -1),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(-1, 0, 1)
    ];

    var onMouseMove = function(event) {

        if (scope.enabled === false) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));

        //for raycasting
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

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
    camera = new THREE.PerspectiveCamera(130, window.innerWidth / window.innerHeight, 1, 1000);
    camera2 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
    setup_2d();
    camera2.position.y = 200;
    camera2.rotation.x = -Math.PI / 2;
    scene = new THREE.Scene();
    //scene.fog = new THREE.Fog(0xffffff, 0, 750);
    var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
    light.position.set(0.5, 1, 0.75);
    scene.add(light);
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());



    controls.getObject().position.x = 140;
    controls.getObject().position.y = 10;
    controls.getObject().position.z = -5;


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
                wall_material = new THREE.MeshBasicMaterial({ color: "#ffffff" });
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


var canMoveForward = canMoveBack = canMoveLeft = canMoveRight = true;

var intersects = [],
    prevIntersects = [],
    arrow = [];
var INTERSECTED = [];
var len = 7;


function testRay(rayIndex){

}
function animate() {
    requestAnimationFrame(animate);
    if (controls.enabled) {
        draw_2d();
        intersects = [];


        canMoveRight = canMoveLeft = canMoveForward = canMoveBack = true;

        var v = new THREE.Vector3();

        for (var i = 0; i < controls.rays.length; i++) {
            var r = new THREE.Euler(0, 0, 0, "YXZ");
            var d = controls.rays[i];

            r.set(controls.getPitchObject().rotation.x, controls.getObject().rotation.y, 0);
            dd = v.copy(d).applyEuler(r);
            dd.y = 0;

            var raycaster = new THREE.Raycaster(controls.getObject().position, dd, 0, len);


            intersects = raycaster.intersectObjects(wall);

            // if there is one (or more) intersections
            if (intersects.length > 0) {
                // if the closest object intersected is not the currently stored intersection object
                if (intersects[0].object != INTERSECTED[i]) {
                    // restore previous intersection object (if it exists) to its original color
                    if (INTERSECTED[i])
                        INTERSECTED[i].material.color.setHex(INTERSECTED[i].currentHex);
                    // store reference to closest object as current intersection object
                    INTERSECTED[i] = intersects[0].object;
                    // store color of closest object (for later restoration)
                    INTERSECTED[i].currentHex = INTERSECTED[i].material.color.getHex();
                    // set a new color for closest object
                    INTERSECTED[i].material.color.setHex(0xffff00);
                }
            } else{ // there are no intersections
            
                // restore previous intersection object (if it exists) to its original color
                if (INTERSECTED[i])
                    INTERSECTED[i].material.color.setHex(INTERSECTED[i].currentHex);
                // remove previous intersection object reference
                //     by setting current intersection object to "nothing"
                INTERSECTED[i] = null;
            }

            if (intersects.length > 0 && controls.rays[i].x == -1) canMoveLeft = false;
            if (intersects.length > 0 && controls.rays[i].x == 1) canMoveRight = false;
            if (intersects.length > 0 && controls.rays[i].z == -1) canMoveForward = false;
            if (intersects.length > 0 && controls.rays[i].z == 1) canMoveBack = false;

            scene.remove(arrow[i]);
            //arrow[i] = new THREE.ArrowHelper( camera.getWorldDirection(), camera.getWorldPosition(), 100, "#A1B23C" );
            arrow[i] = new THREE.ArrowHelper(dd, controls.getObject().position, len, "#FAC123");
            scene.add(arrow[i]);

        }



        var pos = controls.getObject().position;

       // console.log(canMoveForward, canMoveBack, canMoveLeft, canMoveRight);

        var time = performance.now();
        var delta = (time - prevTime) / 1000;



        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= velocity.y * 10.0 * delta;
        if (test_keys("W")) {

            velocity.z -= speed * delta;
        }
        if (test_keys("S") && canMoveBack) velocity.z += speed * delta;
        if (test_keys("A") && canMoveLeft) velocity.x -= speed * delta;
        if (test_keys("D") && canMoveRight) velocity.x += speed * delta;
        if (test_keys("SHIFT")) velocity.y += speed * delta;
        if (test_keys("SPACE") && controls.getObject().position.y > 10) velocity.y -= speed * delta; 
        if (test_keys("SPACE") && controls.getObject().position.y <= 10) velocity.y=0;

        controls.getObject().translateX(velocity.x * delta);
        controls.getObject().translateY(velocity.y * delta);
        controls.getObject().translateZ(velocity.z * delta);

        prevTime = time;
    }
    

        // renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
        // renderer.setScissor( 0, 0, window.innerWidth, window.innerHeight );
        // renderer.setScissorTest( true );
        renderer.render(scene, camera);        
        // renderer.setViewport( window.innerWidth*0.75, window.innerHeight*0.75, window.innerWidth*0.25, window.innerHeight*0.25 );
        // renderer.setScissor( window.innerWidth*0.75, window.innerHeight*0.75, window.innerWidth*0.25, window.innerHeight*0.25  );
        // renderer.setScissorTest( true );
        // renderer.render(scene, camera2);
}

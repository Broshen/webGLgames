/*================================================
=            Event Listener Functions            =
================================================*/

var on_key_down = on_key_up = function(e) {
    e = e || event; // to deal with IE
    key_map[e.keyCode] = e.type == 'keydown';
}

var pointerlockchange = function(event) {
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
=            Object collision helper function            =
========================================================*/
//tests a vector against a group of three.js objects for collisions
//d		:		vector3D object (ray)
//group	:		array of object3Ds
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

//converts a vector3d into it's components relative to the scene
//d		:		vector3d
var getComponents = function(d) {
    var v = new THREE.Vector3();
    var r = new THREE.Euler(0, 0, 0, "YXZ");

    r.set(controls.getPitchObject().rotation.x, controls.getObject().rotation.y, 0);
    var dd = v.copy(d).applyEuler(r);

    dd.y = 0;

    var x = new THREE.Vector3(dd.x, 0, 0);
    var z = new THREE.Vector3(0, 0, dd.z);

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

/*===============================================
=            2d map helper functions            =
===============================================*/

//converts the coordinates on the 2d array map into a threejs Vector3
var get_vector_from_map = function(i, j, k) {
    var x = (i - map.length / 2) * 10;
    var y = k;
    var z = (j - map[0].length / 2) * 10;
    return new THREE.Vector3(x, y, z);
}

//converts a threejs Vector3 into a 2d array map cell
var get_cell = function(pos) {

    var x = Math.round(pos.x / 10 + map.length / 2);
    var y = Math.round(pos.z / 10 + map[0].length / 2);
    var dx = x - pos.x / 10 - map.length / 2;
    var dy = y - pos.z / 10 - map[0].length / 2;

    return [x, y, dx, dy];
}

//draws a circle with center x,y, radius r, and color
//onto the 2d map
//x, y, r		:		int
//color			:		hex string (e.g. "#ffffff")
var draw_circle = function(x, y, r, color) {
    map_2d.ctx.fillStyle = color;
    map_2d.ctx.beginPath();
    map_2d.ctx.arc(x, y, r, 0, 2 * Math.PI);
    map_2d.ctx.fill();
}

//draws a line from x1, y1, to x2, y2 in color onto the 2d map
//x1, y1, x2, y2	: 	int
//color				:	hex string (e.g. "#ffffff")
var draw_line = function(x1, y1, x2, y2, color) {
    map_2d.ctx.strokeStyle = color;
    map_2d.ctx.beginPath();
    map_2d.ctx.lineWidth = 5;
    map_2d.ctx.moveTo(x1 * map_2d.px, y1 * map_2d.px);
    map_2d.ctx.lineTo(x2 * map_2d.px, y2 * map_2d.px);
    map_2d.ctx.stroke();
}

//draws a square onto the 2d map
//x, y			: 	int
//color			:	hex string (e.g. "#ffffff")
var draw_rect = function(x, y, color) {
    map_2d.ctx.fillStyle = color;
    map_2d.ctx.fillRect(x * map_2d.px, y * map_2d.px, map_2d.px, map_2d.px);
}

//updates an object's position on the 2d map
//coords		:		current cell of the object [int, int, ...]
//prevCoords	:		previous cell of the object [int, int, ...]
//color			:		color of the object on the 2d map
var draw_2d = function(coords, prevCoords, color) {

    try {
        if (map[prevCoords[0]][prevCoords[1]] && map[prevCoords[0]][prevCoords[1]] == "0") {
            map_2d.ctx.fillStyle = "#ffffff";
        } else {
            map_2d.ctx.fillStyle = "#000000";
        }
        map_2d.ctx.fillRect(prevCoords[0] * map_2d.px, prevCoords[1] * map_2d.px, map_2d.px, map_2d.px);

        if (map[prevCoords[0]][prevCoords[1]] == "*") {
            draw_circle((prevCoords[0] + 0.5) * map_2d.px, (prevCoords[1] + 0.5) * map_2d.px, (map_2d.px - 4) / 2, "#fff000");
        } else if (map[prevCoords[0]][prevCoords[1]] == "X") {
            draw_circle((prevCoords[0] + 0.5) * map_2d.px, (prevCoords[1] + 0.5) * map_2d.px, (map_2d.px - 2) / 2, "#ffa500");
        }

        map_2d.ctx.fillStyle = color;
        map_2d.ctx.fillRect(coords[0] * map_2d.px, coords[1] * map_2d.px, map_2d.px, map_2d.px);

    } catch (err) { console.error(err) }

}

//gets the possible directions to go to at cell [x,y]
//x,y		:		int
//direction	:		current direction of the object (int)
var get_intersections = function(x, y, direction) {

    var arr = [];

    map[x + 1][y] && map[x + 1][y] != "0" && (direction + 2) % 4 != 1 ? arr.push(1) : arr;
    map[x - 1][y] && map[x - 1][y] != "0" && (direction + 2) % 4 != 3 ? arr.push(3) : arr;
    map[x][y + 1] && map[x][y + 1] != "0" && (direction + 2) % 4 != 2 ? arr.push(2) : arr;
    map[x][y - 1] && map[x][y - 1] != "0" && (direction + 2) % 4 != 0 ? arr.push(0) : arr;

    return arr;
}

//gets the cell relative to [x,y] in the given direction
//x,y,direction		:		int
var get_cell_from_direction = function(x, y, direction) {

    if (direction == 0) {
        return [x, y - 1];
    } else if (direction == 1) {
        return [x + 1, y];
    } else if (direction == 2) {
        return [x, y + 1];
    } else if (direction == 3) {
        return [x - 1, y];
    }
    console.error("Invalid Direction");
}

//returns the direction with the shortest direct path from the 
//pos to the target
//pos		:		position of object [int, int, ...]
//target	:		position of the target [int, int, ...]
//directions:		array of possible directions [int...]
var get_shortest_direction_to = function(pos, target, directions) {
    var shortestPath = Infinity; //assume the shortest path is infinity
    var shortestDirection;
    var shortestCell;
    for (var i = 0; i < directions.length; i++) {
        var newCell = get_cell_from_direction(pos[0], pos[1], directions[i]);

        var distance = Math.sqrt(Math.pow((newCell[0] - target[0]), 2) + Math.pow((newCell[1] - target[1]), 2))

        if (distance < shortestPath) {
            shortestPath = distance;
            shortestDirection = directions[i];
            shortestCell = newCell;
        }
    }
    return shortestDirection;
}

/*============================
=            Misc            =
============================*/

//sets the title and description of the pause screen
var set_text = function(title, desc) {
    $(".title").html(title);
    $(".description").html(desc);
}

/*========================================
=            Set up functions            =
========================================*/

//set up the 2d map and the 3d scene
var setup_map = function() {
    var canvas = document.getElementById("map-2d");
    var ctx = canvas.getContext("2d");

    map_2d.canvas = canvas;
    map_2d.ctx = ctx;

    canvas.height = map_2d.px * map[0].length;
    canvas.width = map_2d.px * map.length;


    // floor
    var floor_geometry = new THREE.PlaneGeometry(map.length * 10, map[0].length * 10);
    floor_geometry.rotateX(-Math.PI / 2);

    var floor_material = new THREE.MeshBasicMaterial({ color: "#ffffff" });
    var floor = new THREE.Mesh(floor_geometry, floor_material);
    floor.position.y = 5;
    floor.position.z = -5;
    floor.position.x = -5;
    scene.add(floor);



    var wall_geometry = new THREE.BoxGeometry(10, 10, 10);
    var wall_material = new THREE.MeshBasicMaterial({ color: "#1a237e", side: THREE.DoubleSide });

    var dot_geometry = new THREE.SphereGeometry(1, 10, 10);
    var dot_material = new THREE.MeshBasicMaterial({ color: "#fff000", side: THREE.DoubleSide });

    var powerPellet_geometry = new THREE.SphereGeometry(3, 10, 10);
    var powerPellet_material = new THREE.MeshBasicMaterial({ color: "#ffa500", side: THREE.DoubleSide });



    for (var i = 0; i < map.length; i++) {
        for (var j = 0; j < map[i].length; j++) {

            var type = map[i][j];
            var x = (i - map.length / 2) * 10;
            var y = 10;
            var z = (j - map[i].length / 2) * 10;
            if (type == '0') {
                var wallUnit = new THREE.Mesh(wall_geometry, wall_material);
                wall.push(wallUnit);

                scene.add(wallUnit);
                wallUnit.position.x = x;
                wallUnit.position.y = y;
                wallUnit.position.z = z;

                ctx.fillStyle = "#FFFFFF";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);
            } else if (type == '*') {

                var dotUnit = new THREE.Mesh(dot_geometry, dot_material);
                dotUnit.dotType = "normal";

                dots.push(dotUnit);
                scene.add(dotUnit);
                dotUnit.position.x = x;
                dotUnit.position.y = y;
                dotUnit.position.z = z;


                ctx.fillStyle = "#000000";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);

                draw_circle((i + 0.5) * map_2d.px, (j + 0.5) * map_2d.px, (map_2d.px - 4) / 2, "#fff000");
            } else if (type == 'X') {

                var dotUnit = new THREE.Mesh(powerPellet_geometry, powerPellet_material);
                dotUnit.dotType = "powerPellet";

                dots.push(dotUnit);
                scene.add(dotUnit);

                dotUnit.position.x = x;
                dotUnit.position.y = y;
                dotUnit.position.z = z;



                ctx.fillStyle = "#000000";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);

                draw_circle((i + 0.5) * map_2d.px, (j + 0.5) * map_2d.px, (map_2d.px - 2) / 2, "#ffa500");
            } else {
                ctx.fillStyle = "#000000";
                ctx.fillRect(i * map_2d.px, j * map_2d.px, map_2d.px, map_2d.px);
            }



        }
    }

    totalDots = dots.length;
}

//set up the ghosts
var setup_ghosts = function() {

    ghosts[0] = new GHOST(0xff5f5f, "Blinky",   totalDots,      [-1, -1],                               controls);
    ghosts[1] = new GHOST(0xffb8ff, "Pinky",    totalDots,      [-1, map[0].length + 1],                controls);
    ghosts[2] = new GHOST(0x01ffff, "Inky",     totalDots - 30, [map.length + 1, -1],                   controls);
    ghosts[3] = new GHOST(0xffb851, "Clyde",    totalDots - 60, [map.length + 1, map[0].length + 1],    controls);

    /*----------  Override each ghost's getChaseDirection method  ----------*/
    
    //blinky's chase target is the player's current cell
    ghosts[0].get_chase_direction = function(directions) {
        return get_shortest_direction_to(this.cell, this.target.cell, directions)
    }

    //pinky's chase target is 4 tiles in front of player, in the current direction the player is in
    ghosts[1].get_chase_direction  = function(directions) {

        var targetCell = [this.target.cell[0] - this.target.worldDir.x * 4, this.target.cell[1] - this.target.worldDir.z * 4];

        return get_shortest_direction_to(this.cell, targetCell, directions)
    }

    //inky's chase target is the tile double the vector from blinky to 2 tiles in front of the player
    ghosts[2].get_chase_direction  = function(directions) {

        //coords 2 tiles in front of player
        var playerTarget = [this.target.cell[0] - this.target.worldDir.x * 2, this.target.cell[1] - this.target.worldDir.z * 2];

        //coords of pinky's pos + 2(playerTarget - pinky's pos)
        var targetCell = [2 * playerTarget[0] - ghosts[0].cell[0], 2 * playerTarget[1] - ghosts[0].cell[1]];
        return get_shortest_direction_to(this.cell, targetCell, directions)
    }

    //if clyde is closer than 8 tiles away, use blinky targeting, otherwise, use scatter mode target
    ghosts[3].get_chase_direction  = function(directions) {

        var distance = Math.sqrt(Math.pow(this.cell[0] - this.target.cell[0]), 2) + Math.pow((this.cell[1] - this.target.cell[1]), 2)

        if (distance < 8) {
            return get_shortest_direction_to(this.cell, this.scatterModeTarget, directions)
        } else {
            return get_shortest_direction_to(this.cell, this.target.cell, directions)
        }
    }

    //add ghosts to the scene
    for (var g = 0; g < ghosts.length; g++) {
        scene.add(ghosts[g]);
    }

    //blinky starts outside of the house
    ghosts[0].position.copy(ghosts[0].startPos);
    ghosts[0].hasLeftHouse = true;
    ghosts[0].modeBeginTime = time;

}
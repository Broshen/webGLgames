get_vector_from_map = function(i, j, k) {

    var x = (i - map.length / 2) * 10;
    var y = k;
    var z = (j - map[0].length / 2) * 10;
    return new THREE.Vector3(x, y, z);
}


get_cell = function(pos) {

    var x = Math.round(pos.x / 10 + map.length / 2);
    var y = Math.round(pos.z / 10 + map[0].length / 2);
    var dx = x - pos.x / 10 - map.length / 2;
    var dy = y - pos.z / 10 - map[0].length / 2;

    return [x, y, dx, dy];
}

draw_circle = function(x, y, r, color) {
    map_2d.ctx.fillStyle = color;
    map_2d.ctx.beginPath();
    map_2d.ctx.arc(x, y, r, 0, 2 * Math.PI);
    map_2d.ctx.fill();
}

draw_line = function(x1, y1, x2, y2, color) {
    map_2d.ctx.strokeStyle = color;
    map_2d.ctx.beginPath();
    map_2d.ctx.lineWidth = 5;
    map_2d.ctx.moveTo(x1 * map_2d.px, y1 * map_2d.px);
    map_2d.ctx.lineTo(x2 * map_2d.px, y2 * map_2d.px);
    map_2d.ctx.stroke();
}

draw_rect = function(x, y, color) {
    map_2d.ctx.fillStyle = color;
    map_2d.ctx.fillRect(x * map_2d.px, y * map_2d.px, map_2d.px, map_2d.px);
}

draw_2d = function(coords, prevCoords, color, shouldDrawDot) {

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

rotate_ghost_left = function(ghost) {
    ghost.rotateY(-Math.PI / 2);
    ghost.direction = (ghost.direction + 1) % 4;
}

get_intersections = function(x, y, direction) {

    var arr = [];

    map[x + 1][y] && map[x + 1][y] != "0" && (direction + 2) % 4 != 1 ? arr.push(1) : arr;
    map[x - 1][y] && map[x - 1][y] != "0" && (direction + 2) % 4 != 3 ? arr.push(3) : arr;
    map[x][y + 1] && map[x][y + 1] != "0" && (direction + 2) % 4 != 2 ? arr.push(2) : arr;
    map[x][y - 1] && map[x][y - 1] != "0" && (direction + 2) % 4 != 0 ? arr.push(0) : arr;

    return arr;
}

get_cell_from_direction = function(x, y, direction) {

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


setup_ghosts = function() {

    ghosts[0].scatterModeTarget = [-1, -1];
    ghosts[1].scatterModeTarget = [-1, map[0].length + 1];
    ghosts[2].scatterModeTarget = [map.length + 1, -1];
    ghosts[3].scatterModeTarget = [map.length + 1, map[0].length + 1];

    for (var g = 0; g < ghosts.length; g++) {
        scene.add(ghosts[g]);
        ghosts[g].inactivePos = get_vector_from_map(map.length / 2 - 1.5, map[0].length / 2 - 2 + g, 20);
        ghosts[g].startPos = new THREE.Vector3(-45, 10, -5);
        ghosts[g].position.copy(ghosts[g].inactivePos);
        ghosts[g].lastCell = get_cell(ghosts[g].position);
        ghosts[g].cell = get_cell(ghosts[g].position);
        ghosts[g].mode = "scatter";
        ghosts[g].previousMode = "scatter";
        ghosts[g].material.materials[0].color.setHex(ghosts[g].color);
        ghosts[g].activeColor = ghosts[g].colorStr;
        ghosts[g].scatterTimes = [7, 7, 5, 5];
        ghosts[g].chaseTimes = [20, 20, 20];
        ghosts[g].modeCounter = 0;
        ghosts[g].velocity = 35;
        ghosts[g].direction = 2; //facing south
    }

}

get_shortest_direction_to = function(pos, target, directions) {
    var shortestPath = Infinity; //assume the shortest path is infinity
    var shortestDirection;
    var shortestCell;

    for (var i = 0; i < directions.length; i++) {
        var newCell = get_cell_from_direction(pos[0], pos[1], directions[i]);

        var distance = Math.sqrt((newCell[0] - target[0]) ** 2 + (newCell[1] - target[1]) ** 2)

        if (distance < shortestPath) {
            shortestPath = distance;
            shortestDirection = directions[i];
            shortestCell = newCell;
        }
    }
    return shortestDirection;
}

get_new_direction = function(ghost, directions) {
    //if the ghost is in frightened mode, return a random direction to go to
    if (ghost.mode == "frightened") {
        return directions[Math.floor(Math.random() * directions.length)];
    } else if (ghost.mode == "scatter") { //ghost is in scatter mode
        return get_shortest_direction_to(ghost.cell, ghost.scatterModeTarget, directions);
    } else if (ghost.mode == "chase") { //ghost is chase mode
        return ghost.getChaseDirection(directions);
    } else if (ghost.mode == "eaten") {
        return get_shortest_direction_to(ghost.cell, [11, 14], directions); //ghost has been eaten
    }

    console.error("Invalid ghost mode: ", ghost.mode);
}

//blinky's chase target is the player's current cell
ghosts[0].getChaseDirection = function(directions) {
    return get_shortest_direction_to(this.cell, controls.cell, directions)
}

//pinky's chase target is 4 tiles in front of player, in the current direction the player is in
ghosts[1].getChaseDirection = function(directions) {

    var targetCell = [controls.cell[0] - controls.worldDir.x * 4, controls.cell[1] - controls.worldDir.z * 4];

    return get_shortest_direction_to(this.cell, targetCell, directions)
}

//inky's chase target is the tile double the vector from blinky to 2 tiles in front of the player
ghosts[2].getChaseDirection = function(directions) {

    //coords 2 tiles in front of player
    var playerTarget = [controls.cell[0] - controls.worldDir.x * 2, controls.cell[1] - controls.worldDir.z * 2];

    //coords of pinky's pos + 2(playerTarget - pinky's pos)
    var targetCell = [2 * playerTarget[0] - ghosts[0].cell[0], 2 * playerTarget[1] - ghosts[0].cell[1]];
    return get_shortest_direction_to(this.cell, targetCell, directions)
}

//if clyde is closer than 8 tiles away, use blinky targeting, otherwise, use scatter mode target
ghosts[3].getChaseDirection = function(directions) {

    var distance = Math.sqrt((this.cell[0] - controls.cell[0]) ** 2 + (this.cell[1] - controls.cell[1]) ** 2)

    if (distance < 8) {
        return get_shortest_direction_to(this.cell, this.scatterModeTarget, directions)
    } else {
        return get_shortest_direction_to(this.cell, controls.cell, directions)
    }
}


// //BLINKY
ghosts[1].tick = ghosts[2].tick = ghosts[3].tick = ghosts[0].tick = function(player, dots, delta) {


    if (dots.length <= totalDots && this.hasLeftHouse == undefined) {
        this.hasLeftHouse = true;
        this.position.copy(ghosts[0].startPos);
        this.modeBeginTime = time;
    }

    if (this.hasLeftHouse) {

        this.lastCell = this.cell;
        this.cell = get_cell(this.position)

        if (dots.lastDotEaten == "powerPellet" && this.mode != "frightened") {
            console.log("Power pellet eaten");
            this.previousMode = this.mode;
            this.mode = "frightened";
            this.material.materials[0].color.setHex(0x3041f2);
            this.activeColor = "#3041f2";
            this.scatterModeBeginTime = time;
            this.velocity = 30;
        } else if (dots.lastDotEaten == "powerPellet" && this.mode == "frightened") {
            dots.lastDotEaten = "nothing";
        }


        if (this.mode == "scatter" && this.modeCounter < 4 && time - this.modeBeginTime > this.scatterTimes[this.modeCounter] * 1000) {
            this.previousMode = this.mode;
            this.mode = "chase";
            this.modeBeginTime = time;
        } else if (this.mode == "chase" && this.modeCounter < 3 && time - this.modeBeginTime > this.chaseTimes[this.modeCounter] * 1000) {
            this.previousMode = this.mode;
            this.mode = "scatter";
            this.modeBeginTime = time;
            this.modeCounter++;
        } else if (this.mode == "frightened") {

        	//scatter mode ends
            if (time - this.scatterModeBeginTime > 8000) {
                this.modeBeginTime = time;
                this.mode = this.previousMode;
                this.previousMode = "frightened";
                this.material.materials[0].color.setHex(this.color);
                this.activeColor = this.colorStr;
                this.velocity = 35;
            }

            //ghost should flash
            else if (time - this.scatterModeBeginTime > 5000){
            	if(Math.round((time - this.scatterModeBeginTime)/200)%2 == 0){
		            this.material.materials[0].color.setHex(0x3041f2);
		            this.activeColor = "#3041f2";
            	}
            	else{

		            this.material.materials[0].color.setHex(0xffffff);
		            this.activeColor = "#ffffff";
            	}
            }

        } else if (this.mode == "eaten" && this.cell[0] == 11 && (this.cell[1] == 14 || this.cell[1] == 13)) {
            this.mode = this.previousMode;
            this.modeBeginTime = time;
            this.geometry = ghost_geometry;
            this.activeColor = this.colorStr;
            this.material.materials[0].color.setHex(this.color);
            this.velocity = 35;
        }


        //if the ghost is close to the center of a cell and has not turned yet
        if (Math.abs(this.cell[2]) < 0.3 && Math.abs(this.cell[3]) < 0.3 && !this.hasTurned) {

            //get all of the possible directions the ghost can move in
            //other than turning around (reverse)
            var intersections = get_intersections(this.cell[0], this.cell[1], this.direction);

            //choose a new direction to go
            var newDirection;

            if (intersections.length > 1) {
                newDirection = get_new_direction(this, intersections);
            } else if (intersections.length > 0) {
                newDirection = intersections[0];
            } else {
                newDirection = this.direction;
            }

            if (newDirection != this.direction) {
                //first move the ghost to the exact center of the cell before turning
                this.position.copy(get_vector_from_map(this.cell[0], this.cell[1], 10));
                //turn the ghost to the new direction
                while (this.direction != newDirection) {
                    rotate_ghost_left(this);
                }
            }

            this.hasTurned = true;
        }

        //if the ghost has entered a new cell, reset the turn flag
        if ((this.lastCell[0] != this.cell[0] || this.lastCell[1] != this.cell[1]) && this.hasTurned) {
            this.hasTurned = false;
        }

        //move ghost forward
        this.translateZ(this.velocity * delta);

        //teleport the ghost to the other side if it ghosts out of bounds 
        if (this.position.z < -145) {
            this.position.z = 130;
        }

        if (this.position.z > 135) {
            this.position.z = -140;
        }


    }
    draw_2d(this.cell, this.lastCell, this.activeColor, true);
}


ghost_tick = function(player, dots, delta) {
    ghosts[0].tick(player, dots, delta);
    ghosts[1].tick(player, dots, delta);
    ghosts[2].tick(player, dots, delta);
    ghosts[3].tick(player, dots, delta);
}

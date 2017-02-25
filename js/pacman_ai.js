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

draw_2d = function(coords, prevCoords, color) {

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

    ghosts[0] = new GHOST(0xff5f5f, "Blinky", totalDots, [-1, -1], controls);
    ghosts[1] = new GHOST(0xffb8ff, "Pinky", totalDots, [-1, map[0].length + 1], controls);
    ghosts[2] = new GHOST(0x01ffff, "Inky", totalDots - 30, [map.length + 1, -1], controls);
    ghosts[3] = new GHOST(0xffb851, "Clyde", totalDots - 60, [map.length + 1, map[0].length + 1], controls);

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

        var distance = Math.sqrt((this.cell[0] - this.target.cell[0]) ** 2 + (this.cell[1] - this.target.cell[1]) ** 2)

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

get_shortest_direction_to = function(pos, target, directions) {
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

ghost_tick = function(dots, delta) {
    ghosts[0].tick(dots, delta);
    ghosts[1].tick(dots, delta);
    ghosts[2].tick(dots, delta);
    ghosts[3].tick(dots, delta);
}

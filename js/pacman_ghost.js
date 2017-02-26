/*======================================================
=            Constructor for a ghost object            =
======================================================*/
//color 			: 	hexadecimal number
//name				:	string
//startDots			: 	int
//scatterModeTarget	: 	array [int, int] 
//target			: 	pointerLockControls object
function GHOST(color, name, startDots, scatterModeTarget, target) {

    /*----------  Variables  ----------*/
    GHOST.count = ++GHOST.count || 1; //static counter of how many ghosts have been initialized

    THREE.Mesh.call(this, ghost_geometry, ghost_material.clone());

    this.color = color;
    this.material.materials[0].color.setHex(this.color);
    this.activeColor = '#' + ('00000' + (this.color | 0).toString(16)).substr(-6);

    this.name = name;

    this.inactivePos = get_vector_from_map(map.length / 2 - 1.5, map[0].length / 2 - 2 + GHOST.count - 1, 20);
    this.startPos = new THREE.Vector3(-45, 10, -5);
    this.scatterTimes = [7, 7, 5, 5];
    this.scatterModeTarget = scatterModeTarget;
    this.chaseTimes = [20, 20, 20];


    this.position.copy(this.inactivePos);
    this.lastCell = get_cell(this.position);
    this.cell = get_cell(this.position);
    this.mode = "scatter";
    this.previousMode = "scatter";
    this.modeCounter = 0;
    this.velocity = 35;
    this.direction = 2; //facing south

    this.hasLeftHouse = false;
    this.hasTurned = false;
    this.modeBeginTime = time;

    this.target = target;

    this.startDots = startDots;

    /*----------  Methods  ----------*/

    //chooses a new direction to turn to, given an array of available directions
    //based on the mode of the ghost
    //availableDirections		:		array[int...]
    this.get_new_direction = function(availableDirections) {
        //if the ghost is in frightened mode, return a random direction to go to
        if (this.mode == "frightened") {
            return availableDirections[Math.floor(Math.random() * availableDirections.length)];
        } else if (this.mode == "scatter") { //ghost is in scatter mode
            return get_shortest_direction_to(this.cell, this.scatterModeTarget, availableDirections);
        } else if (this.mode == "chase") { //ghost is chase mode
            return this.get_chase_direction(availableDirections);
        } else if (this.mode == "eaten") {
            return get_shortest_direction_to(this.cell, [11, 14], availableDirections); //ghost has been eaten
        }

        console.error("Invalid ghost mode: ", this.mode);
    }

    //the getChaseDirection should be overwritten for every ghost instance outside of the constructor
    this.get_chase_direction = function(directions) {
        throw "THE GET CHASE DIRECTION FUNCTION SHOULD BE OVERWRITTEN FOR EVERY GHOST INSTANCE"
    }

    //color			:	hex number
    this.set_color = function(color) {
        this.material.materials[0].color.setHex(color);
        this.activeColor = '#' + ('00000' + (color | 0).toString(16)).substr(-6);
    }

    this.rotate_left = function() {
        this.rotateY(-Math.PI / 2);
        this.direction = (this.direction + 1) % 4;


    }

    //ghost's AI to determine where to go
    //tick is seperated into 5 parts:
    //decide whether or not the ghost has left the house
    //update the ghost's current position
    //update the ghost's current mode
    //update the ghost's current direction
    //moves the ghost forward
    //player		:		pointerLockControls Object
    //dots			:		dots Object (array with a lastDotEaten property)
    //delta			:		number - time elapsed since last animation frame
    this.tick = function(dots, delta) {

        if (dots.length <= this.startDots && !this.hasLeftHouse) {
            this.hasLeftHouse = true;
            this.position.copy(ghosts[0].startPos);
            this.modeBeginTime = time;
            return;
        }

        if (this.hasLeftHouse) {
            /*----------  Updates the current position  ----------*/

            this.lastCell = this.cell;
            this.cell = get_cell(this.position)

            /*----------  Updates the current mode of the ghost  ----------*/

            if (dots.lastDotEaten == "powerPellet" && this.mode != "frightened") {
                this.previousMode = this.mode;
                this.mode = "frightened";
                this.set_color(0x3041f2);
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
                    this.set_color(this.color);
                    this.velocity = 35;
                }

                //ghost should flash
                else if (time - this.scatterModeBeginTime > 5000) {
                    if (Math.round((time - this.scatterModeBeginTime) / 200) % 2 == 0) {
                        this.set_color(0x3041f2);
                    } else {
                        this.set_color(0xffffff);
                    }
                }

            } else if (this.mode == "eaten" && this.cell[0] == 11 && (this.cell[1] == 14 || this.cell[1] == 13)) {
                this.mode = this.previousMode;
                this.modeBeginTime = time;
                this.geometry = ghost_geometry;
                this.set_color(this.color);
                this.velocity = 35;
            }

            /*----------  Turns the ghost if neccesary  ----------*/

            //if the ghost is close to the center of a cell and has not turned yet
            if (Math.abs(this.cell[2]) < 0.3 && Math.abs(this.cell[3]) < 0.3 && !this.hasTurned) {

                //get all of the possible directions the ghost can move in
                //other than turning around (reverse)
                var intersections = get_intersections(this.cell[0], this.cell[1], this.direction);

                //choose a new direction to go
                var newDirection;

                if (intersections.length > 1) {
                    newDirection = this.get_new_direction(intersections);
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
                        this.rotate_left();
                    }
                }

                this.hasTurned = true;
            }

            //if the ghost has entered a new cell, reset the turn flag
            if ((this.lastCell[0] != this.cell[0] || this.lastCell[1] != this.cell[1]) && this.hasTurned) {
                this.hasTurned = false;
            }

            /*----------  Moves the ghost forward  ----------*/

            this.translateZ(this.velocity * delta);

            //teleport the ghost to the other side if it ghosts out of bounds 
            if (this.position.z < -145) {
                this.position.z = 130;
            }

            if (this.position.z > 135) {
                this.position.z = -140;
            }
        }
        //end of hasLeftHouse

        draw_2d(this.cell, this.lastCell, this.activeColor);
    }

}

GHOST.prototype = Object.create(THREE.Mesh.prototype)

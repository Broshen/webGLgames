/*=============================================================================
=            Constructor for a THREE.js pointerLockControls Object            =
=============================================================================*/

THREE.PointerLockControls = function(camera) {

    /*----------  Private variables  ----------*/
    
    var scope = this;
    var pitchObject = new THREE.Object3D();
    var yawObject = new THREE.Object3D();
    var PI_2 = Math.PI / 2;

    /*----------  Public variables  ----------*/
    
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

    this.prevCoords = this.cell = [0, 0];
    this.enabled = false;
    this.worldDir = yawObject.getWorldDirection();

    /*----------  Private methods  ----------*/
    
    var onMouseMove = function(event) {

        if (scope.enabled === false) return;

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        yawObject.rotation.y -= movementX * 0.002;
        pitchObject.rotation.x -= movementY * 0.002;

        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
    };

    /*----------  Public methods  ----------*/
    this.getObject = function() {

        return yawObject;

    };

    this.getPitchObject = function() {

        return pitchObject;
    }

    /*----------  Initialize variables  ----------*/
    
    camera.rotation.set(0, 0, 0);

    pitchObject.add(camera);

    yawObject.position.y = 10;
    yawObject.add(pitchObject);

    document.addEventListener('mousemove', onMouseMove, false);

};

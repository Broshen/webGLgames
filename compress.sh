#!/bin/bash

uglifyjs ./js/pointerLockControls.js ./js/pacman_ghost.js ./js/pacman_variables.js ./js/pacman_helpers.js ./js/pacman.js ./js/pacman_tests.js   --source-map   -m  -c  --lint --stats -o pacman.min.js

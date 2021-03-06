var key_map = {};
var camera, scene, renderer;
var controls;
var accel = 400.0;
var wall = [],
	dots = [],
	wallIntersects = [],
    dotIntersects = [],
    ghostIntersects = [],
    arrow = [];
var len = 4;
var toggleFloor = false;
var animationFrameId;
var vectors;

var draw = false;
var debugMode = false;

var totalDots;

var raycaster;
var element = document.body;
var gameHasEnded = false;

var map_2d = {};
map_2d.px = 7;

var prevTime = performance.now();
var time = performance.now();
var delta;
var pos;

var velocity = new THREE.Vector3();

var stats = new Stats();
var stats2 = new Stats();
stats.showPanel(0);
stats2.showPanel(2);
document.body.appendChild(stats.domElement);
document.body.appendChild(stats2.domElement);
$(stats.domElement).addClass("stats")
$(stats2.domElement).addClass("stats")
$(stats2.domElement).css("left", $(stats.domElement).width());


var ghostbody_material = new THREE.MeshBasicMaterial({ color: "#ff0000", side: THREE.DoubleSide });

var eyeball_material = new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide });
var eye_material = new THREE.MeshBasicMaterial({ color: "#000000", side: THREE.DoubleSide });


var ghost_material = new THREE.MultiMaterial([ghostbody_material, eyeball_material, eye_material]);

var ghostHead_geometry = new THREE.SphereGeometry(3, 30, 30, 0, Math.PI * 2, 0, Math.PI / 2);
var ghostBody_geometry = new THREE.CylinderGeometry(3, 3, 3, 50);
var ghostEyeball_geometry = new THREE.SphereGeometry(0.5, 20, 20);
var ghostEye_geometry = new THREE.SphereGeometry(0.2, 10, 10);

var ghost_geometry = new THREE.Geometry();
var dead_ghost_geometry = new THREE.Geometry();


var ghostHead_mesh = new THREE.Mesh(ghostHead_geometry);
ghostHead_mesh.position.y = -0.5;

var ghostBody_mesh = new THREE.Mesh(ghostBody_geometry);
ghostBody_mesh.position.y = -2;

var eyeBall_z = 2.5;
var eye_z = 2.86;
var eye_x = 1.1;

var ghostEyeball1_mesh = new THREE.Mesh(ghostEyeball_geometry);
ghostEyeball1_mesh.position.x = -1;
ghostEyeball1_mesh.position.z = eyeBall_z;

var ghostEyeball2_mesh = new THREE.Mesh(ghostEyeball_geometry);
ghostEyeball2_mesh.position.x = 1;
ghostEyeball2_mesh.position.z = eyeBall_z;

var ghostEye1_mesh = new THREE.Mesh(ghostEye_geometry);
ghostEye1_mesh.position.x = -eye_x;
ghostEye1_mesh.position.z = eye_z;
var ghostEye2_mesh = new THREE.Mesh(ghostEye_geometry);
ghostEye2_mesh.position.x = eye_x;
ghostEye2_mesh.position.z = eye_z;

ghostHead_mesh.updateMatrix();
ghostBody_mesh.updateMatrix();
ghostEye1_mesh.updateMatrix();
ghostEye2_mesh.updateMatrix();
ghostEyeball1_mesh.updateMatrix();
ghostEyeball2_mesh.updateMatrix();

ghost_geometry.merge(ghostEyeball1_mesh.geometry, ghostEyeball1_mesh.matrix, 1);
ghost_geometry.merge(ghostEyeball2_mesh.geometry, ghostEyeball2_mesh.matrix, 1);
ghost_geometry.merge(ghostHead_mesh.geometry, ghostHead_mesh.matrix);
ghost_geometry.merge(ghostBody_mesh.geometry, ghostBody_mesh.matrix);
ghost_geometry.merge(ghostEye1_mesh.geometry, ghostEye1_mesh.matrix, 2);
ghost_geometry.merge(ghostEye2_mesh.geometry, ghostEye2_mesh.matrix, 2);


dead_ghost_geometry.merge(ghostEyeball1_mesh.geometry, ghostEyeball1_mesh.matrix, 1);
dead_ghost_geometry.merge(ghostEyeball2_mesh.geometry, ghostEyeball2_mesh.matrix, 1);
dead_ghost_geometry.merge(ghostEye1_mesh.geometry, ghostEye1_mesh.matrix, 2);
dead_ghost_geometry.merge(ghostEye2_mesh.geometry, ghostEye2_mesh.matrix, 2);

var ghosts = [];



var map = [
    ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0'],
    ['0', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '0'],
    ['0', '*', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '*', '0'],
    ['0', 'X', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', 'X', '0'],
    ['0', '*', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '*', '0'],
    ['0', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '0'],
    ['0', '*', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '*', '0'],
    ['0', '*', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '*', '0'],
    ['0', '*', '*', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '*', '*', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', ' ', '0', '0', ' ', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', ' ', '0', '0', ' ', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', '0', '0', '0', '0', '0', '0', '0', '0', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', '0', '0', '0', '0', '0', '0', '0', '0', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['*', '*', '*', '*', '*', '*', '*', ' ', ' ', ' ', '0', '0', '0', '0', '0', '0', '0', '0', ' ', ' ', ' ', '*', '*', '*', '*', '*', '*', '*'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', '0', '0', '0', '0', '0', '0', '0', '0', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', '0', '0', '0', '0', '0', '0', '0', '0', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', '0', '0', '0', '0', '0', '0', '0', '0', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '0', '0', '0', '0', '0', '*', '0', '0', ' ', '0', '0', '0', '0', '0', '0', '0', '0', ' ', '0', '0', '*', '0', '0', '0', '0', '0', '0'],
    ['0', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '0'],
    ['0', '*', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '*', '0'],
    ['0', '*', '0', '0', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '*', '0', '0', '0', '0', '*', '0'],
    ['0', 'X', '*', '*', '0', '0', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '0', '0', '*', '*', 'X', '0'],
    ['0', '0', '0', '*', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '*', '0', '0', '0'],
    ['0', '0', '0', '*', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '*', '0', '0', '0'],
    ['0', '*', '*', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '0', '0', '*', '*', '*', '*', '*', '*', '0'],
    ['0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0'],
    ['0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0', '0', '*', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '*', '0'],
    ['0', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '*', '0'],
    ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
];

var alias = {
    "CANCEL": 3,
    "HELP": 6,
    "BACK_SPACE": 8,
    "TAB": 9,
    "CLEAR": 12,
    "ENTER": 13,
    "ENTER_SPECIAL": 14,
    "SHIFT": 16,
    "CONTROL": 17,
    "ALT": 18,
    "PAUSE": 19,
    "CAPS_LOCK": 20,
    "KANA": 21,
    "EISU": 22,
    "JUNJA": 23,
    "FINAL": 24,
    "HANJA": 25,
    "ESCAPE": 27,
    "CONVERT": 28,
    "NONCONVERT": 29,
    "ACCEPT": 30,
    "MODECHANGE": 31,
    "SPACE": 32,
    "PAGE_UP": 33,
    "PAGE_DOWN": 34,
    "END": 35,
    "HOME": 36,
    "LEFT": 37,
    "UP": 38,
    "RIGHT": 39,
    "DOWN": 40,
    "SELECT": 41,
    "PRINT": 42,
    "EXECUTE": 43,
    "PRINTSCREEN": 44,
    "INSERT": 45,
    "DELETE": 46,
    "0": 48,
    "1": 49,
    "2": 50,
    "3": 51,
    "4": 52,
    "5": 53,
    "6": 54,
    "7": 55,
    "8": 56,
    "9": 57,
    "COLON": 58,
    "SEMICOLON": 59,
    "LESS_THAN": 60,
    "EQUALS": 61,
    "GREATER_THAN": 62,
    "QUESTION_MARK": 63,
    "AT": 64,
    "A": 65,
    "B": 66,
    "C": 67,
    "D": 68,
    "E": 69,
    "F": 70,
    "G": 71,
    "H": 72,
    "I": 73,
    "J": 74,
    "K": 75,
    "L": 76,
    "M": 77,
    "N": 78,
    "O": 79,
    "P": 80,
    "Q": 81,
    "R": 82,
    "S": 83,
    "T": 84,
    "U": 85,
    "V": 86,
    "W": 87,
    "X": 88,
    "Y": 89,
    "Z": 90,
    "OS_KEY": 91,
    "CONTEXT_MENU": 93,
    "SLEEP": 95,
    "NUMPAD0": 96,
    "NUMPAD1": 97,
    "NUMPAD2": 98,
    "NUMPAD3": 99,
    "NUMPAD4": 100,
    "NUMPAD5": 101,
    "NUMPAD6": 102,
    "NUMPAD7": 103,
    "NUMPAD8": 104,
    "NUMPAD9": 105,
    "MULTIPLY": 106,
    "ADD": 107,
    "SEPARATOR": 108,
    "SUBTRACT": 109,
    "DECIMAL": 110,
    "DIVIDE": 111,
    "F1": 112,
    "F2": 113,
    "F3": 114,
    "F4": 115,
    "F5": 116,
    "F6": 117,
    "F7": 118,
    "F8": 119,
    "F9": 120,
    "F10": 121,
    "F11": 122,
    "F12": 123,
    "F13": 124,
    "F14": 125,
    "F15": 126,
    "F16": 127,
    "F17": 128,
    "F18": 129,
    "F19": 130,
    "F20": 131,
    "F21": 132,
    "F22": 133,
    "F23": 134,
    "F24": 135,
    "NUM_LOCK": 144,
    "SCROLL_LOCK": 145,
    "WIN_OEM_FJ_JISHO": 146,
    "WIN_OEM_FJ_MASSHOU": 147,
    "WIN_OEM_FJ_TOUROKU": 148,
    "WIN_OEM_FJ_LOYA": 149,
    "WIN_OEM_FJ_ROYA": 150,
    "CIRCUMFLEX": 160,
    "EXCLAMATION": 161,
    "DOUBLE_QUOTE": 162,
    "HASH": 163,
    "DOLLAR": 164,
    "PERCENT": 165,
    "AMPERSAND": 166,
    "UNDERSCORE": 167,
    "OPEN_PAREN": 168,
    "CLOSE_PAREN": 169,
    "ASTERISK": 170,
    "PLUS": 171,
    "PIPE": 172,
    "HYPHEN_MINUS": 173,
    "OPEN_CURLY_BRACKET": 174,
    "CLOSE_CURLY_BRACKET": 175,
    "TILDE": 176,
    "VOLUME_MUTE": 181,
    "VOLUME_DOWN": 182,
    "VOLUME_UP": 183,
    "SEMICOLON": 186,
    "EQUALS": 187,
    "COMMA": 188,
    "MINUS": 189,
    "PERIOD": 190,
    "SLASH": 191,
    "BACK_QUOTE": 192,
    "OPEN_BRACKET": 219,
    "BACK_SLASH": 220,
    "CLOSE_BRACKET": 221,
    "QUOTE": 222,
    "META": 224,
    "ALTGR": 225,
    "WIN_ICO_HELP": 227,
    "WIN_ICO_00": 228,
    "WIN_ICO_CLEAR": 230,
    "WIN_OEM_RESET": 233,
    "WIN_OEM_JUMP": 234,
    "WIN_OEM_PA1": 235,
    "WIN_OEM_PA2": 236,
    "WIN_OEM_PA3": 237,
    "WIN_OEM_WSCTRL": 238,
    "WIN_OEM_CUSEL": 239,
    "WIN_OEM_ATTN": 240,
    "WIN_OEM_FINISH": 241,
    "WIN_OEM_COPY": 242,
    "WIN_OEM_AUTO": 243,
    "WIN_OEM_ENLW": 244,
    "WIN_OEM_BACKTAB": 245,
    "ATTN": 246,
    "CRSEL": 247,
    "EXSEL": 248,
    "EREOF": 249,
    "PLAY": 250,
    "ZOOM": 251,
    "PA1": 253,
    "WIN_OEM_CLEAR": 254,
};

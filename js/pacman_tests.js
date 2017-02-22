var test_scatter_mode_corners = function() {
    for (var i = 0; i < 4; i++) {
        console.log(ghosts[i].scatterModeTarget);
        draw_circle((ghosts[i].scatterModeTarget[0]  + 0.5) * map_2d.px, (ghosts[i].scatterModeTarget[1]  + 0.5) * map_2d.px, (map_2d.px*10 - 2) / 2, ghosts[i].colorStr);
    }
}

var test_direction = function(pos, direction){
	switch (direction){
		case 0:
			draw_rect(pos[0], pos[1]-1, "#fff000");
			break;
		case 1:
			draw_rect(pos[0] + 1, pos[1], "#fff000");
			break;
		case 2:
			draw_rect(pos[0] , pos[1]+ 1, "#fff000");
			break;
		case 3:
			draw_rect(pos[0] - 1, pos[1] , "#fff000");
			break;
	}

}

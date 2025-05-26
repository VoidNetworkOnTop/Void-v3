var ORIENTATION_PORTRAIT = 0;
var ORIENTATION_LANDSCAPE = 1;
var GAME_CURRENT_ORIENTATION = ORIENTATION_PORTRAIT;
var MAX_SWIPES = 5;
var game_resolutions = {0:{x:483, yMin:650, yMax:800}, 1:{xMin:816 * .7, xMax:1200 * .7, y:600 * .7}};
function getMaxGameResolution() {
  return [game_resolutions[0]["x"], game_resolutions[0]["yMax"]];
}
;

var IMAGE_FOLDER = "img_480/";
function loadSplash(game) {
  game.load.text("lang_strings", "assets/dat/m.xml");
  game.load.image("void", "assets/" + IMAGE_FOLDER + "void.png");
  game.load.image("addg_logo", "assets/" + IMAGE_FOLDER + "addicting-games-stacked-color@1x.png");
  game.load.image("addg_logo_side", "assets/" + IMAGE_FOLDER + "AG-site-side-tab.png");
  game.load.image("ldrbtn", "assets/" + IMAGE_FOLDER + "ldrbrd.png");
}
function loadImages(game) {
  game.load.atlas("pak1", "assets/" + IMAGE_FOLDER + "pak1.png", "assets/" + IMAGE_FOLDER + "pak1.json");
  game.load.xml("gamefont_TA_xml", "assets/fnt/gamefont_TA.xml");
  game.load.xml("gamefont_RU_xml", "assets/fnt/gamefont_RU.xml");
}
function loadSounds(game) {
  game.load.audio("music_menu", ["assets/audio/music_menu.ogg", "assets/audio/music_menu.mp3"]);
  game.load.audio("music_game", ["assets/audio/music_game.ogg", "assets/audio/music_game.mp3"]);
  game.load.audio("menu-click1", ["assets/audio/menu-click1.ogg", "assets/audio/menu-click1.mp3"]);
  game.load.audio("shoot", ["assets/audio/shoot.ogg", "assets/audio/shoot.mp3"]);
  game.load.audio("ball", ["assets/audio/ball.ogg", "assets/audio/ball.mp3"]);
  game.load.audio("explode", ["assets/audio/explode.ogg", "assets/audio/explode.mp3"]);
  game.load.audio("vybuch", ["assets/audio/vybuch.ogg", "assets/audio/vybuch.mp3"]);
  game.load.audio("gems", ["assets/audio/gems.ogg", "assets/audio/gems.mp3"]);
  game.load.audio("laser2", ["assets/audio/laser2.ogg", "assets/audio/laser2.mp3"]);
  game.load.audio("warning", ["assets/audio/warning.ogg", "assets/audio/warning.mp3"]);
  game.load.audio("pay", ["assets/audio/pay.ogg", "assets/audio/pay.mp3"]);
  game.load.audio("achieve", ["assets/audio/achieve.ogg", "assets/audio/achieve.mp3"]);
  game.load.audio("tile_wrong-one", ["assets/audio/tile_wrong-one.ogg", "assets/audio/tile_wrong-one.mp3"]);
  game.load.audio("power_up", ["assets/audio/power_up.ogg", "assets/audio/power_up.mp3"]);
}
function getPakFrames(prefix, frames) {
  output = [];
  for (var i = 0;i < frames.length;i++) {
    output[i] = prefix + frames[i] + ".png";
  }
  return output;
}
;

var GameState = function(game) {
};
var gameState = null;
var particles = null;
var textParticles = null;
GameState.prototype = {preload:function() {
}, create:function() {
  game.stage.backgroundColor = 528168;
  game.renderer.renderSession.roundPixels = true;
  ScenesTransitions.TRANSITION_LENGTH *= .4;
  game.time.advancedTiming = true;
  game.time.desiredFps = 40;
  gameState = this;
  game.cache.addBitmapFontFromAtlas("gamefont_TA", "pak1", "gamefont_TA.png", "gamefont_TA_xml", "xml", 0, 0);
  game.cache.addBitmapFontFromAtlas("gamefont_RU", "pak1", "gamefont_RU.png", "gamefont_RU_xml", "xml", 0, 0);
  game.cache.getBitmapFont("gamefont_RU").font.lineHeight = Math.floor(.7 * game.cache.getBitmapFont("gamefont_RU").font.lineHeight);
  soundManager = new SoundManager(game);
  soundManager.create();
  GameData.Load();
  scenes = [];
  scenes.push(new SceneLogo);
  scenes.push(new SceneMenu);
  scenes.push(new SceneGame);
  scenes.push(new SceneShop);
  scenes.push(new SceneConfirmation);
  scenes.push(new SceneConfirmReset);
  scenes.push(new SceneInstructions);
  scenes.push(new SceneLanguages);
  scenes.push(new SceneBackground);
  scenes.push(new SceneSounds);
  scenes.push(new SceneOverlay);
  scenes.push(new ScenePause);
  scenes.push(new SceneResult);
  scenes.push(new SceneWinner);
  if (particles != null) {
    particles.Destroy();
  }
  particles = new Particles(grpSceneGame);
  if (textParticles != null) {
    textParticles.Destroy();
  }
  textParticles = new TextParticles(grpSceneGame);
  grpPrevLangScene = grpSceneGame;
  this.game.stage.backgroundColor = 528168;
  SceneBackground.instance.ShowAnimated();
  SceneLogo.instance.ShowAnimated();
  SceneMenu.instance.ShowAnimated(100);
  paused = false;
  game.onPause.add(this.onGamePause, this);
  game.onResume.add(this.onGameResume, this);
  resizeCounter = 0;
}, update:function() {
  scenes.forEach(function(scene) {
    if (typeof scene.update === "function") {
      scene.update();
    }
  });
}, updateTexts:function() {
  scenes.forEach(function(scene) {
    if (typeof scene.updateTexts === "function") {
      scene.updateTexts();
    }
  });
}, onResolutionChange:function() {
  scenes.forEach(function(scene) {
    if (typeof scene.onResolutionChange === "function") {
      scene.onResolutionChange();
    }
  });
}, onGamePause:function() {
  if (game.device.desktop && game.device.chrome) {
    game.input.mspointer.stop();
  }
  LOG("GameState.onGamePause");
  if (paused) {
    return;
  }
  soundManager.pauseMusic();
  paused = true;
  scenes.forEach(function(scene) {
    if (typeof scene.onPause === "function") {
      scene.onPause();
    }
  });
}, onGameResume:function() {
  if (game.device.desktop && game.device.chrome) {
    game.input.mspointer.stop();
  }
  LOG("GameState.onGameResume");
  if (!paused) {
    return;
  }
  soundManager.resumeMusic();
  paused = false;
  scenes.forEach(function(scene) {
    if (typeof scene.onResume === "function") {
      scene.onResume();
    }
  });
}, render:function() {
  scenes.forEach(function(scene) {
    if (typeof scene.render === "function") {
      scene.render();
    }
  });
}};


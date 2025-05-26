var swagApiInstance = null;
var swagApiIsReady = false;
var Splash = function(game) {
};
function enterIncorrectOrientation() {
  LOG("enterIncorrectOrientation()");
  showDiv("wrongRotation");
  hideDiv("gameCanvas");
  if (!game.device.desktop && gameState != null) {
    gameState.onGamePause();
  }
}
function leaveIncorrectOrientation() {
  LOG("leaveIncorrectOrientation()");
  hideDiv("wrongRotation");
  showDiv("gameCanvas");
  if (!game.device.desktop && gameState != null) {
    gameState.onGameResume();
  }
}
Splash.prototype = {preload:function() {
  game.load.crossOrigin = "Anonymous";
  game.canvas.id = "gameCanvas";
  var gameCanvas = document.getElementById("gameCanvas");
  gameCanvas.style.position = "fixed";
  game.stage.backgroundColor = 0;
  game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
  game.scale.refresh();
  window.addEventListener("resize", function() {
    onGameResize();
  });
  onGameResize();
  loadSplash(this.game);
  if (!game.device.desktop && game.device.chrome && game.device.touch && inIframe()) {
    game.input.mouse.stop();
  }
  // swagApiInstance = SWAGAPI.getInstance({wrapper:document.getElementById("swagWrapper"), api_key:"5eda86fa271c3a371f976bb7", theme:"shockwave", debug:true});
  // swagApiInstance.startSession();
  // swagApiInstance.on("SESSION_READY", function(event) {
  //   swagApiIsReady = true;
  // });
}, create:function() {
  this.loadContinue();
}, loadContinue:function() {
  this.startPreload();
}, hideLogo:function() {
}, startPreload:function() {
  game.state.start("PreloadState");
}};
var savedClientWidth = 0;
var savedClientHeight = 0;
function onGameResize() {
  if (game === null) {
    return;
  }
  var docWidth = document.documentElement.clientWidth;
  var docHeight = document.documentElement.clientHeight;
  if (isIOS) {
    if (docWidth > docHeight) {
      docWidth = window.innerWidth;
      docHeight = window.innerHeight;
    }
  }
  if (docHeight > docWidth) {
    leaveIncorrectOrientation();
    GAME_CURRENT_ORIENTATION = ORIENTATION_PORTRAIT;
    resolutionX = game_resolutions[GAME_CURRENT_ORIENTATION].x;
    var aspect = docHeight / docWidth;
    resolutionY = resolutionX * aspect;
    if (isNaN(resolutionY)) {
      resolutionY = 0;
    }
    if (resolutionY < game_resolutions[GAME_CURRENT_ORIENTATION].yMin) {
      resolutionY = game_resolutions[GAME_CURRENT_ORIENTATION].yMin;
    }
    if (resolutionY > game_resolutions[GAME_CURRENT_ORIENTATION].yMax) {
      resolutionY = game_resolutions[GAME_CURRENT_ORIENTATION].yMax;
    }
  } else {
    enterIncorrectOrientation();
  }
  savedClientWidth = docWidth;
  savedClientHeight = docHeight;
  game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.pageAlignHorizontally = true;
  game.scale.pageAlignVertically = true;
  game.scale.refresh();
  game.scale.setGameSize(resolutionX, resolutionY);
  game.time.events.add(200, function() {
    if (gameState != null) {
      gameState.onResolutionChange();
    }
    if (preloadState != null) {
      preloadState.onResolutionChange();
    }
  });
}
function inIframe() {
  try {
    return window.self !== window.top;
  } catch (e) {
    return true;
  }
}
;

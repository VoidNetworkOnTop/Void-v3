var Preloader = function(game) {
};
var loaderPosY;
var preloadState;
Preloader.prototype = {preload:function() {
  sceneLanguages = null;
  startTime = Date.now();
  this.game.stage.backgroundColor = 0;
  preloadState = this;
  loaderPosY = this.game.world.height / 5 * 4.5;
  imgSplash = this.game.add.sprite(game.width / 2, game.height / 2, "addg_logo");
  imgSplash.anchor.set(.5);
  imgSplash.inputEnabled = true;
  imgSplash.events.onInputUp.add(function() {
    var win = window.open("http://addictinggames.com", "_blank");
    win.focus();
  });
  imgBtn = this.game.add.sprite(game.width / 2, game.height / 2, "void");
  imgBtn.anchor.set(.5);
  imgBtn.scale.x = game.width / 100 + .2;
  imgBtn.scale.y = game.height / 100 + .2;
  new Languages;
  percentageText = this.game.add.text(this.game.world.centerX, this.game.height - 20, "0 %", {font:'35px "Arial Black"', fill:"#FFFFFF"});
  percentageText.anchor.set(.5);
  this.game.load.onFileComplete.add(this.fileComplete, this);
  loadImages(this.game);
  if (SOUNDS_ENABLED) {
    loadSounds(this.game);
  }
  this.loadLanguageSettings();
}, fileComplete:function(progress, cacheKey, success, totalLoaded, totalFiles) {
  percentageText.text = progress + " %";
  if (progress >= 100) {
    this._create();
  }
}, _create:function() {
  imgBtn.inputEnabled = true;
  imgBtn.events.onInputDown.add(this.inputListener, this);
  game.add.tween(percentageText).to({alpha:0}, ScenesTransitions.TRANSITION_LENGTH * 1.4, "Linear", true, ScenesTransitions.TRANSITION_LENGTH * 3, -1, true);
  var timeDelta = Date.now() - startTime;
  if (timeDelta < 2E3) {
    game.time.events.add(2E3 - timeDelta, function() {
      this.startGame();
    }, this);
  } else {
    this.startGame();
  }
}, createMenuText:function(x, y, text) {
  var txtObj = new Phaser.Text(game, x, y, text, {fill:"#FED87F"});
  txtObj.anchor.x = getCorrectAnchorX(txtObj, .5);
  txtObj.anchor.y = getCorrectAnchorY(txtObj, .5);
  txtObj.shadowOffsetX = 3;
  txtObj.shadowOffsetY = 3;
  txtObj.shadowColor = "#660000";
  return txtObj;
}, loadLanguageSettings:function() {
  Languages.instance.language = "en";
  var systemLanguage = navigator.userLanguage || navigator.language;
  if (systemLanguage == "fr") {
    Languages.instance.language = "fr";
  }
  if (systemLanguage == "it") {
    Languages.instance.language = "it";
  }
  if (systemLanguage == "de") {
    Languages.instance.language = "de";
  }
  if (systemLanguage == "es") {
    Languages.instance.language = "es";
  }
  if (systemLanguage == "pt") {
    Languages.instance.language = "pt";
  }
}, inputListener:function() {
  this.startGame();
}, startGame:function() {
  if (sceneLanguages != null) {
    return;
  }
  imgBtn.inputEnabled = false;
  imgBtn.events.onInputDown.dispose();
  this.game.world.remove(imgSplash);
  this.game.world.remove(imgBtn);
  ScenesTransitions.hideSceneAlpha(percentageText);
  sceneLanguages = new SceneLanguages;
  sceneLanguages.ShowAnimated();
}, onResolutionChange:function() {
  loaderPosY = this.game.world.height / 5 * 4.5;
  imgSplash.reset(game.width / 2, game.height / 2);
  imgBtn.reset(game.width / 2, game.height / 2);
  imgBtn.scale.x = game.width / 100 + .2;
  imgBtn.scale.y = game.height / 100 + .2;
  percentageText.reset(this.game.world.centerX, this.game.height - 20);
  if (sceneLanguages !== undefined) {
    if (sceneLanguages != null) {
      sceneLanguages.onResolutionChange();
    }
  }
}};


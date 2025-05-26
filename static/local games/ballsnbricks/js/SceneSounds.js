var SceneSounds = function() {
  SceneSounds.instance = this;
  this.create();
};
SceneSounds.instance = null;
SceneSounds.prototype = {create:function() {
  grpSceneSounds = game.add.group();
  btnFullscreenToggle = grpSceneSounds.create(35, 35, "pak1", "full-screen.png");
  btnFullscreenToggle.anchor.set(.5);
  AddButtonEvents(btnFullscreenToggle, function() {
    this.button.buttonPressed = false;
  }, ButtonOnInputOver, ButtonOnInputOut, this.ToggleFullscreen);
  if (SOUNDS_ENABLED) {
    btnSoundsToggle = grpSceneSounds.create(game.width - 35, 35, "pak1", soundManager.musicPlaying ? "sound-on.png" : "sound-off.png");
    btnSoundsToggle.anchor.setTo(.5, .5);
    AddButtonEvents(btnSoundsToggle, this.ToggleSounds, ButtonOnInputOver, ButtonOnInputOut);
  }
  imgGemsBG = grpSceneSounds.create(game.width >> 1, 35, "pak1", "top_baner_part.png");
  imgGemsBG.anchor.set(.5);
  txtPlayerGems = game.add.bitmapText(20, 0, "gamefont_TA", "" + PlayerGems, 40);
  txtPlayerGems.anchor.set(.5);
  imgGemsBG.addChild(txtPlayerGems);
  txtBuildString = game.add.text(2, 2, "build " + GameData.BuildString + " [" + SceneSounds.instance.GetRenderTypeName(game.renderer.type) + "]" + "  " + SceneSounds.instance.GetPhaserSettingsString(), {font:"11px Arial", fill:"#FFFFFF"});
  txtBuildString.anchor.x = 0;
  txtBuildString.visible = GameData.BuildDebug;
  grpSceneSounds.add(txtBuildString);
  SceneSounds.instance.onResolutionChange();
}, update:function() {
  btnFullscreenToggle.frameName = screenfull.isFullscreen ? "full-screen2.png" : "full-screen.png";
}, onResolutionChange:function() {
  var buttonHeight = imgBannerBottom.height * .8;
  if (buttonHeight > 65) {
    buttonHeight = 65;
  }
  btnFullscreenToggle.visible = screenfull.isEnabled;
  btnFullscreenToggle.height = buttonHeight;
  btnFullscreenToggle.scale.x = btnFullscreenToggle.scale.y;
  btnFullscreenToggle.position.setTo(imgBannerBottom.height / 2, imgBannerBottom.height / 2);
  imgGemsBG.height = buttonHeight;
  imgGemsBG.scale.x = imgGemsBG.scale.y;
  imgGemsBG.position.setTo(game.width >> 1, imgBannerBottom.height / 2);
  if (SOUNDS_ENABLED) {
    btnSoundsToggle.height = buttonHeight;
    btnSoundsToggle.scale.x = btnSoundsToggle.scale.y;
    btnSoundsToggle.position.setTo(game.width - imgBannerBottom.height / 2, imgBannerBottom.height / 2);
  }
  txtBuildString.position.setTo(game.width - 5, 2);
}, ButtonsOnLeft:function() {
  btnSoundsToggle.x = 26;
}, ButtonsOnRight:function() {
  btnSoundsToggle.x = game.width - 26;
}, GetRenderTypeName:function(type) {
  switch(type) {
    case Phaser.AUTO:
      return "AUTO";
    case Phaser.CANVAS:
      return "CANVAS";
    case Phaser.WEBGL:
      return "WEBGL";
  }
  return "NaN";
}, GetPhaserSettingsString:function() {
  var retVal = game.width + "x" + game.height;
  if (!game.debug.isDisabled) {
    retVal += ", enableDebug";
  }
  if (game.debug.forceSingleUpdate) {
    retVal += ", forceSingleUpdate";
  }
  return "[" + retVal + "]";
}, ToggleSounds:function() {
  soundManager.toggleMusic(soundManager.actualMusic);
  btnSoundsToggle.frameName = soundManager.musicPlaying ? "sound-on.png" : "sound-off.png";
  btnSoundsToggle.cachedTint = -1;
  btnSoundsToggle.cachedTint = -1;
}, ToggleFullscreen:function() {
  this.button.buttonPressed = false;
  screenfull.toggle();
}};


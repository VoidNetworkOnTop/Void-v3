var SceneResult = function() {
  SceneResult.instance = this;
  this.create();
};
SceneResult.instance = null;
SceneResult.prototype = {create:function() {
  grpSceneResult = game.add.group();
  grpSceneResult.name = "grpSceneResult";
  imgResultBG = game.add.sprite(game.width >> 1, game.height >> 1, "pak1", "results.png");
  imgResultBG.anchor.set(.5);
  grpSceneResult.add(imgResultBG);
  imgResultStripe = game.add.sprite(0, -80, "pak1", "blank.png");
  imgResultStripe.width = 316;
  imgResultStripe.height = 150;
  imgResultStripe.anchor.set(.5);
  imgResultStripe.tint = 262172;
  imgResultBG.addChild(imgResultStripe);
  txtResultGems = new Phaser.Text(game, -70, -100, STR("GEMS"), {fill:"#FFFFFF", font:"20px " + GAME_FONT, align:"center"});
  txtResultGems.anchor.set(.5);
  imgResultBG.addChild(txtResultGems);
  txtResultRounds = new Phaser.Text(game, 70, -100, STR("ROUNDS"), {fill:"#FFFFFF", font:"20px " + GAME_FONT, align:"center"});
  txtResultRounds.anchor.set(.5);
  imgResultBG.addChild(txtResultRounds);
  txtResultGemsVal = new Phaser.Text(game, -70, -100 + 50, "+0", {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtResultGemsVal.anchor.set(.5);
  imgResultBG.addChild(txtResultGemsVal);
  txtResultRoundsVal = new Phaser.Text(game, 70, -100 + 50, "10", {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtResultRoundsVal.anchor.set(.5);
  imgResultBG.addChild(txtResultRoundsVal);
  txtResultTitle = new Phaser.Text(game, 0, -210, STR("RESULT"), {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtResultTitle.anchor.set(.5);
  imgResultBG.addChild(txtResultTitle);
  btnResultRestart = game.add.sprite(0, 60, "pak1", "button.png");
  btnResultRestart.anchor.set(.5);
  btnResultRestart.scale.set(.6);
  imgResultBG.addChild(btnResultRestart);
  AddButtonEvents(btnResultRestart, SceneResult.instance.OnPressedRestart, ButtonOnInputOver, ButtonOnInputOut);
  txtResultRestart = new Phaser.Text(game, 0, 0, STR("RESTART"), {fill:"#000000", font:"30px " + GAME_FONT, align:"center"});
  txtResultRestart.anchor.set(.5);
  btnResultRestart.addChild(txtResultRestart);
  btnResultQuit = game.add.sprite(0, 160, "pak1", "button.png");
  btnResultQuit.anchor.set(.5);
  btnResultQuit.width = btnResultRestart.width;
  btnResultQuit.height = btnResultRestart.height;
  imgResultBG.addChild(btnResultQuit);
  AddButtonEvents(btnResultQuit, this.OnPressedPauseToMenu, ButtonOnInputOver, ButtonOnInputOut);
  txtResultMenu = new Phaser.Text(game, 0, 0, STR("MENU"), {fill:"#000000", font:"30px " + GAME_FONT, align:"center"});
  txtResultMenu.anchor.set(.5);
  btnResultQuit.addChild(txtResultMenu);
  grpSceneResult.visible = false;
  this.updateTexts();
  this.onResolutionChange();
}, onResolutionChange:function() {
  imgResultBG.y = game.height >> 1;
}, updateTexts:function() {
  setFontText(txtResultTitle, STR("RESULT"), true);
  setFontText(txtResultGems, STR("GEMS"), true);
  setFontText(txtResultRestart, STR("RESTART"), true);
  setFontText(txtResultRounds, STR("ROUNDS"), true);
  setFontText(txtResultMenu, STR("MENU"), true);
}, OnPressedRestart:function() {
  soundManager.playSound("menu-click1");
  SceneResult.instance.HideAnimated();
  SceneLogo.instance.HideAnimated();
  SceneOverlay.instance.HideAnimated();
  SceneGame.instance.RestartGame();
  soundManager.playMusic("music_game");
}, OnPressedPauseToMenu:function() {
  soundManager.playSound("menu-click1");
  SceneOverlay.instance.HideAnimated();
  SceneResult.instance.HideAnimated();
  SceneGame.instance.HideAnimated();
  SceneLogo.instance.ShowAnimated();
  SceneMenu.instance.ShowAnimated();
  if (grpSceneBottomGameButtons.visible) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameButtons);
  }
  if (grpSceneBottomGameRunningButtons.visible) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameRunningButtons);
  }
}, ShowAnimated:function() {
  this.onResolutionChange();
  soundManager.playMusic("music_menu");
  soundManager.playSound("menu-click1");
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Back.Out;
  ScenesTransitions.showSceneFromBottom(grpSceneResult, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneToBottom(grpSceneResult, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


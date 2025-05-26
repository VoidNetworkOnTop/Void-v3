var ScenePause = function() {
  ScenePause.instance = this;
  this.create();
};
ScenePause.instance = null;
ScenePause.prototype = {create:function() {
  grpScenePause = game.add.group();
  grpScenePause.name = "grpScenePause";
  imgPauseBG = game.add.sprite(game.width >> 1, game.height >> 1, "pak1", "quit_buy.png");
  imgPauseBG.anchor.set(.5);
  grpScenePause.add(imgPauseBG);
  txtPauseTitle = new Phaser.Text(game, 0, -120, STR("PAUSED"), {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtPauseTitle.anchor.set(.5);
  imgPauseBG.addChild(txtPauseTitle);
  btnPauseResume = game.add.sprite(0, -20, "pak1", "button.png");
  btnPauseResume.anchor.set(.5);
  btnPauseResume.scale.set(.6);
  imgPauseBG.addChild(btnPauseResume);
  AddButtonEvents(btnPauseResume, ScenePause.instance.OnPressedResume, ButtonOnInputOver, ButtonOnInputOut);
  txtPauseResume = new Phaser.Text(game, 0, 0, STR("RESUME"), {fill:"#000000", font:"30px " + GAME_FONT, align:"center"});
  txtPauseResume.anchor.set(.5);
  btnPauseResume.addChild(txtPauseResume);
  btnPauseQuit = game.add.sprite(0, 80, "pak1", "button.png");
  btnPauseQuit.anchor.set(.5);
  btnPauseQuit.width = btnPauseResume.width;
  btnPauseQuit.height = btnPauseResume.height;
  imgPauseBG.addChild(btnPauseQuit);
  AddButtonEvents(btnPauseQuit, this.OnPressedPauseToMenu, ButtonOnInputOver, ButtonOnInputOut);
  txtPauseMenu = new Phaser.Text(game, 0, 0, STR("MENU"), {fill:"#000000", font:"30px " + GAME_FONT, align:"center"});
  txtPauseMenu.anchor.set(.5);
  btnPauseQuit.addChild(txtPauseMenu);
  grpScenePause.visible = false;
  this.updateTexts();
  this.onResolutionChange();
}, onResolutionChange:function() {
  imgPauseBG.y = game.height >> 1;
}, updateTexts:function() {
  setFontText(txtPauseTitle, STR("PAUSED"), true);
  setFontText(txtPauseResume, STR("RESUME"), true);
  setFontText(txtPauseMenu, STR("MENU"), true);
}, OnPressedResume:function() {
  soundManager.playSound("menu-click1");
  ScenePause.instance.HideAnimated();
  SceneLogo.instance.HideAnimated();
  SceneOverlay.instance.HideAnimated();
  SceneGame.instance.ResumeGame();
  soundManager.playMusic("music_game");
}, OnPressedPauseToMenu:function() {
  soundManager.playSound("menu-click1");
  if (grpSceneConfirmation.visible) {
    SceneConfirmation.instance.HideAnimated();
  }
  SceneOverlay.instance.HideAnimated();
  ScenePause.instance.HideAnimated();
  SceneGame.instance.HideAnimated();
  SceneLogo.instance.ShowAnimated();
  SceneMenu.instance.ShowAnimated();
  if (grpSceneBottomGameButtons.visible) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameButtons);
  }
  if (grpSceneBottomGameRunningButtons.visible) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameRunningButtons);
  }
  onGameOver(GAME_OVER_BY_USER);
}, ShowAnimated:function() {
  this.onResolutionChange();
  soundManager.playMusic("music_menu");
  soundManager.playSound("menu-click1");
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Sinusoidal.Out;
  ScenesTransitions.showSceneAlpha(grpScenePause, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Sinusoidal.Out;
  ScenesTransitions.hideSceneAlpha(grpScenePause, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


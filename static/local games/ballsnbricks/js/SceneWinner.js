var SceneWinner = function() {
  SceneWinner.instance = this;
  this.create();
};
SceneWinner.instance = null;
SceneWinner.prototype = {create:function() {
  grpSceneWinner = game.add.group();
  grpSceneWinner.name = "grpSceneWinner";
  imgWinnerBG = game.add.sprite(game.width >> 1, game.height >> 1, "pak1", "results.png");
  imgWinnerBG.anchor.set(.5);
  grpSceneWinner.add(imgWinnerBG);
  imgWinnerStripe = game.add.sprite(0, -80, "pak1", "blank.png");
  imgWinnerStripe.width = 316;
  imgWinnerStripe.height = 150;
  imgWinnerStripe.anchor.set(.5);
  imgWinnerStripe.tint = 262172;
  imgWinnerBG.addChild(imgWinnerStripe);
  txtWinnerGems = new Phaser.Text(game, -70, -100, STR("GEMS"), {fill:"#FFFFFF", font:"20px " + GAME_FONT, align:"center"});
  txtWinnerGems.anchor.set(.5);
  imgWinnerBG.addChild(txtWinnerGems);
  txtWinnerBonus = new Phaser.Text(game, 70, -100, STR("BONUS"), {fill:"#FFFFFF", font:"20px " + GAME_FONT, align:"center"});
  txtWinnerBonus.anchor.set(.5);
  imgWinnerBG.addChild(txtWinnerBonus);
  txtWinnerGemsVal = new Phaser.Text(game, -70, -100 + 50, "+0", {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtWinnerGemsVal.anchor.set(.5);
  imgWinnerBG.addChild(txtWinnerGemsVal);
  txtWinnerBonusVal = new Phaser.Text(game, 70, -100 + 50, "+100", {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtWinnerBonusVal.anchor.set(.5);
  imgWinnerBG.addChild(txtWinnerBonusVal);
  txtWinnerTitle = new Phaser.Text(game, 0, -210, STR("CONGRATULATION"), {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtWinnerTitle.anchor.set(.5);
  imgWinnerBG.addChild(txtWinnerTitle);
  updateBitmapTextToWidth(txtWinnerTitle, 20, 260);
  txtWinnerTryHigherDiff = new Phaser.Text(game, 0, 60, STR("TRY_HIGHER_DIFF"), {fill:"#FFFFFF", font:"20px " + GAME_FONT, align:"center"});
  txtWinnerTryHigherDiff.anchor.set(.5);
  imgWinnerBG.addChild(txtWinnerTryHigherDiff);
  updateBitmapTextToWidth(txtWinnerTryHigherDiff, 20, 220);
  btnWinnerQuit = game.add.sprite(0, 160, "pak1", "button.png");
  btnWinnerQuit.anchor.set(.5);
  btnWinnerQuit.scale.set(.6);
  imgWinnerBG.addChild(btnWinnerQuit);
  AddButtonEvents(btnWinnerQuit, this.OnPressedPauseToMenu, ButtonOnInputOver, ButtonOnInputOut);
  txtWinnerMenu = new Phaser.Text(game, 0, 0, STR("MENU"), {fill:"#000000", font:"30px " + GAME_FONT, align:"center"});
  txtWinnerMenu.anchor.set(.5);
  btnWinnerQuit.addChild(txtWinnerMenu);
  grpSceneWinner.visible = false;
  this.onResolutionChange();
}, onResolutionChange:function() {
  imgWinnerBG.y = game.height >> 1;
}, updateTexts:function() {
  setFontText(txtWinnerGems, STR("GEMS"), true);
  setFontText(txtWinnerMenu, STR("MENU"), true);
  setFontText(txtWinnerBonus, STR("BONUS"), true);
  setFontText(txtWinnerTitle, STR("CONGRATULATION"), true);
  setFontText(txtWinnerTryHigherDiff, STR("TRY_HIGHER_DIFF"), true);
  updateBitmapTextToWidth(txtWinnerTitle, 20, 260);
  updateBitmapTextToWidth(txtWinnerTryHigherDiff, 20, 220);
}, OnPressedRestart:function() {
  soundManager.playSound("menu-click1");
  SceneWinner.instance.HideAnimated();
  SceneLogo.instance.HideAnimated();
  SceneOverlay.instance.HideAnimated();
  SceneGame.instance.RestartGame();
  soundManager.playMusic("music_game");
}, OnPressedPauseToMenu:function() {
  soundManager.playSound("menu-click1");
  SceneOverlay.instance.HideAnimated();
  SceneWinner.instance.HideAnimated();
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
  ScenesTransitions.showSceneFromBottom(grpSceneWinner, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneToBottom(grpSceneWinner, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


var SceneConfirmReset = function() {
  SceneConfirmReset.instance = this;
  this.create();
};
SceneConfirmReset.instance = null;
SceneConfirmReset.prototype = {create:function() {
  grpSceneConfirmReset = game.add.group();
  grpSceneConfirmReset.name = "grpSceneConfirmReset";
  imgConfirmResetOverlay = grpSceneConfirmReset.create(game.width >> 1, game.height >> 1, "pak1", "blank.png");
  imgConfirmResetOverlay.anchor.set(.5);
  imgConfirmResetOverlay.width = game.width;
  imgConfirmResetOverlay.height = game.height;
  imgConfirmResetOverlay.alpha = .8;
  imgConfirmResetOverlay.tint = 1907997;
  imgConfirmResetOverlay.inputEnabled = true;
  imgConfirmResetBG = game.add.sprite(game.width >> 1, game.height >> 1, "pak1", "quit_buy.png");
  imgConfirmResetBG.anchor.set(.5);
  grpSceneConfirmReset.add(imgConfirmResetBG);
  txtConfirmResetTitle = new Phaser.Text(game, 0, -120, STR("CONFIRM_RESET_TITLE"), {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtConfirmResetTitle.anchor.set(.5);
  txtConfirmResetTitle.lineSpacing = -8;
  imgConfirmResetBG.addChild(txtConfirmResetTitle);
  txtConfirmResetItem = new Phaser.Text(game, 0, -5, STR("CONFIRM_RESET_TEXT"), {fill:"#EAB042", font:"15px " + GAME_FONT, align:"center"});
  txtConfirmResetItem.anchor.set(.5);
  imgConfirmResetBG.addChild(txtConfirmResetItem);
  btnConfirmResetConfirm = game.add.sprite(0, 95, "pak1", "button.png");
  btnConfirmResetConfirm.anchor.set(.5);
  btnConfirmResetConfirm.scale.set(.5);
  imgConfirmResetBG.addChild(btnConfirmResetConfirm);
  AddButtonEvents(btnConfirmResetConfirm, SceneConfirmReset.instance.OnPressedConfirm, ButtonOnInputOver, ButtonOnInputOut);
  txtConfirmResetConfirm = new Phaser.Text(game, 0, 0, STR("CONFIRM"), {fill:"#000000", font:"30px " + GAME_FONT, align:"center"});
  txtConfirmResetConfirm.anchor.set(.5);
  btnConfirmResetConfirm.addChild(txtConfirmResetConfirm);
  grpSceneConfirmReset.visible = false;
  this.onResolutionChange();
  this.updateTexts();
}, onResolutionChange:function() {
  imgConfirmResetBG.y = game.height >> 1;
  imgConfirmResetOverlay.reset(game.width >> 1, game.height >> 1);
  imgConfirmResetOverlay.width = game.width;
  imgConfirmResetOverlay.height = game.height;
}, updateTexts:function() {
  setFontText(txtConfirmResetTitle, STR("CONFIRM_RESET_TITLE"), true);
  setFontText(txtConfirmResetItem, STR("CONFIRM_RESET_TEXT"), true);
  setFontText(txtConfirmResetConfirm, STR("CONFIRM"), true);
}, OnPressedConfirm:function() {
  soundManager.playSound("menu-click1");
  CheckpointLevel = 0;
  Difficulty = 1;
  GameData.Save();
  SceneConfirmReset.instance.HideAnimated();
  ScenesTransitions.hideSceneAlpha(grpSceneBottomBackButtons);
  ScenesTransitions.showSceneAlpha(grpSceneBottomMenuButtons);
  var tmp = "";
  for (var i = 0;i < Difficulty - 1;i++) {
    tmp += "*";
  }
  txtMenuCheckpoint.text = STR("LEVEL") + " " + (CheckpointLevel + 1) + tmp;
  txtMenuCheckpoint.visible = CheckpointLevel > 0;
  btnMenuCheckpoint.visible = txtMenuCheckpoint.visible;
}, ShowAnimated:function() {
  this.onResolutionChange();
  soundManager.playMusic("music_menu");
  soundManager.playSound("menu-click1");
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
  ScenesTransitions.showSceneAlpha(grpSceneConfirmReset, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneAlpha(grpSceneConfirmReset, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


var SceneConfirmation = function() {
  SceneConfirmation.instance = this;
  this.create();
};
SceneConfirmation.instance = null;
SceneConfirmation.prototype = {create:function() {
  grpSceneConfirmation = game.add.group();
  grpSceneConfirmation.name = "grpSceneConfirmation";
  imgOverlay = grpSceneConfirmation.create(game.width >> 1, game.height >> 1, "pak1", "blank.png");
  imgOverlay.anchor.set(.5);
  imgOverlay.width = game.width;
  imgOverlay.height = game.height;
  imgOverlay.alpha = .8;
  imgOverlay.tint = 1907997;
  imgOverlay.inputEnabled = true;
  imgConfirmationBG = game.add.sprite(game.width >> 1, game.height >> 1, "pak1", "quit_buy.png");
  imgConfirmationBG.anchor.set(.5);
  grpSceneConfirmation.add(imgConfirmationBG);
  txtConfirmationTitle = new Phaser.Text(game, 0, -120, STR("CONFIRM_BUY"), {fill:"#EAB042", font:"20px " + GAME_FONT, align:"center"});
  txtConfirmationTitle.anchor.set(.5);
  imgConfirmationBG.addChild(txtConfirmationTitle);
  imgConfirmationItem = game.add.sprite(0, -40, "pak1", "ball6.png");
  imgConfirmationItem.anchor.set(.5);
  imgConfirmationItem.scale.set(1.4);
  imgConfirmationBG.addChild(imgConfirmationItem);
  txtConfirmationItem = new Phaser.Text(game, 0, 10, "CAPTION1", {fill:"#EAB042", font:"15px " + GAME_FONT, align:"center"});
  txtConfirmationItem.lineSpacing = -10;
  txtConfirmationItem.anchor.set(.5);
  imgConfirmationBG.addChild(txtConfirmationItem);
  txtConfirmationPrice = new Phaser.Text(game, 0, 40, "100", {fill:"#FFFFFF", font:"12px " + GAME_FONT, align:"center"});
  txtConfirmationPrice.anchor.set(.4);
  imgConfirmationBG.addChild(txtConfirmationPrice);
  imgConfirmationPrice = game.add.sprite(-28, 38, "pak1", "dia.png");
  imgConfirmationPrice.anchor.set(.5);
  imgConfirmationPrice.scale.set(.6);
  imgConfirmationBG.addChild(imgConfirmationPrice);
  btnConfirmationConfirm = game.add.sprite(0, 95, "pak1", "button.png");
  btnConfirmationConfirm.anchor.set(.5);
  btnConfirmationConfirm.scale.set(.5);
  imgConfirmationBG.addChild(btnConfirmationConfirm);
  AddButtonEvents(btnConfirmationConfirm, SceneConfirmation.instance.OnPressedConfirm, ButtonOnInputOver, ButtonOnInputOut);
  txtConfirmationConfirm = new Phaser.Text(game, 0, 0, STR("CONFIRM"), {fill:"#000000", font:"30px " + GAME_FONT, align:"center"});
  txtConfirmationConfirm.anchor.set(.5);
  btnConfirmationConfirm.addChild(txtConfirmationConfirm);
  grpSceneConfirmation.visible = false;
  this.updateTexts();
  this.onResolutionChange();
}, onResolutionChange:function() {
  imgConfirmationBG.y = game.height >> 1;
  imgOverlay.reset(game.width >> 1, game.height >> 1);
  imgOverlay.width = game.width;
  imgOverlay.height = game.height;
}, updateTexts:function() {
  setFontText(txtConfirmationTitle, STR("CONFIRM_BUY"), true);
  updateBitmapTextToWidth(txtConfirmationTitle, 20, 260);
  setFontText(txtConfirmationConfirm, STR("CONFIRM"), true);
  updateBitmapTextToWidth(txtConfirmationConfirm, 30, 200);
}, OnPressedConfirm:function() {
  soundManager.playSound("menu-click1");
  PlayerGems -= SceneConfirmation.instance.item.price;
  soundManager.playSound("pay");
  txtPlayerGems.text = "" + PlayerGems;
  if (SceneConfirmation.instance.item.idx < 1E3) {
    BallsPrizes[SceneConfirmation.instance.item.idx] = 0;
    SceneShop.instance.UpdateItem(SceneConfirmation.instance.item);
  }
  if (SceneConfirmation.instance.item.idx == 1E3) {
    SceneGame.instance.BonusBreakBottomBlocks();
  }
  if (SceneConfirmation.instance.item.idx == 1001) {
    SceneGame.instance.BonusHalveAllBlocks();
  }
  if (SceneConfirmation.instance.item.idx == 1002) {
    SceneGame.instance.BonusUltraBall();
  }
  GameData.Save();
  SceneConfirmation.instance.HideAnimated();
  if (SceneConfirmation.instance.item.idx >= 1E3) {
    ScenesTransitions.showSceneAlpha(grpSceneBottomGameButtons);
    ScenesTransitions.hideSceneAlpha(grpSceneBottomBackButtons);
  }
}, OnPressedPauseToMenu:function() {
  soundManager.playSound("menu-click1");
  SceneOverlay.instance.HideAnimated();
  SceneConfirmation.instance.HideAnimated();
  SceneGame.instance.HideAnimated();
  SceneLogo.instance.ShowAnimated();
  SceneMenu.instance.ShowAnimated();
  if (grpSceneBottomGameButtons.visible) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameButtons);
  }
  if (grpSceneBottomGameRunningButtons.visible) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameRunningButtons);
  }
}, ShowAnimated:function(item) {
  this.onResolutionChange();
  SceneConfirmation.instance.item = item;
  if (SceneConfirmation.instance.item.idx >= 1E3) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameButtons);
  }
  imgConfirmationItem.frameName = item.imgBall.frameName;
  txtConfirmationItem.text = item.txtCaption.text;
  txtConfirmationPrice.text = item.price + "";
  var totalW = txtConfirmationPrice.width + 5 + imgConfirmationPrice.width;
  imgConfirmationPrice.x = -totalW / 2;
  txtConfirmationPrice.x = imgConfirmationPrice.x + imgConfirmationPrice.width + 5;
  soundManager.playMusic("music_menu");
  soundManager.playSound("menu-click1");
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
  ScenesTransitions.showSceneAlpha(grpSceneConfirmation, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneAlpha(grpSceneConfirmation, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


var SceneBackground = function() {
  SceneBackground.instance = this;
  this.create();
};
SceneBackground.instance = null;
SceneBackground.prototype = {create:function() {
  grpSceneBackgroundCenter = game.add.group();
  imgBannerTop = grpSceneBackgroundCenter.create(game.width >> 1, 0, "pak1", "banner.png");
  imgBannerTop.width = game.width;
  imgBannerTop.scale.y = imgBannerTop.scale.x;
  imgBannerTop.anchor.setTo(.5, 0);
  imgBannerBottom = grpSceneBackgroundCenter.create(game.width >> 1, game.height, "pak1", "banner.png");
  imgBannerBottom.width = game.width;
  imgBannerBottom.scale.y = imgBannerBottom.scale.x;
  imgBannerBottom.anchor.setTo(.5, 1);
  grpSceneBottomMenuButtons = game.add.group();
  grpSceneBackgroundCenter.addChild(grpSceneBottomMenuButtons);
  grpSceneBottomMenuButtons.visible = false;
  btnMenuInstructions = game.add.sprite((game.width >> 1) + 60, (game.height >> 1) + 280, "pak1", "info.png");
  btnMenuInstructions.anchor.setTo(.5, .5);
  grpSceneBottomMenuButtons.add(btnMenuInstructions);
  AddButtonEvents(btnMenuInstructions, SceneMenu.instance.OnPressedPauseInstructions, ButtonOnInputOver, ButtonOnInputOut);
  btnMenuLang = game.add.sprite((game.width >> 1) - 60, (game.height >> 1) + 280, "pak1", "flag1.png");
  btnMenuLang.width = btnMenuInstructions.width;
  btnMenuLang.height = btnMenuInstructions.width;
  btnMenuLang.anchor.set(.5);
  grpSceneBottomMenuButtons.add(btnMenuLang);
  AddButtonEvents(btnMenuLang, SceneMenu.instance.OnPressedPauseLang, ButtonOnInputOver, ButtonOnInputOut);
  SceneMenu.instance.UpdateLangIcon(btnMenuLang);
  grpSceneBottomGameButtons = game.add.group();
  grpSceneBackgroundCenter.addChild(grpSceneBottomGameButtons);
  grpSceneBottomGameButtons.visible = false;
  btnGamePause1 = grpSceneBottomGameButtons.create(0, 0, "pak1", "pause.png");
  btnGamePause1.anchor.set(.5);
  AddButtonEvents(btnGamePause1, function() {
    SceneGame.instance.OnPressedFromGameToPause();
  }.bind(this), ButtonOnInputOver, ButtonOnInputOut);
  btnGameBonus1 = grpSceneBottomGameButtons.create(0, 0, "pak1", "break_row.png");
  btnGameBonus1.anchor.set(.5);
  btnGameBonus2 = grpSceneBottomGameButtons.create(0, 0, "pak1", "halve_hp.png");
  btnGameBonus2.anchor.setTo(.5, .5);
  btnGameBonus3 = grpSceneBottomGameButtons.create(0, 0, "pak1", "ultra_ball.png");
  btnGameBonus3.anchor.setTo(.5, .5);
  grpSceneBottomGameRunningButtons = game.add.group();
  grpSceneBackgroundCenter.addChild(grpSceneBottomGameRunningButtons);
  grpSceneBottomGameRunningButtons.visible = false;
  btnGamePause2 = grpSceneBottomGameRunningButtons.create(0, 0, "pak1", "pause.png");
  btnGamePause2.anchor.set(.5);
  AddButtonEvents(btnGamePause2, function() {
    SceneGame.instance.OnPressedFromGameToPause();
  }.bind(this), ButtonOnInputOver, ButtonOnInputOut);
  btnGameNextLevel = grpSceneBottomGameRunningButtons.create(0, 0, "pak1", "endround.png");
  btnGameNextLevel.anchor.set(.5);
  AddButtonEvents(btnGameNextLevel, SceneGame.instance.RecallAllBalls, ButtonOnInputOver, ButtonOnInputOut);
  btnGameFWD = grpSceneBottomGameRunningButtons.create(0, 0, "pak1", "speedbutt.png");
  btnGameFWD.anchor.setTo(.5, .5);
  AddButtonEvents(btnGameFWD, function() {
    FWD = true;
  }, ButtonOnInputOver, ButtonOnInputOut);
  grpSceneBottomBackButtons = game.add.group();
  grpSceneBackgroundCenter.addChild(grpSceneBottomBackButtons);
  grpSceneBottomBackButtons.visible = false;
  btnCommonBack = grpSceneBottomBackButtons.create(0, 0, "pak1", "back.png");
  btnCommonBack.anchor.setTo(.5, .5);
  AddButtonEvents(btnCommonBack, this.OnPressedCloseButton, ButtonOnInputOver, ButtonOnInputOut);
  grpSceneBackgroundCenter.visible = false;
  this.onResolutionChange();
}, OnPressedCloseButton:function() {
  soundManager.playSound("menu-click1");
  if (grpSceneConfirmReset.visible) {
    ScenesTransitions.hideSceneAlpha(grpSceneBottomBackButtons);
    ScenesTransitions.showSceneAlpha(grpSceneBottomMenuButtons);
    SceneConfirmReset.instance.HideAnimated();
    return;
  }
  if (grpSceneConfirmation.visible) {
    SceneConfirmation.instance.HideAnimated();
    if (SceneConfirmation.instance.item.idx >= 1E3) {
      soundManager.playMusic("music_game");
      ScenesTransitions.showSceneAlpha(grpSceneBottomGameButtons);
      ScenesTransitions.hideSceneAlpha(grpSceneBottomBackButtons);
    }
    return;
  }
  if (grpSceneShop.visible) {
    SceneShop.instance.HideAnimated();
    SceneLogo.instance.ShowAnimated();
    SceneMenu.instance.ShowAnimated();
  }
  if (grpSceneInstructions.visible) {
    SceneInstructions.instance.HideAnimated();
    SceneToReturnFromInstructions.ShowAnimated();
    if (SceneToReturnFromInstructions == SceneMenu.instance) {
      SceneLogo.instance.ShowAnimated();
    }
  }
}, onResolutionChange:function() {
  var bannerHeight = (game.height - MIN_GAME_HEIGHT) / 2;
  imgBannerTop.x = game.width >> 1;
  imgBannerTop.y = 0;
  imgBannerTop.height = bannerHeight;
  imgBannerTop.scale.x = imgBannerTop.scale.y;
  imgBannerBottom.x = game.width >> 1;
  imgBannerBottom.y = game.height;
  imgBannerBottom.height = bannerHeight;
  imgBannerBottom.scale.x = imgBannerBottom.scale.y;
  var buttonHeight = imgBannerBottom.height * .8;
  if (buttonHeight > 65) {
    buttonHeight = 65;
  }
  btnGamePause1.height = buttonHeight;
  btnGamePause1.scale.x = btnGamePause1.scale.y;
  btnGamePause1.position.setTo(imgBannerBottom.height / 2, game.height - imgBannerBottom.height / 2);
  btnGameNextLevel.height = buttonHeight;
  btnGameNextLevel.scale.x = btnGameNextLevel.scale.y;
  btnGameNextLevel.position.setTo(game.width / 2, game.height - imgBannerBottom.height / 2);
  btnGameFWD.height = buttonHeight;
  btnGameFWD.scale.x = btnGameFWD.scale.y;
  btnGameFWD.position.setTo(game.width - imgBannerBottom.height / 2, game.height - imgBannerBottom.height / 2);
  btnGamePause2.height = buttonHeight;
  btnGamePause2.scale.x = btnGamePause2.scale.y;
  btnGamePause2.position.setTo(imgBannerBottom.height / 2, game.height - imgBannerBottom.height / 2);
  btnGameBonus1.height = buttonHeight;
  btnGameBonus1.scale.x = btnGameBonus1.scale.y;
  btnGameBonus1.position.setTo(game.width / 7 * 2.5, game.height - imgBannerBottom.height / 2);
  btnGameBonus1.imgBall = {frameName:"break_row2.png"};
  btnGameBonus1.txtCaption = {text:STR("BONUS1")};
  btnGameBonus1.price = 10;
  btnGameBonus1.idx = 1E3;
  AddButtonEvents(btnGameBonus1, this.BuySelectedBonus, ButtonOnInputOver, ButtonOnInputOut);
  btnGameBonus2.height = buttonHeight;
  btnGameBonus2.scale.x = btnGameBonus2.scale.y;
  btnGameBonus2.position.setTo(game.width / 7 * 4.5, game.height - imgBannerBottom.height / 2);
  btnGameBonus2.imgBall = {frameName:"halve_hp2.png"};
  btnGameBonus2.txtCaption = {text:STR("BONUS2")};
  btnGameBonus2.price = 10;
  btnGameBonus2.idx = 1001;
  AddButtonEvents(btnGameBonus2, this.BuySelectedBonus, ButtonOnInputOver, ButtonOnInputOut);
  btnGameBonus3.height = buttonHeight;
  btnGameBonus3.scale.x = btnGameBonus3.scale.y;
  btnGameBonus3.position.setTo(game.width - imgBannerBottom.height / 2, game.height - imgBannerBottom.height / 2);
  btnGameBonus3.imgBall = {frameName:"ultra_ball2.png"};
  btnGameBonus3.txtCaption = {text:STR("BONUS3")};
  btnGameBonus3.price = 20;
  btnGameBonus3.idx = 1002;
  AddButtonEvents(btnGameBonus3, this.BuySelectedBonus, ButtonOnInputOver, ButtonOnInputOut);
  btnMenuInstructions.height = buttonHeight;
  btnMenuInstructions.scale.x = btnMenuInstructions.scale.y;
  btnMenuInstructions.position.setTo(game.width - imgBannerBottom.height / 2, game.height - imgBannerBottom.height / 2);
  btnMenuLang.height = buttonHeight * .85;
  btnMenuLang.scale.x = btnMenuLang.scale.y;
  btnMenuLang.position.setTo(game.width / 2, game.height - imgBannerBottom.height / 2);
  btnCommonBack.height = buttonHeight;
  btnCommonBack.scale.x = btnCommonBack.scale.y;
  btnCommonBack.position.setTo(imgBannerBottom.height / 2, game.height - imgBannerBottom.height / 2);
}, BuySelectedBonus:function() {
  if (PlayerGems < this.button.price) {
    SetPoingScaleTween(txtPlayerGems, 1500);
    return;
  }
  ScenesTransitions.showSceneAlpha(grpSceneBottomBackButtons);
  SceneConfirmation.instance.ShowAnimated(this.button);
}, updateTexts:function() {
  btnGameBonus1.txtCaption = {text:STR("BONUS1")};
  btnGameBonus2.txtCaption = {text:STR("BONUS2")};
  btnGameBonus3.txtCaption = {text:STR("BONUS3")};
  SceneMenu.instance.UpdateLangIcon(btnMenuLang);
}, update:function() {
}, ShowAnimated:function() {
  soundManager.playSound("menu-click1");
  ScenesTransitions.transitionStarted();
  gameRunning = false;
  var LEN = ScenesTransitions.TRANSITION_LENGTH * 4;
  ScenesTransitions.showSceneAlpha(grpSceneBackgroundCenter, 0, LEN, ScenesTransitions.transitionFinished);
}};


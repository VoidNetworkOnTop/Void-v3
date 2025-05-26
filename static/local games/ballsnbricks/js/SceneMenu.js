var SceneMenu = function() {
  SceneMenu.instance = this;
  this.create();
};
SceneMenu.instance = null;
SceneMenu.prototype = {create:function() {
  grpSceneMenu = game.add.group();
  grpSceneMenu.name = "grpSceneMenu";
  btnMenuPlay = game.add.sprite(game.width >> 1, (game.height >> 1) + 100, "pak1", "play.png");
  btnMenuPlay.anchor.set(.5);
  btnMenuPlay.scale.set(1);
  grpSceneMenu.add(btnMenuPlay);
  AddButtonEvents(btnMenuPlay, this.OnPressedPlay, ButtonOnInputOver, ButtonOnInputOut);
  txtMenuCheckpoint = game.add.bitmapText(game.width >> 1, 75, "gamefont_TA", "LEVEL 120", 30);
  txtMenuCheckpoint.tint = 16777215;
  txtMenuCheckpoint.anchor.set(.5);
  grpSceneMenu.add(txtMenuCheckpoint);
  btnMenuCheckpoint = game.add.sprite(60, 0, "pak1", "x.png");
  btnMenuCheckpoint.anchor.setTo(1.4, .5);
  txtMenuCheckpoint.addChild(btnMenuCheckpoint);
  AddButtonEvents(btnMenuCheckpoint, this.OnPressedResetCheckpoint, ButtonOnInputOver, ButtonOnInputOut);
  btnMenuSkins = game.add.sprite(game.width >> 1, (game.height >> 1) + 150, "pak1", "skin_butt.png");
  btnMenuSkins.anchor.set(.5);
  btnMenuSkins.scale.set(1);
  grpSceneMenu.add(btnMenuSkins);
  AddButtonEvents(btnMenuSkins, this.OnPressedSkins, ButtonOnInputOver, ButtonOnInputOut);
  agSideLogo = game.add.sprite(0, game.height >> 1, "addg_logo_side");
  agSideLogo.anchor.set(.9, .5);
  agSideLogo.scale.set(.42);
  agSideLogo.scale.y *= -1;
  agSideLogo.scale.x *= -1;
  grpSceneMenu.addChild(agSideLogo);
  agSideLogo.inputEnabled = true;
  agSideLogo.events.onInputUp.add(function() {
    var win = window.open("http://addictinggames.com", "_blank");
    win.focus();
  });
  menuLdrbrd = game.add.sprite(0, 0, "ldrbtn");
  menuLdrbrd.anchor.set(.5);
  menuLdrbrd.y -= menuLdrbrd.height >> 1;
  menuLdrbrd.isClickable = true;
  menuLdrbrd.inputEnabled = true;
  menuLdrbrd.events.onInputUp.add(function(btn) {
    if (swagApiIsReady) {
      swagApiInstance.showDialog("scores", {title:"Best Scores", level_key:"score", period:"alltime", value_formatter:""});
    }
    btn.tint = 16777215;
  }, this);
  menuLdrbrd.events.onInputOver.add(function(btn) {
    btn.tint = 10066329;
  }, this);
  menuLdrbrd.events.onInputOut.add(function(btn) {
    btn.tint = 16777215;
  }, this);
  grpSceneMenu.add(menuLdrbrd);
  grpSceneMenu.visible = false;
  this.onResolutionChange();
  this.updateTexts();
}, onResolutionChange:function() {
  txtMenuCheckpoint.visible = CheckpointLevel > 0;
  btnMenuCheckpoint.visible = txtMenuCheckpoint.visible;
  setBitmapText(txtMenuCheckpoint, STR("LEVEL") + " " + CheckpointLevel, true);
  txtMenuCheckpoint.update();
  btnMenuPlay.position.setTo(game.width >> 1, (game.height >> 1) + 30);
  txtMenuCheckpoint.position.setTo(game.width >> 1, (game.height >> 1) + 120);
  btnMenuSkins.position.setTo(game.width >> 1, btnMenuPlay.y + 170);
  txtMenuCheckpoint.x = game.width / 2;
  btnMenuCheckpoint.x = 0;
  btnMenuCheckpoint.x = -txtMenuCheckpoint.width / 2;
  menuLdrbrd.position.set(btnMenuPlay.x + btnMenuPlay.width, btnMenuPlay.y);
  agSideLogo.position.set(0, game.height >> 1);
}, updateTexts:function() {
  SceneMenu.instance.onResolutionChange();
  var tmp = "";
  for (var i = 0;i < Difficulty - 1;i++) {
    tmp += "*";
  }
  setBitmapText(txtMenuCheckpoint, STR("LEVEL") + " " + (CheckpointLevel + 1) + tmp, true);
  txtMenuCheckpoint.visible = CheckpointLevel > 0;
  btnMenuCheckpoint.visible = txtMenuCheckpoint.visible;
}, UpdateLangIcon:function(btnLang) {
  switch(Languages.instance.language) {
    case "en":
      btnLang.frameName = "flag1.png";
      break;
    case "fr":
      btnLang.frameName = "flag2.png";
      break;
    case "pt":
      btnLang.frameName = "flag3.png";
      break;
    case "de":
      btnLang.frameName = "flag4.png";
      break;
    case "it":
      btnLang.frameName = "flag5.png";
      break;
    case "es":
      btnLang.frameName = "flag6.png";
      break;
    case "ru":
      btnLang.frameName = "flag7.png";
      break;
  }
}, OnPressedPlay:function() {
  soundManager.playSound("menu-click1");
  SceneLogo.instance.HideAnimated();
  SceneMenu.instance.HideAnimated();
  SceneGame.instance.RestartGame();
  SceneGame.instance.ShowAnimated();
  soundManager.playMusic("music_game");
  gameRunning = true;
}, OnPressedSkins:function() {
  soundManager.playSound("menu-click1");
  SceneLogo.instance.HideAnimated();
  SceneMenu.instance.HideAnimated();
  SceneShop.instance.ShowAnimated();
}, OnPressedResetCheckpoint:function() {
  ScenesTransitions.hideSceneAlpha(grpSceneBottomMenuButtons);
  ScenesTransitions.showSceneAlpha(grpSceneBottomBackButtons);
  SceneConfirmReset.instance.ShowAnimated();
}, OnPressedPauseLang:function() {
  soundManager.playSound("menu-click1");
  SceneToReturnFromLanguage = SceneMenu.instance;
  SceneLogo.instance.HideAnimated();
  SceneMenu.instance.HideAnimated();
  SceneLanguages.instance.ShowAnimated();
}, OnPressedPauseInstructions:function() {
  soundManager.playSound("menu-click1");
  SceneToReturnFromInstructions = SceneMenu.instance;
  SceneLogo.instance.HideAnimated();
  SceneMenu.instance.HideAnimated();
  SceneInstructions.instance.ShowAnimated();
}, ShowAnimated:function(delay) {
  if (delay === undefined) {
    delay = 0;
  }
  var tmp = "";
  for (var i = 0;i < Difficulty - 1;i++) {
    tmp += "*";
  }
  txtMenuCheckpoint.text = STR("LEVEL") + " " + (CheckpointLevel + 1) + tmp;
  txtMenuCheckpoint.visible = CheckpointLevel > 0;
  btnMenuCheckpoint.visible = txtMenuCheckpoint.visible;
  soundManager.playMusic("music_menu");
  soundManager.playSound("menu-click1");
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
  ScenesTransitions.showSceneAlpha(grpSceneBottomMenuButtons, delay + 100, ScenesTransitions.TRANSITION_LENGTH);
  ScenesTransitions.showSceneAlpha(grpSceneMenu, delay + 100, ScenesTransitions.TRANSITION_LENGTH);
  ScenesTransitions.showSceneScale(btnMenuPlay, delay + 200, 200, null, Phaser.Easing.Back.Out);
  if (CheckpointLevel > 0) {
    ScenesTransitions.showSceneScale(btnMenuCheckpoint, delay + 200, 200, null, Phaser.Easing.Back.Out);
    ScenesTransitions.showSceneScale(txtMenuCheckpoint, delay + 200, 200, null, Phaser.Easing.Back.Out);
  }
  ScenesTransitions.showSceneScale(btnMenuSkins, delay + 300, 200, ScenesTransitions.transitionFinished, Phaser.Easing.Back.Out);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneScale(btnMenuPlay, 0, 200, null, Phaser.Easing.Back.In);
  ScenesTransitions.hideSceneScale(btnMenuSkins, 100, 200, null, Phaser.Easing.Back.In);
  ScenesTransitions.hideSceneAlpha(grpSceneBottomMenuButtons);
  ScenesTransitions.hideSceneAlpha(grpSceneMenu, 100, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


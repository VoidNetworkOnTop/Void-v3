var SceneLanguages = function() {
  SceneLanguages.instance = this;
  this.create();
};
SceneLanguages.instance = null;
SceneLanguages.prototype = {create:function() {
  grpSceneLanguages = game.add.group();
  imgLanguagesBackground = CreateBoardSpr(game.width >> 1, game.height >> 1, 400, 400, "pak1", "dialog", .5, .5, 400, 400);
  imgLanguagesBackground.alpha = 1;
  grpSceneLanguages.add(imgLanguagesBackground);
  var btnH = 100;
  var btnW = 60;
  var btnGap = 10;
  var posY = -(3 * btnH + 2 * btnGap) / 2 + btnH / 2;
  btnLangEN = grpSceneLanguages.create(-btnW * 1.9, posY, "pak1", "flag1.png");
  btnLangEN.anchor.set(.5);
  imgLanguagesBackground.addChild(btnLangEN);
  AddButtonEvents(btnLangEN, this.OnPressedLangEN, ButtonOnInputOver, ButtonOnInputOut);
  btnLangDE = grpSceneLanguages.create(0, posY, "pak1", "flag4.png");
  btnLangDE.anchor.set(.5);
  imgLanguagesBackground.addChild(btnLangDE);
  AddButtonEvents(btnLangDE, this.OnPressedLangDE, ButtonOnInputOver, ButtonOnInputOut);
  btnLangES = grpSceneLanguages.create(+btnW * 1.9, posY, "pak1", "flag6.png");
  btnLangES.anchor.set(.5);
  imgLanguagesBackground.addChild(btnLangES);
  AddButtonEvents(btnLangES, this.OnPressedLangES, ButtonOnInputOver, ButtonOnInputOut);
  posY += btnH + btnGap;
  btnLangFR = grpSceneLanguages.create(-btnW * 1.9, posY, "pak1", "flag2.png");
  btnLangFR.anchor.set(.5);
  imgLanguagesBackground.addChild(btnLangFR);
  AddButtonEvents(btnLangFR, this.OnPressedLangFR, ButtonOnInputOver, ButtonOnInputOut);
  btnLangIT = grpSceneLanguages.create(0, posY, "pak1", "flag5.png");
  btnLangIT.anchor.set(.5);
  imgLanguagesBackground.addChild(btnLangIT);
  AddButtonEvents(btnLangIT, this.OnPressedLangIT, ButtonOnInputOver, ButtonOnInputOut);
  btnLangBR = grpSceneLanguages.create(+btnW * 1.9, posY, "pak1", "flag3.png");
  btnLangBR.anchor.set(.5);
  imgLanguagesBackground.addChild(btnLangBR);
  AddButtonEvents(btnLangBR, this.OnPressedLangBR, ButtonOnInputOver, ButtonOnInputOut);
  posY += btnH + btnGap;
  btnLangRU = grpSceneLanguages.create(0, posY, "pak1", "flag7.png");
  btnLangRU.anchor.set(.5);
  imgLanguagesBackground.addChild(btnLangRU);
  AddButtonEvents(btnLangRU, this.OnPressedLangRU, ButtonOnInputOver, ButtonOnInputOut);
  grpSceneLanguages.visible = false;
}, onResolutionChange:function() {
  imgLanguagesBackground.position.setTo(game.width >> 1, game.height >> 1);
}, OnPressedLangEN:function() {
  language = "en";
  sceneLanguages.OnLanguageSelected();
}, OnPressedLangDE:function() {
  language = "de";
  sceneLanguages.OnLanguageSelected();
}, OnPressedLangFR:function() {
  language = "fr";
  sceneLanguages.OnLanguageSelected();
}, OnPressedLangES:function() {
  language = "es";
  sceneLanguages.OnLanguageSelected();
}, OnPressedLangBR:function() {
  language = "pt";
  sceneLanguages.OnLanguageSelected();
}, OnPressedLangIT:function() {
  language = "it";
  sceneLanguages.OnLanguageSelected();
}, OnPressedLangRU:function() {
  language = "ru";
  sceneLanguages.OnLanguageSelected();
}, OnLanguageSelected:function() {
  try {
    localStorage.setItem("pwrwl-lang", "" + language);
  } catch (e) {
  }
  Languages.instance.language = language;
  languageLoaded = true;
  if (gameState == null) {
    game.state.start("GameState");
    return;
  }
  gameState.updateTexts();
  SceneLanguages.instance.HideAnimated();
  SceneToReturnFromLanguage.ShowAnimated();
  if (SceneToReturnFromLanguage == SceneMenu.instance) {
    SceneLogo.instance.ShowAnimated();
  }
}, ShowAnimated:function() {
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Quadratic.Out;
  ScenesTransitions.showSceneAlpha(grpSceneLanguages, 0, ScenesTransitions.TRANSITION_LENGTH);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneAlpha(grpSceneLanguages, ScenesTransitions.TRANSITION_LENGTH);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


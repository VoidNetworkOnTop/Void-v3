var SceneInstructions = function() {
  SceneInstructions.instance = this;
  this.create();
};
SceneInstructions.instance = null;
SceneInstructions.prototype = {create:function() {
  grpSceneInstructions = game.add.group();
  grpSceneInstructionsStones = game.add.group();
  grpSceneInstructions.add(grpSceneInstructionsStones);
  txtInstructions = new Phaser.Text(game, game.width >> 1, game.height / 3 * 2, STR("INS_TEXT"), {fill:"#ffffff", font:"46px " + GAME_FONT, wordWrap:true, wordWrapWidth:480, align:"center"});
  txtInstructions.anchor.x = getCorrectAnchorX(txtInstructions, .5);
  txtInstructions.anchor.y = getCorrectAnchorY(txtInstructions, .5);
  txtInstructions.shadowOffsetX = 1;
  txtInstructions.shadowOffsetY = 1;
  txtInstructions.shadowColor = "#FFFFFF";
  txtInstructions.shadowFill = "#0f174b";
  txtInstructions.shadowBlur = 5;
  txtInstructions.lineSpacing = -7;
  grpSceneInstructions.add(txtInstructions);
  grpSceneInstructions.visible = false;
  this.updateTexts();
  this.onResolutionChange();
}, onResolutionChange:function() {
  grpSceneInstructionsStones.x = game.width >> 1;
  grpSceneInstructionsStones.y = game.height / 3;
  grpSceneInstructionsStones.scale.set(game.height / 890);
  txtInstructions.reset(game.width >> 1, game.height >> 1);
  var objStyle = txtInstructions.style;
  objStyle.wordWrapWidth = game.width * .8;
  txtInstructions.setStyle(objStyle);
}, updateTexts:function() {
  setFontText(txtInstructions, STR("INS_TEXT"), true);
  updateTextToHeight(txtInstructions, 23, language == "ru" ? "Arial" : "gameFont", 320);
}, OnPressedInstructionsClose:function() {
  soundManager.playSound("menu-click1");
  SceneInstructions.instance.HideAnimated();
  SceneToReturnFromInstructions.ShowAnimated();
  if (SceneToReturnFromInstructions == SceneMenu.instance) {
    SceneLogo.instance.ShowAnimated();
  }
}, ShowAnimated:function() {
  SceneInstructions.instance.onResolutionChange();
  gameRunning = false;
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Quadratic.Out;
  ScenesTransitions.showSceneAlpha(grpSceneInstructions, 0, ScenesTransitions.TRANSITION_LENGTH);
  ScenesTransitions.showSceneAlpha(grpSceneBottomBackButtons);
  ScenesTransitions.showSceneScale(grpSceneInstructionsStones, 100, 200, null, Phaser.Easing.Back.Out, grpSceneInstructionsStones.scale.x);
  ScenesTransitions.showSceneScale(txtInstructions, 200, 200, ScenesTransitions.transitionFinished, Phaser.Easing.Back.Out, txtInstructions.scale.x);
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneAlpha(grpSceneBottomBackButtons);
  ScenesTransitions.hideSceneAlpha(grpSceneInstructions, ScenesTransitions.TRANSITION_LENGTH * .5, ScenesTransitions.TRANSITION_LENGTH + 10, ScenesTransitions.transitionFinished);
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
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
}};


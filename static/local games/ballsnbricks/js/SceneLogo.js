var SceneLogo = function() {
  SceneLogo.instance = this;
  this.create();
};
SceneLogo.instance = null;
SceneLogo.prototype = {create:function() {
  grpSceneLogo = game.add.group();
  imgLogo = game.add.sprite(game.width >> 1, (game.height >> 1) / 2, "pak1", "logo.png");
  imgLogo.anchor.set(.5);
  grpSceneLogo.add(imgLogo);
  this.onResolutionChange();
  grpSceneLogo.visible = false;
}, onResolutionChange:function() {
  imgLogo.position.setTo(game.width >> 1, (game.height >> 1) * .6);
}, ShowAnimated:function() {
  ScenesTransitions.showSceneAlpha(grpSceneLogo);
}, HideAnimated:function() {
  ScenesTransitions.hideSceneAlpha(grpSceneLogo);
}};


var SceneOverlay = function() {
  SceneOverlay.instance = this;
  this.create();
};
SceneOverlay.instance = null;
SceneOverlay.prototype = {create:function() {
  grpSceneOverlay = game.add.group();
  grpSceneOverlay.name = "grpSceneOverlay";
  imgOverlay = grpSceneOverlay.create(game.width >> 1, game.height >> 1, "pak1", "blank.png");
  imgOverlay.anchor.set(.5);
  imgOverlay.width = game.width;
  imgOverlay.height = game.height;
  imgOverlay.alpha = .8;
  imgOverlay.tint = 1907997;
  imgOverlay.inputEnabled = true;
  grpSceneOverlay.visible = false;
}, onResolutionChange:function() {
  imgOverlay.reset(game.width >> 1, game.height >> 1);
  imgOverlay.width = game.width;
  imgOverlay.height = game.height;
}, ShowAnimated:function() {
  SceneOverlay.instance.onResolutionChange();
  ScenesTransitions.showSceneAlpha(grpSceneOverlay, 0, ScenesTransitions.TRANSITION_LENGTH);
}, HideAnimated:function() {
  ScenesTransitions.hideSceneAlpha(grpSceneOverlay, 0, ScenesTransitions.TRANSITION_LENGTH);
}};


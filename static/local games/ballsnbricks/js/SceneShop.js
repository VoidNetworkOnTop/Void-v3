var SceneShop = function() {
  SceneShop.instance = this;
  this.create();
};
SHOP_ITEMS_CAPTIONS = ["caption1", "caption2", "caption3", "caption4", "caption5", "caption6", "caption7", "caption8", "caption9", "caption10", "caption11", "caption12", "caption13", "caption14", "caption15", "caption16", "caption17", "caption18", "caption19", "caption20", "caption21", "caption22", "caption23", "caption24", "caption25"];
SceneShop.instance = null;
SceneShop.prototype = {create:function() {
  grpSceneShop = game.add.group();
  grpSceneShop.name = "grpSceneShop";
  imgShopBG = game.add.sprite(game.width >> 1, game.height >> 1, "pak1", "void.png");
  imgShopBG.anchor.set(.5);
  imgShopBG.width = game.width * 1.1;
  imgShopBG.height = game.height * 1.1;
  imgShopBG.inputEnabled = true;
  grpSceneShop.add(imgShopBG);
  sprShopItems = null;
  grpSceneShop.visible = false;
}, createShopItems:function() {
  var posx = 0;
  var posy = 0;
  sprShopItems = [];
  for (var y = 0;y < 5;y++) {
    posx = 0;
    for (var x = 0;x < 5;x++) {
      idx = y * 5 + x;
      sprShopItems[idx] = game.add.sprite(posx, posy, "pak1", "skin_tabulka.png");
      sprShopItems[idx].idx = idx;
      sprShopItems[idx].anchor.set(0);
      sprShopItems[idx].width = 85;
      sprShopItems[idx].scale.y = sprShopItems[idx].scale.x;
      grpSceneShop.add(sprShopItems[idx]);
      sprShopItems[idx].imgBall = game.add.sprite(78, 55, "pak1", "ball" + (y * 5 + x + 1) + ".png");
      sprShopItems[idx].imgBall.scale.set(1.5);
      sprShopItems[idx].imgBall.anchor.set(.5);
      sprShopItems[idx].addChild(sprShopItems[idx].imgBall);
      sprShopItems[idx].imgButton = game.add.sprite(78, 166, "pak1", "skin_tabulka_butt.png");
      sprShopItems[idx].imgButton.anchor.set(.5);
      sprShopItems[idx].addChild(sprShopItems[idx].imgButton);
      AddButtonEvents(sprShopItems[idx].imgButton, this.BuySelectedItem, ButtonOnInputOver, ButtonOnInputOut);
      if (language == "ru") {
        sprShopItems[idx].txtFontCaption = new Phaser.Text(game, 78, 123, STR("BALL" + (idx + 1)), {fill:"#FFFFFF", font:"22px Arial", align:"center"});
        setFontText(sprShopItems[idx].txtFontCaption, STR("BALL" + (idx + 1)), true);
        sprShopItems[idx].txtFontCaption.lineSpacing = -10;
        sprShopItems[idx].txtFontCaption.align = "center";
        sprShopItems[idx].txtFontCaption.tint = 14854725;
        sprShopItems[idx].txtFontCaption.anchor.set(.5);
        sprShopItems[idx].addChild(sprShopItems[idx].txtFontCaption);
        updateBitmapTextToWidth(sprShopItems[idx].txtFontCaption, 22, 130);
      } else {
        sprShopItems[idx].txtCaption = game.add.bitmapText(78, 119, "gamefont_TA", STR("BALL" + (idx + 1)), 20);
        setBitmapText(sprShopItems[idx].txtCaption, STR("BALL" + (idx + 1)), true);
        sprShopItems[idx].txtCaption.align = "center";
        sprShopItems[idx].txtCaption.tint = 14854725;
        sprShopItems[idx].txtCaption.anchor.set(.5);
        sprShopItems[idx].addChild(sprShopItems[idx].txtCaption);
        updateBitmapTextToWidth(sprShopItems[idx].txtCaption, 20, 120);
      }
      sprShopItems[idx].imgLock = game.add.sprite(27, 30, "pak1", "lock.png");
      sprShopItems[idx].imgLock.anchor.set(.5);
      sprShopItems[idx].addChild(sprShopItems[idx].imgLock);
      sprShopItems[idx].imgGem = game.add.sprite(41, 164, "pak1", "dia.png");
      sprShopItems[idx].imgGem.anchor.set(.5);
      sprShopItems[idx].addChild(sprShopItems[idx].imgGem);
      sprShopItems[idx].price = BallsPrizes[idx];
      sprShopItems[idx].txtPrice = game.add.bitmapText(88, 164, "gamefont_TA", "" + BallsPrizes[idx], 30);
      sprShopItems[idx].txtPrice.tint = 0;
      sprShopItems[idx].txtPrice.anchor.set(.5);
      sprShopItems[idx].addChild(sprShopItems[idx].txtPrice);
      posx += sprShopItems[idx].width;
    }
    posy += sprShopItems[idx].height;
  }
  for (var i = 0;i < sprShopItems.length;i++) {
    SceneShop.instance.UpdateItem(sprShopItems[i]);
  }
}, UpdateItem:function(item) {
  item.price = BallsPrizes[item.idx];
  item.imgLock.visible = item.price > 0;
  item.imgGem.visible = item.price > 0;
  item.txtPrice.x = item.price > 0 ? 88 : 80;
  setBitmapText(item.txtPrice, item.price > 0 ? "" + item.price : STR("USE"), true);
  item.imgButton.frameName = "skin_tabulka_butt.png";
  if (PlayerBall == item.idx) {
    item.imgButton.frameName = "skin_tabulka_butt2.png";
    setBitmapText(item.txtPrice, STR("USING"), true);
  }
  updateBitmapTextToWidth(item.txtPrice, 30, 115);
}, BuySelectedItem:function() {
  if (PlayerGems < this.button.parent.price) {
    soundManager.playSound("tile_wrong-one");
    SetPoingScaleTween(txtPlayerGems, 1500);
    return;
  }
  if (this.button.parent.price == 0) {
    soundManager.playSound("menu-click1");
    if (PlayerBall == this.button.parent.idx) {
      PlayerBall = -1;
    } else {
      PlayerBall = this.button.parent.idx;
    }
    for (var i = 0;i < sprShopItems.length;i++) {
      SceneShop.instance.UpdateItem(sprShopItems[i]);
    }
    return;
  }
  SceneConfirmation.instance.ShowAnimated(this.button.parent);
}, deleteShopItems:function() {
  for (var i = 0;i < sprShopItems.length;i++) {
    sprShopItems[i].destroy();
    sprShopItems[i] = null;
  }
  sprShopItems = null;
}, onResolutionChange:function() {
  imgShopBG.width = game.width * 1.1;
  imgShopBG.height = game.height * 1.1;
  imgShopBG.position.setTo(game.width >> 1, game.height >> 1);
  if (sprShopItems == null) {
    return;
  }
  var posx = (game.width - 5 * sprShopItems[0].width) / 2;
  var gap = 0;
  var posy = (game.height - 5 * sprShopItems[0].height - gap * 4) / 2;
  for (var y = 0;y < 5;y++) {
    posx = (game.width - 5 * sprShopItems[0].width) / 2;
    for (var x = 0;x < 5;x++) {
      idx = y * 5 + x;
      sprShopItems[idx].position.setTo(posx, posy);
      posx += sprShopItems[idx].width;
    }
    posy += sprShopItems[idx].height + gap;
  }
}, updateTexts:function() {
}, OnPressedShopClose:function() {
  soundManager.playSound("menu-click1");
  if (grpSceneConfirmation.visible) {
    SceneConfirmation.instance.HideAnimated();
    return;
  }
  SceneShop.instance.HideAnimated();
  SceneLogo.instance.ShowAnimated();
  SceneMenu.instance.ShowAnimated();
}, ShowAnimated:function() {
  SceneShop.instance.createShopItems();
  SceneShop.instance.onResolutionChange();
  ScenesTransitions.transitionStarted();
  SceneShop.instance.onResolutionChange();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Linear.In;
  ScenesTransitions.showSceneAlpha(grpSceneBottomBackButtons);
  ScenesTransitions.showSceneAlpha(grpSceneShop, 0, ScenesTransitions.TRANSITION_LENGTH);
  for (var i = 0;i < sprShopItems.length;i++) {
    ScenesTransitions.showSceneScale(sprShopItems[i], i / 2 * 30, 40, null, Phaser.Easing.Back.Out, sprShopItems[i].scale.y);
  }
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
  ScenesTransitions.hideSceneAlpha(grpSceneBottomBackButtons);
  ScenesTransitions.hideSceneAlpha(grpSceneShop, 0, ScenesTransitions.TRANSITION_LENGTH, function() {
    SceneShop.instance.deleteShopItems();
    ScenesTransitions.transitionFinished();
  });
  ScenesTransitions.TRANSITION_EFFECT_OUT = Phaser.Easing.Linear.Out;
}};


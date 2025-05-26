var SOUNDS_ENABLED = true;
var RUNNING_ON_WP = navigator.userAgent.indexOf("Windows Phone") > -1;
if (RUNNING_ON_WP) {
  SOUNDS_ENABLED = false;
}
var partnerName = "addictinggames";
window["partnerName"] = partnerName;
var ANIMATION_CUBIC_IO = Phaser.Easing.Cubic.InOut;
var tmp_sprites = [];
function getRandomUInt(num) {
  return Math.floor(Math.random() * num);
}
function getRandomInt(num) {
  return Math.floor(Math.random() * num) * (getRandomUInt(100) > 50 ? -1 : 1);
}
function getRandomUIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function getRandomIntInRange(min, max) {
  return getRandomUIntInRange(min, max) * (getRandomUInt(100) > 50) ? -1 : 1;
}
String.prototype.replaceAll = function(search, replacement) {
  var target = this;
  return target.split(search).join(replacement);
};
function cloneObject(obj) {
  if (null == obj || "object" != typeof obj) {
    return obj;
  }
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) {
      copy[attr] = obj[attr];
    }
  }
  return copy;
}
function isUpperCase(myString) {
  return myString == myString.toUpperCase();
}
function isLowerCase(myString) {
  return myString == myString.toLowerCase();
}
function LOG(msg) {
}
Array.prototype.contains = function(obj) {
  var i = this.length;
  while (i--) {
    if (this[i] === obj) {
      return true;
    }
  }
  return false;
};
function shuffleArray(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;
  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}
function getCorrectAnchorX(obj, anchX) {
  return Math.round(obj.width * anchX) / obj.width;
}
function getCorrectAnchorY(obj, anchY) {
  return Math.round(obj.height * anchY) / obj.height;
}
function getAndroidVersion(ua) {
  ua = (ua || navigator.userAgent).toLowerCase();
  var match = ua.match(/android\s([0-9\.]*)/);
  return match ? match[1] : false;
}
function updateTextToHeight(textObj, fontSize, fontName, maxHeight) {
  textObj.style.font = fontSize + 'px "' + fontName + '"';
  while (textObj.height > maxHeight) {
    fontSize--;
    var style = textObj.style;
    style.font = fontSize + "px gameFont";
    textObj.setStyle(style);
  }
}
function updateTextToWidth(textObj, fontSize, fontName, maxWidth) {
  textObj.style.font = fontSize + 'px "' + fontName + '"';
  while (textObj.width > maxWidth) {
    fontSize--;
    var style = textObj.style;
    style.font = fontSize + 'px "' + fontName + '"';
    textObj.setStyle(style);
  }
}
function updateBitmapTextToHeight(textObj, fontSize, maxHeight) {
  textObj.fontSize = fontSize;
  while (textObj.height > maxHeight) {
    textObj.fontSize -= .5;
  }
}
function updateBitmapTextToWidth(textObj, fontSize, maxWidth) {
  textObj.fontSize = fontSize;
  while (textObj.width > maxWidth) {
    textObj.fontSize -= .5;
  }
}
function CreateBoardSpr(posX, posY, width, height, pak, spr, anchorX, anchorY, scaledW, scaledH) {
  if (anchorX === undefined) {
    anchorX = 0;
  }
  if (anchorY === undefined) {
    anchorY = 0;
  }
  if (scaledW === undefined) {
    scaledW = width;
  }
  if (scaledH === undefined) {
    scaledH = height;
  }
  if (!tmp_sprites.contains(pak)) {
    tmp_sprites[pak] = game.make.sprite(-1E4, -1E4, pak);
  }
  _width = width;
  _height = height;
  var tileW;
  var tileH;
  tileW = getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 0).width;
  tileH = getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 0).height;
  width = Math.floor(width / tileW + .5) * tileW;
  height = Math.floor(height / tileH + .5) * tileH;
  var bmpData = game.make.bitmapData(width, height);
  bmpData.smoothed = false;
  var tile1WC = width / tileW - 2;
  var tile1HC = height / tileH - 2;
  var posLeft = 0;
  var posRight = posLeft + width;
  var posTop = 0;
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 0), posLeft, posTop);
  for (var i = 0;i < tile1WC;i++) {
    bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 1), posLeft + tileW * (i + 1), posTop);
  }
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 2), posRight - tileW, posTop);
  for (var j = 0;j < tile1HC;j++) {
    bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 3), posLeft, posTop + tileH * (j + 1));
    bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 5), posRight - tileW, posTop + tileH * (j + 1));
    for (var i = 0;i < tile1WC;i++) {
      bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 4), posLeft + tileW * (i + 1), posTop + tileH * (j + 1));
    }
  }
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 6), posLeft, posTop + height - tileH);
  for (var i = 0;i < tile1WC;i++) {
    bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 7), posLeft + tileW * (i + 1), posTop + height - tileH);
  }
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 8), posRight - tileW, posTop + height - tileH);
  var spr = makeSprite(0, 0, "pak1", "void.png");
  var tid = game.rnd.uuid();
  var texture = bmpData.generateTexture(tid, function(texture) {
    LOG("bmpData.generateTexture");
    this.sprite.loadTexture(texture);
    this.sprite.scale.set(1);
    this.sprite.width = this.scaledW;
    this.sprite.height = this.scaledH;
    this.sprite.anchor.setTo(this.anchorX, this.anchorY);
  }, {sprite:spr, anchorX:anchorX, anchorY:anchorY, scaledW:scaledW, scaledH:scaledH});
  spr.x = posX;
  spr.y = posY;
  bmpData.destroy();
  bmpData = null;
  return spr;
}
function CreateDialogSpr(posX, posY, width, height, pak, spr, anchorX, anchorY, scaledW, scaledH) {
  var tileW;
  var tileH;
  if (anchorX === undefined) {
    anchorX = 0;
  }
  if (anchorY === undefined) {
    anchorY = 0;
  }
  if (scaledW === undefined) {
    scaledW = width;
  }
  if (scaledH === undefined) {
    scaledH = height;
  }
  if (!tmp_sprites.contains(pak)) {
    tmp_sprites[pak] = game.make.sprite(-1E4, -1E4, pak);
  }
  tileW = getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 0).width;
  tileH = getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 0).height;
  var bmpData = game.make.bitmapData(width, height);
  bmpData.smoothed = false;
  var posLeft = 0;
  var posRight = posLeft + width;
  var posTop = 0;
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 0), posLeft, posTop);
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 1), posLeft, posTop + tileH, tileW, height - 2 * tileH);
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 2), posLeft, posTop + height - tileH);
  var spr = makeSprite(0, 0, "pak1", "void.png");
  var tid = game.rnd.uuid();
  var texture = bmpData.generateTexture(tid, function(texture) {
    LOG("bmpData.generateTexture");
    this.sprite.loadTexture(texture);
    this.sprite.width = this.scaledW;
    this.sprite.height = this.scaledH;
    this.sprite.anchor.setTo(this.anchorX, this.anchorY);
  }, {sprite:spr, anchorX:anchorX, anchorY:anchorY, scaledW:scaledW, scaledH:scaledH});
  spr.x = posX;
  spr.y = posY;
  bmpData.destroy();
  bmpData = null;
  return spr;
}
function CreateButtonSpr(posX, posY, width, pak, spr, anchorX, anchorY, scaleX, scaleY) {
  if (anchorX === undefined) {
    anchorX = 0;
  }
  if (anchorY === undefined) {
    anchorY = 0;
  }
  if (scaleX === undefined) {
    scaleX = 1;
  }
  if (scaleY === undefined) {
    scaleY = 1;
  }
  if (!tmp_sprites.contains(pak)) {
    tmp_sprites[pak] = game.make.sprite(-1E4, -1E4, pak);
  }
  _width = width;
  var tileW;
  var tileH;
  tileW = game.cache.getFrameByName(pak, spr + "_0.png").width;
  tileH = game.cache.getFrameByName(pak, spr + "_0.png").height;
  var bmpData = game.make.bitmapData(width, tileH);
  bmpData.smoothed = false;
  var tile1WC = width / tileW - 2;
  var posLeft = 0;
  var posRight = posLeft + width;
  var posTop = 0;
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 0), posLeft, posTop);
  for (var i = 0;i < tile1WC;i++) {
    bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 1), posLeft + tileW * (i + 1), posTop);
  }
  bmpData.draw(getSpriteFrameWithinAtlas(tmp_sprites[pak], spr, 2), posRight - tileW, posTop);
  var spr = makeSprite(0, 0, "pak1", "void.png");
  var tid = game.rnd.uuid();
  var texture = bmpData.generateTexture(tid, function(texture) {
    this.sprite.loadTexture(texture);
    this.sprite.anchor.setTo(this.anchorX, this.anchorY);
    this.sprite.scale.setTo(this.scaleX, this.scaleY);
  }, {sprite:spr, anchorX:anchorX, anchorY:anchorY, scaleX:scaleX, scaleY:scaleY});
  spr.x = posX;
  spr.y = posY;
  spr.width = width * scaleX;
  spr.height = tileH * scaleY;
  bmpData.destroy();
  bmpData = null;
  return spr;
}
function getSpriteFrame(spr, frm) {
  spr.frame = frm;
  return spr;
}
function getSpriteFrameWithinAtlas(pak, prefix, frm) {
  pak.frameName = prefix + "_" + frm + ".png";
  return pak;
}
function makeSprite(x, y, spr, frm) {
  frm = frm || 0;
  var spr = game.make.sprite(x, y, spr, frm);
  return spr;
}
function addSprite(x, y, spr, frm) {
  frm = frm || 0;
  var spr = game.add.sprite(x, y, spr, frm);
  return spr;
}
function leadingZero(num, len) {
  var retVal = "" + num;
  while (retVal.length < len) {
    retVal = "0" + retVal;
  }
  return retVal;
}
function SetPoingScaleTween(obj, duration, delay, callbackOnStart) {
  var negX = obj.scale.x < 0;
  var negY = obj.scale.y < 0;
  if (duration === undefined) {
    duration = 150;
  }
  if (delay === undefined) {
    delay = 0;
  }
  if (callbackOnStart === undefined) {
    callbackOnStart = null;
  }
  var scale = obj.scale.x;
  var tween = game.add.tween(obj.scale).to({x:scale * (negX ? -1 : 1), y:scale * (negY ? -1 : 1)}, duration, Phaser.Easing.Quadratic.Out, true, delay, 0);
  tween.onStart.add(function() {
    if (this.callbackOnStart != null) {
      this.callbackOnStart();
    }
    this.obj.scale.setTo(scale * 1.3 * (negX ? -1 : 1), scale * 1.3 * (negY ? -1 : 1));
  }, {obj:obj, callbackOnStart:callbackOnStart});
}
function CreateButtonWithText(group, parent, x, y, sprite, caption, spriteHighlighted, colorText, colorShadow, textSize) {
  if (spriteHighlighted === undefined) {
    spriteHighlighted = null;
  }
  if (colorText === undefined) {
    colorText = "#FFFFFF";
  }
  if (colorShadow === undefined) {
    colorShadow = "#000000";
  }
  if (textSize === undefined) {
    textSize = 25;
  }
  var imgButtonBack = group.create(x, y, "pak1", sprite);
  imgButtonBack.anchor.set(.5);
  parent.addChild(imgButtonBack);
  if (spriteHighlighted != null) {
    var imgButtonHighlighted = group.create(0, 0, "pak1", spriteHighlighted);
    imgButtonHighlighted.anchor.set(.5);
    imgButtonBack.addChild(imgButtonHighlighted);
    imgButtonBack.btnHighlighted = imgButtonHighlighted;
    imgButtonHighlighted.visible = false;
  }
  var txtButtonCaption = game.add.text(1, 0, caption, {font:textSize + "px gameFont", fill:colorText});
  txtButtonCaption.anchor.setTo(.5, .5);
  txtButtonCaption.shadowOffsetX = 2;
  txtButtonCaption.shadowOffsetY = 2;
  txtButtonCaption.shadowColor = colorShadow;
  txtButtonCaption.shadowFill = colorShadow;
  imgButtonBack.addChild(txtButtonCaption);
  imgButtonBack.txtCaption = txtButtonCaption;
  return imgButtonBack;
}
function SetTextColor(textObj, color, colorShadow) {
  textObj.tint = color;
}
function wiggle(aProgress, aPeriod1, aPeriod2) {
  var current1 = aProgress * Math.PI * 2 * aPeriod1;
  var current2 = aProgress * (Math.PI * 2 * aPeriod2 + Math.PI / 2);
  return Math.sin(current1) * Math.cos(current2);
}
function MoveSpriteBezier(sprite, destX, destY, duration, callbackOnComplete, callbackOnCompleteParams) {
  var tween = null;
  tmpLine.start.x = sprite.world.x;
  tmpLine.start.y = sprite.world.y;
  tmpLine.end.x = destX;
  tmpLine.end.y = destY;
  var coords = tmpLine.coordinatesOnLine(Math.floor(tmpLine.length / 5 + .5));
  LOG("coords.lenght = " + coords.length);
  if (coords.length < 5) {
    coords[4] = [];
    coords[4][0] = coords[3][0];
    coords[4][1] = coords[3][1];
  }
  var p = coords[0];
  var sign = 1;
  tmpLineNormal1.fromAngle(coords[1][0], coords[1][1], tmpLine.normalAngle, (Math.floor(tmpLine.length / 4) + getRandomInt(10)) * sign);
  tmpLineNormal2.fromAngle(coords[4][0], coords[4][1], tmpLine.normalAngle, (Math.floor(tmpLine.length / 8) + getRandomInt(20)) * sign);
  tmpCircle1.x = tmpLineNormal1.end.x;
  tmpCircle1.y = tmpLineNormal1.end.y;
  tmpCircle2.x = tmpLineNormal2.end.x;
  tmpCircle2.y = tmpLineNormal2.end.y;
  var tmp1 = Math.floor(tmpLine.length / 4);
  var tmp2 = Math.floor(tmpLine.length / 8);
  var pointsArray = [];
  pointsArray[0] = {x:sprite.world.x, y:sprite.world.y};
  pointsArray[1] = {x:tmpLineNormal1.end.x, y:tmpLineNormal1.end.y};
  pointsArray[2] = {x:tmpLineNormal2.end.x, y:tmpLineNormal2.end.y};
  pointsArray[3] = {x:destX, y:destY};
  tween = game.add.tween(sprite.position).to({x:[pointsArray[0].x, pointsArray[1].x, pointsArray[2].x, pointsArray[3].x], y:[pointsArray[0].y, pointsArray[1].y, pointsArray[2].y, pointsArray[3].y]}, duration, Phaser.Easing.Linear.Out, true, 0, 0).interpolation(function(v, k) {
    return Phaser.Math.bezierInterpolation(v, k);
  });
  if (callbackOnComplete != null) {
    tween.onComplete.add(callbackOnComplete, callbackOnCompleteParams);
  }
}
function createIngameText(x, y, text, fntSize) {
  var _fntSize = fntSize || "25";
  var txtObj = new Phaser.Text(game, x, y, text, {fill:"#FFFFFF", font:_fntSize + "px gameFont"});
  txtObj.anchor.x = getCorrectAnchorX(txtObj, .5);
  txtObj.anchor.y = getCorrectAnchorY(txtObj, .5);
  txtObj.shadowOffsetX = 3;
  txtObj.shadowOffsetY = 3;
  txtObj.shadowColor = "#660000";
  return txtObj;
}
function createResultText(x, y, text, fntSize) {
  var _fntSize = fntSize || "25";
  var txtObj = new Phaser.Text(game, x, y, text, {fill:"#ffffff", font:_fntSize + "px gameFont"});
  txtObj.anchor.x = getCorrectAnchorX(txtObj, .5);
  txtObj.anchor.y = getCorrectAnchorY(txtObj, .5);
  txtObj.shadowOffsetX = 2;
  txtObj.shadowOffsetY = 2;
  txtObj.shadowColor = "#5b2121";
  txtObj.shadowFill = "#5b2121";
  return txtObj;
}
function createButtonWithIcon(group, x, y, iconIdx, callback) {
  var btnObj = group.create(x, y, "pak1", "button_0.png");
  btnObj.anchor.set(.5);
  btnObj.inputEnabled = true;
  AddButtonEvents(btnObj, callback, ButtonOnInputOver, ButtonOnInputOut);
  var btnIcon = new Phaser.Sprite(game, 0, -3, "pak1", "icons_" + iconIdx + ".png");
  btnIcon.anchor.set(.5);
  btnObj.addChild(btnIcon);
  return btnObj;
}
function createInstructionsText(x, y, text, wrapWidth) {
  var txtObj = new Phaser.Text(game, x, y, text, {fill:"#FFFFFF", font:"24px gameFont", wordWrap:true, wordWrapWidth:wrapWidth, align:"center"});
  txtObj.anchor.x = getCorrectAnchorX(txtObj, .5);
  txtObj.anchor.y = getCorrectAnchorY(txtObj, .5);
  txtObj.shadowOffsetX = 2;
  txtObj.shadowOffsetY = 2;
  txtObj.shadowColor = "#555555";
  txtObj.shadowFill = "#555555";
  return txtObj;
}
function tweenTint(obj, startColor, endColor, time) {
  var colorBlend = {step:0};
  var colorTween = game.add.tween(colorBlend).to({step:100}, time);
  colorTween.onUpdateCallback(function() {
    obj.tint = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
  });
  obj.tint = startColor;
  colorTween.start();
}
function tweenBackgroundColor(obj, startColor, ecR, ecG, ecB, time) {
  var colorBlend = {step:0};
  var colorTween = game.add.tween(colorBlend).to({step:10}, time);
  colorTween.onUpdateCallback(function() {
    obj.backgroundColor = Phaser.Color.interpolateColorWithRGB(startColor, ecR, ecG, ecB, 10, colorBlend.step);
  });
  obj.backgroundColor = startColor;
  colorTween.start();
}
function setBitmapText(objText, text, translate) {
  if (translate === undefined) {
    translate = false;
  }
  objText.font = "gamefont_TA";
  if (translate && language == "ru") {
    objText.font = "gamefont_RU";
  }
  objText.text = text;
}
function setFontText(objText, text, translate) {
  if (translate === undefined) {
    translate = false;
  }
  var font = GAME_FONT;
  if (translate && language == "ru") {
    font = "Arial";
  }
  objText.cssFont = objText.fontSize + "px " + font;
  objText.text = text;
}
;

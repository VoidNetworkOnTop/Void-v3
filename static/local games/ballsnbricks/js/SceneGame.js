var MIN_GAME_HEIGHT = 552;
var MIN_ANGLE = 15;
var MAX_BALLS = 300;
var MAX_BRICKS = 50;
var MAX_BONUSES = 40;
var BALLS_SPEED = 20;
var BALLS_DELAY = 75;
var BRICK_COLORS = [14882570, 8520291, 12714235, 15468648, 16535856, 16485156, 16757263, 15846472, 10208573, 836935, 1808779, 1826269, 32767, 6304728];
var gameRunning = false;
var gamePaused = false;
var SceneGame = function() {
  SceneGame.instance = this;
  this.create();
};
SceneGame.instance = null;
SceneGame.prototype = {CreateBricks:function() {
  sprBricks = [];
  for (var i = 0;i < MAX_BRICKS;i++) {
    sprBricks[i] = grpSceneGame.create(game.width - (i + 1) * 70, (i + 1) * 60, "pak1", "brick.png");
    sprBricks[i].tint = BRICK_COLORS[getRandomUInt(BRICK_COLORS.length)];
    sprBricks[i].anchor.set(.5);
    sprBricks[i].brickValue = 0;
    sprBricks[i].txtBrickValue = game.add.bitmapText(0, 0, "gamefont_TA", "25", 40);
    sprBricks[i].txtBrickValue.anchor.set(.5);
    sprBricks[i].setBrickValue = function(val) {
      this.brickValue = val;
      this.txtBrickValue.text = "" + val;
      this.tint = SceneGame.instance.GetBlockColor(this.brickValue);
      if (val <= 0) {
        this.visible = false;
      }
    };
    sprBricks[i].decBrickValue = function() {
      this.setBrickValue(this.brickValue - 1);
      if (this.brickValue <= 0) {
        SceneGame.instance.UpdateWarnings(true);
        soundManager.playSound("explode");
      }
    };
    sprBricks[i].addChild(sprBricks[i].txtBrickValue);
    sprBricks[i].visible = false;
  }
}, ResetBricks:function() {
  for (var i = 0;i < sprBricks.length;i++) {
    sprBricks[i].visible = false;
  }
  SceneGame.instance.UpdateWarnings();
}, GetBlockColor:function(blockLife) {
  var color1 = 16777215;
  var color2 = 16777215;
  var colorNumber = Math.floor(blockLife / 3);
  if (colorNumber >= BRICK_COLORS.length) {
    colorNumber = colorNumber % BRICK_COLORS.length;
  }
  color1 = BRICK_COLORS[colorNumber];
  if (colorNumber + 1 >= BRICK_COLORS.length) {
    color2 = BRICK_COLORS[0];
  } else {
    color2 = BRICK_COLORS[colorNumber + 1];
  }
  return Phaser.Color.interpolateColorWithRGB(color1, Phaser.Color.getRed(color2), Phaser.Color.getGreen(color2), Phaser.Color.getBlue(color2), 3, blockLife % 3);
}, GetFreeBrick:function() {
  for (var i = 0;i < sprBricks.length;i++) {
    if (sprBricks[i].visible) {
      continue;
    }
    return sprBricks[i];
  }
  return null;
}, DecBricksInRow:function(posy) {
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (sprBricks[i].y != posy) {
      continue;
    }
    sprBricks[i].decBrickValue();
  }
  return null;
}, DecBricksInCol:function(posx) {
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (sprBricks[i].x != posx) {
      continue;
    }
    sprBricks[i].decBrickValue();
  }
  return null;
}, CreateBalls:function() {
  sprBalls = [];
  for (var i = 0;i < MAX_BALLS;i++) {
    sprBalls[i] = grpSceneGame.create(-40, 0, "pak1", "ball0.png");
    sprBalls[i].anchor.set(.5);
    sprBalls[i].radius = sprBalls[i].width * .4;
    sprBalls[i].delay = 200 * i;
    sprBalls[i].speedX = 0;
    sprBalls[i].speedY = 0;
    sprBalls[i].collisionsEnabled = true;
    sprBalls[i].alreadyShot = false;
    sprBalls[i].ultraball = false;
    sprBalls[i].visible = false;
    sprBalls[i].shield = grpSceneGame.create(0, 0, "pak1", "sballshield.png");
    sprBalls[i].shield.anchor.set(.5);
    sprBalls[i].addChild(sprBalls[i].shield);
    sprBalls[i].shield.visible = false;
    sprBalls[i].setBounces = function(val) {
      if (this.ultraball && val < this.bounces || !this.ultraball) {
        this.bounces = val;
      }
      this.shield.frameName = this.ultraball ? "sballulrta.png" : "sballshield.png";
      this.shield.visible = this.bounces > 0 || this.ultraball;
    };
    sprBalls[i].incBounces = function(val) {
      this.setBounces(this.bounces + val);
    };
  }
  txtBallsCount = game.add.bitmapText(game.width >> 1, game.height >> 1, "gamefont_TA", "x1", 20);
  txtBallsCount.anchor.set(.5);
  grpSceneGame.addChild(txtBallsCount);
}, UpdateBallsDelays:function() {
  var cnt = ballsAtStart;
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    if (sprBalls[i].speedX == 0 && sprBalls[i].speedY == 0) {
      if (sprBalls[i].alreadyShot) {
        cnt--;
      }
      continue;
    }
    if (sprBalls[i].delay > 0) {
      sprBalls[i].delay -= game.time.physicsElapsedMS;
      if (sprBalls[i].delay <= 0) {
        sprBalls[i].alreadyShot = true;
      }
      continue;
    }
    if (!sprBalls[i].alreadyShot) {
      continue;
    }
    cnt--;
  }
  txtBallsCount.text = "x" + cnt;
  txtBallsCount.visible = cnt > 0;
}, UpdateBalls:function() {
  sprLaserLineH.visible = false;
  sprLaserLineV.visible = false;
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    if (sprBalls[i].delay > 0) {
      continue;
    }
    if (sprBalls[i].speedX == 0 && sprBalls[i].speedY == 0) {
      continue;
    }
    sprBalls[i].x += sprBalls[i].speedX;
    sprBalls[i].y += sprBalls[i].speedY;
    if (sprBalls[i].collisionsEnabled) {
      if (SceneGame.instance.CheckCollisionBallWithBonuses(sprBalls[i])) {
        continue;
      }
      if (SceneGame.instance.CheckCollisionBallWithBricks(sprBalls[i])) {
        continue;
      }
    }
    if (sprBalls[i].left < 0) {
      sprBalls[i].left = 0;
      sprBalls[i].speedX *= -1;
      soundManager.playSound("ball");
    }
    if (sprBalls[i].top < 0) {
      sprBalls[i].top = 0;
      sprBalls[i].speedY *= -1;
      soundManager.playSound("ball");
    }
    if (sprBalls[i].right > game.width) {
      sprBalls[i].right = game.width;
      sprBalls[i].speedX *= -1;
      soundManager.playSound("ball");
    }
    if (sprBalls[i].bottom > imgBannerBottom.top - imgBannerTop.height) {
      sprBalls[i].bottom = imgBannerBottom.top - imgBannerTop.height;
      sprBalls[i].speedY *= -1;
      sprBalls[i].incBounces(-1);
      if (sprBalls[i].bounces < 0) {
        if (startPosX == null) {
          startPosX = sprBalls[i].x;
        }
        sprBalls[i].speedX = 0;
        sprBalls[i].speedY = 0;
        sprBalls[i].bounces = 0;
        SceneGame.instance.NextLevel();
      } else {
        soundManager.playSound("ball");
      }
    }
  }
}, RecallAllBalls:function() {
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    if (!sprBalls[i].collisionsEnabled) {
      return;
    }
  }
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    sprBalls[i].bounces = -1;
    sprBalls[i].delay = 0;
    sprBalls[i].collisionsEnabled = false;
    sprBalls[i].speedX = 0;
    sprBalls[i].speedY = BALLS_SPEED * 1.5;
  }
}, CheckCollisionBallWithBricks:function(ball) {
  for (var j = 0;j < sprBricks.length;j++) {
    if (!sprBricks[j].visible) {
      continue;
    }
    var collision = this.CheckCollisionCircleRect(ball, sprBricks[j]);
    if (collision == -1) {
      continue;
    }
    while (this.CheckCollisionCircleRect(ball, sprBricks[j]) >= 0) {
      ball.x -= ball.speedX / 2;
      ball.y -= ball.speedY / 2;
    }
    if (collision & 1 && (ball.x + ball.radius < sprBricks[j].left || ball.x - ball.radius > sprBricks[j].right)) {
      ball.speedX *= -1;
    }
    if (collision & 2 && (ball.y + ball.radius < sprBricks[j].top || ball.y - ball.radius > sprBricks[j].bottom)) {
      ball.speedY *= -1;
    }
    particles.CreateHitParticles(ball.x, ball.y + imgBannerTop.height, sprBricks[j].tint);
    if (ball.ultraball) {
      sprBricks[j].setBrickValue(0);
      soundManager.playSound("explode");
    } else {
      sprBricks[j].decBrickValue();
      soundManager.playSound("ball");
    }
    return true;
  }
  return false;
}, CheckCollisionBallWithBonuses:function(ball) {
  for (var j = 0;j < sprBonuses.length;j++) {
    if (!sprBonuses[j].visible) {
      continue;
    }
    if (sprBonuses[j].interactedBalls.contains(ball)) {
      continue;
    }
    var dist = Phaser.Math.distance(ball.x, ball.y, sprBonuses[j].x, sprBonuses[j].y);
    if (dist > ball.radius + sprBonuses[j].radius) {
      continue;
    }
    sprBonuses[j].interactedBalls.push(ball);
    if (sprBonuses[j].frameName == "ballup.png") {
      soundManager.playSound("power_up");
      soundManager.playSound("ball");
      gameBalls++;
    }
    if (sprBonuses[j].frameName == "ballshield.png") {
      ball.incBounces(1);
      sprBonuses[j].destroyOnNextLevel = true;
      return true;
    }
    if (sprBonuses[j].frameName == "sipkaV.png") {
      sprLaserLineV.reset(sprBonuses[j].x, game.height / 2);
      sprBonuses[j].destroyOnNextLevel = true;
      SceneGame.instance.DecBricksInCol(sprBonuses[j].x);
      soundManager.playSound("laser2", false);
      return true;
    }
    if (sprBonuses[j].frameName == "sipkaH.png") {
      sprLaserLineH.reset(game.width / 2, sprBonuses[j].y);
      sprBonuses[j].destroyOnNextLevel = true;
      SceneGame.instance.DecBricksInRow(sprBonuses[j].y);
      soundManager.playSound("laser2", false);
      return true;
    }
    if (sprBonuses[j].frameName == "sipkaVH.png") {
      sprLaserLineV.reset(sprBonuses[j].x, game.height / 2);
      sprLaserLineH.reset(game.width / 2, sprBonuses[j].y);
      sprBonuses[j].destroyOnNextLevel = true;
      SceneGame.instance.DecBricksInCol(sprBonuses[j].x);
      SceneGame.instance.DecBricksInRow(sprBonuses[j].y);
      soundManager.playSound("laser2", false);
      return true;
    }
    if (sprBonuses[j].frameName.indexOf("dia") == 0) {
      PlayerGems += sprBonuses[j].gems;
      levelGems += sprBonuses[j].gems;
      txtPlayerGems.text = "" + PlayerGems;
      GameData.Save();
      soundManager.playSound("gems");
    }
    sprBonuses[j].visible = false;
    return true;
  }
  return false;
}, CheckCollisionCircleRect:function(circle, rect) {
  var distx = circle.x - rect.x;
  var disty = circle.y - rect.y;
  if (distx < -rect.width / 2 - circle.radius) {
    return -1;
  }
  if (distx > rect.width / 2 + circle.radius) {
    return -1;
  }
  if (disty < -rect.height / 2 - circle.radius) {
    return -1;
  }
  if (disty > rect.height / 2 + circle.radius) {
    return -1;
  }
  var retval = 0;
  if (Math.abs(distx) <= rect.width / 2 + circle.radius) {
    retval = retval | 1;
  }
  if (Math.abs(disty) <= rect.height / 2 + circle.radius) {
    retval = retval | 2;
  }
  return retval;
}, ResetBalls:function() {
  ballsPosX = game.width / 2;
  ballsPosY = imgBannerBottom.top - imgBannerTop.height - sprBalls[0].width / 2;
  for (var i = 0;i < sprBalls.length;i++) {
    sprBalls[i].visible = false;
  }
  for (var i = 0;i < gameBalls;i++) {
    var ball = SceneGame.instance.GetFreeBall();
    ball.reset(ballsPosX, ballsPosY);
    ball.speedX = 0;
    ball.speedY = 0;
    ball.collisionsEnabled = true;
    ball.alreadyShot = false;
    ball.setBounces(0);
    ball.frameName = "ball0.png";
    if (PlayerBall != -1) {
      ball.frameName = "ball" + (PlayerBall + 1) + ".png";
    }
  }
  txtBallsCount.text = "x" + gameBalls;
  txtBallsCount.reset(ballsPosX, ballsPosY - 20);
}, GetFreeBall:function() {
  for (var i = 0;i < sprBalls.length;i++) {
    if (sprBalls[i].visible) {
      continue;
    }
    return sprBalls[i];
  }
  return null;
}, GetVisibleBallsCount:function() {
  var cnt = 0;
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    cnt++;
  }
  return cnt;
}, GetActiveBallsCount:function() {
  var cnt = 0;
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    if (sprBalls[i].speedX == 0 && sprBalls[i].speedY == 0) {
      continue;
    }
    cnt++;
  }
  return cnt;
}, ShootBalls:function(speedX, speedY) {
  game.paused = false;
  soundManager.playSound("shoot");
  var delay = 0;
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    sprBalls[i].speedX = speedX;
    sprBalls[i].speedY = speedY;
    sprBalls[i].setBounces(0);
    sprBalls[i].delay = delay;
    sprBalls[i].collisionsEnabled = true;
    if (delay == 0) {
      sprBalls[i].alreadyShot = true;
    }
    delay += BALLS_DELAY;
  }
  FWD = false;
  startPosX = null;
  ScenesTransitions.hideSceneAlpha(grpSceneBottomGameButtons);
  ScenesTransitions.showSceneAlpha(grpSceneBottomGameRunningButtons);
}, CreateNewBalls:function() {
  var cnt = SceneGame.instance.GetVisibleBallsCount();
  for (var i = 0;i < gameBalls - cnt;i++) {
    var ball = SceneGame.instance.GetFreeBall();
    ball.reset(ballsPosX, ballsPosY);
    ball.setBounces(0);
    ball.frameName = "ball0.png";
    ball.alreadyShot = false;
    if (PlayerBall != -1) {
      ball.frameName = "ball" + (PlayerBall + 1) + ".png";
    }
  }
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    sprBalls[i].alreadyShot = false;
    sprBalls[i].ultraball = false;
    sprBalls[i].shield.visible = false;
  }
  ballsAtStart = gameBalls;
}, TryToCreateCheckpoint:function() {
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    return;
  }
  textParticles.CreateTextParticle1(game.width >> 1, (game.height >> 1) + 20, "CHECKPOINT", 30, "#FFFFFF");
  particles.CreateFinalStars(0, (game.height >> 1) - 180, true);
  particles.CreateFinalStars(0, game.height >> 1, true);
  particles.CreateFinalStars(0, (game.height >> 1) + 180, true);
  particles.CreateFinalStars(game.width, (game.height >> 1) - 180, false);
  particles.CreateFinalStars(game.width, game.height >> 1, false);
  particles.CreateFinalStars(game.width, (game.height >> 1) + 180, false);
  CheckpointLevel = gameLevel;
  GameData.Save();
  soundManager.playSound("achieve");
}, EqualizeBalls:function() {
  ScenesTransitions.transitionStarted();
  var cnt = SceneGame.instance.GetVisibleBallsCount();
  if (cnt == 1) {
    for (var i = 0;i < sprBalls.length;i++) {
      if (!sprBalls[i].visible) {
        continue;
      }
      ballsPosX = sprBalls[i].x;
    }
    if (SceneGame.instance.TestForGameWinner()) {
      SceneGame.instance.GameWin();
      return;
    }
    SceneGame.instance.TryToCreateCheckpoint();
    SceneGame.instance.CreateNewBalls();
    SceneGame.instance.SpawnNewRow();
    ScenesTransitions.showSceneAlpha(grpSceneBottomGameButtons);
    ScenesTransitions.hideSceneAlpha(grpSceneBottomGameRunningButtons, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
    return;
  }
  var posx = 0;
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    posx += sprBalls[i].x;
  }
  posx = posx / cnt;
  var callbackSet = false;
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    sprBalls[i].moveTween = game.add.tween(sprBalls[i]);
    sprBalls[i].moveTween.to({x:startPosX}, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.TRANSITION_EFFECT_OUT);
    sprBalls[i].moveTween.start();
    if (!callbackSet) {
      sprBalls[i].moveTween.onComplete.add(function() {
        if (SceneGame.instance.TestForGameWinner()) {
          SceneGame.instance.GameWin();
          return;
        }
        SceneGame.instance.TryToCreateCheckpoint();
        SceneGame.instance.CreateNewBalls();
        SceneGame.instance.SpawnNewRow();
        ScenesTransitions.showSceneAlpha(grpSceneBottomGameButtons);
        ScenesTransitions.hideSceneAlpha(grpSceneBottomGameRunningButtons, 0, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.transitionFinished);
      }, this);
      callbackSet = true;
    }
    ballsPosX = startPosX;
  }
}, CreateBonuses:function() {
  sprBonuses = [];
  for (var i = 0;i < MAX_BONUSES;i++) {
    sprBonuses[i] = grpSceneGame.create(-40, 0, "pak1", "ballup.png");
    sprBonuses[i].anchor.set(.5);
    sprBonuses[i].radius = sprBonuses[i].width * .4;
    sprBonuses[i].visible = false;
    sprBonuses[i].destroyOnNextLevel = false;
    sprBonuses[i].interactedBalls = [];
  }
}, ResetBonusesVsBalls:function() {
  for (var i = 0;i < sprBonuses.length;i++) {
    sprBonuses[i].interactedBalls = [];
  }
}, ResetBonuses:function() {
  for (var i = 0;i < sprBonuses.length;i++) {
    sprBonuses[i].visible = false;
  }
}, GetFreeBonus:function() {
  for (var i = 0;i < sprBonuses.length;i++) {
    if (sprBonuses[i].visible) {
      continue;
    }
    return sprBonuses[i];
  }
  return null;
}, CreateWarnings:function() {
  sprWarnings = [];
  for (var i = 0;i < 7;i++) {
    var posx = game.width / 2 - 7 / 2 * sprBricks[0].width + i * sprBricks[0].width + sprBricks[0].width / 2;
    var posy = sprBricks[0].height * 8 - sprBricks[0].height / 2;
    sprWarnings[i] = grpSceneGame.create(posx, posy, "pak1", "warning.png");
    sprWarnings[i].anchor.set(.5);
    sprWarnings[i].alpha = 0;
    game.add.tween(sprWarnings[i]).to({alpha:.9}, 400, Phaser.Easing.Quartic.Out, true, 50, -1, true);
  }
  imgGameHazardL = grpSceneGame.create(0, game.height >> 1, "pak1", "beam.png");
  imgGameHazardL.tint = 16711680;
  imgGameHazardL.alpha = 0;
  imgGameHazardL.scale.x = 2.8;
  imgGameHazardL.anchor.set(.5);
  imgGameHazardL.height = game.height;
  imgGameHazardR = grpSceneGame.create(game.width, game.height >> 1, "pak1", "beam.png");
  imgGameHazardR.tint = 16711680;
  imgGameHazardR.alpha = 0;
  imgGameHazardR.scale.x = -2.8;
  imgGameHazardR.anchor.set(.5);
  imgGameHazardR.height = game.height;
  game.add.tween(imgGameHazardL).to({alpha:.6}, 400, Phaser.Easing.Quartic.Out, true, 50, -1, true);
  game.add.tween(imgGameHazardR).to({alpha:.6}, 400, Phaser.Easing.Quartic.Out, true, 50, -1, true);
}, UpdateWarnings:function(ingame) {
  if (ingame === undefined) {
    ingame = false;
  }
  var warning = false;
  for (var i = 0;i < sprBricks.length && !warning;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (sprBricks[i].y >= sprWarnings[0].y - 1 * sprBricks[0].height) {
      warning = true;
    }
  }
  for (var i = 0;i < sprWarnings.length;i++) {
    sprWarnings[i].visible = warning;
  }
  if (ingame && warning) {
    return;
  }
  imgGameHazardL.visible = warning;
  imgGameHazardR.visible = warning;
  if (warning) {
    soundManager.playSound("warning", false);
  } else {
    soundManager.sounds["warning"].stop();
  }
}, UpdateInput:function() {
  if (ScenesTransitions.transitionActive) {
    return;
  }
  if (SceneGame.instance.GetActiveBallsCount() > 0) {
    return;
  }
  sprInputLine.visible = false;
  sprAimingLine.visible = false;
  if (game.input.activePointer.isDown) {
    if (game.input.activePointer.positionDown.y < imgBannerTop.bottom) {
      return;
    }
    if (game.input.activePointer.positionDown.y > imgBannerBottom.top) {
      return;
    }
    var dist = Phaser.Math.distance(game.input.activePointer.positionDown.x, game.input.activePointer.positionDown.y, game.input.activePointer.position.x, game.input.activePointer.position.y);
    var rotation = Phaser.Math.angleBetweenPoints(game.input.activePointer.positionDown, game.input.activePointer.position);
    sprInputLine.position.setTo(game.input.activePointer.positionDown.x, game.input.activePointer.positionDown.y - imgBannerTop.height);
    sprInputLine.height = dist;
    sprInputLine.rotation = rotation + Phaser.Math.degToRad(90);
    if (rotation > 0) {
      rotation -= Phaser.Math.degToRad(180);
    }
    angle = Phaser.Math.radToDeg(rotation);
    sprAimingLine.tint = 16777215;
    if (angle <= -180 + MIN_ANGLE || angle >= -MIN_ANGLE) {
      sprAimingLine.tint = 16711680;
    }
    sprAimingLine.position.setTo(ballsPosX, ballsPosY);
    sprAimingLine.height = game.height;
    sprAimingLine.rotation = rotation + Phaser.Math.degToRad(90);
    sprInputLine.visible = true;
    sprAimingLine.visible = true;
    tookAim = true;
  } else {
    if (tookAim) {
      tookAim = false;
      var rotation = Phaser.Math.angleBetweenPoints(game.input.activePointer.positionDown, game.input.activePointer.position);
      if (rotation > 0) {
        rotation -= Phaser.Math.degToRad(180);
      }
      angle = Phaser.Math.radToDeg(rotation);
      if (angle <= -180 + MIN_ANGLE || angle >= -MIN_ANGLE) {
        return;
      }
      rotation += Phaser.Math.degToRad(90);
      SceneGame.instance.ShootBalls(Math.sin(rotation) * BALLS_SPEED, -(Math.cos(rotation) * BALLS_SPEED));
    }
  }
}, NextLevel:function() {
  if (SceneGame.instance.GetActiveBallsCount() > 0) {
    return;
  }
  SceneGame.instance.ResetBonusesVsBalls();
  SceneGame.instance.EqualizeBalls();
}, PrepareNextRow:function() {
  gameLevel++;
  var row = [0, 0, 0, 0, 0, 0, 0];
  var blocksSet = 0;
  var ballSet = false;
  var upgradeSet = false;
  while (blocksSet == 0 || !ballSet) {
    for (var i = 0;i < row.length;i++) {
      if (row[i] == 0) {
        var diceRoll = Phaser.Math.between(0, 100);
        if (diceRoll <= 5 * (Math.sqrt(gameLevel) - 1) / 2 && blocksSet < 4) {
          var blockVal = gameLevel;
          var tmp = 1 * (Math.sqrt(gameLevel) - 1) / 2;
          tmp *= Difficulty;
          if (Phaser.Math.between(0, 100) <= tmp) {
            blockVal = gameLevel * 2;
          }
          row[i] = blockVal;
          blocksSet++;
        } else {
          if (diceRoll <= 15 && !ballSet) {
            row[i] = -1;
            ballSet = true;
          } else {
            if (diceRoll >= 97 & !upgradeSet) {
              var upgradeRNG = Phaser.Math.between(1, 5);
              if (upgradeRNG == 1) {
                row[i] = -2;
                upgradeSet = true;
              } else {
                if (upgradeRNG == 2) {
                  var laserRNG = Phaser.Math.between(0, 100);
                  if (laserRNG <= 30) {
                    row[i] = -3;
                  } else {
                    if (laserRNG >= 60) {
                      row[i] = -4;
                    } else {
                      row[i] = -5;
                    }
                  }
                  upgradeSet = true;
                } else {
                  if (upgradeRNG == 3) {
                    var gemRNG = Phaser.Math.between(1, 4);
                    row[i] = -5 + -gemRNG;
                    upgradeSet = true;
                  } else {
                    if (upgradeRNG == 4) {
                      row[i] = -9;
                      upgradeSet = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  LOG("Row array: " + "|" + row[0] + "|" + row[1] + "|" + row[2] + "|" + row[3] + "|" + row[4] + "|" + row[5] + "|" + row[6] + "|");
  return row;
}, SpawnNewRow:function() {
  var row = SceneGame.instance.PrepareNextRow();
  for (var i = 0;i < row.length;i++) {
    var posx = game.width / 2 - row.length / 2 * sprBricks[0].width + i * sprBricks[0].width + sprBricks[0].width / 2;
    var posy = -sprBricks[0].height / 2;
    if (row[i] == 0) {
      continue;
    }
    if (row[i] > 0) {
      var brick = SceneGame.instance.GetFreeBrick();
      brick.reset(posx, posy);
      brick.setBrickValue(row[i]);
      continue;
    }
    if (row[i] == -1) {
      var bonus = SceneGame.instance.GetFreeBonus();
      bonus.frameName = "ballup.png";
      bonus.reset(posx, posy);
      bonus.destroyOnNextLevel = false;
      continue;
    }
    if (row[i] == -2) {
      var bonus = SceneGame.instance.GetFreeBonus();
      bonus.frameName = "ballshield.png";
      bonus.reset(posx, posy);
      bonus.destroyOnNextLevel = false;
      continue;
    }
    if (row[i] == -3) {
      var bonus = SceneGame.instance.GetFreeBonus();
      bonus.frameName = "sipkaH.png";
      bonus.reset(posx, posy);
      bonus.destroyOnNextLevel = false;
      continue;
      continue;
    }
    if (row[i] == -4) {
      var bonus = SceneGame.instance.GetFreeBonus();
      bonus.frameName = "sipkaV.png";
      bonus.reset(posx, posy);
      bonus.destroyOnNextLevel = false;
      continue;
      continue;
    }
    if (row[i] == -5) {
      var bonus = SceneGame.instance.GetFreeBonus();
      bonus.frameName = "sipkaVH.png";
      bonus.reset(posx, posy);
      bonus.destroyOnNextLevel = false;
      continue;
    }
    if (row[i] <= -6 && row[i] >= -8) {
      var bonus = SceneGame.instance.GetFreeBonus();
      bonus.gems = row[i] + 9;
      bonus.frameName = "dia" + bonus.gems + ".png";
      bonus.reset(posx, posy);
      bonus.destroyOnNextLevel = false;
      continue;
      continue;
    }
    if (row[i] == -9) {
      continue;
    }
  }
  txtLevelNum.text = "" + gameLevel;
  txtBallsCount.text = "x" + gameBalls;
  txtBallsCount.reset(ballsPosX, ballsPosY - 20);
  SceneGame.instance.MoveAllObjectsDown();
}, TestForGameWinner:function() {
  if (gameLevel == 300) {
    return true;
  }
}, RestartGame:function() {
  //return swagApiInstance.startGame().then(function() {
    soundManager.stopMusic();
    gameBalls = CheckpointLevel;
    if (gameBalls == 0) {
      gameBalls = 1;
    }
    gameLevel = CheckpointLevel;
    ballsAtStart = gameBalls;
    startLevel = gameLevel;
    levelGems = 0;
    tookAim = false;
    SceneGame.instance.ResetBalls();
    SceneGame.instance.ResetBricks();
    SceneGame.instance.ResetBonuses();
    SceneGame.instance.SpawnNewRow();
    ScenesTransitions.showSceneAlpha(grpSceneBottomGameButtons);
    sprLaserLineV.visible = false;
    sprLaserLineH.visible = false;
    gameRunning = true;
    onGameStart();
  // });
}, ResumeGame:function() {
  gameRunning = true;
  gamePaused = false;
  SceneGame.instance.UpdateWarnings();
}, MoveAllObjectsDown:function() {
  var dspy = sprBricks[0].height;
  var maxIdx = -1;
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (i > maxIdx) {
      maxIdx = i;
    }
    sprBricks[i].moveTween = game.add.tween(sprBricks[i]);
    sprBricks[i].moveTween.to({y:sprBricks[i].y + dspy}, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.TRANSITION_EFFECT_OUT);
    sprBricks[i].moveTween.start();
  }
  if (maxIdx > -1) {
    sprBricks[maxIdx].moveTween.onComplete.add(function() {
      SceneGame.instance.UpdateWarnings();
    }, this);
  }
  for (var i = 0;i < sprBonuses.length;i++) {
    if (!sprBonuses[i].visible) {
      continue;
    }
    if (sprBonuses[i].destroyOnNextLevel) {
      sprBonuses[i].visible = false;
      continue;
    }
    sprBonuses[i].moveTween = game.add.tween(sprBonuses[i]);
    sprBonuses[i].moveTween.to({y:sprBonuses[i].y + dspy}, ScenesTransitions.TRANSITION_LENGTH, ScenesTransitions.TRANSITION_EFFECT_OUT);
    sprBonuses[i].moveTween.start();
  }
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (sprBricks[i].y >= sprWarnings[0].y - sprBricks[0].height) {
      SceneGame.instance.GameOver();
      return;
    }
  }
}, OnPressedFromGameToPause:function() {
  gameRunning = false;
  gamePaused = true;
  soundManager.sounds["warning"].stop();
  SceneOverlay.instance.ShowAnimated();
  ScenePause.instance.ShowAnimated();
}, GameOver:function() {
  gameRunning = false;
  gamePaused = true;
  txtResultGemsVal.text = "+" + levelGems;
  txtResultRoundsVal.text = "" + (gameLevel - startLevel);
  soundManager.sounds["warning"].stop();
  SceneOverlay.instance.ShowAnimated();
  SceneResult.instance.ShowAnimated();
  onGameOver(GAME_OVER_BY_GAME);
}, GameWin:function() {
  gameRunning = false;
  gamePaused = true;
  txtResultGemsVal.text = "+" + levelGems;
  txtResultRoundsVal.text = "" + (gameLevel - startLevel);
  PlayerGems += 100;
  Difficulty += 1;
  if (Difficulty > 3) {
    Difficulty = 3;
  }
  GameData.Save();
  txtPlayerGems.text = "" + PlayerGems;
  SceneMenu.instance.updateTexts();
  soundManager.sounds["warning"].stop();
  SceneOverlay.instance.ShowAnimated();
  SceneWinner.instance.ShowAnimated();
}, BonusBreakBottomBlocks:function() {
  var bottomPosY = -1E3;
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (sprBricks[i].y > bottomPosY) {
      bottomPosY = sprBricks[i].y;
    }
  }
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (sprBricks[i].y == bottomPosY) {
      particles.CreateHitParticles(sprBricks[i].x, sprBricks[i].y + imgBannerTop.height, sprBricks[i].tint, 15);
      sprBricks[i].visible = false;
    }
  }
  soundManager.playSound("vybuch");
  SceneGame.instance.UpdateWarnings(true);
  soundManager.playMusic("music_game");
}, BonusHalveAllBlocks:function() {
  for (var i = 0;i < sprBricks.length;i++) {
    if (!sprBricks[i].visible) {
      continue;
    }
    if (sprBricks[i].brickValue > 1) {
      sprBricks[i].setBrickValue(Math.floor(sprBricks[i].brickValue / 2));
      particles.CreateHitParticles(sprBricks[i].x, sprBricks[i].y + imgBannerTop.height, sprBricks[i].tint, 10);
    }
  }
  soundManager.playSound("vybuch");
  soundManager.playMusic("music_game");
}, BonusUltraBall:function() {
  for (var i = 0;i < sprBalls.length;i++) {
    if (!sprBalls[i].visible) {
      continue;
    }
    sprBalls[i].ultraball = true;
    sprBalls[i].shield.frameName = "sballulrta.png";
    sprBalls[i].shield.visible = true;
  }
  soundManager.playMusic("music_game");
}, create:function() {
  grpSceneGame = game.add.group();
  txtLevelNum = game.add.bitmapText(game.width >> 1, game.height >> 1, "gamefont_TA", "25", 200);
  txtLevelNum.anchor.set(.5);
  txtLevelNum.alpha = .2;
  grpSceneGame.addChild(txtLevelNum);
  btnGamePause = grpSceneGame.create(35, game.height - 35, "pak1", "pause.png");
  btnGamePause.anchor.set(.5);
  AddButtonEvents(btnGamePause, function() {
    this.OnPressedFromGameToPause();
  }.bind(this), ButtonOnInputOver, ButtonOnInputOut);
  sprInputLine = grpSceneGame.create(0, 0, "pak1", "blank.png");
  sprInputLine.anchor.setTo(.5, 1);
  sprInputLine.width = 2;
  sprInputLine.height = 5;
  sprInputLine.tint = 16776960;
  sprAimingLine = grpSceneGame.create(0, 0, "pak1", "blank.png");
  sprAimingLine.anchor.setTo(.5, 1);
  sprAimingLine.width = 4;
  sprAimingLine.height = 5;
  this.CreateBricks();
  this.CreateWarnings();
  this.CreateBalls();
  this.CreateBonuses();
  sprLaserLineH = grpSceneGame.create(0, 0, "pak1", "blank.png");
  sprLaserLineH.anchor.setTo(.5, .5);
  sprLaserLineH.width = game.width;
  sprLaserLineH.height = 5;
  sprLaserLineH.tint = 16776960;
  sprLaserLineH.visible = false;
  sprLaserLineV = grpSceneGame.create(0, 0, "pak1", "blank.png");
  sprLaserLineV.anchor.setTo(.5, .5);
  sprLaserLineV.width = 5;
  sprLaserLineV.height = game.height;
  sprLaserLineV.tint = 16776960;
  sprLaserLineV.visible = false;
  grpSceneGame.visible = false;
  FWD = false;
  gameRunning = false;
}, update:function() {
  SceneGame.instance.UpdateParticles();
  grpSceneGame.y = imgBannerTop.bottom;
  if (!gameRunning) {
    return;
  }
  this.UpdateInput();
  this.UpdateBallsDelays();
  this.UpdateBalls();
  if (FWD) {
    this.UpdateBallsDelays();
    this.UpdateBalls();
  }
}, onResolutionChange:function() {
  grpSceneGame.y = imgBannerTop.bottom;
  btnGamePause.reset(35, game.height - 35);
  txtLevelNum.position.setTo(game.width >> 1, (game.height >> 1) - imgBannerTop.height);
}, onPause:function() {
  if (!gameRunning) {
    return;
  }
  if (grpSceneGame.visible && !grpScenePause.visible && !grpSceneResult.visible) {
    if (gameRunning) {
      SceneGame.instance.OnPressedFromGameToPause();
    }
  }
  soundManager.pauseMusic();
}, UpdateParticles:function() {
  particles.Update();
  textParticles.Update();
  if (!gameRunning) {
    return;
  }
}, ShowAnimated:function() {
  SceneGame.instance.onResolutionChange();
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Quadratic.Out;
  ScenesTransitions.showSceneAlpha(grpSceneGame, 0, ScenesTransitions.TRANSITION_LENGTH + 10, ScenesTransitions.transitionFinished);
}, HideAnimated:function() {
  ScenesTransitions.transitionStarted();
  ScenesTransitions.TRANSITION_EFFECT_IN = Phaser.Easing.Quadratic.Out;
  ScenesTransitions.hideSceneAlpha(grpSceneGame, 0, ScenesTransitions.TRANSITION_LENGTH + 10, ScenesTransitions.transitionFinished);
}, render:function() {
}};
function onGameStart() {
}
var GAME_OVER_BY_GAME = 0;
var GAME_OVER_BY_USER = 1;
function onGameOver(endType) {
  var score = gameLevel - 1;
  // return swagApiInstance.endGame({score:score}).then(function() {
  //   if (endType === GAME_OVER_BY_GAME) {
  //     if (swagApiIsReady) {
  //       swagApiInstance.postScore("score", score);
  //     }
  //   }
  // });
}
;

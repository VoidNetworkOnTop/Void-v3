Particles = function(grp) {
  this.MAX_PARTICLES = 100;
  if (!Phaser.Device.desktop) {
    this.MAX_PARTICLES = 50;
  }
  this.objParticles = [];
  this._init();
  Particles.instance = this;
}, Particles.instance = null;
Particles.prototype = {constructor:Particles, _init:function(grp) {
  this.grpParticles = game.add.group();
  var data = {tag:"", velX:0, velY:0, accX:0, accY:0, sprite:"pak1", frameName:"particle_smallest.png"};
  for (var i = 0;i < this.MAX_PARTICLES;i++) {
    this.CreateParticle(0, 0, data);
  }
  for (var i = 0;i < this.MAX_PARTICLES;i++) {
    this.objParticles[i].sprite.visible = false;
  }
}, CreateParticle:function(x, y, data) {
  if (!data.hasOwnProperty("tag")) {
    data.tag = "";
  }
  if (!data.hasOwnProperty("frame")) {
    data.frame = 0;
  }
  if (!data.hasOwnProperty("blendMode")) {
    data.blendMode = PIXI.blendModes.NORMAL;
  }
  if (!data.hasOwnProperty("life")) {
    data.life = 500 + getRandomUInt(200);
  }
  if (!data.hasOwnProperty("velX")) {
    data.velX = 0;
  }
  if (!data.hasOwnProperty("velY")) {
    data.velY = 0;
  }
  if (!data.hasOwnProperty("accX")) {
    data.accX = 0;
  }
  if (!data.hasOwnProperty("accY")) {
    data.accY = 0;
  }
  if (!data.hasOwnProperty("rotation")) {
    data.rotation = 0;
  }
  if (!data.hasOwnProperty("scale")) {
    data.scale = {start:1, end:1};
  } else {
    if (!data.scale.hasOwnProperty("start")) {
      data.scale.start = 1;
    }
    if (!data.scale.hasOwnProperty("end")) {
      data.scale.end = data.scale.start;
    }
  }
  data.scale.delta = data.scale.start - data.scale.end;
  if (!data.hasOwnProperty("alpha")) {
    data.alpha = {start:1, end:1};
  } else {
    if (!data.alpha.hasOwnProperty("start")) {
      data.alpha.start = 1;
    }
    if (!data.alpha.hasOwnProperty("end")) {
      data.alpha.end = data.alpha.start;
    }
  }
  data.alpha.delta = data.alpha.start - data.alpha.end;
  var part = null;
  for (var i = 0;i < this.objParticles.length && part == null;i++) {
    if (!this.objParticles[i].sprite.visible) {
      part = this.objParticles[i];
      if (part.sprite.key != data.sprite) {
        part.sprite.loadTexture(data.sprite);
      }
      part.sprite.frame = data.frame;
      if (data.hasOwnProperty("frameName")) {
        part.sprite.frameName = data.frameName;
      }
    }
  }
  if (part === null) {
    if (this.objParticles.length == this.MAX_PARTICLES) {
      return null;
    }
    part = this.objParticles[this.objParticles.length] = new Object;
    part.sprite = this.grpParticles.create(-100, -100, data.sprite, data.frame);
    part.sprite.anchor.set(.5);
    if (data.hasOwnProperty("frameName")) {
      part.sprite.frameName = data.frameName;
    }
  }
  game.world.bringToTop(part.sprite);
  part.sprite.visible = true;
  part.sprite.alpha = data.alpha.start;
  part.sprite.angle = 0;
  part.sprite.x = x;
  part.sprite.y = y;
  part.sprite.scale.set(1);
  part.sprite.tint = 16777215;
  part.sprite.blendMode = data.blendMode;
  part.data = data;
  part.data.lifeInit = data.life;
  return part;
}, Reset:function() {
  for (var i = 0;i < objParticles.length;i++) {
    this.objParticles[i].sprite.visible = false;
  }
}, GetActiveCount:function(tag) {
  tag = tag || null;
  var retVal = 0;
  for (var i = 0;i < this.objParticles.length;i++) {
    if (tag != null) {
      if (this.objParticles[i].data.tag != tag) {
        continue;
      }
    }
    if (!this.objParticles[i].sprite.visible) {
      continue;
    }
    if (objParticles[i].data.life > 0) {
      retVal++;
    }
  }
  return retVal;
}, Update:function() {
  for (var i = 0;i < this.objParticles.length;i++) {
    if (!this.objParticles[i].sprite.visible) {
      continue;
    }
    this.objParticles[i].data.life -= game.time.elapsedMS;
    if (this.objParticles[i].data.life <= 0) {
      this.objParticles[i].sprite.visible = false;
      continue;
    }
    this.objParticles[i].sprite.alpha = this.objParticles[i].data.alpha.start - this.objParticles[i].data.alpha.delta + this.objParticles[i].data.life / this.objParticles[i].data.lifeInit * this.objParticles[i].data.alpha.delta;
    this.objParticles[i].sprite.scale.set(this.objParticles[i].data.scale.start - this.objParticles[i].data.scale.delta + this.objParticles[i].data.life / this.objParticles[i].data.lifeInit * this.objParticles[i].data.scale.delta);
    this.objParticles[i].sprite.angle += this.objParticles[i].data.rotation;
    this.objParticles[i].sprite.x += this.objParticles[i].data.velX;
    this.objParticles[i].sprite.y += this.objParticles[i].data.velY;
    this.objParticles[i].data.velX += this.objParticles[i].data.accX;
    this.objParticles[i].data.velY += this.objParticles[i].data.accY;
  }
}, Destroy:function() {
  for (var i = 0;i < this.objParticles.length;i++) {
    this.objParticles[i].sprite.destroy();
    this.objParticles[i].sprite = null;
    this.objParticles[i] = null;
  }
  this.objParticles = null;
}, CreateBubbles:function(xpos, ypos, colour, particlesCount, life, blendMode) {
  particlesCount = particlesCount || 10;
  blendMode = blendMode || PIXI.blendModes.NORMAL;
  for (var i = particlesCount - 1;i >= 0;i--) {
    tmpX = game.rnd.integerInRange(-100, 100) / 30;
    tmpY = game.rnd.integerInRange(50, 100) / 1E3;
    var scl = (5 + getRandomUInt(5)) / 10;
    var alph = (2 + getRandomUInt(5)) / 10;
    var data = {velX:0, velY:-tmpY, accX:0, accY:tmpY <= 0 ? .01 : -.01, sprite:"pak1", frameName:"particle_smallest.png", blendMode:blendMode, rotation:tmpX <= 0 ? 4 : 4, scale:{start:scl, end:scl}, alpha:{start:alph, end:alph}, life:life};
    var part = this.CreateParticle(xpos + game.rnd.integerInRange(-6, 6), ypos + game.rnd.integerInRange(-4, 4), data);
    if (part == null) {
      continue;
    }
    part.sprite.tint = colour;
  }
}, CreateTrail:function(xpos, ypos, colour) {
  particlesCount = 1;
  blendMode = PIXI.blendModes.ADD;
  life = 700;
  if (!Phaser.Device.desktop) {
    life = Math.ceil(life * .6);
  }
  for (var i = particlesCount - 1;i >= 0;i--) {
    var scl = (5 + getRandomUInt(5)) / 10;
    var alph = (2 + getRandomUInt(5)) / 10;
    var data = {velX:0, velY:0, accX:0, accY:0, sprite:"pak1", frameName:"dot_1.png", blendMode:blendMode, rotation:0, scale:{start:1, end:.3}, alpha:{start:.6, end:0}, life:life};
    var part = this.CreateParticle(xpos, ypos, data);
    if (part == null) {
      continue;
    }
    part.sprite.tint = colour;
  }
}, CreateHitParticles:function(xpos, ypos, colour, particlesCount) {
  if (particlesCount === undefined) {
    particlesCount = 1;
    if (PlayerBalls < 20) {
      particlesCount = 3;
    }
    if (PlayerBalls < 50) {
      particlesCount = 2;
    }
  }
  blendMode = PIXI.blendModes.NORMAL;
  for (var i = particlesCount - 1;i >= 0;i--) {
    tmpX = game.rnd.integerInRange(-100, 100) / 25;
    tmpY = game.rnd.integerInRange(-100, 100) / 25;
    var data = {velX:tmpX, velY:tmpY, accX:tmpX <= 0 ? .01 : -.01, accY:tmpY <= 0 ? .01 : -.01, sprite:"pak1", frameName:"blank.png", blendMode:blendMode, rotation:0, scale:{start:1.5, end:.5}, alpha:{start:1, end:0}, life:300};
    var part = this.CreateParticle(xpos + game.rnd.integerInRange(-4, 4), ypos + game.rnd.integerInRange(-4, 4), data);
    if (part == null) {
      continue;
    }
    part.sprite.tint = colour;
  }
}, CreateFinalStars:function(xpos, ypos, left) {
  particlesCount = 10;
  if (!Phaser.Device.desktop) {
    particlesCount = 5;
  }
  blendMode = PIXI.blendModes.ADD;
  for (var i = particlesCount - 1;i >= 0;i--) {
    tmpX = Math.abs(game.rnd.integerInRange(-100, 100) / 10) * (left ? 1 : -1);
    tmpY = game.rnd.integerInRange(-100, 100) / 15;
    var tmpScale = getRandomUInt(20) / 100;
    var data = {velX:tmpX, velY:tmpY, accX:tmpX <= 0 ? .01 : -.01, accY:tmpY <= 0 ? .02 : -.02, sprite:"pak1", frameName:"star_particles.png", blendMode:blendMode, rotation:tmpX <= 0 ? 4 : 4, scale:{start:1.2 - tmpScale, end:2.3 - tmpScale}, alpha:{start:1, end:0}, life:650};
    var part = this.CreateParticle(xpos + game.rnd.integerInRange(-10, 10), ypos + game.rnd.integerInRange(-10, 10), data);
    if (part == null) {
      continue;
    }
    part.sprite.tint = BRICK_COLORS[getRandomUInt(BRICK_COLORS.length)];
  }
}, CreateFallingStars:function(xpos, ypos, frameName) {
  particlesCount = 6;
  for (var i = particlesCount - 1;i >= 0;i--) {
    var tmpX = game.rnd.integerInRange(-100, 100) / 50;
    var tmpY = game.rnd.integerInRange(-100, 100) / 50;
    var data = {velX:tmpX, velY:tmpY, accX:tmpX <= 0 ? .01 : -.01, accY:tmpY <= 0 ? .01 : -.01, sprite:"pak1", frameName:frameName, blendMode:PIXI.blendModes.NORMAL, rotation:0, scale:{start:1, end:.3}, alpha:{start:.7, end:0}, life:500};
    var part = this.CreateParticle(xpos, ypos, data);
    if (part == null) {
      continue;
    }
  }
}};


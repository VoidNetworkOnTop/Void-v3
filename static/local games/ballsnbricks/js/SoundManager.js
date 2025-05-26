SoundManager = function(game) {
  this.game = game;
  try {
    this.musicPlaying = SOUNDS_ENABLED;
    if (localStorage.getItem("inl-blls-brcks-music")) {
      this.musicPlaying = SOUNDS_ENABLED && JSON.parse(localStorage.getItem("inl-blls-brcks-music")) === true;
    }
  } catch (e) {
    this.musicPlaying = SOUNDS_ENABLED;
  }
  if (GameData.BuildDebug) {
    this.musicPlaying = false;
  }
  this.music = [];
  this.sounds = [];
  this.actualMusic = null;
  this.prevSoundPlayed = null;
};
SoundManager.prototype = {constructor:SoundManager, create:function() {
  this.addMusic("music_menu", .3, true);
  this.addMusic("music_game", .3, true);
  this.addSound("menu-click1", .5);
  this.addSound("explode", .6);
  this.addSound("vybuch", .6);
  this.addSound("gems", .6);
  this.addSound("ball", .7);
  this.addSound("shoot", .5);
  this.addSound("laser2", .5);
  this.addSound("pay", .5);
  this.addSound("achieve", .5);
  this.addSound("tile_wrong-one", .3);
  this.addSound("warning", .1, true);
  this.addSound("power_up", .6);
}, addMusic:function(audioFile, volume, loop) {
  if (loop === undefined) {
    loop = false;
  }
  this.music[audioFile] = game.add.audio(audioFile, volume, loop);
}, addSound:function(audioFile, volume, loop, callback) {
  if (loop === undefined) {
    loop = false;
  }
  if (callback === undefined) {
    callback = null;
  }
  this.sounds[audioFile] = game.add.audio(audioFile, volume, loop);
  this.sounds[audioFile].VOLUME = volume;
  if (callback != null) {
    this.sounds[audioFile].onStop.add(callback, this);
  }
}, playMusic:function(musicToPlay, reset) {
  if (reset === undefined) {
    reset = false;
  }
  if (musicToPlay != this.actualMusic || reset) {
    this.actualMusic = musicToPlay;
  }
  if (!this.musicPlaying) {
    return;
  }
  for (var key in this.music) {
    if (key == "contains") {
      continue;
    }
    if (key == this.actualMusic) {
      if (!this.music[key].isPlaying || reset) {
        this.music[key].play();
      }
    } else {
      this.music[key].stop();
    }
  }
}, playSound:function(soundToPlay, reset) {
  if (reset === undefined) {
    reset = true;
  }
  if (!this.musicPlaying) {
    return;
  }
  if (this.sounds[soundToPlay].isPlaying && !reset) {
    return;
  }
  try {
    this.sounds[soundToPlay].play("", 0, this.sounds[soundToPlay].VOLUME);
  } catch (e) {
    LOG("Failed to play sound : " + soundToPlay);
  }
}, pauseMusic:function() {
  LOG("SoundManager.pauseMusic()");
  game.sound.mute = true;
}, resumeMusic:function() {
  LOG("SoundManager.resumeMusic()");
  game.sound.mute = !this.musicPlaying;
}, stopMusic:function() {
  for (var key in this.music) {
    if (key == "contains") {
      continue;
    }
    this.music[key].stop();
  }
}, toggleMusic:function(musicToPlay) {
  this.musicPlaying = !this.musicPlaying;
  game.sound.mute = !this.musicPlaying;
  if (this.musicPlaying) {
    this.playMusic(musicToPlay);
  } else {
    this.stopMusic();
  }
  try {
    localStorage.setItem("inl-blls-brcks-music", this.musicPlaying);
  } catch (e) {
  }
}};


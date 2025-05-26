var GameData = function() {
};
GameData.BuildTitle = "Balls and Bricks";
GameData.BuildString = "5.12.2019 9:52";
GameData.BuildDebug = false;
GameData.ProfileName = "blls-brcks";
var Difficulty = 1;
var PlayerGems = 0;
var PlayerBalls = 1;
var BallsPrizes = [10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 30, 30, 30, 30, 30, 40, 40, 40, 40, 40, 50, 50, 50, 50, 50];
var CheckpointLevel = 0;
GameData.Reset = function() {
  Difficulty = 1;
  PlayerGems = 0;
  PlayerBalls = 1;
  PlayerBall = -1;
  BallsPrizes = [10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 30, 30, 30, 30, 30, 40, 40, 40, 40, 40, 50, 50, 50, 50, 50];
  CheckpointLevel = 0;
};
GameData.Load = function() {
  GameData.Reset();
  var profile = null;
  try {
    profile = JSON.parse(localStorage.getItem(GameData.ProfileName));
  } catch (e) {
  }
  try {
    Difficulty = profile["Difficulty"];
    PlayerGems = profile["PlayerGems"];
    PlayerBalls = profile["PlayerBalls"];
    PlayerBall = profile["PlayerBall"];
    BallsPrizes = profile["BallsPrizes"];
    CheckpointLevel = profile["CheckpointLevel"];
  } catch (e) {
  }
  if (Difficulty === undefined) {
    Difficulty = 1;
  }
  if (PlayerGems === undefined) {
    PlayerGems = 0;
  }
  if (PlayerBalls === undefined) {
    PlayerBalls = 1;
  }
  if (PlayerBall === undefined) {
    PlayerBall = 1;
  }
  if (BallsPrizes === undefined) {
    BallsPrizes = [10, 10, 10, 10, 10, 20, 20, 20, 20, 20, 30, 30, 30, 30, 30, 40, 40, 40, 40, 40, 50, 50, 50, 50, 50];
  }
  if (CheckpointLevel === undefined) {
    CheckpointLevel = 0;
  }
};
GameData.Save = function() {
  var profile = {};
  profile["Difficulty"] = Difficulty;
  profile["PlayerGems"] = PlayerGems;
  profile["PlayerBall"] = PlayerBall;
  profile["PlayerBalls"] = PlayerBalls;
  profile["BallsPrizes"] = BallsPrizes;
  profile["CheckpointLevel"] = CheckpointLevel;
  try {
    localStorage.setItem(GameData.ProfileName, JSON.stringify(profile));
  } catch (e) {
  }
};


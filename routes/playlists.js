const express = require("express");
const router = express.Router();
const playlistsData = require("../data/playlists");
const weatherData = require("../data/weather");

function LoggedIn(req, res, next) {
  if (!req.session.user) {
    req.session.error = { status: 403, message: "Must be logged in." };
    res.status(403).redirect("/");
  } else {
    next();
  }
}

router.get("/", LoggedIn, async (req, res) => {
  try {
    let weData = await weatherData.getWeather(req.session.user.zip);

    if (weData.code) {
      req.session.error = { status: weData.code, message: weData.message };
      res.redirect("/private");
      return;
    }

    let weatherPlaylists = await playlistsData.getPlaylistsByWeather(
      weData.weather_tag
    );

    let removedUnliked = weatherPlaylists.filter(
      element => !req.session.user.unlikedPlaylists.includes(element.spotifyId)
    );

    removedUnliked.sort(function(a, b) {
      let first = req.session.user.likedPlaylists.indexOf(b.spotifyId);
      let second = req.session.user.likedPlaylists.indexOf(a.spotifyId);
      return first - second;
    }); // sorts playlists by liked then remainder in order of Spotify Id (low to high)

    let lists = [];
    for (let element of removedUnliked)
      lists.push(await playlistsData.getPlaylists(element.spotifyId));
    res.render("private/playlists", {
      weather: weData,
      playlist: lists,
      user: req.session.user
    });
  } catch (e) {
    req.session.error = { status: 500, message: e };
    res.status(500).redirect("/");
  }
});

module.exports = router;

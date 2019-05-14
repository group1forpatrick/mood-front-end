var SpotifyWebApi = require("spotify-web-api-node");
const mongoCollections = require("./config/mongoCollections");
const playlists = mongoCollections.playlists;
const weatherData = require("./data/weather");
var clientId = "aba7897fb89b4bf299913de0fda991e0",
  clientSecret = "9d58ecc5a16f4f8299cc6e0bbea197bf";

// Create the api object with the credentials
var spotifyApi = new SpotifyWebApi({
  clientId: clientId,
  clientSecret: clientSecret
});

async function createPlaylist(genre, weatherTag, spotifyId) {
  if (!genre) {
    throw "error: argument genre does not exist";
  }
  if (!weatherTag) {
    throw "error: argument weatherTag does not exist";
  }
  if (!spotifyId) {
    throw "error: argument spotifyId does not exist";
  }

  if (typeof genre !== "string") {
    throw "error: argument genre is not type string";
  }
  if (typeof weatherTag !== "string") {
    throw "error: argument weatherTag is not type string";
  }
  if (typeof spotifyId !== "string") {
    throw "error: argument spotifyId is not type string";
  }

  const playlistCollection = await playlists();

  let newPlaylist = {
    genre: genre,
    weatherTag: weatherTag,
    comments: [],
    spotifyId: spotifyId
  };

  const insertInfo = await playlistCollection.insertOne(newPlaylist);
  if (insertInfo.insertedCount === 0) throw "Could not add playlist";
  return;
}

async function seeder() {
  try {
    //console.log("test0");
    const data = await spotifyApi.clientCredentialsGrant();
    //console.log("The access token expires in " + data.body["expires_in"]);
    //console.log("The access token is " + data.body["access_token"]);
    spotifyApi.setAccessToken(data.body["access_token"]);
    //console.log("test1");
    const lists = await spotifyApi.getUserPlaylists("123643422");
    //console.log("test2");
    //console.log(lists.body.items[0].id);
    for (const element in lists.body.items) {
      //console.log("test3");
      //console.log(lists.body.items[element].id);
      const list = await spotifyApi.getPlaylist(lists.body.items[element].id);
      //console.log(lists.body.items[element].id);
      //console.log("test4");
      await createPlaylist(list.body.description, list.body.name, list.body.id);
      //console.log("test5");
    }
    //console.log("test6");
  } catch (e) {
    //console.log(`Error: ${e}`);
  }
}

async function getPlaylistsByWeather(weather_tag) {
  if (!weather_tag) throw "error: argument weather_tag does not exist";
  //console.log("test7");
  const playlistCollection = await playlists();
  //console.log("test8");
  const pls = await playlistCollection
    .find({ weatherTag: weather_tag })
    .toArray();
  //console.log("test9");
  return pls;
}

async function testWeatherPlaylists() {
  try {
    let wthr = await weatherData.getWeather("07307");
    console.log(wthr.weather_tag);
    let cloudplaylist = await getPlaylistsByWeather(wthr.weather_tag);
    console.log(cloudplaylist);
    return;
  } catch (e) {
    console.log(`Error: ${e}`);
  }
}

seeder().then(
  function() {
    testWeatherPlaylists().then(
      function() {
        //console.log("yes");
        process.exit();
      },
      function(err) {
        console.log(`Error: ${err}`);
      }
    );
  },
  function(err) {
    console.log(`Error: ${err}`);
  }
);

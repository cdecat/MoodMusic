const request = require('request-promise-native');
const UserModel = require('../models/User');
const PlaylistModel = require('../models/Playlist');
const TrackModel = require('../models/Track');
const LabelModel = require('../models/Label');

exports.refreshTracks = async () => {
  // Get new Liked Tracks => add new
  const likedTracks = await getLikedTracks(true);
  return await TrackModel.addTracks(likedTracks, true);
  // Get up-to date playlists and update them
  // const playlistsWithChanges = await refreshPlaylists();
  // Get last 100 tracks from playlists with changes => add new

  // const playlistTracks = await getPlaylistTracks(playlistsWithChanges);
};
exports.syncTracks = async () => {
  const likedTracks = await getLikedTracks(true);
  // add new liked Tracks
  // remove liked from tracks not in this list (use hashMap)
  const playlistsWithChanges = await refreshPlaylists();
};

// Helpers
const getLikedTracks = async (sync = false) => {
  const { access_token: token } = await UserModel.userData();
  const response = await request.get({
    url: 'https://api.spotify.com/v1/me/tracks',
    headers: { Authorization: 'Bearer ' + token },
    json: true,
  });

  if (sync) {
    // Get all liked tracks (parallel requests)
    const totalTracks = response.total;
    const requests = [];
    for (let offset = 1; offset <= totalTracks / 50; offset++) {
      const req = async () => {
        const response = await request.get({
          url:
            'https://api.spotify.com/v1/me/tracks?limit=50&offset=' +
            offset * 50,
          headers: { Authorization: 'Bearer ' + token },
          json: true,
        });
        return response.items;
      };
      requests.push(req());
    }
    const otherTracks = (await Promise.all(requests)).flat(Infinity);
    return parseTracks([...response.items, ...otherTracks]);
  } else {
    // Get only first 50 tracks
    return parseTracks(response.items);
  }
};
const refreshPlaylists = async () => {
  const { access_token: token } = await UserModel.userData();
  const response = await request.get({
    url: nextUrl ? nextUrl : 'https://api.spotify.com/v1/me/playlists?limit=50',
    headers: { Authorization: 'Bearer ' + token },
    json: true,
  });
  const totalPlaylists = response.total;

  if (totalPlaylists <= 50) {
    return PlaylistModel.refresh(parsePlaylists(response.items));
  } else {
    const requests = [];
    for (let offset = 1; offset <= totalPlaylists / 50; offset++) {
      const req = async () => {
        const response = await request.get({
          url:
            'https://api.spotify.com/v1/me/playlists?limit=50&offset=' +
            offset * 50,
          headers: { Authorization: 'Bearer ' + token },
          json: true,
        });
        return response.items;
      };
      requests.push(req());
    }
    const otherPlaylists = (await Promise.all(requests)).flat(Infinity);
    return PlaylistModel.refresh(
      parsePlaylists([...response.items, ...otherPlaylists])
    );
  }
};
const getPlaylistTracks = async playlist => {
  const { access_token: token } = await UserModel.userData();
  const { id, tracks_num: tracksNum } = playlist;
  const response = await request.get({
    url: 'https://api.spotify.com/v1/playlists/' + id + '/tracks',
    headers: { Authorization: 'Bearer ' + token },
    json: true,
  });
  const totalTracks = response.total;
  const requests = [];
  for (let offset = 1; offset <= totalTracks / 50; offset++) {
    const req = async () => {
      const response = await request.get({
        url:
          'https://api.spotify.com/v1/playlists/' +
          id +
          '/tracks?offset=' +
          offset * 100,
        headers: { Authorization: 'Bearer ' + token },
        json: true,
      });
      return response.items;
    };
    requests.push(req());
  }
  const otherTracks = (await Promise.all(requests)).flat(Infinity);
  return parseTracks([...response.items, ...otherTracks]);
};

// Data Parsing
const parseTracks = list => {
  return list.map(obj => ({
    id: obj.track.id,
    name: obj.track.name,
    artist: obj.track.artists[0].name,
    album_id: obj.track.album.id,
    added_at: obj.added_at,
    album: {
      id: obj.track.album.id,
      name: obj.track.album.name,
      images: obj.track.album.images.map(size => size.url),
    },
  }));
};
const parsePlaylists = list => {
  return list.map(obj => ({
    id: obj.id,
    name: obj.name,
    snapshot_id: obj.snapshot_id,
    tracks_num: obj.tracks.total,
  }));
};

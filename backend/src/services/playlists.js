const { default: axios } = require('axios');
const PlaylistModel = require('../models/Playlist');
const TrackModel = require('../models/Track');
const LabelModel = require('../models/Label');
const TracksService = require('./tracks');
const { chunkArray } = require('../utils');

/**
 * - Add tracks to Spotify playlists
 * - Add Track-Playlist associations in our database
 * - Update Playlists with new info
 * @param {UserObj} userObj
 * @param {PlaylistTrackIds[]} data
 */
exports.addTracks = async (userObj, data) => {
  // Spotify: add tracks to playlists in parallel
  const spotifyRequests = data.map(playlistTracks =>
    updateSpotifyPlaylistTracks(userObj, playlistTracks)
  );
  // Get back new snapshot_ids and track_count_delta
  const playlistUpdates = await Promise.all(spotifyRequests);
  // Add associations to our database
  await PlaylistModel.addPlaylists(data);
  // Update playlists with new info
  await PlaylistModel.updateMany(playlistUpdates);
};
/**
 * - Remove tracks from Spotify playlists
 * - Remove Track-Playlist associations in our database
 * - Update Playlists with new info
 * @param {UserObj} userObj
 * @param {PlaylistTrackIds[]} data
 */
exports.removeTracks = async (userObj, data) => {
  // Spotify: remove tracks to playlists in parallel
  const spotifyRequests = data.map(playlistTracks =>
    updateSpotifyPlaylistTracks(userObj, playlistTracks, true)
  );
  // Get back new snapshot_ids and track_count_delta
  const playlistUpdates = await Promise.all(spotifyRequests);
  // Remove associations from our database
  await PlaylistModel.removePlaylists(data);
  // Update playlists with new info
  await PlaylistModel.updateMany(playlistUpdates);
};

/**
 * Create new playlist, on Spotify and MoodMusic.
 * @param {UserObj} userObj
 * @param {NewPlaylist} data
 * @returns {Promise<object>} Created playlist
 */
exports.create = async (userObj, data) => {
  // Handle playlists auto-generated from labels
  if (!data.name && data.type === 'label') {
    const label = await LabelModel.get(userObj.userId, data.label_id);
    data.name = `< ${label.name} >`;
    data.description = `Playlist generated by MoodMusic, associated with\
    ${label.type} label: < ${label.name} >`;
  }
  // Create Spotify playlist and handle response data
  const { data: resData } = await axios.post(
    `https://api.spotify.com/v1/users/${userObj.userId}/playlists`,
    { name: data.name, description: data.description },
    { headers: { Authorization: `Bearer ${userObj.accessToken}` } }
  );
  data.id = resData.id;
  data.snapshot_id = resData.snapshot_id;
  // Add label's existing tracks to Spotify playlist
  if (data.type === 'label') {
    const trackIds = await LabelModel.getTrackIds(data.label_id);
    const playlistTrackIds = { playlist_id: resData.id, track_ids: trackIds };
    if (trackIds.length) {
      const {
        snapshot_id,
        track_count_delta,
      } = await updateSpotifyPlaylistTracks(userObj, playlistTrackIds);
      data.snapshot_id = snapshot_id;
      data.track_count = track_count_delta;
    }
    const playlist = await PlaylistModel.create(userObj.userId, data);
    await PlaylistModel.addPlaylists([playlistTrackIds]);
    return playlist;
  }

  return PlaylistModel.create(userObj.userId, data);
};
/**
 * Update playlist's Spotify and MoodMusic state.
 * Changing playlist's type comes with various side-effects.
 * @param {UserObj} userObj
 * @param {string} id - playlistId
 * @param {PlaylistUpdates} data
 * @returns {Promise<object>} Updated playlist
 */
exports.update = async (userObj, id, data) => {
  const { type, label_id } = await PlaylistModel.getOne(userObj.userId, id);

  // Changing playlist type comes with multiple side-effects
  if (data.type) {
    // Handle changes to existing label playlist
    if (type === 'label') {
      if (data.type === 'label' && data.label_id) {
        // Remove old label from playlist's tracks
        await LabelModel.removeLabelTracks(label_id);
      } else {
        // Remove playlist-label assoc; keep label-tracks assoc
        data.label_id = null;
      }
    }

    if (data.type === 'untracked') {
      // Remove playlist-tracks assoc; keep user-tracks
      await PlaylistModel.removePlaylistTracks(id);
    } else {
      // Unless setting playlist to 'untracked', syncTracks
      /** @type PlaylistChanges */
      const changes = await exports.syncTracks(userObj, id, {
        type: data.type,
        label_id: data.label_id,
      });
      data.updates = false;
      data.snapshot_id = changes.snapshot_id;
      data.track_count_delta = changes.track_count_delta;

      if (data.type === 'label') {
        // Playlist inherit label's tracks
        const trackIds = await LabelModel.getTrackIdsNotInPlaylist(
          data.label_id,
          id
        );
        if (trackIds.length) {
          const playlistTrackIds = {
            playlist_id: id,
            track_ids: trackIds,
          };
          const changes = await updateSpotifyPlaylistTracks(
            userObj,
            playlistTrackIds
          );
          data.snapshot_id = changes.snapshot_id;
          data.track_count_delta =
            (data.track_count_delta || 0) + changes.track_count_delta;
          await PlaylistModel.addPlaylists([playlistTrackIds]);
        }
      }
    }
  }

  // Spotify request to change name and/or description
  if (data.name || data.description) {
    await axios.put(
      `https://api.spotify.com/v1/playlists/${id}`,
      {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
      },
      { headers: { Authorization: `Bearer ${userObj.accessToken}` } }
    );
  }

  return PlaylistModel.update(userObj.userId, id, data);
};
/**
 * Delete Spotify playlist and set type 'deleted' on MoodMusic.
 * Deleted playlists can be restored on both platforms.
 * @param {UserObj} userObj
 * @param {string} id - playlistId
 */
exports.delete = async (userObj, id) => {
  await axios.delete(`https://api.spotify.com/v1/playlists/${id}/followers`, {
    headers: { Authorization: `Bearer ${userObj.accessToken}` },
  });
  await PlaylistModel.removePlaylistTracks(id);
  return PlaylistModel.update(userObj.userId, id, {
    type: 'deleted',
    label_id: null,
  });
};
/**
 * Restore playlist on Spotify and set type 'untracked' on MoodMusic.
 * @param {UserObj} userObj
 * @param {string} id - playlistId
 */
exports.restore = async (userObj, id) => {
  await axios.put(
    `https://api.spotify.com/v1/playlists/${id}/followers`,
    {},
    { headers: { Authorization: `Bearer ${userObj.accessToken}` } }
  );
  return PlaylistModel.update(userObj.userId, id, { type: 'untracked' });
};

/**
 * - Sync a playlist to match it's Spotify state.
 * - Import tracks from 'untracked' playlist.
 * - Pass updateData to sync when updating playlist type.
 * @param {UserObj} userObj
 * @param {string} id - playlistId
 * @param {object} [updateData] - Sync for playlist type update.
 * @param {string} updateData.type
 * @param {number} updateData.label_id
 * @returns {Promise<object>} Synced playlist | type: PlaylistChanges
 */
exports.syncTracks = async (userObj, id, updateData = undefined) => {
  const { type, label_id } =
    updateData || (await PlaylistModel.getOne(userObj.userId, id));

  const tracks = await TracksService.getPlaylistTracks(userObj, id);
  await TrackModel.addTracks(userObj.userId, tracks);
  // If type is 'untracked' stop here, only import tracks

  const playlistChanges = { updates: false };
  if (['mix', 'label'].includes(type)) {
    // Remove Spotify playlist duplicates
    const changes = await exports.removePlaylistDuplicates(userObj, id, tracks);
    playlistChanges.snapshot_id = changes.snapshot_id;
    playlistChanges.track_count_delta = changes.removed;

    // Add new playlist-track associations
    const playlistTracks = { playlist_id: id, tracks };
    await PlaylistModel.addPlaylists([playlistTracks], true);
    // Sync 'label' playlists by matching tracks-playlists with tracks-labels
    if (type === 'label') {
      // If not update syncing, remove labels from tracks no longer in playlist
      if (!updateData) {
        const idsToRemove = await LabelModel.getTrackIdsNotInPlaylist(
          label_id,
          id
        );
        if (idsToRemove.length) {
          const labelTracksToRemove = {
            label_id,
            track_ids: idsToRemove,
          };
          await LabelModel.removeLabels([labelTracksToRemove]);
        }
      }
      // Upsert playlist's tracks to playlist's label
      const labelTracks = {
        label_id,
        track_ids: tracks.map(t => t.id),
      };
      await LabelModel.addLabels([labelTracks]);
    }
  }
  // If syncing for 'playlist type update', update playlist there instead
  if (!updateData) {
    return PlaylistModel.update(userObj.userId, id, playlistChanges);
  }
  return { id, ...playlistChanges };
};
/**
 * Revert Spotify playlist to it's current MoodMusic track state.
 * @param {UserObj} userObj
 * @param {string} id - playlistId
 * @returns {Promise<object>} Reverted playlist
 */
exports.revertTracks = async (userObj, id) => {
  const url = `https://api.spotify.com/v1/playlists/${id}/tracks`;
  const headers = { Authorization: 'Bearer ' + userObj.accessToken };
  let snapshot_id;
  // Get ordered trackIds from MoodMusic
  const trackIds = await PlaylistModel.getTrackIds(id);
  const trackUris = trackIds.map(id => `spotify:track:${id}`);

  let replace = true; // Flag for first request to use 'replace' endpoint.
  const chunks = chunkArray(trackUris, 100);
  for (const chunk of chunks) {
    const { data } = await axios({
      url,
      method: replace ? 'put' : 'post',
      data: { uris: chunk },
      headers,
    });
    replace = false;
    snapshot_id = data.snapshot_id;
  }

  return PlaylistModel.update(userObj.userId, id, {
    updates: false,
    snapshot_id,
    track_count: trackIds.length,
  });
};

// Helpers
/**
 * Handle adding/removing tracks in Spotify playlist.
 * @param {UserObj} userObj
 * @param {PlaylistTrackIds} data
 * @param {boolean=} remove - Default false, pass true to reverse operation.
 * @returns {Promise<PlaylistChanges>}
 */
const updateSpotifyPlaylistTracks = async (
  userObj,
  { playlist_id, track_ids },
  remove = false
) => {
  const url = `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`;
  const headers = { Authorization: 'Bearer ' + userObj.accessToken };
  let snapshot_id;

  const trackUris = track_ids.map(id => `spotify:track:${id}`);
  const chunks = chunkArray(trackUris, 100);
  for (const chunk of chunks) {
    const { data } = await axios({
      url,
      method: remove ? 'delete' : 'post',
      data: { uris: chunk },
      headers,
    });
    snapshot_id = data.snapshot_id;
  }
  // TODO? snapshot_id might be undefined (v2 had a check for this)
  return {
    id: playlist_id,
    snapshot_id,
    track_count_delta: track_ids.length * (remove ? -1 : 1),
  };
};
/**
 * Remove duplicate tracks from Spotify playlist.
 * @param {UserObj} userObj
 * @param {string} id - playlistId
 * @param {{id: string}[]} tracks - Optional, avoid unnecessary Spotify requests
 * @returns {Promise<{snapshot_id?: string, removed?: number}>}
 */
exports.removePlaylistDuplicates = async (userObj, id, tracks = undefined) => {
  // TODO? consider using in TS.refresh(sync)
  const url = `https://api.spotify.com/v1/playlists/${id}/tracks`;
  const headers = { Authorization: 'Bearer ' + userObj.accessToken };
  tracks = tracks || (await TracksService.getPlaylistTracks(userObj, id));

  // Find duplicate tracks and generate request bodyData
  const trackMap = {};
  let duplicatesCount = 0;
  const duplicatesMap = tracks.reduce((acc, track, idx) => {
    if (trackMap[track.id]) {
      acc[track.id] = acc[track.id] || {
        uri: `spotify:track:${track.id}`,
        positions: [],
      };
      acc[track.id].positions.push(idx);
      duplicatesCount += 1;
    }
    trackMap[track.id] = track;
    return acc;
  }, {});
  // No duplicates, return early
  if (!duplicatesCount) return {};

  const duplicates = Object.values(duplicatesMap);
  // We only need snapshot_id for more than 100 unique duplicate tracks (rare)
  let { snapshot_id = undefined } =
    duplicates.length > 100
      ? await PlaylistModel.getOne(userObj.userId, id)
      : {};
  const chunks = chunkArray(duplicates, 100);
  for (const chunk of chunks) {
    const { data } = await axios({
      url,
      method: 'delete',
      data: { tracks: chunk, ...(snapshot_id && { snapshot_id }) },
      headers,
    });
    snapshot_id = data.snapshot_id;
  }

  return {
    snapshot_id,
    removed: -duplicatesCount,
  };
};

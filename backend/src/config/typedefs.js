/**
 * @typedef {object} UserObj
 * @property {string} UserObj.accessToken
 * @property {string} UserObj.userId
 */
/**
 * @typedef {object} UserData
 * @property {string} refresh_token
 * @property {string} refreshed_at
 * @property {string} synced_at
 */

/**
 * @typedef {object} ParsedTrack
 * @property {string} id
 * @property {string} name
 * @property {string} artist
 * @property {string} album_id
 * @property {string} added_at
 * @property {ParsedAlbum} album
 */
/**
 * @typedef {object} ParsedAlbum
 * @property {string} id
 * @property {string} name
 * @property {string} small
 * @property {string} medium
 * @property {string} large
 */
/**
 * @typedef {object} ParsedPlaylist
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {string} snapshot_id
 * @property {number} track_count
 * @property {string} user_id
 */

/**
 * @typedef {object} PlaylistTracks
 * @property {string} playlist_id
 * @property {string[]=} track_ids
 * @property {{id: string; added_at: string}[]=} tracks
 */
/**
 * @typedef {object} PlaylistTrackIds
 * @property {string} playlist_id
 * @property {string[]} track_ids
 */
/**
 * @typedef {object} LabelTracks
 * @property {number} label_id
 * @property {string[]} track_ids
 */

/**
 * @typedef {object} PlaylistChanges - Internal changes to playlists.
 * @property {string} id
 * @property {string=} snapshot_id
 * @property {number=} track_count_delta
 * @property {boolean=} updates
 */
/**
 * @typedef {object} PlaylistUpdates - Updates made by user.
 * @property {string=} name
 * @property {string=} description
 * @property {string=} type - enum: ['untracked', 'label', 'mix', 'deleted']
 * @property {number=} label_id
 * @property {string=} snapshot_id
 * @property {number=} track_count_delta
 * @property {boolean=} updates
 */
/**
 * @typedef {object} NewPlaylist
 * @property {string} type - enum: ['label', 'mix']
 * @property {string=} name
 * @property {string=} description
 * @property {number=} label_id
 * @property {string=} id
 * @property {string=} snapshot_id
 * @property {number=} label_id
 * @property {number=} track_count
 * @property {string=} user_id
 */

// ============================================================================
// Initial Loading and Updates
// ============================================================================
export const LOADING_FINISHED = 'LOADING_FINISHED';
export const LOADING_STARTED = 'LOADING_STARTED'; //Not used
export const SET_AUTHORIZED = 'SET_AUTHORIZED';
export const FETCH_TRACKS = 'FETCH_TRACKS';
export const FETCH_PLAYLISTS = 'FETCH_PLAYLISTS';
export const FETCH_LABELS = 'FETCH_LABELS';

// ============================================================================
// Filters
// ============================================================================
export const MODIFY_PLAYLIST_FILTER = 'MODIFY_PLAYLIST_FILTER';
export const SELECT_ALL_PLAYLIST_FILTERS = 'SELECT_ALL_PLAYLIST_FILTERS';
export const DESELECT_ALL_PLAYLIST_FILTERS = 'DESELECT_ALL_PLAYLIST_FILTERS';
export const MODIFY_LABEL_FILTER = 'MODIFY_LABEL_FILTER';
export const DESELECT_ALL_LABEL_FILTERS = 'DESELECT_ALL_LABEL_FILTERS';
export const MODIFY_SEARCH_FILTER = 'MODIFY_SEARCH_FILTER';
export const REMOVE_SEARCH_FILTER = 'REMOVE_SEARCH_FILTER';
// Filtering events
export const FILTER_BY_PLAYLIST = 'FILTER_BY_PLAYLIST';
export const FILTER_BY_LABEL = 'FILTER_BY_LABEL';
export const FILTER_BY_SEARCH = 'FILTER_BY_SEARCH';

// ============================================================================
// Label / Playlist Managing
// ============================================================================
export const CREATE_LABEL = 'CREATE_LABEL';
export const CREATE_PLAYLIST = 'CREATE_PLAYLIST';
export const CLEAR_PLAYLIST_CHANGES = 'CLEAR_PLAYLIST_CHANGES';

// ============================================================================
// Track selection
// ============================================================================
export const MODIFY_TRACK_SELECTION = 'MODIFY_TRACK_SELECTION';
export const SELECT_ALL_TRACKS = 'SELECT_ALL_TRACKS';
export const DESELECT_ALL_TRACKS = 'DESELECT_ALL_TRACKS';

// ============================================================================
// TrackObj Managing (Changes)
// ============================================================================
export const UPDATE_TRACKS_LABELS = 'UPDATE_TRACKS_LABELS';
export const UPDATE_TRACKS_PLAYLISTS = 'UPDATE_TRACKS_PLAYLISTS';
// Track-Label diff state
export const SET_LABEL_CHANGES = 'SET_LABEL_CHANGES';
export const CLEAR_LABEL_CHANGES = 'CLEAR_LABEL_CHANGES';
// Playlist-Track diff state
export const SET_TRACK_CHANGES = 'SET_TRACK_CHANGES';
export const CLEAR_TRACK_CHANGES = 'CLEAR_TRACK_CHANGES';

// ============================================================================
// Player
// ============================================================================
export const PLAY_TRACK = 'PLAY_TRACK';
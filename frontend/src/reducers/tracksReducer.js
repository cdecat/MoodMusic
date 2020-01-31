import {
  FETCH_TRACKS,
  MODIFY_TRACK_SELECTION,
  SELECT_ALL_TRACKS,
  DESELECT_ALL_TRACKS,
  UPDATE_TRACKS_LABELS,
  UPDATE_TRACKS_PLAYLISTS,
} from '../actions/types';

const initialState = {
  tracksById: {},
  ids: [],
  selected: []
};

export default function(state = initialState, action) {
  switch (action.type) {
    case FETCH_TRACKS:
      return {
        ...state,
        tracksById: action.payload,
        ids: Object.keys(action.payload),
        likedIds: Object.keys(action.payload).filter(id => 
          action.payload[id].liked)
      }
    case MODIFY_TRACK_SELECTION:
      return {
        ...state,
        selected: {
          ...state.selected,
          [action.payload]: !state.selected[action.payload]
        }
      }
    case SELECT_ALL_TRACKS:
      return {
        ...state,
        selected: action.selected
      }    
    case DESELECT_ALL_TRACKS:
      return {
        ...state,
        selected: {}
      }
    case UPDATE_TRACKS_LABELS:
      return {
        ...state,
        map: {
          ...state.map,
          ...action.trackIds.reduce((obj, trackId) => ({
            ...obj,
            [trackId]: {
              ...state.map[trackId],
              label_ids: [
                ...state.map[trackId].label_ids.filter(id => 
                  !action.toRemove.includes(id)
                  && !action.toAdd.includes(id)),
                ...action.toAdd
              ]
            }
          }), {})
        }
      }
    case UPDATE_TRACKS_PLAYLISTS:
      return {
        ...state,
        map: {
          ...state.map,
          ...action.trackIds.reduce((obj, trackId) => ({
            ...obj,
            [trackId]: {
              ...state.map[trackId],
              playlist_ids: [
                ...state.map[trackId].playlist_ids.filter(id =>
                  !action.toRemove.includes(id)
                  && !action.toAdd.includes(id)),
                ...action.toAdd
              ]
            }
          }), {})
        }
      }
    default:
      return state;
  }
}
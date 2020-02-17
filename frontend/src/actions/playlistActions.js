import axios from 'axios';
import _ from 'lodash';
import {
  UPDATE_PLAYLIST,
  CREATE_PLAYLIST,
  DELETE_PLAYLIST,
  FETCH_TRACKS,
} from './types';
import { fetchLabels, fetchTracks } from './dataActions';

export const createPlaylist = data => dispatch => {
  const json = _.pickBy(data);
  axios
    .post('/api/playlists', json)
    .then(res =>
      dispatch({
        type: CREATE_PLAYLIST,
        playlist: res.data,
      })
    )
    .catch(err => console.log(err));
};
export const updatePlaylist = (id, data) => dispatch => {
  const json = _.pickBy(data);
  axios
    .patch('/api/playlist/' + id, json)
    .then(res => {
      dispatch({
        type: UPDATE_PLAYLIST,
        playlist: res.data,
      });
      if (json.type) {
        dispatch(fetchLabels());
        dispatch(fetchTracks());
      }
    })
    .catch(err => console.log(err));
};
export const deletePlaylist = id => dispatch => {
  axios.delete('/api/playlist/' + id).then(res => {
    if (res.status === 200) {
      dispatch({
        type: DELETE_PLAYLIST,
        id,
      });
      dispatch(fetchLabels());
      dispatch(fetchTracks());
    }
  });
};
export const syncPlaylist = id => dispatch => {
  axios.get('/api/playlist/' + id + '/sync').then(res => {
    dispatch({ type: UPDATE_PLAYLIST, playlist: res.data });
    dispatch(fetchTracks());
  });
};

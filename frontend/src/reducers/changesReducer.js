import { 
  SET_LABEL_CHANGES,
  CLEAR_LABEL_CHANGES,
  LOADING_FINISHED,
} from '../actions/types';

const initialState = {
  loadingFinished: false,
  labelsToAdd: {},
  labelsToRemove: {},
};

export default (state = initialState, action) => {
  switch (action.type) {
    case LOADING_FINISHED:
      return {
        ...state,
        loadingFinished: true
      }
    case SET_LABEL_CHANGES:
      return {
        ...state,
        labelsToAdd: action.addLabels 
          ? setLabelChanges(state.labelsToAdd, action) 
          : state.labelsToAdd,
        labelsToRemove: !action.addLabels
          ? setLabelChanges(state.labelsToRemove, action) 
          : state.labelsToRemove,
      }
    case CLEAR_LABEL_CHANGES:
      return {
        ...state,
        labelsToAdd: {},
        labelsToRemove: {},
      }
    default:
      return state;
  }
}

const setLabelChanges = (state, action) => {
  switch (action.type) {
    case SET_LABEL_CHANGES:
      return {
        ...state,
        ...action.trackIds.reduce((obj, trackId) => ({
          ...obj,
          [trackId]: [
            ...state[trackId] ? state[trackId] : [],
            ...action.labelIds.filter(id =>
              action.addLabels !== action.tracks[trackId].label_ids.includes(id)
            )
          ]
        }), {})
      }
    default:
      return state;
  }
}
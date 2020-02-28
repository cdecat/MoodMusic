import React, { memo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { createSelector } from 'reselect';

import { updateTracks } from '../../actions/trackActions';
import Dialog from '@material-ui/core/Dialog';
import LabelButton from './LabelButton';
import Button from '../common/Button';
import CloseIcon from '@material-ui/icons/Close';

const stateSelector = createSelector(
  state => state.labels,
  ({ labelsById, ids: labelIds }) => ({
    labelsById,
    genreIds: labelIds.filter(id => labelsById[id].type === 'genre'),
    moodIds: labelIds.filter(id => labelsById[id].type === 'mood'),
  })
);

export default memo(({ open, setOpen }) => {
  const dispatch = useDispatch();
  const { labelsById, genreIds, moodIds } = useSelector(stateSelector);

  // Select
  const [toAdd, setToAdd] = useState({});
  const [toRemove, setToRemove] = useState({});
  const add = useCallback(
    (id, select = true) =>
      setToAdd(toAdd => ({
        ...toAdd,
        [id]: select,
      })),
    [setToAdd]
  );
  const remove = useCallback(
    (id, select = true) =>
      setToRemove(toRemove => ({
        ...toRemove,
        [id]: select,
      })),
    [setToRemove]
  );
  // Handle Submit and Close
  const [update, setUpdate] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);
  const updateAndClose = useCallback(() => {
    setUpdate(true);
  }, [setUpdate]);
  useEffect(() => {
    if (update) {
      dispatch(
        updateTracks({
          labels: {
            toAdd,
            toRemove,
          },
        })
      );
      // Reset modal state and close
      setToAdd({});
      setToRemove({});
      setUpdate(false);
      setOpen(false);
    }
    // eslint-disable-next-line
  }, [dispatch, update, setOpen]);

  return (
    <StyledDialog open={open} onClose={close}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
        }}
      >
        <Button variant="cancel" onClick={close} startIcon={<CloseIcon />} />
      </div>
      <div>
        <h3>Genres</h3>
        {genreIds.map(id =>
          [id, ...(labelsById[id].subgenre_ids || [])].map(id => (
            <LabelButton
              key={id}
              itemId={id}
              color={labelsById[id].color}
              add={add}
              remove={remove}
            >
              {labelsById[id].name}
            </LabelButton>
          ))
        )}
      </div>
      <div>
        <h3>Moods</h3>
        {moodIds.map(id => (
          <LabelButton
            key={id}
            itemId={id}
            color={labelsById[id].color}
            add={add}
            remove={remove}
          >
            {labelsById[id].name}
          </LabelButton>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flex: '1 1 0',
          justifyContent: 'flex-end',
          alignItems: 'flex-end',
        }}
      >
        <Button variant="submit" onClick={updateAndClose}>
          Apply Changes
        </Button>
      </div>
    </StyledDialog>
  );
});

const StyledDialog = styled(Dialog)`
  .MuiPaper-root {
    background-color: #1f1f1f;
    border-radius: 4px;
    min-width: 600px;
    min-height: 300px;
    padding: 8px 10px;
    color: white;
  }
  .MuiDialog-container {
    margin-top: -200px;
  }
`;

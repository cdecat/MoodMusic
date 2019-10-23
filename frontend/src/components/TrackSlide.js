import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';

import { modifyTrackSelection } from '../actions/actions';
import Label from './Label';
import PlaylistLabel from './PlaylistLabel';

class TrackSlide extends Component {
  shouldComponentUpdate(nextProps) {
    const { track, tracks } = this.props;
    if (tracks.selected[track.id] !== nextProps.tracks.selected[track.id]) return true;
    if (track !== nextProps.track) return true;
    return false;
  }
  render() {
    const { track, tracks, labels, playlists, modifyTrackSelection } = this.props;
    return (
      <Container>
        <input
          type="checkbox"
          checked={tracks.selected[track.id] ? true : false}
          onChange={() => modifyTrackSelection(track.id)}
        />
        <Section>{track.name}</Section>
        <Section>{track.artist}</Section>
        <Section>{track.album.name}</Section>
        <Section>{track.rating}</Section>
        <LabelsSection>
          {labels.all.length ?
            track.label_ids.map(id => (
              <Label
                key={id} 
                label={labels.map[id]}
              />
            ))
            : null
          }
          {playlists.map[track.playlist_ids[0]] ?
            track.playlist_ids.map(id => (
              <PlaylistLabel
                key={id}
                playlist={playlists.map[id]}
              />
            ))
            : null
          }
        </LabelsSection>
      </Container>
    );
  }
}

const mapStateToProps = state => ({
  tracks: { 
    all: state.tracks.all,
    selected: state.tracks.selected,
  },
  labels: { 
    map: state.labels.map,
    all: state.labels.all,
  }, 
  playlists: {
    map: state.playlists.map,
    all: state.playlists.all,
  },
});

export default connect(
  mapStateToProps,
  { modifyTrackSelection, }
)(TrackSlide);

const Container = styled.div`
  background-color: #333333;
  height: 30px;
  border-bottom: 1px solid #272727;
  padding: 4px 16px;
  display: grid;
  grid-template-columns: 
    15px
    minmax(180px, 2fr)
    minmax(120px, 1fr)
    minmax(70px, 1fr)
    minmax(20px, 30px)
    minmax(30px, 3fr);
  align-items: center;
`;

const Section = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 3px;
  color: #3fe479;
  font-size: 1.05em;
  text-shadow: 0.7px 0.9px #00000099;
`;

const LabelsSection = styled.div`
  display: flex;
  flex-direction: row;
`;
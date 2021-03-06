import React, { memo } from 'react';
import styled from 'styled-components';

import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

export default memo(({ row = false, name, options, ...props }) => {
  return (
    <StyledRadioGroup {...props} name={name} row={row}>
      {options.map((option, idx) => (
        <FormControlLabel
          key={idx}
          value={option.type}
          control={<StyledRadio />}
          label={option.label}
        />
      ))}
    </StyledRadioGroup>
  );
});

const StyledRadioGroup = styled(RadioGroup)`
  display: flex;
  flex-direction: ${props => (props.row ? 'row' : 'column')};
  flex-wrap: nowrap;
  .MuiTypography-root.MuiFormControlLabel-label.MuiTypography-body1 {
    /* margin-left: -5px; */
  }
  .MuiFormControlLabel-root {
    margin-left: -5px;
    margin-right: 6px;
  }
`;
const StyledRadio = styled(Radio)`
  &.MuiRadio-colorSecondary {
    &.Mui-checked {
      color: #5dff5d;
    }
    &:hover {
      background-color: #5dff5d08;
    }
  }
  &.MuiButtonBase-root {
    padding: 5px;
  }
`;

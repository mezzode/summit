import React, { SFC } from 'react';
import './NumInput.css';

interface Props extends React.HTMLProps<HTMLInputElement> {
  // Require id so label can be linked
  id: string;
  label: string;
}

// tslint:disable-next-line:variable-name
export const NumInput: SFC<Props> = ({ label, ...inputProps }) => (
  <div className='num-input-container'>
    <label htmlFor={inputProps.id}>{label}</label>
    <input type='number' className='num-input' {...inputProps} />
  </div>
);

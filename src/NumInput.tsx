import React, { ChangeEventHandler, SFC } from 'react';

interface Props {
  id: string;
  label: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  value: string;
}

// tslint:disable-next-line:variable-name
export const NumInput: SFC<Props> = ({ label, ...inputProps }) => (
  <div
    style={{
      alignItems: 'center',
      display: 'flex',
      justifyContent: 'center',
      margin: '4px 12px',
    }}
  >
    <label htmlFor={inputProps.id}>{label}</label>
    <input
      type='number'
      style={{
        marginLeft: 12,
        maxWidth: 100,
      }}
      {...inputProps}
    />
  </div>
);

import React, { SFC } from 'react';

interface Props extends React.HTMLProps<HTMLInputElement> {
  // Require id so label can be linked
  id: string;
  label: string;
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

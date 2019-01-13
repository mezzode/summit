import React from 'react';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export interface Props
  extends Omit<React.HTMLProps<HTMLInputElement>, 'hidden' | 'type'> {
  children: string;
  forwardedRef: React.RefObject<HTMLInputElement>;
  id: string;
}

export class FileInput extends React.PureComponent<Props> {
  public render() {
    const {
      children,
      id,
      className,
      style,
      forwardedRef,
      ...props
    } = this.props;

    return (
      <>
        <input id={id} type='file' {...props} hidden ref={forwardedRef} />
        <label htmlFor={id} className={className} style={style}>
          {children}
        </label>
      </>
    );
  }
}

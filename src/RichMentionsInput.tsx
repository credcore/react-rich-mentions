import React, { HTMLProps, useRef, useContext, useState } from 'react';
import { RichMentionsContext } from './RichMentionsContext';

import styles from './RichMentions.module.css';

interface TProps extends HTMLProps<HTMLDivElement> {
  defaultValue?: string;
  singleLine?: Boolean;
  placeholder?: string;
  className?: string;
  onEnter?: () => void;
}

export function RichMentionsInput({
  defaultValue,
  singleLine,
  placeholder,
  className,
  onEnter,
  ...divAttributes
}: TProps) {
  const ref = useRef<string | null>(null);

  const {
    setInputElement,
    onBeforeChanges,
    onKeyDown,
    onChanges,
    getInitialHTML,
    opened,
    getTransformedValue,
  } = useContext(RichMentionsContext);
  const [isEmpty, setEmpty] = useState(getTransformedValue() ? false : true);

  if (ref.current === null && getInitialHTML) {
    ref.current = getInitialHTML(defaultValue ? defaultValue : '');
  }

  if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    divAttributes['data-cy'] = 'input';
  }

  const mergeOnKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      if (onEnter && !opened) {
        //Because the updates, has to be applied for the event to get the correct value
        //TODO: Better handling
        setTimeout(() => {
          onEnter();
        }, 200);
      }

      if (singleLine) {
        event.preventDefault();
      }
    }
    onKeyDown(event);

    if (divAttributes.onKeyDown) {
      divAttributes.onKeyDown(event);
    }
  };

  const onInput = (event: React.FormEvent<HTMLDivElement>) => {
    if (divAttributes.onInput) {
      divAttributes.onInput(event);
    }
    onChanges(event);
    setEmpty(getTransformedValue() ? false : true);
  };

  const onBeforeInput = (event: React.FormEvent<HTMLDivElement>) => {
    onBeforeChanges(event);

    if (divAttributes.onBeforeInput) {
      divAttributes.onBeforeInput(event);
    }
  };

  let style = {};
  if (singleLine) {
    style = { whiteSpace: 'nowrap', overflow: 'hidden' };
  }

  return (
    <div
      ref={setInputElement}
      {...divAttributes}
      className={`${styles.xinput} ${
        isEmpty ? styles.xempty : ''
      } ${className}`}
      contentEditable={true}
      onBeforeInput={onBeforeInput}
      onKeyDown={mergeOnKeyDown}
      onInput={onInput}
      data-ph={placeholder}
      dangerouslySetInnerHTML={{ __html: ref.current || '' }}
      style={style}
    ></div>
  );
}

/**
 * ButtonGroup Component
 *
 * Renders submit buttons and an always-visible reset button.
 * Supports multiple submit buttons with different queries and a configurable reset button position.
 */

import React from 'react';
import { Button } from '@neo4j-ndl/react';
import { PlayIconSolid } from '@neo4j-ndl/react/icons';
import { ButtonGroupProps, ButtonConfig } from '../utils/types';

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  buttons,
  showReset,
  resetLabel,
  resetPosition,
  onSubmit,
  onReset,
  isSubmitting,
  submitDisabled,
}) => {
  const resetButton = showReset && (
    <Button
      color='neutral'
      onClick={onReset}
      disabled={isSubmitting}
      style={{
        marginRight: resetPosition === 'left' ? 10 : 0,
        marginLeft: resetPosition === 'right' || resetPosition === 'inline' ? 10 : 0,
      }}
    >
      {resetLabel}
    </Button>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 15,
        marginLeft: 15,
        marginBottom: 10,
      }}
    >
      {/* Reset button on the left */}
      {resetPosition === 'left' && resetButton}

      {/* Submit buttons */}
      {buttons.map((button, index) => (
        <Button
          key={index}
          color={button.variant === 'primary' ? 'primary' : 'neutral'}
          onClick={() => onSubmit(button)}
          disabled={isSubmitting || submitDisabled}
        >
          {button.label}
          {button.variant === 'primary' && <PlayIconSolid className='btn-icon-base-r' />}
        </Button>
      ))}

      {/* Reset button on the right or inline */}
      {(resetPosition === 'right' || resetPosition === 'inline') && resetButton}
    </div>
  );
};

export default ButtonGroup;

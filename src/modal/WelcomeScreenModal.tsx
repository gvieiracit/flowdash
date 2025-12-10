import React from 'react';
import { Tooltip } from '@mui/material';
import { Button, Dialog, TextLink } from '@neo4j-ndl/react';
import {
  BackspaceIconOutline,
  PlayIconSolid,
} from '@neo4j-ndl/react/icons';

/**
 * Configures setting the current Neo4j database connection for the dashboard.
 */
export const NeoWelcomeScreenModal = ({
  welcomeScreenOpen,
  setWelcomeScreenOpen,
  hasCachedDashboard,
  resetDashboard,
  onConnectionModalOpen,
  onAboutModalOpen,
}) => {
  const [promptOpen, setPromptOpen] = React.useState(false);
  const handleOpen = () => {
    setWelcomeScreenOpen(true);
  };
  const handleClose = () => {
    setWelcomeScreenOpen(false);
  };
  const handlePromptOpen = () => {
    setPromptOpen(true);
  };
  const handlePromptClose = () => {
    setPromptOpen(false);
  };

  return (
    <div>
      <Dialog size='small' open={welcomeScreenOpen} aria-labelledby='form-dialog-title' disableCloseButton>
        <Dialog.Header id='form-dialog-title'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src='ciandt-flow-icon.svg' alt='CI&T Flow' style={{ height: '20px', width: 'auto', marginTop: '2px' }} />
            <span>CI&T Flow Dashboard</span>
          </div>
        </Dialog.Header>
        <Dialog.Content>
          <Tooltip title='Connect to Neo4j and create a new dashboard.' aria-label='create' disableInteractive>
            <Button
              onClick={() => {
                if (hasCachedDashboard) {
                  handlePromptOpen();
                  handleClose();
                } else {
                  onConnectionModalOpen();
                  handleClose();
                }
              }}
              style={{ 
                marginTop: '10px', 
                width: '100%',
                backgroundColor: '#000050',
                borderColor: '#000050'
              }}
              fill='filled'
              color='primary'
              size='large'
            >
              New Dashboard
            </Button>
          </Tooltip>

          <Tooltip title='Load the existing dashboard from cache (if it exists).' aria-label='load' disableInteractive>
            {hasCachedDashboard ? (
              <Button
                onClick={() => {
                  handleClose();
                  onConnectionModalOpen();
                }}
                style={{ marginTop: '10px', width: '100%' }}
                fill='outlined'
                color='primary'
                size='large'
              >
                Existing Dashboard
              </Button>
            ) : (
              <Button
                disabled
                style={{ marginTop: '10px', width: '100%' }}
                fill='outlined'
                color='neutral'
                size='large'
              >
                Existing Dashboard
              </Button>
            )}
          </Tooltip>

          <Tooltip title='Show information about this application.' aria-label='' disableInteractive>
            <Button
              onClick={onAboutModalOpen}
              style={{ marginTop: '10px', width: '100%' }}
              fill='outlined'
              color='neutral'
              size='large'
            >
              About
            </Button>
          </Tooltip>
        </Dialog.Content>
        <Dialog.Actions
          style={{
            background: '#000050',
            marginLeft: '-3rem',
            marginRight: '-3rem',
            marginBottom: '-3rem',
            padding: '2rem 3rem',
            justifyContent: 'center',
          }}
        >
          <div style={{ color: 'white', fontSize: '14px', textAlign: 'center', width: '100%' }}>
            Powered by CI&T Flow — Build powerful dashboards for your graph data.
          </div>
        </Dialog.Actions>
      </Dialog>

      {/* Prompt when creating new dashboard with existing cache */}
      <Dialog size='small' open={promptOpen == true} aria-labelledby='form-dialog-title'>
        <Dialog.Header id='form-dialog-title'>
          Create New Dashboard
        </Dialog.Header>
        <Dialog.Content>
          Are you sure you want to create a new dashboard? This will remove your currently cached dashboard.
        </Dialog.Content>
        <Dialog.Actions>
          <Button
            onClick={() => {
              handleOpen();
              handlePromptClose();
            }}
            style={{ marginTop: '10px', float: 'right' }}
            color='primary'
            fill='outlined'
          >
            <BackspaceIconOutline className='btn-icon-base-l' />
            No
          </Button>
          <Button
            onClick={() => {
              handleClose();
              handlePromptClose();
              resetDashboard();
              onConnectionModalOpen();
            }}
            style={{ 
              marginTop: '10px', 
              float: 'right', 
              marginRight: '5px',
              backgroundColor: '#000050'
            }}
            color='primary'
          >
            Yes
            <PlayIconSolid className='btn-icon-base-r' />
          </Button>
        </Dialog.Actions>
      </Dialog>
    </div>
  );
};

export default NeoWelcomeScreenModal;

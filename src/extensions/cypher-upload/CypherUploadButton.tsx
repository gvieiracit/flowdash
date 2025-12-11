import React from 'react';
import { connect } from 'react-redux';
import { IconButton } from '@neo4j-ndl/react';
import { CommandLineIconOutline } from '@neo4j-ndl/react/icons';
import Tooltip from '@mui/material/Tooltip/Tooltip';
import { createNotificationThunk } from '../../page/PageThunks';
import CypherUploadModal from './CypherUploadModal';
import { applicationGetConnection } from '../../application/ApplicationSelectors';

interface CypherUploadButtonProps {
  connection: {
    database: string;
  };
  createNotification: (title: string, message: string) => void;
}

const CypherUploadButton = ({ connection, createNotification }: CypherUploadButtonProps) => {
  const [modalOpen, setModalOpen] = React.useState(false);

  const handleButtonClick = () => {
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
  };

  return (
    <div style={{ display: 'inline' }}>
      <Tooltip title='Cypher Upload' aria-label='Cypher Upload' disableInteractive>
        <IconButton className='n-mx-1' aria-label='Cypher Upload' onClick={handleButtonClick}>
          <CommandLineIconOutline />
        </IconButton>
      </Tooltip>
      <CypherUploadModal
        open={modalOpen}
        handleClose={handleClose}
        database={connection?.database}
        createNotification={createNotification}
      />
    </div>
  );
};

const mapStateToProps = (state) => ({
  connection: applicationGetConnection(state),
});

const mapDispatchToProps = (dispatch) => ({
  createNotification: (title: string, message: string) => {
    dispatch(createNotificationThunk(title, message));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CypherUploadButton);

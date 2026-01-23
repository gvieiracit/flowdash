import React from 'react';
import { Button, Dialog } from '@neo4j-ndl/react';
import { ExclamationTriangleIconOutline } from '@neo4j-ndl/react/icons';

interface DashboardImportCollisionModalProps {
  open: boolean;
  existingTitle: string;
  importingTitle: string;
  onReplace: () => void;
  onCancel: () => void;
  onImportAsNew: () => void;
}

export const NeoDashboardSidebarImportCollisionModal = ({
  open,
  existingTitle,
  importingTitle,
  onReplace,
  onCancel,
  onImportAsNew,
}: DashboardImportCollisionModalProps) => {
  return (
    <Dialog size='medium' open={open} onClose={onCancel} aria-labelledby='collision-dialog-title'>
      <Dialog.Header id='collision-dialog-title'>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExclamationTriangleIconOutline style={{ color: '#f59e0b', width: '24px', height: '24px' }} />
          Dashboard Already Exists
        </div>
      </Dialog.Header>
      <Dialog.Content>
        <p>A dashboard with the same identifier already exists in the database:</p>
        <div style={{ margin: '16px 0', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
          <p style={{ margin: '4px 0' }}>
            <strong>Existing:</strong> &quot;{existingTitle}&quot;
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Importing:</strong> &quot;{importingTitle}&quot;
          </p>
        </div>
        <p>What would you like to do?</p>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onClick={onCancel} fill='outlined' color='neutral' style={{ marginRight: '8px' }}>
          Cancel
        </Button>
        <Button onClick={onReplace} fill='outlined' color='danger' style={{ marginRight: '8px' }}>
          Replace
        </Button>
        <Button onClick={onImportAsNew} color='primary'>
          Import as New
        </Button>
      </Dialog.Actions>
      <Dialog.Content>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          <em>&quot;Import as New&quot; creates a copy with a new identifier</em>
        </p>
      </Dialog.Content>
    </Dialog>
  );
};

export default NeoDashboardSidebarImportCollisionModal;

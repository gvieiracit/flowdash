import React from 'react';
import { connect } from 'react-redux';
import { IconButton } from '@neo4j-ndl/react';
import { Tooltip } from '@mui/material';

import { DASHBOARD_HEADER_BUTTON_COLOR } from '../../config/ApplicationConfig';
import StyleConfig from '../../config/StyleConfig';
import { ArrowRightOnRectangleIconOutline } from '@neo4j-ndl/react/icons';
import { getDashboardTheme } from '../DashboardSelectors';

await StyleConfig.getInstance();

const LogoutButton = ({ standaloneSettings, onConnectionModalOpen, themeMode }) => {
  const isDarkMode = themeMode === 'dark';
  const buttonColor = isDarkMode ? '#FFFFFF' : (DASHBOARD_HEADER_BUTTON_COLOR || '#000050');

  return standaloneSettings.standalone && !standaloneSettings.standaloneMultiDatabase ? (
    <></>
  ) : (
    <Tooltip title={'Log out'} disableInteractive>
      <IconButton
        className='logo-btn n-p-1'
        aria-label={'connection '}
        style={{ color: buttonColor }}
        onClick={() => {
          onConnectionModalOpen();
        }}
        size='large'
        clean
      >
        <ArrowRightOnRectangleIconOutline className='header-icon' type='outline' />
      </IconButton>
    </Tooltip>
  );
};

const mapStateToProps = (state) => ({
  themeMode: getDashboardTheme(state),
});

const mapDispatchToProps = () => ({});

export const NeoLogoutButton = connect(mapStateToProps, mapDispatchToProps)(LogoutButton);

export default NeoLogoutButton;

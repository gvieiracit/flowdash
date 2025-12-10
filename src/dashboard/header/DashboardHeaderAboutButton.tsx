import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IconButton, Menu, MenuItems, MenuItem } from '@neo4j-ndl/react';
import {
  QuestionMarkCircleIconOutline,
  BookOpenIconOutline,
  InformationCircleIconOutline,
} from '@neo4j-ndl/react/icons';
import { Tooltip } from '@mui/material';

import { DASHBOARD_HEADER_BUTTON_COLOR } from '../../config/ApplicationConfig';
import StyleConfig from '../../config/StyleConfig';
import { getDashboardExtensions, getDashboardTheme } from '../DashboardSelectors';
import { getExampleReports } from '../../extensions/ExtensionUtils';
import { NeoReportExamplesModal } from '../../modal/ReportExamplesModal';
import { enterHandler, openTab } from '../../utils/accessibility';

type HelpMenuOpenEvent = React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>;

await StyleConfig.getInstance();

const AboutButton = ({ connection, onAboutModalOpen, extensions, themeMode }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const handleHelpMenuOpen = (event: HelpMenuOpenEvent) => {
    setAnchorEl(event.currentTarget);
  };
  const handleHelpMenuClose = () => {
    setAnchorEl(null);
  };
  const menuOpen = Boolean(anchorEl);

  const menuAboutHandler = (e) => {
    onAboutModalOpen(e);
    handleHelpMenuClose();
  };

  const isDarkMode = themeMode === 'dark';
  const buttonColor = isDarkMode ? '#FFFFFF' : (DASHBOARD_HEADER_BUTTON_COLOR || '#000050');

  return (
    <>
      <Tooltip title={'Help and documentation'} disableInteractive>
        <IconButton
          className='logo-btn n-p-1'
          aria-label={'help'}
          style={{ color: buttonColor }}
          size='large'
          onClick={handleHelpMenuOpen}
          clean
        >
          <QuestionMarkCircleIconOutline className='header-icon' type='outline' />
        </IconButton>
      </Tooltip>
      <Menu
        anchorOrigin={{
          horizontal: 'right',
          vertical: 'bottom',
        }}
        transformOrigin={{
          horizontal: 'right',
          vertical: 'top',
        }}
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleHelpMenuClose}
        size='large'
      >
        <MenuItems>
          <NeoReportExamplesModal
            extensions={extensions}
            examples={getExampleReports(extensions)}
            database={connection.database}
          ></NeoReportExamplesModal>
          <MenuItem
            onKeyDown={(e) =>
              enterHandler(e, () =>
                openTab(
                  'https://github.com/gvieiracit/flowdash/tree/master/docs/modules/ROOT/pages/user-guide/index.adoc'
                )
              )
            }
            onClick={() =>
              openTab('https://github.com/gvieiracit/flowdash/tree/master/docs/modules/ROOT/pages/user-guide/index.adoc')
            }
            title={'Documentation'}
            icon={<BookOpenIconOutline />}
          />
          <MenuItem
            title={'About'}
            onClick={menuAboutHandler}
            onKeyDown={(e) => enterHandler(e, menuAboutHandler)}
            icon={<InformationCircleIconOutline />}
          />
        </MenuItems>
      </Menu>
    </>
  );
};

const mapStateToProps = (state) => ({
  extensions: getDashboardExtensions(state),
  themeMode: getDashboardTheme(state),
});

export const NeoAboutButton = connect(mapStateToProps, null)(AboutButton);

export default NeoAboutButton;

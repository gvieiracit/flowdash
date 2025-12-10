import React, { useEffect, useState } from 'react';
import { LoadingSpinner, IconButton } from '@neo4j-ndl/react';
import { QuestionMarkCircleIconOutline } from '@neo4j-ndl/react/icons';
import { Tooltip } from '@mui/material';
import { DarkModeSwitch } from 'react-toggle-dark-mode';
import { NeoDashboardHeaderLogo } from '../header/DashboardHeaderLogo';
import { DASHBOARD_HEADER_BUTTON_COLOR } from '../../config/ApplicationConfig';
import { connect } from 'react-redux';
import { getDashboardTheme } from '../DashboardSelectors';
import { updateDashboardSetting } from '../../settings/SettingsActions';

const DashboardPlaceholder = ({ themeMode, setTheme, onAboutModalOpen }) => {
  const [isDarkMode, setDarkMode] = useState(themeMode !== 'light');

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
  };

  useEffect(() => {
    setTheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const buttonColor = isDarkMode ? '#FFFFFF' : (DASHBOARD_HEADER_BUTTON_COLOR || '#000050');
  const navTextColor = isDarkMode ? '#FFFFFF' : '#000050';

  return (
    <>
      <div className='n-w-screen n-flex n-flex-row n-items-center n-bg-neutral-bg-weak n-border-b n-border-neutral-border-weak'>
        <div className='n-relative n-bg-neutral-bg-weak n-w-full'>
          <div className='n-min-w-full'>
            <div className='n-flex n-justify-between n-h-16 n-items-center n-py-6 md:n-justify-start md:n-space-x-10 n-mx-4'>
              <NeoDashboardHeaderLogo />
              <nav className='n-items-center n-justify-center n-flex n-flex-1 n-w-full n-font-semibold' style={{ color: navTextColor }}>
                CI&T Flow Dashboard
              </nav>
              <div className='sm:n-flex n-items-center n-justify-end md:n-flex-1 lg:n-w-0 n-gap-6'>
                <div className='n-flex n-flex-row n-gap-x-2'>
                  <Tooltip title={'Change Theme'} disableInteractive>
                    <div>
                      <DarkModeSwitch
                        className={'ndl-icon-btn n-p-2 ndl-large ndl-clean'}
                        style={{}}
                        checked={isDarkMode}
                        onChange={toggleDarkMode}
                        size={24}
                        sunColor={DASHBOARD_HEADER_BUTTON_COLOR || '#000050'}
                        moonColor={'#FFFFFF'}
                      />
                    </div>
                  </Tooltip>
                  <Tooltip title={'Help and documentation'} disableInteractive>
                    <IconButton
                      className='logo-btn n-p-1'
                      aria-label={'help'}
                      style={{ color: buttonColor }}
                      size='large'
                      onClick={onAboutModalOpen}
                      clean
                    >
                      <QuestionMarkCircleIconOutline className='header-icon' type='outline' />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='n-w-full n-h-full n-overflow-y-scroll n-flex n-flex-row' style={{ backgroundColor: '#F5F7FA' }}>
        <div className='n-flex-1 n-relative n-z-0  n-scroll-smooth n-w-full'>
          <div className='n-absolute n-inset-0 page-spacing'>
            <div className='page-spacing-overflow'>
              <div className='n-absolute n-w-full n-h-full'>
                <LoadingSpinner size='large' className='centered' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  themeMode: getDashboardTheme(state),
});

const mapDispatchToProps = (dispatch) => ({
  setTheme: (theme: string) => {
    dispatch(updateDashboardSetting('theme', theme));
  },
});

export const NeoDashboardPlaceholder = connect(mapStateToProps, mapDispatchToProps)(DashboardPlaceholder);

export default NeoDashboardPlaceholder;

import React from 'react';
import { connect } from 'react-redux';

import { DASHBOARD_HEADER_BRAND_LOGO } from '../../config/ApplicationConfig';
import StyleConfig from '../../config/StyleConfig';
import { getDashboardTheme } from '../DashboardSelectors';

await StyleConfig.getInstance();

const DashboardHeaderLogo = ({ resetApplication, themeMode, standaloneSettings, devMode }) => {
  const isDarkMode = themeMode === 'dark';

  // In standalone mode (without devMode), disable logo click to prevent showing welcome dialog
  const isClickDisabled = standaloneSettings?.standalone && !devMode;

  const content = (
    <div className='n-items-center sm:n-flex md:n-flex-1 n-justify-start'>
      <a className={isClickDisabled ? 'n-flex n-items-center n-gap-2' : 'n-cursor-pointer n-flex n-items-center n-gap-2'}>
        <img
          onClick={isClickDisabled ? undefined : resetApplication}
          className='n-h-8 n-w-auto n-m-2'
          src={DASHBOARD_HEADER_BRAND_LOGO}
          alt='CI&T Flow Graph Dashboards'
          style={isDarkMode ? { filter: 'brightness(0) invert(1)' } : {}}
        />
      </a>
    </div>
  );

  return content;
};

const mapStateToProps = (state) => ({
  themeMode: getDashboardTheme(state),
});

export const NeoDashboardHeaderLogo = connect(mapStateToProps)(DashboardHeaderLogo);

export default NeoDashboardHeaderLogo;

import React from 'react';
import { connect } from 'react-redux';

import { DASHBOARD_HEADER_BRAND_LOGO } from '../../config/ApplicationConfig';
import StyleConfig from '../../config/StyleConfig';
import { getDashboardTheme } from '../DashboardSelectors';

await StyleConfig.getInstance();

const DashboardHeaderLogo = ({ resetApplication, themeMode }) => {
  const isDarkMode = themeMode === 'dark';
  
  const content = (
    <div className='n-items-center sm:n-flex md:n-flex-1 n-justify-start'>
      <a className='n-cursor-pointer n-flex n-items-center n-gap-2'>
        <img 
          onClick={resetApplication} 
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

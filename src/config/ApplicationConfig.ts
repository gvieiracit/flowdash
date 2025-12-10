import StyleConfig from './StyleConfig';

export const enum Screens {
  WELCOME_SCREEN,
  CONNECTION_MODAL,
}

const styleConfig = await StyleConfig.getInstance();

export const DEFAULT_SCREEN = Screens.WELCOME_SCREEN; // WELCOME_SCREEN
export const DEFAULT_NEO4J_URL = 'localhost'; // localhost
export const DEFAULT_DASHBOARD_TITLE = 'New dashboard';

export const DASHBOARD_HEADER_COLOR = styleConfig?.style?.DASHBOARD_HEADER_COLOR || '#000050'; // CI&T Primary Navy

export const DASHBOARD_HEADER_BUTTON_COLOR = styleConfig?.style?.DASHBOARD_HEADER_BUTTON_COLOR || '#000050'; // CI&T Navy

export const DASHBOARD_HEADER_TITLE_COLOR = styleConfig?.style?.DASHBOARD_HEADER_TITLE_COLOR || '#FFFFFF'; // White

export const DASHBOARD_HEADER_BRAND_LOGO =
  styleConfig?.style?.DASHBOARD_HEADER_BRAND_LOGO || 'ciandt-flow-logo.svg';

export const IS_CUSTOM_LOGO = Boolean(styleConfig?.style?.DASHBOARD_HEADER_BRAND_LOGO);

export const CUSTOM_CONNECTION_FOOTER_TEXT = ''; // ''

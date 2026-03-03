#!/bin/sh
###########
set -e

# ── Auth: generate cookie token and nginx map config ──
if [ -n "${AUTH_PASSWORD}" ]; then
  AUTH_COOKIE_TOKEN=$(printf '%s' "${AUTH_PASSWORD}" | sha256sum | awk '{print $1}')
  cat > /etc/nginx/conf.d/auth-map.conf << MAP_EOF
map_hash_bucket_size 128;
map \$cookie_flowdash_token \$flowdash_auth_valid {
    "${AUTH_COOKIE_TOKEN}" 1;
    default                0;
}
MAP_EOF
  echo "Auth cookie token configured."
else
  cat > /etc/nginx/conf.d/auth-map.conf << MAP_EOF
map \$cookie_flowdash_token \$flowdash_auth_valid {
    default 0;
}
MAP_EOF
  echo "WARNING: AUTH_PASSWORD not set. config-credentials.json will be inaccessible."
fi

# Default allowed domains
AUTH_ALLOWED_DOMAINS=${AUTH_ALLOWED_DOMAINS:='["ciandt.com","asos.com"]'}

# ── config.json — PUBLIC (no credentials) ──
echo " \
    { \
    \"ssoEnabled\": ${ssoEnabled:=false}, \
    \"ssoProviders\": ${ssoProviders:=[]}, \
    \"ssoDiscoveryUrl\": \"${ssoDiscoveryUrl:='https://example.com'}\",  \
    \"standalone\": ${standalone:=false}, \
    \"standaloneDashboardName\": \"${standaloneDashboardName:='My Dashboard'}\", \
    \"standaloneDashboardDatabase\": \"${standaloneDashboardDatabase:='neo4j'}\",  \
    \"standaloneDashboardURL\": \"${standaloneDashboardURL:=}\",  \
    \"standaloneAllowLoad\": ${standaloneAllowLoad:=false},  \
    \"standaloneLoadFromOtherDatabases\": ${standaloneLoadFromOtherDatabases:=false},  \
    \"standaloneMultiDatabase\": ${standaloneMultiDatabase:=false}, \
    \"standaloneDatabaseList\": \"${standaloneDatabaseList:='neo4j'}\", \
    \"standalonePasswordWarningHidden\": ${standalonePasswordWarningHidden:=false},  \
    \"loggingMode\": \"${loggingMode:='0'}\",  \
    \"loggingDatabase\": \"${loggingDatabase:='logs'}\",  \
    \"authEnabled\": ${authEnabled:=false},  \
    \"authAllowedDomains\": ${AUTH_ALLOWED_DOMAINS}  \
   }" > /usr/share/nginx/html/config.json

# ── config-credentials.json — PROTECTED by nginx cookie gate ──
echo " \
    { \
    \"standaloneProtocol\": \"${standaloneProtocol:='neo4j+s'}\", \
    \"standaloneHost\": \"${standaloneHost:='test.databases.neo4j.io'}\", \
    \"standalonePort\": ${standalonePort:=7687}, \
    \"standaloneDatabase\": \"${standaloneDatabase:='neo4j'}\",  \
    \"standaloneUsername\": \"${standaloneUsername:=}\", \
    \"standalonePassword\": \"${standalonePassword:=}\", \
    \"customHeader\": \"${customHeader:=}\"  \
   }" > /usr/share/nginx/html/config-credentials.json

# ── style.config.json ──
echo " \
  { \
  \"DASHBOARD_HEADER_BRAND_LOGO\": \"${DASHBOARD_HEADER_BRAND_LOGO:=}\",  \
  \"DASHBOARD_HEADER_COLOR\" : \"${DASHBOARD_HEADER_COLOR:=}\",  \
  \"DASHBOARD_HEADER_BUTTON_COLOR\" : \"${DASHBOARD_HEADER_BUTTON_COLOR:=}\",  \
  \"DASHBOARD_HEADER_TITLE_COLOR\" : \"${DASHBOARD_HEADER_TITLE_COLOR:=}\",  \
  \"DASHBOARD_PAGE_LIST_COLOR\" : \"${DASHBOARD_PAGE_LIST_COLOR:=}\", \
  \"DASHBOARD_PAGE_LIST_ACTIVE_COLOR\": \"${DASHBOARD_PAGE_LIST_ACTIVE_COLOR:=}\", \
  \"style\": { \
    \"--palette-light-neutral-bg-weak\": \"${STYLE_PALETTE_LIGHT_NEUTRAL_BG_WEAK:=}\" \
  } \
}" > /usr/share/nginx/html/style.config.json

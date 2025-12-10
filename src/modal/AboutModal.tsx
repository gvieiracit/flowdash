import React from 'react';
import { Button, Dialog, TextLink } from '@neo4j-ndl/react';
import { BeakerIconOutline } from '@neo4j-ndl/react/icons';
import { Section, SectionTitle, SectionContent } from './ModalUtils';

export const version = '2.4.11-flow';

export const NeoAboutModal = ({ open, handleClose, getDebugState }) => {
  const downloadDebugFile = () => {
    const element = document.createElement('a');
    const state = getDebugState();
    state.version = version;
    const file = new Blob([JSON.stringify(state, null, 2)], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'flowdash-debug-state.json';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <>
      <Dialog onClose={handleClose} open={open} aria-labelledby='form-dialog-title' size='large'>
        <Dialog.Header>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src='ciandt-flow-icon.svg' alt='CI&T Flow' style={{ height: '24px', width: 'auto' }} />
            <span>About FlowDash</span>
          </div>
        </Dialog.Header>
        <Dialog.Content>
          <div className='n-flex n-flex-col n-gap-token-4 n-divide-y n-divide-neutral-border-strong'>
            <Section>
              <SectionContent>
                <strong>FlowDash</strong> is a dashboard builder powered by CI&T Flow. Build powerful dashboards
                for your graph data with simple Cypher queries in minutes.
              </SectionContent>
            </Section>
            <Section>
              <SectionTitle>Core Features</SectionTitle>
              <SectionContent>
                <ul className='n-list-disc n-pl-token-8'>
                  <li>
                    An editor to write and execute&nbsp;
                    <TextLink externalLink target='_blank' href='https://neo4j.com/developer/cypher/'>
                      Cypher
                    </TextLink>
                    &nbsp;queries.
                  </li>
                  <li>
                    Use results of your Cypher queries to create tables, bar charts, graph visualizations, and more.
                  </li>
                  <li>Style your reports, group them together in pages, and add interactivity between reports.</li>
                  <li>Save and share your dashboards with your team.</li>
                </ul>
                No connectors or data pre-processing needed, it works directly with Neo4j!
              </SectionContent>
            </Section>
            <Section>
              <SectionTitle>Getting Started</SectionTitle>
              <SectionContent>
                You will automatically start with an empty dashboard when starting up FlowDash for the first time.
                <br />
                Connect to your Neo4j database and start building visualizations right away.
              </SectionContent>
            </Section>
            <Section>
              <SectionTitle>Powered by CI&T Flow</SectionTitle>
              <SectionContent>
                FlowDash is built on top of the NeoDash open-source project and customized for CI&T Flow.
                Visit&nbsp;
                <TextLink target='_blank' href='https://flow.ciandt.com/'>
                  flow.ciandt.com
                </TextLink>
                &nbsp;to learn more about CI&T Flow's AI productivity platform.
              </SectionContent>
            </Section>
          </div>
          <div className='n-flex n-flex-row n-justify-between n-mt-token-8'>
            <div>
              <Button onClick={downloadDebugFile} fill='outlined' color='neutral' size='small'>
                Debug Report
                <BeakerIconOutline className='btn-icon-sm-r' />
              </Button>
            </div>
            <div>
              <i style={{ float: 'right', fontSize: '11px', color: '#6B7280' }}>v{version}</i>
            </div>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
};

export default NeoAboutModal;

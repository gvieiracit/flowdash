import React from 'react';
import { CommandLineIconOutline } from '@neo4j-ndl/react/icons';

interface CypherUploadLoadingIconProps {
  progress?: number;
  executedCount?: number;
  totalCount?: number;
}

const CypherUploadLoadingIcon = ({ executedCount, totalCount }: CypherUploadLoadingIconProps) => {
  const hasProgress = executedCount !== undefined && totalCount !== undefined;
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Animated icon */}
      <div
        style={{
          width: 48,
          height: 48,
          animation: 'pulse 2s infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CommandLineIconOutline style={{ width: '100%', height: '100%', color: '#018bff' }} />
      </div>
      
      {/* Message */}
      <div style={{ marginTop: '12px', textAlign: 'center' }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: '#333' }}>
          Executing Cypher...
        </div>
        {hasProgress && (
          <div style={{ fontSize: 13, color: '#666', marginTop: '6px' }}>
            Statement {executedCount.toLocaleString()} of {totalCount.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CypherUploadLoadingIcon;

import React, { useContext, useRef, useEffect } from 'react';
import { Button, Dialog, Typography } from '@neo4j-ndl/react';
import { CommandLineIconOutline, DocumentArrowUpIconOutline, PlayIconSolid } from '@neo4j-ndl/react/icons';
import { Neo4jContext, Neo4jContextState } from 'use-neo4j/dist/neo4j.context';
import CypherUploadLoadingIcon from './CypherUploadLoadingIcon';
import {
  ExecutionState,
  ExecutionStatus,
  AggregatedCounters,
  getExecutionState,
  updateExecutionState,
  addToCounters,
  resetExecutionState,
  subscribeToExecutionState,
  hasActiveExecution,
} from './CypherUploadState';

interface CypherUploadModalProps {
  open: boolean;
  handleClose: () => void;
  database: string;
  createNotification: (title: string, message: string) => void;
}

const DEFAULT_BATCH_SIZE = 100;

/**
 * Parse cypher content into individual statements by splitting on semicolons.
 * This parser properly handles semicolons inside quoted strings (both single and double quotes).
 * It also handles escaped quotes within strings.
 */
const parseStatements = (content: string): string[] => {
  const statements: string[] = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let i = 0;

  while (i < content.length) {
    const char = content[i];
    const nextChar = content[i + 1];

    // Handle escape sequences (backslash followed by any character)
    if (char === '\\' && (inSingleQuote || inDoubleQuote)) {
      currentStatement += char;
      if (nextChar !== undefined) {
        currentStatement += nextChar;
        i += 2;
        continue;
      }
    }

    // Handle single quotes (only toggle if not inside double quotes)
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      currentStatement += char;
      i++;
      continue;
    }

    // Handle double quotes (only toggle if not inside single quotes)
    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      currentStatement += char;
      i++;
      continue;
    }

    // Handle semicolons - only split if not inside any quotes
    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      const trimmed = currentStatement.trim();
      if (trimmed.length > 0 && !isCommentOnly(trimmed)) {
        statements.push(trimmed);
      }
      currentStatement = '';
      i++;
      continue;
    }

    // Regular character
    currentStatement += char;
    i++;
  }

  // Don't forget the last statement (if no trailing semicolon)
  const trimmed = currentStatement.trim();
  if (trimmed.length > 0 && !isCommentOnly(trimmed)) {
    statements.push(trimmed);
  }

  return statements;
};

/**
 * Check if a statement contains only comments (no actual Cypher code)
 */
const isCommentOnly = (statement: string): boolean => {
  const lines = statement.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    // If line is not empty and doesn't start with //, it has actual code
    if (trimmed.length > 0 && !trimmed.startsWith('//')) {
      return false;
    }
  }
  return true;
};

/**
 * Check if a statement is a schema modification (CREATE/DROP INDEX/CONSTRAINT).
 * Schema modifications cannot be mixed with data operations in the same transaction.
 */
const isSchemaStatement = (statement: string): boolean => {
  // Remove comments and normalize whitespace for checking
  const normalized = statement
    .split('\n')
    .filter(line => !line.trim().startsWith('//'))
    .join(' ')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
  
  // Check for schema modification patterns
  const schemaPatterns = [
    /^CREATE\s+(UNIQUE\s+)?INDEX/,
    /^CREATE\s+CONSTRAINT/,
    /^DROP\s+INDEX/,
    /^DROP\s+CONSTRAINT/,
    /^CREATE\s+FULLTEXT\s+INDEX/,
    /^CREATE\s+LOOKUP\s+INDEX/,
    /^CREATE\s+POINT\s+INDEX/,
    /^CREATE\s+RANGE\s+INDEX/,
    /^CREATE\s+TEXT\s+INDEX/,
  ];
  
  return schemaPatterns.some(pattern => pattern.test(normalized));
};

/**
 * Build a summary message from aggregated counters
 */
const buildSummaryMessage = (counters: AggregatedCounters): string => {
  const summaryParts: string[] = [];
  if (counters.nodesCreated > 0) {
    summaryParts.push(`${counters.nodesCreated} node(s) created`);
  }
  if (counters.nodesDeleted > 0) {
    summaryParts.push(`${counters.nodesDeleted} node(s) deleted`);
  }
  if (counters.relationshipsCreated > 0) {
    summaryParts.push(`${counters.relationshipsCreated} relationship(s) created`);
  }
  if (counters.relationshipsDeleted > 0) {
    summaryParts.push(`${counters.relationshipsDeleted} relationship(s) deleted`);
  }
  if (counters.propertiesSet > 0) {
    summaryParts.push(`${counters.propertiesSet} property(ies) set`);
  }
  if (counters.labelsAdded > 0) {
    summaryParts.push(`${counters.labelsAdded} label(s) added`);
  }
  if (counters.labelsRemoved > 0) {
    summaryParts.push(`${counters.labelsRemoved} label(s) removed`);
  }
  if (counters.indexesAdded > 0) {
    summaryParts.push(`${counters.indexesAdded} index(es) added`);
  }
  if (counters.indexesRemoved > 0) {
    summaryParts.push(`${counters.indexesRemoved} index(es) removed`);
  }
  if (counters.constraintsAdded > 0) {
    summaryParts.push(`${counters.constraintsAdded} constraint(s) added`);
  }
  if (counters.constraintsRemoved > 0) {
    summaryParts.push(`${counters.constraintsRemoved} constraint(s) removed`);
  }
  return summaryParts.length > 0 
    ? summaryParts.join('\n') 
    : 'No changes were made to the database.';
};

const CypherUploadModal = ({ open, handleClose, database, createNotification }: CypherUploadModalProps) => {
  const { driver } = useContext<Neo4jContextState>(Neo4jContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state synced with external state
  const [executionState, setExecutionState] = React.useState<ExecutionState>(getExecutionState);
  const [cypherContent, setCypherContent] = React.useState<string>('');
  const [localBatchSize, setLocalBatchSize] = React.useState<number>(DEFAULT_BATCH_SIZE);

  // Subscribe to external state changes
  useEffect(() => {
    const unsubscribe = subscribeToExecutionState((newState) => {
      setExecutionState(newState);
    });
    
    // Sync initial state when modal opens
    setExecutionState(getExecutionState());
    
    return () => {
      unsubscribe();
    };
  }, [open]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCypherContent(content);
        // Parse and count statements
        const statements = parseStatements(content);
        
        updateExecutionState({
          fileName: file.name,
          totalStatements: statements.length,
          status: 'idle',
          resultMessage: '',
          errorMessage: '',
          executedStatements: 0,
          progress: 0,
        });
      };
      reader.onerror = () => {
        updateExecutionState({
          errorMessage: 'Failed to read file',
          status: 'error',
        });
      };
      reader.readAsText(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleBatchSizeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setLocalBatchSize(value);
      updateExecutionState({ batchSize: value });
    }
  };

  const executeCypher = async () => {
    if (!driver) {
      updateExecutionState({
        errorMessage: 'No database connection available',
        status: 'error',
      });
      return;
    }

    if (!cypherContent.trim()) {
      updateExecutionState({
        errorMessage: 'Cypher file is empty',
        status: 'error',
      });
      return;
    }

    const statements = parseStatements(cypherContent);
    if (statements.length === 0) {
      updateExecutionState({
        errorMessage: 'No valid Cypher statements found in file',
        status: 'error',
      });
      return;
    }

    const batchSize = localBatchSize;

    // Reset and start execution
    updateExecutionState({
      isRunning: true,
      status: 'executing',
      resultMessage: '',
      errorMessage: '',
      executedStatements: 0,
      progress: 0,
      totalStatements: statements.length,
      batchSize: batchSize,
      counters: {
        nodesCreated: 0,
        nodesDeleted: 0,
        relationshipsCreated: 0,
        relationshipsDeleted: 0,
        propertiesSet: 0,
        labelsAdded: 0,
        labelsRemoved: 0,
        indexesAdded: 0,
        indexesRemoved: 0,
        constraintsAdded: 0,
        constraintsRemoved: 0,
      },
    });

    const session = database ? driver.session({ database }) : driver.session();
    
    try {
      // Helper function to execute a single statement
      const executeSingleStatement = async (statement: string, index: number): Promise<boolean> => {
        try {
          const result = await session.run(statement, {});
          const counters = result.summary.counters.updates();
          addToCounters({
            nodesCreated: counters.nodesCreated || 0,
            nodesDeleted: counters.nodesDeleted || 0,
            relationshipsCreated: counters.relationshipsCreated || 0,
            relationshipsDeleted: counters.relationshipsDeleted || 0,
            propertiesSet: counters.propertiesSet || 0,
            labelsAdded: counters.labelsAdded || 0,
            labelsRemoved: counters.labelsRemoved || 0,
            indexesAdded: counters.indexesAdded || 0,
            indexesRemoved: counters.indexesRemoved || 0,
            constraintsAdded: counters.constraintsAdded || 0,
            constraintsRemoved: counters.constraintsRemoved || 0,
          });
          return true;
        } catch (error: any) {
          const currentState = getExecutionState();
          const errorMsg = `Statement ${index + 1} failed: ${error.message || 'Unknown error'}`;
          const partialSummary = buildSummaryMessage(currentState.counters);
          const fullErrorMsg = `${errorMsg}\n\nPartial execution summary (${index} of ${statements.length} statements):\n${partialSummary}`;
          
          updateExecutionState({
            isRunning: false,
            errorMessage: fullErrorMsg,
            status: 'error',
          });
          createNotification('Cypher Execution Failed', errorMsg);
          return false;
        }
      };

      // Process statements - schema statements individually, data statements in batches
      let i = 0;
      while (i < statements.length) {
        const statement = statements[i];
        
        // Schema statements must be executed individually (cannot be batched with data operations)
        if (isSchemaStatement(statement)) {
          const success = await executeSingleStatement(statement, i);
          if (!success) {
            await session.close();
            return;
          }
          
          i++;
          const progress = Math.round((i / statements.length) * 100);
          updateExecutionState({
            executedStatements: i,
            progress: progress,
          });
          continue;
        }
        
        // Collect non-schema statements for batching
        const batchStart = i;
        const batch: string[] = [];
        
        while (i < statements.length && batch.length < batchSize && !isSchemaStatement(statements[i])) {
          batch.push(statements[i]);
          i++;
        }
        
        if (batch.length === 0) {
          continue;
        }
        
        // Execute batch in a single transaction
        const tx = session.beginTransaction();
        
        const batchCounters: AggregatedCounters = {
          nodesCreated: 0,
          nodesDeleted: 0,
          relationshipsCreated: 0,
          relationshipsDeleted: 0,
          propertiesSet: 0,
          labelsAdded: 0,
          labelsRemoved: 0,
          indexesAdded: 0,
          indexesRemoved: 0,
          constraintsAdded: 0,
          constraintsRemoved: 0,
        };
        
        try {
          for (let j = 0; j < batch.length; j++) {
            const batchStatement = batch[j];
            
            try {
              const result = await tx.run(batchStatement, {});
              const counters = result.summary.counters.updates();
              batchCounters.nodesCreated += counters.nodesCreated || 0;
              batchCounters.nodesDeleted += counters.nodesDeleted || 0;
              batchCounters.relationshipsCreated += counters.relationshipsCreated || 0;
              batchCounters.relationshipsDeleted += counters.relationshipsDeleted || 0;
              batchCounters.propertiesSet += counters.propertiesSet || 0;
              batchCounters.labelsAdded += counters.labelsAdded || 0;
              batchCounters.labelsRemoved += counters.labelsRemoved || 0;
              batchCounters.indexesAdded += counters.indexesAdded || 0;
              batchCounters.indexesRemoved += counters.indexesRemoved || 0;
              batchCounters.constraintsAdded += counters.constraintsAdded || 0;
              batchCounters.constraintsRemoved += counters.constraintsRemoved || 0;
            } catch (error: any) {
              await tx.rollback();
              const currentIndex = batchStart + j;
              const currentState = getExecutionState();
              const errorMsg = `Statement ${currentIndex + 1} failed: ${error.message || 'Unknown error'}`;
              const partialSummary = buildSummaryMessage(currentState.counters);
              const fullErrorMsg = `${errorMsg}\n\nPartial execution summary (${currentIndex} of ${statements.length} statements):\n${partialSummary}`;
              
              updateExecutionState({
                isRunning: false,
                errorMessage: fullErrorMsg,
                status: 'error',
              });
              createNotification('Cypher Execution Failed', errorMsg);
              await session.close();
              return;
            }
          }
          
          await tx.commit();
          addToCounters(batchCounters);
          
          const progress = Math.round((i / statements.length) * 100);
          updateExecutionState({
            executedStatements: i,
            progress: progress,
          });
          
        } catch (error: any) {
          try {
            await tx.rollback();
          } catch {
            // Ignore rollback errors
          }
          
          const currentState = getExecutionState();
          const errorMsg = `Batch commit failed at statement ${batchStart + 1}: ${error.message || 'Unknown error'}`;
          const partialSummary = buildSummaryMessage(currentState.counters);
          const fullErrorMsg = `${errorMsg}\n\nPartial execution summary:\n${partialSummary}`;
          
          updateExecutionState({
            isRunning: false,
            errorMessage: fullErrorMsg,
            status: 'error',
          });
          createNotification('Cypher Execution Failed', errorMsg);
          await session.close();
          return;
        }
      }

      // All batches executed successfully
      const finalState = getExecutionState();
      const summaryMessage = buildSummaryMessage(finalState.counters);
      const message = `Cypher executed successfully!\n${statements.length} statement(s) completed.\n\n${summaryMessage}`;
      
      updateExecutionState({
        isRunning: false,
        resultMessage: message,
        status: 'success',
      });
      createNotification('Cypher Executed', `${statements.length} statement(s) completed successfully`);
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error occurred';
      updateExecutionState({
        isRunning: false,
        errorMessage: errorMsg,
        status: 'error',
      });
      createNotification('Cypher Execution Failed', errorMsg);
    } finally {
      await session.close();
    }
  };

  const handleCloseModal = () => {
    // Only reset state if not currently executing
    if (!executionState.isRunning) {
      resetExecutionState();
      setCypherContent('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    handleClose();
  };

  const handleReset = () => {
    resetExecutionState();
    setCypherContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isExecuting = executionState.status === 'executing';
  const hasFile = executionState.totalStatements > 0;
  const canExecute = hasFile && !isExecuting && executionState.status !== 'executing';
  const showFileSelector = !isExecuting;

  return (
    <Dialog size='medium' open={open} onClose={handleCloseModal} aria-labelledby='cypher-upload-dialog'>
      <Dialog.Header id='cypher-upload-dialog'>
        <CommandLineIconOutline className='icon-base icon-inline text-r' style={{ marginRight: '8px' }} />
        Cypher Upload
      </Dialog.Header>
      <Dialog.Content>
        <div className='n-flex n-flex-col n-gap-token-4'>
          <Typography variant='body-medium'>
            Upload a .cypher file to execute against the connected Neo4j database.
          </Typography>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type='file'
            accept='.cypher,.cql,.txt'
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Upload section - hide during execution */}
          {showFileSelector && (
            <div className='n-flex n-flex-row n-gap-token-4 n-items-center'>
              <Button
                onClick={handleUploadClick}
                fill='outlined'
                color='neutral'
                disabled={isExecuting}
              >
                <DocumentArrowUpIconOutline className='btn-icon-base-l' />
                {executionState.fileName ? 'Change File' : 'Select File'}
              </Button>
              {executionState.fileName && (
                <Typography variant='body-medium' className='n-text-neutral-70'>
                  Selected: <strong>{executionState.fileName}</strong>
                  {executionState.totalStatements > 0 && <span> ({executionState.totalStatements} statements)</span>}
                </Typography>
              )}
            </div>
          )}

          {/* Batch size configuration - only show when file is selected and not executing */}
          {hasFile && !isExecuting && (
            <div className='n-flex n-flex-row n-gap-token-4 n-items-center' style={{ marginTop: '8px' }}>
              <Typography variant='body-medium'>Batch Size:</Typography>
              <input
                type='number'
                value={localBatchSize}
                onChange={handleBatchSizeChange}
                min={1}
                max={executionState.totalStatements}
                style={{
                  width: '80px',
                  padding: '4px 8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                }}
              />
              <Typography variant='body-small' className='n-text-neutral-60'>
                statements per transaction
              </Typography>
            </div>
          )}

          {/* Progress section during execution - all elements inside the rectangle */}
          {isExecuting && (
            <div style={{
              padding: '24px',
              border: '1px dashed #999',
              borderRadius: '8px',
              marginTop: '16px',
              backgroundColor: '#fafafa',
            }}>
              {/* Filename */}
              <Typography variant='body-medium' style={{ textAlign: 'center', marginBottom: '16px' }}>
                Executing: <strong>{executionState.fileName}</strong>
              </Typography>

              {/* Icon and message */}
              <CypherUploadLoadingIcon
                progress={executionState.progress}
                executedCount={executionState.executedStatements}
                totalCount={executionState.totalStatements}
              />

              {/* Progress bar */}
              <div style={{
                marginTop: '20px',
                backgroundColor: '#e0e0e0',
                borderRadius: '4px',
                height: '10px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${executionState.progress}%`,
                  height: '100%',
                  backgroundColor: '#018bff',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease-in-out'
                }} />
              </div>

              {/* Progress text */}
              <Typography variant='body-small' style={{ textAlign: 'center', marginTop: '12px', color: '#666' }}>
                {executionState.progress}% complete
              </Typography>
            </div>
          )}

          {/* Success message */}
          {executionState.status === 'success' && executionState.resultMessage && (
            <div style={{
              padding: '16px',
              backgroundColor: '#e8f5e9',
              borderRadius: '4px',
              marginTop: '16px',
              whiteSpace: 'pre-line'
            }}>
              <Typography variant='body-medium' style={{ color: '#2e7d32' }}>
                {executionState.resultMessage}
              </Typography>
            </div>
          )}

          {/* Error message */}
          {executionState.status === 'error' && executionState.errorMessage && (
            <div style={{
              padding: '16px',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
              marginTop: '16px',
              whiteSpace: 'pre-line'
            }}>
              <Typography variant='body-medium' style={{ color: '#c62828' }}>
                {executionState.errorMessage}
              </Typography>
            </div>
          )}
        </div>
      </Dialog.Content>
      <Dialog.Actions>
        {/* Reset button - only show on error to allow retry */}
        {executionState.status === 'error' && !isExecuting && (
          <Button onClick={handleReset} fill='outlined' color='neutral'>
            Reset
          </Button>
        )}
        <Button onClick={handleCloseModal} fill='outlined' color='neutral'>
          {isExecuting ? 'Hide' : 'Close'}
        </Button>
        {/* Send button - hide after success to prevent accidental re-run */}
        {executionState.status !== 'success' && (
          <Button
            onClick={executeCypher}
            disabled={!canExecute}
            color='primary'
          >
            Send
            <PlayIconSolid className='btn-icon-base-r' />
          </Button>
        )}
      </Dialog.Actions>
    </Dialog>
  );
};

export default CypherUploadModal;

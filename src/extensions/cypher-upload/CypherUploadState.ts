/**
 * External state store for Cypher Upload execution.
 * This persists execution state outside of React components so that
 * closing and reopening the modal doesn't lose visibility of ongoing executions.
 */

export interface AggregatedCounters {
  nodesCreated: number;
  nodesDeleted: number;
  relationshipsCreated: number;
  relationshipsDeleted: number;
  propertiesSet: number;
  labelsAdded: number;
  labelsRemoved: number;
  indexesAdded: number;
  indexesRemoved: number;
  constraintsAdded: number;
  constraintsRemoved: number;
}

export type ExecutionStatus = 'idle' | 'executing' | 'success' | 'error';

export interface ExecutionState {
  isRunning: boolean;
  fileName: string;
  totalStatements: number;
  executedStatements: number;
  progress: number;
  status: ExecutionStatus;
  resultMessage: string;
  errorMessage: string;
  batchSize: number;
  counters: AggregatedCounters;
}

const DEFAULT_STATE: ExecutionState = {
  isRunning: false,
  fileName: '',
  totalStatements: 0,
  executedStatements: 0,
  progress: 0,
  status: 'idle',
  resultMessage: '',
  errorMessage: '',
  batchSize: 100,
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
};

// Singleton state
let state: ExecutionState = { ...DEFAULT_STATE };

// Subscribers for reactive updates
type Subscriber = (state: ExecutionState) => void;
const subscribers: Set<Subscriber> = new Set();

/**
 * Get the current execution state
 */
export const getExecutionState = (): ExecutionState => {
  return { ...state };
};

/**
 * Update the execution state and notify all subscribers
 */
export const updateExecutionState = (updates: Partial<ExecutionState>): void => {
  state = { ...state, ...updates };
  notifySubscribers();
};

/**
 * Update counters by adding to existing values
 */
export const addToCounters = (newCounters: Partial<AggregatedCounters>): void => {
  state = {
    ...state,
    counters: {
      nodesCreated: state.counters.nodesCreated + (newCounters.nodesCreated || 0),
      nodesDeleted: state.counters.nodesDeleted + (newCounters.nodesDeleted || 0),
      relationshipsCreated: state.counters.relationshipsCreated + (newCounters.relationshipsCreated || 0),
      relationshipsDeleted: state.counters.relationshipsDeleted + (newCounters.relationshipsDeleted || 0),
      propertiesSet: state.counters.propertiesSet + (newCounters.propertiesSet || 0),
      labelsAdded: state.counters.labelsAdded + (newCounters.labelsAdded || 0),
      labelsRemoved: state.counters.labelsRemoved + (newCounters.labelsRemoved || 0),
      indexesAdded: state.counters.indexesAdded + (newCounters.indexesAdded || 0),
      indexesRemoved: state.counters.indexesRemoved + (newCounters.indexesRemoved || 0),
      constraintsAdded: state.counters.constraintsAdded + (newCounters.constraintsAdded || 0),
      constraintsRemoved: state.counters.constraintsRemoved + (newCounters.constraintsRemoved || 0),
    },
  };
  notifySubscribers();
};

/**
 * Reset state to defaults
 */
export const resetExecutionState = (): void => {
  state = { ...DEFAULT_STATE };
  notifySubscribers();
};

/**
 * Subscribe to state changes
 * @returns Unsubscribe function
 */
export const subscribeToExecutionState = (callback: Subscriber): (() => void) => {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
};

/**
 * Notify all subscribers of state change
 */
const notifySubscribers = (): void => {
  const currentState = getExecutionState();
  subscribers.forEach((callback) => {
    try {
      callback(currentState);
    } catch (e) {
      console.error('Error in execution state subscriber:', e);
    }
  });
};

/**
 * Check if there's an active execution
 */
export const hasActiveExecution = (): boolean => {
  return state.isRunning;
};

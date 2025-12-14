/**
 * TimelinePlayback - Agent Decision Timeline Playback System
 * 
 * Features:
 * - Show agent decisions in chronological order
 * - Allow step-by-step replay
 * - Highlight reasoning at each step
 */

import { v4 as uuidv4 } from 'uuid';

// =============================================================================
// Types
// =============================================================================

export type TimelineEventType = 
  | 'goal_received'
  | 'planning_start'
  | 'task_created'
  | 'workflow_selected'
  | 'execution_start'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'reflection_start'
  | 'insight_generated'
  | 'optimization_start'
  | 'improvement_suggested'
  | 'phase_complete'
  | 'decision_made'
  | 'error_occurred'
  | 'recovery_attempted';

export type AgentRole = 'orchestrator' | 'planner' | 'executor' | 'reflection' | 'optimizer';

// Renamed to avoid conflict with TimelineEvent from reasoning module
export interface PlaybackEvent {
  id: string;
  timestamp: Date;
  type: TimelineEventType;
  agent: AgentRole;
  title: string;
  description: string;
  reasoning?: {
    thought: string;
    confidence: number;
    alternatives?: string[];
    factors?: string[];
  };
  data?: Record<string, any>;
  duration?: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export interface TimelineState {
  id: string;
  runId: string;
  goal: string;
  events: PlaybackEvent[];
  currentIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  startTime: Date;
  endTime?: Date;
  totalDuration: number;
}

export interface PlaybackOptions {
  speed: number;           // 0.5x to 4x
  autoPlay: boolean;
  pauseOnDecisions: boolean;
  highlightReasoning: boolean;
}

export interface TimelineFilter {
  agents?: AgentRole[];
  eventTypes?: TimelineEventType[];
  minConfidence?: number;
  showReasoningOnly?: boolean;
}

export interface TimelineSummary {
  totalEvents: number;
  eventsByAgent: Record<AgentRole, number>;
  eventsByType: Record<string, number>;
  totalDuration: number;
  averageConfidence: number;
  keyDecisions: PlaybackEvent[];
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_PLAYBACK_OPTIONS: PlaybackOptions = {
  speed: 1,
  autoPlay: false,
  pauseOnDecisions: true,
  highlightReasoning: true,
};

// =============================================================================
// TimelinePlayback Class
// =============================================================================

export class TimelinePlayback {
  private state: TimelineState | null = null;
  private options: PlaybackOptions;
  private callbacks: {
    onEventChange?: (event: PlaybackEvent, index: number) => void;
    onPlaybackComplete?: () => void;
    onPlaybackStart?: () => void;
    onPlaybackPause?: () => void;
  } = {};
  private playbackInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<PlaybackOptions> = {}) {
    this.options = { ...DEFAULT_PLAYBACK_OPTIONS, ...options };
  }

  // ---------------------------------------------------------------------------
  // Timeline Creation
  // ---------------------------------------------------------------------------

  /**
   * Create a new timeline from agent run data
   */
  createTimeline(runId: string, goal: string, agentData: any): TimelineState {
    const events = this.extractEvents(agentData);
    
    this.state = {
      id: uuidv4(),
      runId,
      goal,
      events,
      currentIndex: 0,
      isPlaying: false,
      playbackSpeed: this.options.speed,
      startTime: events[0]?.timestamp || new Date(),
      endTime: events[events.length - 1]?.timestamp,
      totalDuration: this.calculateTotalDuration(events),
    };

    return this.state;
  }

  /**
   * Extract timeline events from agent run data
   */
  private extractEvents(data: any): PlaybackEvent[] {
    const events: PlaybackEvent[] = [];
    let timestamp = new Date();

    // Goal received event
    events.push(this.createEvent('goal_received', 'orchestrator', {
      title: 'Goal Received',
      description: `Processing goal: "${data.goal || 'Unknown goal'}"`,
      timestamp: new Date(timestamp),
      status: 'completed',
    }));

    // Planning phase events
    if (data.phases?.find((p: any) => p.name === 'planning')) {
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('planning_start', 'planner', {
        title: 'Planning Phase Started',
        description: 'Analyzing goal and decomposing into tasks',
        timestamp: new Date(timestamp),
        reasoning: {
          thought: 'Analyzing goal complexity and identifying required task types',
          confidence: 0.9,
          factors: ['Goal clarity', 'Context provided', 'Historical patterns'],
        },
        status: 'completed',
      }));

      // Task creation events
      const tasks = data.taskPlan?.tasks || [];
      for (let i = 0; i < tasks.length; i++) {
        timestamp = new Date(timestamp.getTime() + 150);
        events.push(this.createEvent('task_created', 'planner', {
          title: `Task Created: ${tasks[i].title}`,
          description: tasks[i].description || 'Task details',
          timestamp: new Date(timestamp),
          reasoning: {
            thought: tasks[i].reasoning || `Task ${i + 1} is required to achieve the goal`,
            confidence: 0.85,
          },
          data: { taskId: tasks[i].id, priority: tasks[i].priority, type: tasks[i].type },
          status: 'completed',
        }));
      }

      // Workflow selection
      if (data.taskPlan?.workflow) {
        timestamp = new Date(timestamp.getTime() + 200);
        events.push(this.createEvent('workflow_selected', 'planner', {
          title: `Workflow Selected: ${data.taskPlan.workflow.name}`,
          description: data.taskPlan.workflow.reason || 'Best fit for the goal',
          timestamp: new Date(timestamp),
          reasoning: {
            thought: `Selected ${data.taskPlan.workflow.name} workflow based on goal analysis`,
            confidence: data.taskPlan.workflow.confidence || 0.8,
            alternatives: ['Generic Workflow', 'Custom Workflow'],
          },
          data: { workflowId: data.taskPlan.workflow.id },
          status: 'completed',
        }));
      }

      // Planning complete
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('phase_complete', 'planner', {
        title: 'Planning Phase Complete',
        description: `Generated ${tasks.length} tasks`,
        timestamp: new Date(timestamp),
        status: 'completed',
      }));
    }

    // Execution phase events
    if (data.phases?.find((p: any) => p.name === 'executing')) {
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('execution_start', 'executor', {
        title: 'Execution Phase Started',
        description: 'Beginning task execution',
        timestamp: new Date(timestamp),
        reasoning: {
          thought: 'Initiating workflow execution with task queue',
          confidence: 0.9,
        },
        status: 'completed',
      }));

      // Task execution events
      const timeline = data.executionStatus?.taskTimeline || [];
      for (const taskExec of timeline) {
        timestamp = new Date(timestamp.getTime() + 200);
        
        // Task started
        events.push(this.createEvent('task_started', 'executor', {
          title: `Started: ${taskExec.taskTitle}`,
          description: `Executing task ${taskExec.taskId}`,
          timestamp: new Date(timestamp),
          status: 'completed',
        }));

        // Task completed/failed
        timestamp = new Date(timestamp.getTime() + (taskExec.duration || 100));
        const isSuccess = taskExec.status === 'completed' || taskExec.status === 'success';
        events.push(this.createEvent(
          isSuccess ? 'task_completed' : 'task_failed',
          'executor',
          {
            title: `${isSuccess ? 'Completed' : 'Failed'}: ${taskExec.taskTitle}`,
            description: isSuccess ? 'Task executed successfully' : 'Task execution failed',
            timestamp: new Date(timestamp),
            duration: taskExec.duration,
            status: isSuccess ? 'completed' : 'failed',
          }
        ));
      }

      // Execution complete
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('phase_complete', 'executor', {
        title: 'Execution Phase Complete',
        description: `${data.executionStatus?.completedTasks || 0}/${data.executionStatus?.totalTasks || 0} tasks completed`,
        timestamp: new Date(timestamp),
        data: {
          completedTasks: data.executionStatus?.completedTasks,
          failedTasks: data.executionStatus?.failedTasks,
        },
        status: 'completed',
      }));
    }

    // Reflection phase events
    if (data.phases?.find((p: any) => p.name === 'reflecting')) {
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('reflection_start', 'reflection', {
        title: 'Reflection Phase Started',
        description: 'Analyzing execution results',
        timestamp: new Date(timestamp),
        reasoning: {
          thought: 'Evaluating performance metrics and identifying patterns',
          confidence: 0.85,
        },
        status: 'completed',
      }));

      // Insight events
      const insights = data.reflection?.insights || [];
      for (const insight of insights) {
        timestamp = new Date(timestamp.getTime() + 150);
        events.push(this.createEvent('insight_generated', 'reflection', {
          title: `Insight: ${insight.title}`,
          description: insight.description,
          timestamp: new Date(timestamp),
          reasoning: {
            thought: `Identified ${insight.type} insight from execution analysis`,
            confidence: 0.8,
          },
          data: { insightType: insight.type },
          status: 'completed',
        }));
      }

      // Reflection complete
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('phase_complete', 'reflection', {
        title: 'Reflection Phase Complete',
        description: `Score: ${data.reflection?.score || 0}/100`,
        timestamp: new Date(timestamp),
        data: { score: data.reflection?.score, grade: data.reflection?.grade },
        status: 'completed',
      }));
    }

    // Optimization phase events
    if (data.phases?.find((p: any) => p.name === 'optimizing')) {
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('optimization_start', 'optimizer', {
        title: 'Optimization Phase Started',
        description: 'Generating improvement suggestions',
        timestamp: new Date(timestamp),
        reasoning: {
          thought: 'Analyzing patterns and suggesting optimizations',
          confidence: 0.85,
        },
        status: 'completed',
      }));

      // Improvement suggestion events
      const optimizations = data.optimization?.optimizations || [];
      for (const opt of optimizations.slice(0, 3)) {
        timestamp = new Date(timestamp.getTime() + 150);
        events.push(this.createEvent('improvement_suggested', 'optimizer', {
          title: `Suggestion: ${opt.title}`,
          description: opt.description,
          timestamp: new Date(timestamp),
          reasoning: {
            thought: `Identified ${opt.impact} impact improvement opportunity`,
            confidence: 0.75,
          },
          data: { impact: opt.impact, effort: opt.effort, priority: opt.priority },
          status: 'completed',
        }));
      }

      // Optimization complete
      timestamp = new Date(timestamp.getTime() + 100);
      events.push(this.createEvent('phase_complete', 'optimizer', {
        title: 'Optimization Phase Complete',
        description: `${optimizations.length} improvements suggested`,
        timestamp: new Date(timestamp),
        status: 'completed',
      }));
    }

    return events;
  }

  private createEvent(
    type: TimelineEventType,
    agent: AgentRole,
    details: Partial<PlaybackEvent>
  ): PlaybackEvent {
    return {
      id: uuidv4(),
      type,
      agent,
      timestamp: new Date(),
      title: '',
      description: '',
      status: 'completed',
      ...details,
    };
  }

  private calculateTotalDuration(events: PlaybackEvent[]): number {
    if (events.length < 2) return 0;
    return events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime();
  }

  // ---------------------------------------------------------------------------
  // Playback Controls
  // ---------------------------------------------------------------------------

  play(): void {
    if (!this.state) return;
    
    this.state.isPlaying = true;
    this.callbacks.onPlaybackStart?.();
    
    this.playbackInterval = setInterval(() => {
      this.stepForward();
      
      if (this.state && this.state.currentIndex >= this.state.events.length - 1) {
        this.pause();
        this.callbacks.onPlaybackComplete?.();
      }
    }, 1000 / this.state.playbackSpeed);
  }

  pause(): void {
    if (!this.state) return;
    
    this.state.isPlaying = false;
    this.callbacks.onPlaybackPause?.();
    
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  stop(): void {
    this.pause();
    if (this.state) {
      this.state.currentIndex = 0;
    }
  }

  stepForward(): void {
    if (!this.state) return;
    
    if (this.state.currentIndex < this.state.events.length - 1) {
      this.state.currentIndex++;
      const event = this.state.events[this.state.currentIndex];
      this.callbacks.onEventChange?.(event, this.state.currentIndex);
      
      // Pause on decisions if configured
      if (this.options.pauseOnDecisions && event.type === 'decision_made') {
        this.pause();
      }
    }
  }

  stepBackward(): void {
    if (!this.state) return;
    
    if (this.state.currentIndex > 0) {
      this.state.currentIndex--;
      const event = this.state.events[this.state.currentIndex];
      this.callbacks.onEventChange?.(event, this.state.currentIndex);
    }
  }

  goToEvent(index: number): void {
    if (!this.state) return;
    
    if (index >= 0 && index < this.state.events.length) {
      this.state.currentIndex = index;
      const event = this.state.events[index];
      this.callbacks.onEventChange?.(event, index);
    }
  }

  setSpeed(speed: number): void {
    this.options.speed = Math.max(0.5, Math.min(4, speed));
    if (this.state) {
      this.state.playbackSpeed = this.options.speed;
    }
    
    // Restart playback with new speed if playing
    if (this.state?.isPlaying) {
      this.pause();
      this.play();
    }
  }

  // ---------------------------------------------------------------------------
  // Event Filtering
  // ---------------------------------------------------------------------------

  getFilteredEvents(filter: TimelineFilter): PlaybackEvent[] {
    if (!this.state) return [];
    
    return this.state.events.filter(event => {
      if (filter.agents && !filter.agents.includes(event.agent)) return false;
      if (filter.eventTypes && !filter.eventTypes.includes(event.type)) return false;
      if (filter.minConfidence && (event.reasoning?.confidence || 0) < filter.minConfidence) return false;
      if (filter.showReasoningOnly && !event.reasoning) return false;
      return true;
    });
  }

  getEventsByAgent(agent: AgentRole): PlaybackEvent[] {
    return this.getFilteredEvents({ agents: [agent] });
  }

  getDecisionEvents(): PlaybackEvent[] {
    return this.state?.events.filter(e => 
      e.reasoning && e.reasoning.thought
    ) || [];
  }

  // ---------------------------------------------------------------------------
  // Timeline Analysis
  // ---------------------------------------------------------------------------

  getSummary(): TimelineSummary | null {
    if (!this.state) return null;
    
    const events = this.state.events;
    const eventsByAgent: Record<AgentRole, number> = {
      orchestrator: 0,
      planner: 0,
      executor: 0,
      reflection: 0,
      optimizer: 0,
    };
    const eventsByType: Record<string, number> = {};
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const event of events) {
      eventsByAgent[event.agent]++;
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      if (event.reasoning?.confidence) {
        totalConfidence += event.reasoning.confidence;
        confidenceCount++;
      }
    }

    const keyDecisions = events.filter(e => 
      e.type === 'workflow_selected' ||
      e.type === 'decision_made' ||
      (e.reasoning && e.reasoning.confidence >= 0.8)
    );

    return {
      totalEvents: events.length,
      eventsByAgent,
      eventsByType,
      totalDuration: this.state.totalDuration,
      averageConfidence: confidenceCount > 0 ? totalConfidence / confidenceCount : 0,
      keyDecisions,
    };
  }

  // ---------------------------------------------------------------------------
  // State Access
  // ---------------------------------------------------------------------------

  getState(): TimelineState | null {
    return this.state;
  }

  getCurrentEvent(): PlaybackEvent | null {
    if (!this.state) return null;
    return this.state.events[this.state.currentIndex] || null;
  }

  getProgress(): number {
    if (!this.state || this.state.events.length === 0) return 0;
    return (this.state.currentIndex / (this.state.events.length - 1)) * 100;
  }

  getAllEvents(): PlaybackEvent[] {
    return this.state?.events || [];
  }

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------

  onEventChange(callback: (event: PlaybackEvent, index: number) => void): void {
    this.callbacks.onEventChange = callback;
  }

  onPlaybackComplete(callback: () => void): void {
    this.callbacks.onPlaybackComplete = callback;
  }

  onPlaybackStart(callback: () => void): void {
    this.callbacks.onPlaybackStart = callback;
  }

  onPlaybackPause(callback: () => void): void {
    this.callbacks.onPlaybackPause = callback;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  reset(): void {
    this.pause();
    this.state = null;
  }
}

// =============================================================================
// Export Helper Functions
// =============================================================================

export function createTimelinePlayback(options?: Partial<PlaybackOptions>): TimelinePlayback {
  return new TimelinePlayback(options);
}

export function formatEventTime(event: PlaybackEvent): string {
  return event.timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
}

export function getAgentColor(agent: AgentRole): string {
  const colors: Record<AgentRole, string> = {
    orchestrator: '#8B5CF6', // purple
    planner: '#3B82F6',      // blue
    executor: '#10B981',     // green
    reflection: '#F59E0B',   // amber
    optimizer: '#EF4444',    // red
  };
  return colors[agent] || '#6B7280';
}

export function getEventIcon(type: TimelineEventType): string {
  const icons: Record<TimelineEventType, string> = {
    goal_received: '🎯',
    planning_start: '📋',
    task_created: '✏️',
    workflow_selected: '🔀',
    execution_start: '▶️',
    task_started: '⏳',
    task_completed: '✅',
    task_failed: '❌',
    reflection_start: '🔍',
    insight_generated: '💡',
    optimization_start: '📈',
    improvement_suggested: '💪',
    phase_complete: '🏁',
    decision_made: '🤔',
    error_occurred: '⚠️',
    recovery_attempted: '🔄',
  };
  return icons[type] || '•';
}

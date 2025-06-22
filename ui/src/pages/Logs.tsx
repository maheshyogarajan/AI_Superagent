import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { Activity, Clock, CheckCircle, AlertCircle, User, Zap } from 'lucide-react';

interface LogEvent {
  type: 'task_update' | 'heartbeat' | 'error';
  plan_id: string;
  task_id?: string;
  agent_id?: string;
  instruction?: string;
  status?: string;
  timestamp?: string;
  context?: any;
  event_time?: string;
  message?: string;
}

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="w-4 h-4" />;
    case 'running':
    case 'processing':
      return <Zap className="w-4 h-4" />;
    case 'failed':
    case 'error':
      return <AlertCircle className="w-4 h-4" />;
    case 'pending':
      return <Clock className="w-4 h-4" />;
    default:
      return <Activity className="w-4 h-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return '#22c55e';
    case 'running':
    case 'processing':
      return '#3b82f6';
    case 'failed':
    case 'error':
      return '#ef4444';
    case 'pending':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

const mapLogToElement = (log: LogEvent) => {
  const isError = log.type === 'error';
  const isHeartbeat = log.type === 'heartbeat';
  
  if (isHeartbeat) {
    return {
      className: 'vertical-timeline-element--work',
      contentStyle: { 
        background: '#f8fafc', 
        color: '#64748b',
        border: '1px solid #e2e8f0'
      },
      contentArrowStyle: { borderRight: '7px solid #e2e8f0' },
      date: new Date(log.timestamp || '').toLocaleTimeString(),
      iconStyle: { background: '#64748b', color: '#fff' },
      icon: <Activity className="w-4 h-4" />,
      children: (
        <div>
          <h3 className="vertical-timeline-element-title text-sm font-medium">
            System Heartbeat
          </h3>
          <p className="text-xs text-gray-500">
            Plan {log.plan_id.slice(0, 8)}... monitoring active
          </p>
        </div>
      )
    };
  }

  if (isError) {
    return {
      className: 'vertical-timeline-element--work',
      contentStyle: { 
        background: '#fef2f2', 
        color: '#dc2626',
        border: '1px solid #fecaca'
      },
      contentArrowStyle: { borderRight: '7px solid #fecaca' },
      date: new Date(log.timestamp || '').toLocaleTimeString(),
      iconStyle: { background: '#ef4444', color: '#fff' },
      icon: <AlertCircle className="w-4 h-4" />,
      children: (
        <div>
          <h3 className="vertical-timeline-element-title text-sm font-medium">
            System Error
          </h3>
          <p className="text-xs mt-1">
            {log.message}
          </p>
        </div>
      )
    };
  }

  return {
    className: 'vertical-timeline-element--work',
    contentStyle: { 
      background: '#fff', 
      color: '#1f2937',
      border: `2px solid ${getStatusColor(log.status || '')}`
    },
    contentArrowStyle: { borderRight: `7px solid ${getStatusColor(log.status || '')}` },
    date: new Date(log.timestamp || log.event_time || '').toLocaleTimeString(),
    iconStyle: { 
      background: getStatusColor(log.status || ''), 
      color: '#fff' 
    },
    icon: getStatusIcon(log.status || ''),
    children: (
      <div>
        <h3 className="vertical-timeline-element-title text-sm font-medium flex items-center gap-2">
          <User className="w-4 h-4" />
          {log.agent_id || 'Unknown Agent'}
        </h3>
        <h4 className="vertical-timeline-element-subtitle text-xs text-gray-600 mt-1">
          Status: <span className="font-semibold" style={{ color: getStatusColor(log.status || '') }}>
            {log.status || 'Unknown'}
          </span>
        </h4>
        <p className="text-xs mt-2 text-gray-700">
          {log.instruction || 'No instruction provided'}
        </p>
        {log.task_id && (
          <p className="text-xs mt-1 text-gray-500">
            Task: {log.task_id.slice(0, 8)}...
          </p>
        )}
      </div>
    )
  };
};

export default function Logs() {
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan_id');
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (!planId) {
      setConnectionStatus('disconnected');
      return;
    }

    const eventSource = new EventSource(`/logs/stream?plan_id=${planId}`);
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const logEvent: LogEvent = JSON.parse(event.data);
        setLogs(prevLogs => {
          // Keep only the last 50 events for performance
          const newLogs = [logEvent, ...prevLogs].slice(0, 50);
          return newLogs;
        });
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    };

    eventSource.onerror = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      eventSource.close();
    };
  }, [planId]);

  if (!planId) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Plan ID Required</h1>
            <p className="text-gray-600">
              Please provide a plan_id parameter to view logs for a specific execution plan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Live Execution Timeline
              </h1>
              <p className="text-gray-600 mt-2">
                Real-time monitoring for plan {planId.slice(0, 8)}...
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm text-gray-600 capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Waiting for Events
              </h3>
              <p className="text-gray-600">
                {connectionStatus === 'connected' 
                  ? 'Connected and monitoring for task updates...' 
                  : 'Establishing connection to event stream...'}
              </p>
            </div>
          ) : (
            <VerticalTimeline animate={false}>
              {logs.map((log, index) => (
                <VerticalTimelineElement
                  key={`${log.type}-${log.timestamp || log.event_time}-${index}`}
                  {...mapLogToElement(log)}
                />
              ))}
            </VerticalTimeline>
          )}
        </div>
      </div>
    </div>
  );
}
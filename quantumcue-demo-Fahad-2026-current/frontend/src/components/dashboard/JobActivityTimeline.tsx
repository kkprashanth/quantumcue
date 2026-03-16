/**
 * Job Activity Timeline chart showing job activity over time.
 */

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, CustomTooltip, GradientDefs } from '../charts';
import type { RecentJob } from '@/api/endpoints/dashboard';

interface JobActivityTimelineProps {
  jobs: RecentJob[];
}

export const JobActivityTimeline = ({ jobs }: JobActivityTimelineProps) => {
  const chartData = useMemo(() => {
    // Group jobs by date using Date objects as keys for proper sorting
    const jobsByDate = new Map<string, { completed: number; running: number; failed: number; dateObj: Date }>();

    // Get date range (last 14 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateRange: Date[] = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - i);
      dateRange.push(date);
    }

    // Initialize all dates with zero counts
    dateRange.forEach((date) => {
      const dateKey = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      jobsByDate.set(dateKey, { completed: 0, running: 0, failed: 0, dateObj: date });
    });

    // Process each job
    jobs.forEach((job) => {
      let dateToUse: Date | null = null;
      let statusToCount: 'completed' | 'running' | 'failed' | null = null;

      // Determine which date and status to use
      if (job.status === 'completed' && job.completed_at) {
        // Count completed jobs on their completion date
        dateToUse = new Date(job.completed_at);
        statusToCount = 'completed';
      } else if (job.status === 'failed' && job.completed_at) {
        // Count failed jobs on their completion date
        dateToUse = new Date(job.completed_at);
        statusToCount = 'failed';
      } else if ((job.status === 'running' || job.status === 'queued' || job.status === 'pending') && job.submitted_at) {
        // Count running/queued jobs on their submission date
        dateToUse = new Date(job.submitted_at);
        statusToCount = 'running';
      } else if (job.submitted_at) {
        // Fallback to submitted_at if available
        dateToUse = new Date(job.submitted_at);
        if (job.status === 'completed') {
          statusToCount = 'completed';
        } else if (job.status === 'failed') {
          statusToCount = 'failed';
        } else {
          statusToCount = 'running';
        }
      } else {
        // Fallback to created_at if no submitted_at
        dateToUse = new Date(job.created_at);
        if (job.status === 'completed') {
          statusToCount = 'completed';
        } else if (job.status === 'failed') {
          statusToCount = 'failed';
        } else {
          statusToCount = 'running';
        }
      }

      if (dateToUse && statusToCount) {
        // Normalize date to midnight for comparison
        dateToUse.setHours(0, 0, 0, 0);
        
        // Only count jobs within the last 14 days
        const daysDiff = Math.floor((today.getTime() - dateToUse.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff < 14) {
          const dateKey = dateToUse.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });

          if (jobsByDate.has(dateKey)) {
            const stats = jobsByDate.get(dateKey)!;
            stats[statusToCount]++;
          }
        }
      }
    });

    // Convert to array and sort by date using stored Date objects
    return Array.from(jobsByDate.values())
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .map(({ dateObj, ...stats }) => ({
        date: dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        ...stats,
      }));
  }, [jobs]);

  if (chartData.length === 0) {
    return (
      <ChartContainer title="Job Activity Timeline" height={300}>
        <div className="h-full flex items-center justify-center">
          <p className="text-grey-500 dark:text-text-tertiary">No activity data available</p>
        </div>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer title="Job Activity Timeline" height={300}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <GradientDefs />
          <defs>
            <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="runningGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="failedGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-border" />
          <XAxis
            dataKey="date"
            stroke="#64748b"
            className="dark:stroke-text-secondary"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            stroke="#64748b"
            className="dark:stroke-text-secondary"
            tick={{ fontSize: 12 }}
            label={{ value: 'Job Count', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="completed"
            stackId="1"
            stroke="#22c55e"
            fill="url(#completedGradient)"
            name="Completed"
            animationDuration={800}
          />
          <Area
            type="monotone"
            dataKey="running"
            stackId="1"
            stroke="#06b6d4"
            fill="url(#runningGradient)"
            name="Running"
            animationDuration={800}
            animationBegin={100}
          />
          <Area
            type="monotone"
            dataKey="failed"
            stackId="1"
            stroke="#ef4444"
            fill="url(#failedGradient)"
            name="Failed"
            animationDuration={800}
            animationBegin={200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default JobActivityTimeline;


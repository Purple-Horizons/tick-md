"use client";

import { useMemo } from "react";
import { useDashboardStore } from "./DashboardProvider";
import type { Task } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  backlog: "#55556a",
  todo: "#e8e8f0",
  in_progress: "#a78bfa",
  review: "#fbbf24",
  done: "#34d399",
  blocked: "#f87171",
  reopened: "#60a5fa",
};

interface GraphNode {
  task: Task;
  x: number;
  y: number;
  level: number;
}

export default function DependencyGraph() {
  const store = useDashboardStore();
  const { tasks } = store;

  // Only show tasks that have deps or block others
  const connectedTasks = useMemo(() => {
    const ids = new Set<string>();
    for (const task of tasks) {
      if (task.depends_on.length > 0 || task.blocks.length > 0) {
        ids.add(task.id);
        task.depends_on.forEach((d: string) => ids.add(d));
        task.blocks.forEach((b: string) => ids.add(b));
      }
    }
    return tasks.filter((t: Task) => ids.has(t.id));
  }, [tasks]);

  // Build adjacency for topological sort
  const { nodes, edges } = useMemo(() => {
    if (connectedTasks.length === 0) return { nodes: [] as GraphNode[], edges: [] as { from: string; to: string }[] };

    // Simple layered layout
    const taskMap = new Map(tasks.map((t: Task) => [t.id, t]));
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    const edgeList: { from: string; to: string }[] = [];

    for (const task of connectedTasks) {
      if (!inDegree.has(task.id)) inDegree.set(task.id, 0);
      if (!adjList.has(task.id)) adjList.set(task.id, []);

      for (const dep of task.depends_on) {
        if (!adjList.has(dep)) adjList.set(dep, []);
        adjList.get(dep)!.push(task.id);
        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
        if (!inDegree.has(dep)) inDegree.set(dep, 0);
        edgeList.push({ from: dep, to: task.id });
      }
    }

    // Topological level assignment (BFS)
    const levels = new Map<string, number>();
    const queue: string[] = [];

    for (const [id, deg] of inDegree) {
      if (deg === 0) {
        queue.push(id);
        levels.set(id, 0);
      }
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentLevel = levels.get(current) || 0;

      for (const next of adjList.get(current) || []) {
        const newDeg = (inDegree.get(next) || 1) - 1;
        inDegree.set(next, newDeg);
        levels.set(next, Math.max(levels.get(next) || 0, currentLevel + 1));
        if (newDeg === 0) queue.push(next);
      }
    }

    // Position nodes
    const levelGroups = new Map<number, string[]>();
    for (const [id, level] of levels) {
      if (!levelGroups.has(level)) levelGroups.set(level, []);
      levelGroups.get(level)!.push(id);
    }

    const nodeWidth = 160;
    const nodeHeight = 60;
    const xGap = 220;
    const yGap = 90;
    const graphNodes: GraphNode[] = [];

    for (const [level, ids] of levelGroups) {
      ids.forEach((id, idx) => {
        const task = taskMap.get(id);
        if (task) {
          graphNodes.push({
            task: task as Task,
            x: level * xGap + 40,
            y: idx * yGap + 40,
            level,
          });
        }
      });
    }

    return { nodes: graphNodes, edges: edgeList };
  }, [connectedTasks, tasks]);

  if (connectedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="text-4xl mb-4 block">◈</span>
          <p className="font-sans text-sm text-[var(--color-text-muted)]">No task dependencies found</p>
          <p className="font-sans text-xs text-[var(--color-text-muted)] mt-1">
            Add <code className="text-[var(--color-accent)]">depends_on</code> or <code className="text-[var(--color-accent)]">blocks</code> to tasks to see the graph
          </p>
        </div>
      </div>
    );
  }

  const nodeMap = new Map(nodes.map((n) => [n.task.id, n]));
  const svgWidth = Math.max(...nodes.map((n) => n.x)) + 220;
  const svgHeight = Math.max(...nodes.map((n) => n.y)) + 100;

  return (
    <div className="p-5 md:p-8 overflow-auto h-full">
      <svg width={svgWidth} height={svgHeight} className="select-none">
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;

          const x1 = from.x + 160;
          const y1 = from.y + 30;
          const x2 = to.x;
          const y2 = to.y + 30;
          const midX = (x1 + x2) / 2;

          return (
            <path
              key={i}
              d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
              fill="none"
              stroke="var(--color-border)"
              strokeWidth="1.5"
              markerEnd="url(#arrowhead)"
            />
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="var(--color-text-muted)" />
          </marker>
        </defs>

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.task.id} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              width="160"
              height="60"
              rx="8"
              fill="var(--color-bg-surface)"
              stroke={STATUS_COLORS[node.task.status] || "var(--color-border)"}
              strokeWidth="1.5"
            />
            <text x="12" y="22" fill={STATUS_COLORS[node.task.status]} className="font-mono" fontSize="11">
              {node.task.id}
            </text>
            <text x="12" y="42" fill="var(--color-text)" className="font-sans" fontSize="12">
              {node.task.title.length > 18 ? node.task.title.slice(0, 18) + "…" : node.task.title}
            </text>
            {/* Status dot */}
            <circle cx="148" cy="14" r="4" fill={STATUS_COLORS[node.task.status]} />
          </g>
        ))}
      </svg>
    </div>
  );
}

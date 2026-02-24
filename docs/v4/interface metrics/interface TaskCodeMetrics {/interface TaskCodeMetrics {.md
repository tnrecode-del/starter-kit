interface TaskCodeMetrics {  
  taskId: string;  
    
  // Rollup по всем агентам  
  totalFilesCreated: number;            // sum(agents[*].filesCreated)  
  totalFilesModified: number;  
  totalLinesAdded: number;  
  totalLinesRemoved: number;  
    
  // Качество: худший показатель среди агентов  
  maxTypeErrorsAfter: number;           // max(agents[*].typeErrorsAfter)  
  maxLintErrorsAfter: number;  
    
  // Покрытие: среднее взвешенное  
  weightedTestCoverage: number;         // по размеру кода  
    
  // FSD/DDD compliance: строгий AND  
  fsdCompliant: boolean;                // все агенты compliant  
  dddCompliant: boolean;  
    
  // Детализация по агентам  
  agentBreakdown: AgentCodeMetrics[];  
    
  // Итоговый diff (git)  
  finalCommitHash: string;  
  changedFiles: string[];               // из git diff --name-only  
}  

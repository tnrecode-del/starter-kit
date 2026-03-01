interface AgentCodeMetrics {  
  agentId: string;           // "frontend-ui", "backend-api", etc.  
  taskId: string;            // родительская задача  
    
  // Файловые операции (MCP filesystem)  
  filesCreated: number;  
  filesModified: number;  
  filesDeleted: number;  
    
  // Git diff (только изменения этого агента)  
  linesAdded: number;  
  linesRemoved: number;  
    
  // Качество кода (до/после работы агента)  
  typeErrorsBefore: number;  
  typeErrorsAfter: number;  
  lintErrorsBefore: number;  
  lintErrorsAfter: number;  
    
  // Специфичные для роли метрики  
  roleSpecific: RoleSpecificMetrics;  
}  
  
// Специализация по ролям  
type RoleSpecificMetrics =   
  | FrontendUIMetrics  
  | FrontendBizLogicMetrics  
  | BackendAPIMetrics  
  | BackendDatabaseMetrics  
  | QATestingMetrics;  

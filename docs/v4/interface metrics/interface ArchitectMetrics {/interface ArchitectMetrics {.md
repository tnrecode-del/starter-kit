interface ArchitectMetrics {  
  // Security review  
  securityIssuesFound: number;  
  securityIssuesSeverity: {  
    critical: number;  
    high: number;  
    medium: number;  
    low: number;  
  };  
  cweIdsDetected: string[];             // ["CWE-79", "CWE-89"]  
    
  // Architecture compliance  
  fsdViolationsFound: number;  
  dddViolationsFound: number;  
  dependencyRuleViolations: number;     // DDD: Domain → Infrastructure  
    
  // Performance  
  nPlusOneRisks: number;  
  suggestedOptimizations: number;  
    
  // Review time  
  reviewDurationMs: number;  
  linesOfCodeReviewed: number;  
    
  // Decision  
  approved: boolean;  
  rejectionReason?: string;  
  suggestedChanges: string[];  
}  

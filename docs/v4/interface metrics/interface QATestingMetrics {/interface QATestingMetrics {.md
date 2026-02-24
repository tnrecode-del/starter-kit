interface QATestingMetrics {  
  // Unit tests (Vitest)  
  unitTestsCreated: number;  
  unitTestsModified: number;  
  unitTestsPassed: number;  
  unitTestsFailed: number;  
  coveragePercent: number;              // statements, branches, functions, lines  
    
  // E2E tests (Playwright)  
  e2eTestsCreated: number;  
  e2eTestsModified: number;  
  e2eTestsPassed: number;  
  e2eTestsFailed: number;  
  browsersTested: string[];             // ["chromium", "firefox", "webkit"]  
    
  // Performance  
  avgTestDurationMs: number;  
  slowTestsCount: number;               // > 5 секунд  
    
  // Snapshots  
  snapshotsCreated: number;  
  snapshotsUpdated: number;  
  snapshotsObsolete: number;  
    
  // Regression  
  visualRegressionTests: number;  
  visualDifferencesFound: number;  
}  

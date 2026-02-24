interface FrontendBizLogicMetrics {  
  // State management  
  storesCreated: number;                // Zustand stores  
  storesModified: number;  
    
  // Data fetching  
  tanstackQueriesCreated: number;       // useQuery, useMutation  
  tanstackQueriesModified: number;  
  cacheInvalidations: number;           // queryClient.invalidateQueries  
    
  // Validation  
  zodSchemasCreated: number;  
  zodSchemasModified: number;  
    
  // Type safety  
  trpcProceduresCalled: string[];       // ["user.getById", "post.create"]  
  typeCoveragePercent: number;          // typescript-coverage-report  
    
  // Forms  
  reactHookFormsCreated: number;  
  controlledFieldsCount: number;  
}  

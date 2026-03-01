interface BackendDatabaseMetrics {  
  // Prisma schema  
  modelsCreated: number;                // model User, model Post  
  modelsModified: number;  
  fieldsAdded: number;                  // scalar + relation fields  
  relationsDefined: number;             // @relation()  
    
  // Миграции  
  migrationsGenerated: number;  
  migrationDurationMs: number;          // время apply  
  migrationRolledBack: boolean;         // откат при ошибке  
    
  // SQL  
  rawQueriesWritten: number;            // $queryRaw, $executeRaw  
  indexesAdded: number;                 // @@index(), @unique()  
    
  // Seeding  
  seedRecordsCreated: number;  
    
  // Performance  
  nPlusOneQueriesDetected: number;      // prisma-query-log  
  suggestedOptimizations: string[];     // ["add index", "use include"]  
}  

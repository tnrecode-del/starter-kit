interface FrontendUIMetrics {  
  // Компоненты  
  componentsCreated: number;  
  componentsModified: number;  
    
  // Дизайн-система  
  shadcnComponentsInstalled: string[];  // ["button", "card", "dialog"]  
  tailwindClassesUsed: number;          // уникальных классов  
    
  // Accessibility  
  a11yViolationsBefore: number;         // axe-core  
  a11yViolationsAfter: number;  
    
  // Визуальное тестирование  
  screenshotsTaken: number;             // Playwright MCP  
  visualDiffPixels: number;             // pixelmatch  
    
  // FSD архитектура  
  fsdLayer: "app" | "pages" | "widgets" | "features" | "entities" | "shared";  
  fsdSliceName: string;                 // "UserProfile", "AuthLogin"  
  fsdPublicApiExports: number;          // export из index.ts  
  fsdCrossImports: string[];            // нарушения изоляции (если найдены)  
}  

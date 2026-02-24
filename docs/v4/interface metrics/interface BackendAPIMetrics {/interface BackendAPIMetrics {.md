interface BackendAPIMetrics {  
  // Endpoints  
  controllersCreated: number;  
  controllersModified: number;  
  routesAdded: number;                  // @Get(), @Post() декораторы  
    
  // DTOs  
  dtoClassesCreated: number;  
  dtoClassesModified: number;  
  validationDecoratorsAdded: number;    // @IsString(), @IsEmail()  
    
  // Security  
  guardsImplemented: string[];          // ["JwtAuthGuard", "RolesGuard"]  
  decoratorsAdded: string[];            // ["@CurrentUser()", "@Public()"]  
    
  // Documentation  
  swaggerAnnotationsAdded: number;      // @ApiProperty(), @ApiResponse()  
    
  // DDD слои  
  domainLayerFiles: number;             // entities, value objects  
  applicationLayerFiles: number;        // services, use cases  
  infrastructureLayerFiles: number;     // repositories, external APIs  
  presentationLayerFiles: number;       // controllers, DTOs  
    
  // Dependencies  
  dependencyInjectionTokens: string[];  // провайдеры NestJS  
}  

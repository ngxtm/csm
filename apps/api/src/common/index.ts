// Services (Singleton)
export { SupabaseService, CodeGeneratorService } from './services';

// Factories (Abstract base classes)
export { EntityFactory, StatusFactory } from './factories';
export type { EntityContext, StatusTransition } from './factories';

// DTOs
export { PaginationDto } from './dto/pagination.dto';

// Module
export { CommonModule } from './common.module';

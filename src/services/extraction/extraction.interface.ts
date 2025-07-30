import { ExtractionResult } from '@/src/types/extraction.types'

export interface ExtractionService {
  extract(fileUrl: string): Promise<ExtractionResult>
  getName(): string
  getCost(): number
  testConnection(): Promise<boolean>
}
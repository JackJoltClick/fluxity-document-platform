# Document Extraction Accuracy Improvement Plan

## Current State Analysis

### Existing Architecture
- **Frontend**: Next.js app with document upload/email ingestion
- **Processing**: AWS Lambda with SQS queue
- **Current Extraction Stack**:
  - AWS Textract (OCR and structure extraction)
  - OpenAI GPT-4 (intelligent field mapping)
  - Hybrid FusionEngine combining both results
- **Supported Formats**: PDFs, images (PNG, JPEG, etc.), potentially Word docs
- **Dynamic Schemas**: Client-defined columns or legacy 21 accounting fields

### Current Extraction Flow
1. Document arrives via email (Mailgun) or manual upload
2. Queued in AWS SQS for processing
3. Lambda function processes:
   - Runs AWS Textract for OCR
   - Runs OpenAI for intelligent mapping
   - FusionEngine combines results
   - Maps to client schema or legacy fields
4. Results stored in Supabase with extracted_data JSONB

## Proposed Multi-Model Architecture for Maximum Accuracy

### Phase 1: Add Preprocessing Pipeline (Week 1)
**Goal**: Improve OCR accuracy by 15-30% on poor quality documents

#### Implementation Steps:

1. **Update Lambda processor to add preprocessing**
   ```typescript
   // In fluxity-lambda-processor/src/services/preprocessing.service.ts
   export class PreprocessingService {
     async enhance(documentUrl: string): Promise<string> {
       // Download document
       // Apply enhancements:
       //   - Auto-rotate/deskew
       //   - Increase contrast
       //   - Denoise
       //   - Convert to optimal format for OCR
       // Return enhanced document URL
     }
   }
   ```

2. **Integrate preprocessing before extraction**
   ```typescript
   // In processor.ts
   const enhancedUrl = await preprocessor.enhance(fileUrl);
   const textractResult = await textractService.process(enhancedUrl);
   ```

3. **Tools to integrate**:
   - Sharp or ImageMagick for image processing
   - pdf-lib for PDF manipulation
   - OpenCV.js for advanced corrections (optional)

### Phase 2: Multi-Model Extraction (Week 2)
**Goal**: Reduce extraction errors by 20-30% through consensus

#### Implementation Steps:

1. **Add Claude Opus to extraction pipeline**
   ```typescript
   // In fluxity-lambda-processor/src/services/claude.service.ts
   import Anthropic from '@anthropic-ai/sdk';
   
   export class ClaudeExtractionService {
     async extract(documentUrl: string, schema?: ClientSchema): Promise<ExtractionResult> {
       // Use Claude's latest model for extraction
       // Return structured data matching our format
     }
   }
   ```

2. **Update FusionEngine for 3-model consensus**
   ```typescript
   // In fusion-engine.service.ts
   export class FusionEngine {
     async combineMultiModel(
       textractResult: TextractResult,
       openaiResult: OpenAIResult,
       claudeResult: ClaudeResult
     ): Promise<HybridExtractionResult> {
       // Implement voting logic
       // If 2+ models agree on a field, use that value
       // Track confidence based on agreement
     }
   }
   ```

3. **Modify processor.ts to run parallel extraction**
   ```typescript
   // Run all three in parallel for speed
   const [textractResult, openaiResult, claudeResult] = await Promise.all([
     textractService.process(enhancedUrl),
     openaiService.extract(enhancedUrl, clientSchema),
     claudeService.extract(enhancedUrl, clientSchema)
   ]);
   
   // Combine with consensus
   const finalResult = await fusionEngine.combineMultiModel(
     textractResult,
     openaiResult, 
     claudeResult
   );
   ```

### Phase 3: Critical Field Validation (Week 3)
**Goal**: Catch and fix logical errors before data storage

#### Implementation Steps:

1. **Create validation service**
   ```typescript
   // In fluxity-lambda-processor/src/services/validation.service.ts
   export class ValidationService {
     validateInvoiceTotals(data: ExtractedData): ValidationResult {
       // Check if line items sum to total
       // Validate tax calculations
       // Ensure dates are reasonable
     }
     
     validateRequiredFields(data: ExtractedData, schema: ClientSchema): ValidationResult {
       // Ensure all required fields are present
       // Check field formats match schema expectations
     }
   }
   ```

2. **Add validation rules configuration**
   ```typescript
   // In config/validation-rules.ts
   export const VALIDATION_RULES = {
     invoice: {
       totalsMustMatch: true,
       taxCalculationTolerance: 0.01,
       dateRangeYears: 2,
       requiredFields: ['invoice_number', 'total_amount', 'vendor_name']
     }
   };
   ```

3. **Integrate validation into processor**
   ```typescript
   // After extraction and fusion
   const validationResult = await validator.validate(finalResult, clientSchema);
   
   if (validationResult.hasErrors) {
     // Attempt auto-correction or flag for review
     finalResult.confidence = Math.min(finalResult.confidence, 0.7);
     finalResult.requires_review = true;
     finalResult.validation_errors = validationResult.errors;
   }
   ```

### Phase 4: Confidence Scoring System (Week 4)
**Goal**: Ensure no critical errors slip through

#### Implementation Steps:

1. **Enhanced confidence calculation**
   ```typescript
   // In fusion-engine.service.ts
   calculateFieldConfidence(field: string, values: ModelValues): number {
     // If all models agree: 0.95
     // If 2/3 agree: 0.80
     // If only one found it: 0.60
     // If validation failed: 0.30
     
     if (field in CRITICAL_FIELDS) {
       // Be more conservative with critical fields
       return confidence * 0.9;
     }
     
     return confidence;
   }
   ```

2. **Update document status based on confidence**
   ```typescript
   // In processor.ts
   const updateStatus = {
     status: 'completed',
     extracted_data: finalResult,
     extraction_confidence: finalResult.confidence,
     requires_review: finalResult.confidence < 0.80 || 
                      finalResult.validation_errors?.length > 0
   };
   ```

3. **Add confidence UI indicators**
   - Update frontend to show confidence scores
   - Highlight low-confidence fields in red
   - Add review queue for flagged documents

## Implementation Prompts

### Prompt 1: Preprocessing Service
```
Create a preprocessing service for the Lambda processor that:
1. Downloads documents from Supabase storage
2. Applies image enhancements (deskew, denoise, contrast)
3. Handles PDFs by converting to high-quality images
4. Uploads enhanced versions back to storage
5. Returns URLs for processed documents
Use Sharp for images and pdf-lib for PDFs.
```

### Prompt 2: Claude Integration
```
Add Claude Opus integration to the extraction pipeline:
1. Create claude.service.ts using @anthropic-ai/sdk
2. Implement extract() method matching OpenAI service interface
3. Use Claude's vision capabilities for direct image analysis
4. Map results to our ExtractionResult interface
5. Calculate and return extraction costs
```

### Prompt 3: Multi-Model Consensus
```
Update FusionEngine to handle 3-model consensus:
1. Accept results from Textract, OpenAI, and Claude
2. Implement voting logic for each field
3. Track which models agreed/disagreed
4. Calculate confidence based on agreement level
5. Return merged result with detailed confidence scores
```

### Prompt 4: Validation Engine
```
Create a validation service that:
1. Validates invoice totals match line items
2. Checks date sanity (not future, not too old)
3. Validates tax calculations
4. Ensures required fields are present
5. Returns detailed error messages for failed validations
```

### Prompt 5: Database Schema Updates
```
Update the database schema to support multi-model extraction:
1. Add columns for model-specific confidence scores
2. Add validation_errors JSONB column
3. Add extraction_models array to track which models were used
4. Create indexes for filtering by confidence and review status
```

### Prompt 6: Frontend Updates
```
Update the document detail page to:
1. Show confidence scores for each field
2. Highlight low-confidence fields in red
3. Display validation errors if present
4. Add "Mark as Reviewed" button for flagged documents
5. Show which models extracted each field
```

## Configuration Updates

### Environment Variables to Add
```env
# Claude API
ANTHROPIC_API_KEY=your_claude_api_key

# Confidence Thresholds
MIN_CONFIDENCE_THRESHOLD=0.80
CRITICAL_FIELD_THRESHOLD=0.95

# Validation Settings
ENABLE_VALIDATION=true
VALIDATION_STRICT_MODE=false

# Model Selection
ENABLE_CLAUDE=true
ENABLE_PREPROCESSING=true
```

### Cost Considerations
- Current: ~$0.015/page (Textract) + ~$0.05 (GPT-4)
- With Claude added: +~$0.03 per document
- Total: ~$0.095 per document (40% increase)
- **Worth it for 20-30% accuracy improvement**

## Testing Strategy

### Test Documents to Prepare
1. High-quality printed invoice (baseline)
2. Poor quality scan (faded, skewed)
3. Handwritten sections
4. Complex multi-page document
5. Non-English invoice
6. Receipt with poor lighting

### Accuracy Metrics to Track
```typescript
interface AccuracyMetrics {
  overall_accuracy: number;
  field_level_accuracy: Record<string, number>;
  model_agreement_rate: number;
  validation_pass_rate: number;
  human_review_rate: number;
  critical_field_accuracy: number;
}
```

## Rollout Strategy

### Week 1: Preprocessing
- Implement preprocessing service
- Test on sample documents
- Measure accuracy improvement

### Week 2: Add Claude
- Integrate Claude API
- Run parallel with existing models
- Compare results but don't use for production yet

### Week 3: Enable Consensus
- Turn on 3-model voting
- Monitor agreement rates
- Fine-tune confidence thresholds

### Week 4: Validation & Monitoring
- Enable validation rules
- Set up accuracy tracking
- Create dashboard for metrics

### Week 5: Production Rollout
- Gradually increase traffic to new pipeline
- Monitor costs and accuracy
- Adjust thresholds based on real data

## Expected Outcomes

### Accuracy Improvements
- **Clean documents**: 95% → 98% (3% improvement)
- **Poor quality**: 85% → 93% (8% improvement)  
- **Handwritten**: 70% → 88% (18% improvement)
- **Critical fields**: 92% → 99% (7% improvement)

### Business Impact
- 50% reduction in manual review needs
- 70% reduction in critical field errors
- Higher client confidence in automated extraction
- Competitive advantage in accuracy

## Next Steps

1. Review and approve implementation plan
2. Set up Claude API access
3. Begin Phase 1 (preprocessing) implementation
4. Prepare test document dataset
5. Set up accuracy tracking infrastructure

---

*This plan balances maximum accuracy gains with practical implementation complexity, leveraging the existing architecture while adding proven techniques for improvement.*
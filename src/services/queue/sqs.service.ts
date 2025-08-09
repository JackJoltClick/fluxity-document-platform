import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'

export interface DocumentProcessingMessage {
  documentId: string
  action: 'process'
  userId: string
  fileUrl: string
  filename: string
  clientSchemaId?: string
}

export class SQSService {
  private client: SQSClient
  private queueUrl: string

  constructor() {
    this.client = new SQSClient({
      region: process.env.AWS_REGION || 'us-west-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
    
    this.queueUrl = process.env.SQS_QUEUE_URL!
    
    if (!this.queueUrl) {
      throw new Error('SQS_QUEUE_URL environment variable is required')
    }
  }

  async sendDocumentForProcessing(documentId: string, userId: string, fileUrl: string, filename: string, clientSchemaId?: string): Promise<void> {
    const message: DocumentProcessingMessage = {
      documentId,
      action: 'process',
      userId,
      fileUrl,
      filename,
      ...(clientSchemaId && { clientSchemaId })
    }

    const messageAttributes: any = {
      documentId: {
        StringValue: documentId,
        DataType: 'String'
      },
      action: {
        StringValue: 'process',
        DataType: 'String'
      }
    }

    if (clientSchemaId) {
      messageAttributes.clientSchemaId = {
        StringValue: clientSchemaId,
        DataType: 'String'
      }
    }

    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(message),
      MessageAttributes: messageAttributes
    })

    try {
      const result = await this.client.send(command)
      const schemaInfo = clientSchemaId ? ` with schema ${clientSchemaId}` : ' (no schema)'
      console.log(`📤 SQS: Sent document ${documentId}${schemaInfo} for processing. MessageId: ${result.MessageId}`)
    } catch (error) {
      console.error(`❌ SQS: Failed to send document ${documentId} for processing:`, error)
      throw new Error(`Failed to queue document for processing: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async isEnabled(): Promise<boolean> {
    return process.env.USE_SQS === 'true'
  }
}
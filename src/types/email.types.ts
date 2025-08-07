export interface EmailAlias {
  id: string
  user_id: string
  email_address: string
  is_primary: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface MailgunWebhookData {
  'stripped-text': string
  'stripped-signature': string
  'body-plain': string
  'body-html': string
  'attachment-count': string
  timestamp: string
  token: string
  signature: string
  'message-headers': string
  'Content-Type': string
  from: string
  sender: string
  subject: string
  'recipient': string
  'Message-Id': string
  'Date': string
  'X-Mailgun-Variables'?: string
  [key: string]: any // For attachment files
}

export interface MailgunAttachment {
  filename: string
  contentType: string
  size: number
  content: Buffer
}

export interface EmailProcessingResult {
  success: boolean
  documentsCreated: number
  errors: string[]
  documentIds: string[]
}

export interface EmailMetadata {
  sender: string
  recipient: string
  subject: string
  messageId: string
  receivedDate: string
  originalFilename?: string
  storedFilename?: string
}

export interface EmailIngestionConfig {
  enabled: boolean
  webhookUrl: string
  signingKey: string
  allowedDomains?: string[]
  maxAttachmentSize: number
  supportedFileTypes: string[]
}
export interface SSEWriter {
  write(event: string, data: Record<string, unknown>): void;
}

export interface GeneratePipelineParams {
  projectId: string;
  userId?: string;
  description?: string;
  safetyClarification?: boolean;
  streamPreview?: boolean;
  sse: SSEWriter;
}

export interface IteratePipelineParams {
  projectId: string;
  userId?: string;
  userMessage: string;
  safetyClarification?: boolean;
  streamPreview?: boolean;
  sse: SSEWriter;
}

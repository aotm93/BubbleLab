/**
 * usePearlChatStore - Combines Pearl chat state with mutation and context gathering
 *
 * This hook provides a clean API for components to trigger Pearl chat generation
 * without needing to subscribe to state changes (unless they want to render the chat).
 *
 * Usage:
 * ```typescript
 * // In a chat UI component (with subscription):
 * const pearl = usePearlChatStore(flowId);
 * return <div>{pearl.messages.map(...)}</div>;
 *
 * // In a button component (no subscription):
 * const pearl = usePearlChatStore(flowId);
 * onClick={() => pearl.startGeneration("Fix errors")}
 * ```
 */

import { useCallback } from 'react';
import type { StreamingEvent } from '@bubblelab/shared-schemas';
import {
  ParsedBubbleWithInfo,
  cleanUpObjectForDisplayAndStorage,
  PEARL_DEFAULT_MODEL,
} from '@bubblelab/shared-schemas';
import { usePearlStream } from './usePearl';
import { useIsMutating } from '@tanstack/react-query';
import { getPearlChatStore, type DisplayEvent } from '../stores/pearlChatStore';
import type { ChatMessage } from '../components/ai/type';
import { useEditor } from './useEditor';
import { useBubbleDetail } from './useBubbleDetail';
import { getExecutionStore } from '../stores/executionStore';
import { trackAIAssistant } from '../services/analytics';
import type { StreamingLogEvent } from '@bubblelab/shared-schemas';
import { simplifyObjectForContext } from '../utils/executionLogsFormatUtils';
import { useValidateCode } from './useValidateCode'; // 添加这一行

// ... existing code ...

/**
 * Main hook - combines store state with mutation and provides simple API
 */
export function usePearlChatStore(flowId: number | null) {
  // IMPORTANT: Always call hooks in the same order (React Rules of Hooks)
  // Gather dependencies - must be called unconditionally
  const { editor } = useEditor();
  const bubbleDetail = useBubbleDetail(flowId);
  
  // 添加validateCodeMutation
  const validateCodeMutation = useValidateCode({ flowId });

  // Get store instance - always returns a valid store (creates fallback for null)
  // This ensures hooks are called in consistent order
  const store = getPearlChatStore(flowId ?? -1);

  // Mutation for API calls with built-in success/error handling
  const pearlMutation = usePearlStream({
    flowId,
    onEvent: (event: StreamingEvent) => {
      if (store) {
        handleStreamingEvent(event, store);
      }
    },
    onSuccess: (result) => {
      if (!store) return;

      const storeState = store.getState();

      // Sometimes the backend returns a JSON string in the message field
      // Try to parse it and extract the actual message
      let messageContent = result.message || '';
      try {
        const parsed = JSON.parse(messageContent.trim());
        if (parsed && typeof parsed === 'object' && 'message' in parsed) {
          messageContent = parsed.message;
        }
      } catch {
        // Not a JSON string, use as-is
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: messageContent,
        code:
          result.type === 'code' && result.snippet ? result.snippet : undefined,
        resultType: result.type,
        timestamp: new Date(),
        bubbleParameters: result.bubbleParameters as Record<
          string,
          ParsedBubbleWithInfo
        >,
      };

      storeState.addMessage(assistantMessage);
      storeState.clearToolCalls();

      // 如果AI生成了代码，则调用validateCodeMutation来更新可视化工作流
      if (result.type === 'code' && result.snippet && flowId) {
        // 获取当前的凭据信息
        const executionState = getExecutionStore(flowId);
        const credentials = executionState?.pendingCredentials || {};
        
        // 调用验证代码的mutation
        validateCodeMutation.mutate({
          code: result.snippet,
          flowId: flowId,
          credentials: credentials,
          syncInputsWithFlow: true,
        });
      }

      trackAIAssistant({
        action: 'receive_response',
        message: assistantMessage.content,
      });
    },
    onError: (error) => {
      if (!store) return;

      const storeState = store.getState();
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content:
          error instanceof Error
            ? error.message
            : 'Failed to generate response',
        resultType: 'reject',
        timestamp: new Date(),
      };

      storeState.addMessage(errorMessage);
      storeState.clearToolCalls();
    },
  });

  // ... existing code ...
}
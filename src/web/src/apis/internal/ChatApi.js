// @flow

import { startSSE } from '../../utils/SSE.js'
import Config from '../../Config.js'
import sessionStore from '../../stores/SessionStore.js'
import { showErrorModal } from '../../modals/ErrorModal.js'

export default class ChatApi {
  // static async sendMessage(
  //   agencyId: string,
  //   message: string,
  //   conversationId?: ?string,
  //   onData: (
  //     data: ?{
  //       conversationId: string,
  //       updateName?: boolean,
  //       messageId?: string,
  //       text?: string,
  //     },
  //     done: boolean,
  //   ) => any,
  // ): Promise<() => void> {
  //   const stopSSE = startSSE(
  //     `${Config.backendHost}/service/chat/${agencyId}/sendMessage`,
  //     {
  //       message,
  //       conversationId,
  //     },
  //     {
  //       Authorization: `Basic ${sessionStore.sessionToken ?? ''}`,
  //     },
  //     onData,
  //     (errorMessage: string) => {
  //       showErrorModal(errorMessage)
  //     },
  //   )
  //   return stopSSE
  // }
}

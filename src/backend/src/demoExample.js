// @flow

const generateHtml = (
  demoSessionToken: string,
  agencyId: number,
  backendHost: string,
): string => `<!DOCTYPE html>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chat Demo</title>
<style>
  .message {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-bottom: 10px;
  }
</style>
<body>
<form id="form">
  <input type="text" id="input" placeholder="Enter text here" autofocus/>
  <button type="submit">Submit</button>
</form>
<div>
  <span id="chat-name">New Chat</span>
  <div id="chat-log"></div>
</div>

<script type="module">
  import { io } from 'https://cdn.skypack.dev/socket.io-client@4.7.2?min'

  // Do not place your accessKey in frontend code unless you intend for it to be publicly available.
  // This temporarySessionToken expires in 8 hours. 
  const temporarySessionToken = '${demoSessionToken}'

  const agencyId = ${agencyId}

  // Connect to your Socket.IO server
  const socket = io('${backendHost}', {
    query: {
      agencyId,
      demoSessionToken: temporarySessionToken,

      // You should not use demoSessionToken in production.
      // Instead, use accessKey:
      // accessKey: '',
    },
  })

  /*
  Typings for the Socket.IO events:

  export type NewChatInput = {
    agencyId: number,
    userPrompt: string,
    filterOnlyManager?: ?boolean
  }

  export type NewChatOutput = {
    agencyId: number,
    chatId: string,
    managerAgentId: number,
  }

  export type NewMessageInput = {
    agencyId: number,
    chatId: string,
    userPrompt: string,
  }

  export type LoadChatInput = {
    agencyId: number,
    chatId: string,
    lastMessageIds?: { [agentId: number]: number },
  }

  export type LoadChatOutput = {
    agencyId: number,
    chatId: string,
    managerAgentId: number,
  }

  export type UpdateNameOutput = {
    agencyId: number,
    chatId: string,
    managerAgentId: number,
    name: string,
  }

  export type AppendMessageOutput = {
    agencyId: number,
    chatId: string,
    managerAgentId: number,
    message: FlatMessage,
  }

  export type UpdateMessageOutput = {
    agencyId: number,
    chatId: string,
    managerAgentId: number,
    message: FlatMessage,
  }

  export const MessageRole = {
    SYSTEM: 'SYSTEM',
    ASSISTANT: 'ASSISTANT',
    USER: 'USER',
  }

  export type MessageRoleType = $Keys<typeof MessageRole>

  export type FlatMessage = {|
    messageId: number,
    agentId: number,
    agentConversationId: string,
    role: MessageRoleType,
    linkedMessageId: ?number,

    internalInstruction?: ?boolean,
    userInstruction?: ?boolean,
    correctionInstruction?: ?boolean,
    toApi?: ?boolean,
    fromApi?: ?boolean,
    completed?: ?boolean,
    toAgentId?: ?number,
    fromAgentId?: ?number,
    text: string,

    dateCreated: string,

    __typename?: string,
    id?: string,
  |}
* */

  socket.on('connect_error', (error) => {
    console.error('connect_error', error)
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
  })

  socket.on('connect', () => {
    console.log('connected')

    socket.on('error', (error) => {
      console.error('error', error)
      window.alert(error.message)
    })

    socket.on('loadChat', (output /*: LoadChatOutput*/) => {
      console.debug('loadChat', output)
      // When you send loadChat,
      // the server will emit many appendMessage and updateMessage to load the client,
      // then finally emit loadChat to indicate that loading is done.
    })

    socket.on('newChat', (output /*: NewChatOutput*/) => {
      console.debug('newChat', output)
      // Starting a new chat returns a chatId.
      // You should send new messages using this chatId.
      // You may also store chatIds and use loadChat to load previous chats.
      chatId = output.chatId
    })

    socket.on('updateName', (output /*: UpdateNameOutput*/) => {
      console.debug('updateName', output)
      document.getElementById('chat-name').innerText = output.name
    })

    socket.on('appendMessage', (output /*: AppendMessageOutput*/) => {
      console.debug('appendMessage', output)
      renderNewMessage(output)
    })

    socket.on('updateMessage', (output /*: UpdateMessageOutput*/) => {
      // console.debug('updateMessage', output)
      updateRenderedMessage(output)
    })
  })

  function sendNewChat(input /*: NewChatInput*/) {
    if (socket?.connected) {
      console.debug('newChat', input)
      socket.emit('newChat', input)
    } else {
      window.alert('Unable to connect to server. Please try again later.')
    }
  }

  function sendNewMessage(input /*: NewMessageInput*/) {
    if (socket?.connected) {
      socket.emit('newMessage', input)
    } else {
      window.alert('Unable to connect to server. Please try again later.')
    }
  }

  function sendLoadChat(input /*: LoadChatInput*/) {
    if (socket?.connected) {
      console.debug('loadChat', input)
      socket.emit('loadChat', input)
    } else {
      window.alert('Unable to connect to server. Please try again later.')
    }
  }

  function renderNewMessage(output /*: AppendMessageOutput*/) {
    // When a new message is received from the socket,
    // render it to the DOM by appending it to the list of existing messages.

    const messageElement = document.createElement('div')
    messageElement.id = \`message-\${output.message.messageId}\`
    messageElement.className = 'message'
    messageElement.innerHTML = \`
      <div>
        <span>\${output.message.text}</span>
      </div>
    \`
    document.getElementById('chat-log').appendChild(messageElement)
  }

  function updateRenderedMessage(output /*: UpdateMessageOutput*/) {
    // When a message is updated,
    // update the DOM by replacing the existing message with the updated message.

    const messageElement = document.getElementById(
      \`message-\${output.message.messageId}\`,
    )
    messageElement.innerHTML = \`
      <div>
        <span>\${output.message.text}</span>
      </div>
    \`
  }

  let chatId = null
  document
    .getElementById('form')
    .addEventListener('submit', function (event) {
      event.preventDefault()

      const userPrompt = document.getElementById('input').value
      document.getElementById('input').value = ''

      if (!chatId) {
        sendNewChat({
          agencyId,
          userPrompt,
          filterOnlyManager: true,
        })
      } else {
        sendNewMessage({
          agencyId,
          chatId,
          userPrompt: userPrompt,
        })
      }
    })
</script>
</body>
`

export default generateHtml

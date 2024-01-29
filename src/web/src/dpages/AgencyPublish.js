// @flow

import React, { useEffect, useState } from 'react'
import View from '../components/View.js'
import type { User } from '../types/User.js'
import type { Agency } from '../types/Agency.js'
import { css } from 'goober'
import { useQuery } from '@apollo/client'
import GetAuthTokens from '../graphql/GetAuthTokens.js'
import sessionStore from '../stores/SessionStore.js'
import nonMaybe from 'non-maybe'
import Form from '../components/Form.js'
import LineBreak from '../components/LineBreak.js'
import TextField from '../components/TextField.js'
import FormSection from '../components/FormSection.js'
import {
  PiCaretDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiTrashBold,
} from 'react-icons/pi'
import Button, { ButtonSquared } from '../components/Button.js'
import Colors from '../Colors.js'
import { showConfirmationModal } from '../modals/ConfirmationModal.js'
import DeleteAuthTokenMutation from '../graphql/mutation/DeleteAuthTokenMutation.js'
import type { AuthToken } from '../types/AuthToken.js'
import { showErrorModal } from '../modals/ErrorModal.js'
import { showSingleInputModal } from '../modals/SingleInputModal.js'
import CreateAuthTokenMutation from '../graphql/mutation/CreateAuthTokenMutation.js'
import { showInfoModal } from '../modals/InfoModal.js'
import MarkdownText from '../components/MarkdownText.js'
import Config from '../Config.js'
import Text from '../components/Text.js'
import Time from '../utils/Time.js'
import GetAgencyVersions from '../graphql/GetAgencyVersions.js'
import GetDemoSessionTokenMutation from '../graphql/mutation/GetDemoSessionTokenMutation.js'
import GetDemoExampleMutation from '../graphql/mutation/GetDemoExampleMutation.js'
import Footer from '../components/Footer.js'
import classnames from 'classnames'
import mainStore from '../stores/MainStore.js'

const guidePanelDefaultWidth = 600

const styles = {
  container: css`
    align-self: stretch;
    flex: 1;
    flex-direction: row;
    background-color: ${Colors.panelBg};
  `,
  publishSettings: css`
    align-self: stretch;
    flex: 1;

    > .scroller {
      flex: 1;
      align-self: stretch;
      overflow-y: scroll;
      max-height: calc(100dvh);
      padding: 0 20px;
    }
  `,
  guide: css`
    flex-direction: column;
    align-self: stretch;
    max-width: ${guidePanelDefaultWidth}px;
    width: 100%;
    transition: width 150ms cubic-bezier(0.4, 0, 0.2, 1);

    /*&[data-is-dragging='true'] {
      user-select: none;
    }*/

    > .scroller {
      flex: 1;
      align-self: stretch;
      overflow-y: scroll;
      max-height: 100dvh;
      background-color: white;
      padding: 0 10px;
      transition: padding 150ms cubic-bezier(0.4, 0, 0.2, 1);

      @media (max-width: 600px) {
        max-height: calc(100dvh - 52px);
      }
    }

    &.hide {
      > .scroller {
        padding: 0 0;
      }
    }

    .toggle-guide-panel-button {
      position: absolute;
      top: 0;
      right: 100%;
      width: 35px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
    }
  `,
  form: css`
    width: 100%;
  `,
  tokenItem: css`
    flex-direction: row;
    align-items: center;

    input {
      background-color: white;
      border: 1px solid ${Colors.blackSoft};
    }

    button {
      display: flex;
      align-self: flex-end;
      justify-content: center;
      align-items: center;
      width: 42px;
      height: 42px;
      border-radius: 4px;
      border: 1px solid ${Colors.blackSoft};
      margin-left: 16px;
      background-color: white;

      &:hover:not([disabled='']):not([disabled='true']) {
        border: 1px solid ${Colors.black};
      }
    }
  `,
  versionTable: css`
    flex-direction: column;
    align-items: center;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid ${Colors.blackSoft};
    max-width: 378px;
    background-color: white;
    overflow: hidden;

    .version-row {
      display: flex;
      flex-direction: row;
      min-width: 221px;
      align-self: stretch;
      align-items: center;
      justify-content: space-between;
      padding-left: 7px;
      padding-right: 7px;
      height: 26px;
    }

    .version-row:not(:first-child) {
      border-top: 1px solid ${Colors.blackSoft};
    }
  `,
  button: css`
    width: 240px;
  `,
}

type TokenItemProps = {
  authToken: AuthToken,
  onDelete: () => any,
}

const TokenItem = (props: TokenItemProps): any => {
  const { authToken, onDelete } = props

  return (
    <View className={styles.tokenItem}>
      {/*<Text>
        {authToken.name}
      </Text>*/}
      <TextField label={authToken.name} value={authToken.token} disabled />
      <Button onClick={onDelete}>
        <PiTrashBold />
      </Button>
    </View>
  )
}

// type VersionItemProps = {
//   agency: Agency,
// }
//
// const VersionItem = (props: VersionItemProps): any => {
//   const {
//     agency
//   } = props
//
//   return (
//     <View className={styles.versionItem}>
//       <Text>
//         {agency.agencyId}
//       </Text>
//       <Text>
//         {agency.dateCreated}
//       </Text>
//     </View>
//   )
// }

type VersionTableProps = {
  agency: Agency,
}

const VersionTable = (props: VersionTableProps): any => {
  const { agency } = props

  const res = useQuery(GetAgencyVersions, {
    variables: {
      sessionToken: nonMaybe(sessionStore.sessionToken),
      lookupId: agency.lookupId,
    },
  })

  const versionedAgencies: Array<Agency> =
    res.data?.viewer?.agency?.versions ?? []

  return (
    <View className={styles.versionTable}>
      <View className={'version-row header'}>
        <Text>{'ID'}</Text>
        <Text>{'Date Created'}</Text>
      </View>
      {versionedAgencies.map((agency: Agency) => {
        return (
          <View key={agency.agencyId} className={'version-row'}>
            <Text>{agency.agencyId}</Text>
            <Text>{Time.fromISO(agency.dateCreated ?? '')}</Text>
          </View>
        )
      })}
    </View>
  )
}

type GuideProps = {
  agencyId?: ?number,
}

export const Guide = (props: GuideProps): any => {
  const { agencyId } = props

  const [demoExample, setDemoExample] = useState('')
  useEffect(() => {
    if (demoExample !== '') return

    if (sessionStore.sessionToken) {
      GetDemoExampleMutation({
        sessionToken: sessionStore.sessionToken,
        agencyId: agencyId ?? 0,
      }).then((res) => {
        if (res?.success) {
          setDemoExample(res.exampleHtml)
        }
      })
    }
  }, [demoExample])

  const exampleAgencyId = agencyId?.toString() || '0'

  let wsHost = ''
  if (Config.backendHost.startsWith('http')) {
    wsHost = Config.backendHost.replace(/^http/, 'ws')
  } else if (Config.backendHost.startsWith('https')) {
    wsHost = Config.backendHost.replace(/^https/, 'wss')
  }

  //   const websocketAuthExample = `
  // \`\`\`js
  // const accessKey = 'your_access_key';
  // const wsUrl = \`${wsHost}/ws?agencyId=${agencyId}&accessKey=\${encodeURIComponent(accessKey)}\`;
  // const webSocket = new WebSocket(wsUrl);
  // \`\`\`
  // `

  const socketioAuthExample = `
\`\`\`js
import { io } from 'socket.io-client'
const socket = io('${Config.backendHost}', {
  query: {
    agencyId: ${exampleAgencyId},
    accessKey: 'your_access_key'
  }
});
\`\`\`
`

  return (
    <View className={'scroller'}>
      <Form className={styles.form}>
        <LineBreak />
        <MarkdownText
          lookupProps={{
            'auth-example': {
              socketio: socketioAuthExample,
              // websocket: websocketAuthExample,
            },
            'try-example': {
              html: demoExample,
            },
          }}
        >
          {`
# API Publishing

You may interact with the agency via [Socket.IO](https://socket.io/).

## Authentication

All API requests are authenticated by passing \`accessKey\` as a query parameter in the initial request.

\`\`\`js
import { io } from 'socket.io-client'
const socket = io('${Config.backendHost}', {
  query: {
    agencyId: ${exampleAgencyId},
    accessKey: 'your_access_key'
  }
});
\`\`\`

## Sendable Events

These are the events which can be sent through Socket.IO from the client.

### newChat

This event is used to initiate a new chat. A new \`chatId\` will be echoed back to the client in the \`NewChatOutput\` event. Only chat messages associated with this \`chatId\` will be sent to the client. 

\`\`\`ts
type NewChatInput = {
  agencyId: number,
  userPrompt: string,
  filterOnlyManager?: ?boolean
}
\`\`\`

Use \`filterOnlyManager\` if the client should receive message updates from only the manager agent. Otherwise, message updates from all agents will be received. 

### newMessage

Appends a new user message to the chat with the manager.

\`\`\`ts
type NewMessageInput = {
  agencyId: number,
  chatId: string,
  userPrompt: string,
}
\`\`\`

### loadChat

Use this event to load a pre-existing \`chatId\`. It can be used to switch chats or to implement reconnection with the last known message IDs.

\`\`\`ts
type LoadChatInput = {
  agencyId: number,
  chatId: string,
  lastMessageIds?: { [agentId: number]: number },
}
\`\`\`

Each agent has its own personal message log. If \`lastMessageIds\` is provided, it should be a mapping from \`agentId\` to the last \`messageId\` in that agent's message log.

## Receivable Events

These are the events which the server may send to the client.

### newChat

The server sends this in response to the client sending a \`newChat\` event. It is to confirm the creation of a new chat, and it also provides the client with the new \`chatId\` to be used in subsequent requests.

\`\`\`ts
type NewChatOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
}
\`\`\`

### updateName

After creating a new chat, the server will automatically generate a name for this chat. This event is sent to the client to inform it of the new name.

\`\`\`ts
type UpdateNameOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  name: string,
}
\`\`\`

### loadChat

The server sends this in response to the client sending a \`loadChat\` event. When the server receives \`loadChat\` from the client,
it will begin sending \`appendMessage\` and \`updateMessage\` events to the client, and finally, when loading is done, it will emit this \`loadChat\` event.
The client can use this to know when the loading phase is done.

\`\`\`ts
type LoadChatOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
}
\`\`\`

### appendMessage

If the client receives this event, it should append the message to the chat log for the agent specified by \`message.agentId\`.

\`\`\`ts
type AppendMessageOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: FlatMessage,
}
\`\`\`

### updateMessage

If the client receives this event, it should update the message specified by \`message.messageId\`.

\`\`\`ts
type UpdateMessageOutput = {
  agencyId: number,
  chatId: string,
  managerAgentId: number,
  message: FlatMessage,
}
\`\`\`

## Message Type

Here are the typings for the Message.

\`\`\`ts
const MessageRole = {
  SYSTEM: 'SYSTEM',
  ASSISTANT: 'ASSISTANT',
  USER: 'USER',
}

type MessageRoleType = $Keys<typeof MessageRole>

type FlatMessage = {|
  __typename: string,
  id: string,
  messageId: number,
  agentId: number,
  agentConversationId: string,
  role: MessageRoleType,
  linkedMessageId: ?number,
  internalInstruction?: ?boolean,
  userInstruction?: ?boolean,
  correctionInstruction?: ?boolean,
  toApi: ?boolean,
  fromApi: ?boolean,
  completed: ?boolean,
  toAgentId: ?number,
  fromAgentId: ?number,
  text: string,
  dateCreated: string,
|}
\`\`\`

## The Manager Agent

One difference between the OpenAI Chat Completions API and this API is that this API is used to interact with an entire agency which is made of multiple agents. Every agency will have a single agent designated as the manager. Messages from the API will be sent to this manager agent, and the manager agent's responses will be sent
back through the API. Messages cannot be sent directly to the other agents in the agency.

## Error Handling

If there is an error, the server will send an \`error\` event with the following JSON data:

\`\`\`json
{
  "message": "Error message"
}
\`\`\`

## API Versioning

The API for an agency is versioned by a unique ID.

Whenever you change an agency's instructions, a new version for it is automatically created. A new version is only created when there are conversations on the latest version.

If you need to access an old version of the agency, you can do so by setting \`agencyId\` in the POST data to the ID of the old version.
The \`agencyId\` of a versioned agency does not change, so old endpoints will continue to work.

## Working Example

${
  agencyId
    ? `
<TryExample
  propId="try-example"
/>
`
    : `
Create an account to try out the API.
`
}

`}
        </MarkdownText>
        <LineBreak />
        <LineBreak />
      </Form>
    </View>
  )
}

type PublishSettingsProps = {
  currentUser: User,
  agency: Agency,
}

const PublishSettings = (props: PublishSettingsProps) => {
  const { currentUser, agency } = props

  const res = useQuery(GetAuthTokens, {
    variables: {
      sessionToken: nonMaybe(sessionStore.sessionToken),
      agencyId: agency.agencyId,
    },
  })

  const authTokens = res.data?.viewer?.currentUser?.authTokens ?? []
  const agencyId = agency.agencyId || 0

  async function handleDeleteKey(authToken: AuthToken) {
    if (authTokens.length <= 1) {
      showErrorModal('You must have at least one API key.')
      return
    }

    const confirmation = await showConfirmationModal()
    if (!confirmation) return

    await DeleteAuthTokenMutation(
      {
        sessionToken: nonMaybe(sessionStore.sessionToken),
        authTokenId: authToken.authTokenId,
      },
      agencyId,
    )
  }

  async function generateNewKey() {
    const name = await showSingleInputModal('Give a name for this key.', 'Name')
    if (!name) {
      return
    }

    const res = await CreateAuthTokenMutation({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      agencyId,
      name: name,
    })

    if (res?.success) {
      showInfoModal({
        open: true,
        title: 'New API Key',
        message: 'This is the only time you will be able to see this key.',
        children: (props: any) => (
          <View {...props}>
            <TextField value={res?.unmaskedToken ?? ''} disabled />
          </View>
        ),
        primaryActionLabel: 'Copy',
        onPrimary: () => {
          navigator.clipboard.writeText(res?.unmaskedToken ?? '')
        },
        disabledClickOutside: true,
      })
    }
  }

  return (
    <View className={styles.publishSettings}>
      <View className={'scroller'}>
        <Form className={styles.form}>
          <FormSection label={'API Access Keys'} labelTag={'h2'}>
            {authTokens.map((authToken, i) => (
              <React.Fragment key={i}>
                <TokenItem
                  authToken={authToken}
                  onDelete={() => handleDeleteKey(authToken)}
                />
                <LineBreak />
              </React.Fragment>
            ))}
            <ButtonSquared className={styles.button} onClick={generateNewKey}>
              Generate New Key
            </ButtonSquared>
          </FormSection>
          <LineBreak />
          <FormSection label={'Versions'} labelTag={'h2'}>
            <VersionTable agency={agency} />
          </FormSection>
        </Form>
      </View>
    </View>
  )
}

type AgencyPublishProps = {
  className: string,
  currentUser: User,
  agency: Agency,
}

const AgencyPublish = (props: AgencyPublishProps): any => {
  const { className, currentUser, agency } = props

  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 600)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const [expanded, setExpanded] = useState(!isMobile)

  useEffect(() => {
    if (!isMobile) {
      setExpanded(true)
    }
  }, [isMobile])

  useEffect(() => {
    if (isMobile && expanded) {
      mainStore.setCloseRightSidePanel(() => {
        setExpanded(false)
      })
    } else {
      mainStore.setCloseRightSidePanel(null)
    }

    return () => {
      mainStore.setCloseRightSidePanel(null)
    }
  }, [isMobile, expanded])

  function toggleExpanded() {
    setExpanded(!expanded)
  }

  return (
    <View className={classnames(className, styles.container)}>
      <PublishSettings currentUser={currentUser} agency={agency} />
      <View
        className={classnames(styles.guide, { hide: !expanded })}
        style={{ width: expanded ? '100%' : '0' }}
      >
        <Guide agencyId={agency?.agencyId} />
        {isMobile ? (
          <Button
            style={{
              zIndex: 1,
            }}
            className={'toggle-guide-panel-button'}
            onClick={toggleExpanded}
          >
            {!expanded ? <PiCaretLeftBold /> : <PiCaretRightBold />}
          </Button>
        ) : null}
      </View>
    </View>
  )
}

export default AgencyPublish

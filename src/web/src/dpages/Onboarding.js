// @flow

import React, { useEffect, useRef, useState } from 'react'
import Body from '../components/Body.js'
import LineBreak from '../components/LineBreak.js'
import TextField from '../components/TextField.js'
import { ButtonSquared } from '../components/Button.js'
import Form from '../components/Form.js'
import { css } from 'goober'
import Text from '../components/Text.js'
import sessionStore from '../stores/SessionStore.js'
import UpdateSettings from '../graphql/mutation/UpdateSettingsMutation.js'
import nonMaybe from 'non-maybe'
import Colors from '../Colors.js'
import reportEvent from '../utils/reportEvent.js'
import MarkdownText from '../components/MarkdownText.js'

const styles = {
  page: css`
    justify-content: center;
    align-items: center; !important;
    background-color: ${Colors.panelBg};
  `,
  form: css`
    display: flex;
    flex-direction: column;
    align-items: center;

    input {
      background-color: white;
      border: 1px solid ${Colors.blackSoft};
    }

    .text-field {
      align-self: stretch;
      width: unset;
    }

    .name-field {
      align-self: center;
      width: 420px;
    }

    .form-section {
      max-width: 420px;
    }

    @media (max-width: 600px) {
      padding: 0 20px;
      .name-field {
        width: 100%;
      }
      .form-section {
        max-width: 420px;
      }
    }
  `,
}

const Onboarding: any = () => {
  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    reportEvent('onboarding load', {})
  }, [])

  const [models, setModels] = useState('')
  const [inFlight, setInFlight] = useState(false)

  function handleModelsChange(e: any) {
    setModels(e.target.value)
  }

  let isParseable
  let parsedModels
  try {
    parsedModels = JSON.parse(models)
    isParseable = true
  } catch (err) {
    console.error(err)
    isParseable = false
  }

  const disabled =
    inFlight ||
    !models ||
    !isParseable ||
    !Array.isArray(parsedModels) ||
    !parsedModels?.length
  function submitChanges() {
    if (disabled) {
      return
    }
    setInFlight(true)
    UpdateSettings({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      models,
    }).then(async (res) => {
      reportEvent('onboarding complete', {})
      setInFlight(false)
      sessionStore.connectSocket()
    })
  }

  return (
    <Body className={styles.page}>
      <Form className={styles.form}>
        <LineBreak />
        <Text>{'Please enter the details of your inference servers.'}</Text>
        <LineBreak />
        <MarkdownText>{`Here is an example:
        
\`\`\`
[
  {
    "title": "GPT-3.5",
    "apiBase": "https://api.openai.com",
    "apiKey": "sk-1234567890abcdefg",
    "completionOptions": {
      "model": "gpt-3.5-turbo"
    }
  },
  {
    "title": "LM Studio",
    "apiBase": "http://localhost:1234"
  }
]
\`\`\`
`}</MarkdownText>
        <LineBreak />
        <TextField
          className={'text-field name-field'}
          label={'Models Configuration'}
          value={models}
          onInput={handleModelsChange}
          onEnterPress={submitChanges}
          multiline
          autoFocus
        />
        <LineBreak />
        <ButtonSquared
          type={'submit'}
          onClick={submitChanges}
          disabled={disabled}
        >
          Save Changes
        </ButtonSquared>
      </Form>
    </Body>
  )
}

export default Onboarding

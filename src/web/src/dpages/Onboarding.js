// @flow

import React, { useEffect, useRef, useState } from 'react'
import Body from '../components/Body.js'
import LineBreak from '../components/LineBreak.js'
import TextField from '../components/TextField.js'
import { ButtonSquared } from '../components/Button.js'
import Form from '../components/Form.js'
import { css } from 'goober'
import Text from '../components/Text.js'
import { useQuery } from '@apollo/client'
import GetCurrentUser from '../graphql/GetCurrentUser.js'
import sessionStore from '../stores/SessionStore.js'
import UpdateSettings from '../graphql/mutation/UpdateSettingsMutation.js'
import nonMaybe from 'non-maybe'
import Colors from '../Colors.js'
import ToggleField from '../components/ToggleField.js'
import FormSection from '../components/FormSection.js'
import reportEvent from '../utils/reportEvent.js'

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

  const [username, setUsername] = useState('')
  const [openAiKey, setOpenAiKey] = useState('')
  const [useTrialKey, setUseTrialKey] = useState(true)
  const [inFlight, setInFlight] = useState(false)
  const res = useQuery(GetCurrentUser, {
    variables: {
      sessionToken: sessionStore.sessionToken,
    },
  })
  const userId = res.data?.viewer?.currentUser?.userId

  function handleOpenAiKeyChange(e: any) {
    setOpenAiKey(e.target.value.trim())
  }

  function handleUsernameChange(e: any) {
    setUsername(e.target.value)
  }

  function handleToggleUseTrialKey() {
    setUseTrialKey(!useTrialKey)
    if (!useTrialKey) {
      setOpenAiKey('')
    }
  }

  const disabled = !username || (!openAiKey && !useTrialKey)
  function submitChanges() {
    if (disabled) {
      return
    }
    setInFlight(true)
    UpdateSettings({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      username,
      openAiKey: useTrialKey ? null : openAiKey,
      useTrialKey,
    }).then(async (res) => {
      reportEvent('onboarding complete', {})
      setInFlight(false)
    })
  }

  return (
    <Body className={styles.page}>
      <Form className={styles.form}>
        <LineBreak />
        <Text>
          {'Please give yourself a name and enter your OpenAI API Key.'}
        </Text>
        <LineBreak />
        <TextField
          className={'text-field name-field'}
          label={'Name'}
          value={username}
          onInput={handleUsernameChange}
          onEnterPress={submitChanges}
          autoFocus
        />
        <LineBreak />
        <FormSection className={'form-section'} label={'OpenAI API Key'}>
          <Text>
            {
              'If you do not have your own OpenAI API Key, you can use the trial key. Usage will be limited to a single agency, 3 agents using GPT-3.5, and no permanent API access.'
            }
          </Text>
          <LineBreak />
          <ToggleField
            label={useTrialKey ? 'Using Trial Key' : 'Bringing Your Own Key'}
            value={useTrialKey}
            onChange={handleToggleUseTrialKey}
          />
          <LineBreak />
          <TextField
            className={'text-field'}
            label={'You API Key'}
            value={openAiKey}
            onInput={handleOpenAiKeyChange}
            onEnterPress={submitChanges}
            type={'password'}
            disabled={useTrialKey}
          />
        </FormSection>

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

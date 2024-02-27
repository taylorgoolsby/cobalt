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

  const [apiBase, setApiBase] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [inFlight, setInFlight] = useState(false)

  function handleApiKeyChange(e: any) {
    setApiKey(e.target.value)
  }

  function handleApiBaseChange(e: any) {
    setApiBase(e.target.value)
  }

  const disabled = !apiBase || inFlight
  function submitChanges() {
    if (disabled) {
      return
    }
    setInFlight(true)
    UpdateSettings({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      apiBase,
      apiKey,
    }).then(async (res) => {
      reportEvent('onboarding complete', {})
      setInFlight(false)
    })
  }

  return (
    <Body className={styles.page}>
      <Form className={styles.form}>
        <LineBreak />
        <Text>{'Please enter the details of your inference server.'}</Text>
        <LineBreak />
        <TextField
          className={'text-field name-field'}
          label={'API Base URL'}
          value={apiBase}
          onInput={handleApiBaseChange}
          onEnterPress={submitChanges}
          autoFocus
        />
        <TextField
          className={'text-field name-field'}
          label={'API Key (Optional)'}
          value={apiKey}
          onInput={handleApiKeyChange}
          onEnterPress={submitChanges}
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

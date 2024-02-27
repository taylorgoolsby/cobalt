// @flow

import type { User } from '../types/User.js'
import React, { Component } from 'react'
import Body from '../components/Body.js'
import { css } from 'goober'
import Form from '../components/Form.js'
import TextField, { textFieldClassName } from '../components/TextField.js'
import {
  ButtonSquared,
  buttonStyles,
  CloseButton,
} from '../components/Button.js'
import LineBreak from '../components/LineBreak.js'
import apolloClient from '../apolloClient.js'
import GetCurrentUser from '../graphql/GetCurrentUser.js'
import sessionStore from '../stores/SessionStore.js'
import SpinnerModal from '../modals/SpinnerModal.js'
import UpdateSettings from '../graphql/mutation/UpdateSettingsMutation.js'
import nonMaybe from 'non-maybe'
import classnames from 'classnames'
import Colors from '../Colors.js'
import Link from '../components/Link.js'
import Text from '../components/Text.js'
import WizardModal from '../modals/WizardModal.js'
import AddPhoneWizard from '../wizards/AddPhoneWizard.js'
import PasswordWizard from '../wizards/PasswordWizard.js'
import type { UpdateSettingsInput } from '../graphql/mutation/UpdateSettingsMutation.js'
import AddEmailWizard from '../wizards/AddEmailWizard.js'
import LoginWizard from '../wizards/LoginWizard.js'
import ChangeOpenAiKeyWizard from '../wizards/ChangeOpenAiKeyWizard.js'
import { getHistory } from '../utils/history.js'

const styles = {
  page: css`
    align-items: center;
    justify-content: center;
    background-color: ${Colors.panelBg};
    padding: 20px;
    max-height: 100vh;
    overflow-y: scroll;

    label {
      margin-bottom: 0px;
    }

    .${textFieldClassName} {
      width: auto;
    }

    .close-settings-button {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 2;

      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      min-width: 120px;
      max-width: 282px;
      height: 34px;
      min-height: 34px;
      padding: 0 16px;
      border-radius: 4px;
      background-color: transparent;

      > span {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        min-width: 0;
        /*font-family: 'Sometype Mono', monospace;*/
        /*opacity: 0.3;*/
        font-size: 16px;
      }

      &:hover:not([disabled='']):not([disabled='true']):not(
          [data-small='true']
        ) {
        background-color: rgba(255, 255, 255, 0.22);
        /*background-color: ${Colors.blackSoftest};*/
      }
    }
  `,
  form: css`
    align-self: stretch;
    max-width: 600px;
    width: 100%;
  `,
  button: css`
    width: 240px;
  `,
}

const MFA_METHOD = {
  Email: 'Email',
  Phone: 'Phone',
}

type MfaMethod = $Keys<typeof MFA_METHOD>

type State = {
  username: string,
  openAiKey: string,
  maskedOpenAiKey: string,
  email: string,
  isEmailVerified: boolean,
  phoneCallingCode: ?string,
  phoneNumber: ?string,
  isPhoneVerified: boolean,
  isPhoneValid: boolean,
  isMfaEnabled: boolean,
  mfaMethod: MfaMethod,
  showAddPhoneWizardModal: boolean,
  mfaToken: ?string, // from wizard
  hasPassword: boolean,
  hasOpenAiKey: boolean,
  password: ?string,
  apiBase: ?string,
  apiKey: ?string,
  showChangeOpenAiKeyWizardModal: boolean,
  showPasswordWizardModal: boolean,
  showAddEmailWizardModal: boolean,
  showLoginModal: boolean,
  inFlight: boolean,
}

class Settings extends Component<any, State> {
  serverData: ?User

  constructor(props: any) {
    super(props)

    this.state = {
      username: '',
      openAiKey: '',
      maskedOpenAiKey: '',
      email: '',
      isEmailVerified: false,
      phoneCallingCode: '',
      phoneNumber: '',
      isPhoneVerified: false,
      isPhoneValid: true,
      isMfaEnabled: false,
      mfaMethod: MFA_METHOD.Email,
      showAddPhoneWizardModal: false,
      mfaToken: null,
      hasPassword: false,
      hasOpenAiKey: false,
      password: null,
      apiBase: '',
      apiKey: '',
      showChangeOpenAiKeyWizardModal: false,
      showPasswordWizardModal: false,
      showAddEmailWizardModal: false,
      showLoginModal: false,
      inFlight: false,
    }
  }

  componentWillMount() {
    this.loadData()
  }

  loadData: any = async () => {
    try {
      const res = await apolloClient.query({
        query: GetCurrentUser,
        variables: {
          sessionToken: sessionStore.sessionToken,
        },
      })
      const currentUser = res?.data?.viewer?.currentUser
      if (currentUser) {
        this.loadUser(currentUser)
      }
    } catch (err) {
      console.error(err)
    }
  }

  loadUser: any = (currentUser: User) => {
    this.serverData = currentUser
    this.setState({
      username: currentUser.username ?? '',
      openAiKey: '',
      maskedOpenAiKey: currentUser.maskedOpenAiKey ?? '',
      email: currentUser.email ?? '',
      isEmailVerified: !!currentUser.isEmailVerified,
      phoneNumber: currentUser.phoneNumber ?? '',
      phoneCallingCode: currentUser.phoneCallingCode ?? '',
      isPhoneVerified: !!currentUser.isPhoneVerified,
      mfaMethod:
        currentUser.phoneCallingCode && currentUser.phoneNumber
          ? 'Phone'
          : 'Email',
      isMfaEnabled: currentUser.isMfaEnabled ?? false,
      hasPassword: !!currentUser.hasPassword,
      hasOpenAiKey: !!currentUser.hasOpenAiKey,
      password: null,
      apiBase: currentUser.inferenceServerConfig?.apiBase ?? '',
      apiKey: currentUser.inferenceServerConfig?.apiKey ?? '',
    })
  }

  isChanged: any = (): boolean => {
    if (!this.serverData) return false
    if (
      this.serverData?.username !== this.state.username ||
      this.serverData?.email !== this.state.email ||
      (this.serverData?.phoneCallingCode ?? '') !==
        this.state.phoneCallingCode ||
      (this.serverData?.phoneNumber ?? '') !== this.state.phoneNumber ||
      this.serverData?.isMfaEnabled !== this.state.isMfaEnabled ||
      this.serverData?.hasPassword !== this.state.hasPassword ||
      this.state.password || // This has a value when password wizard exits
      this.state.openAiKey ||
      this.serverData?.inferenceServerConfig?.apiBase !== this.state.apiBase ||
      this.serverData?.inferenceServerConfig?.apiKey !== this.state.apiKey
    ) {
      return true
    }
    return false
  }

  isValid: any = (): boolean => {
    return this.state.isPhoneValid
  }

  isEmailSyncedToOAuth: any = (): boolean => {
    return (
      !!this.serverData?.hasGithubOAuth || !!this.serverData?.hasGoogleOAuth
    )
  }

  handleUsernameChange: any = (event: any) => {
    this.setState({
      username: event.target.value,
    })
  }

  handleOpenAiKeyChange: any = (event: any) => {
    this.setState({
      openAiKey: event.target.value,
    })
  }

  handleEmailChange: any = (event: any) => {
    this.setState({
      email: event.target.value,
    })
  }

  handlePhoneCallingCodeChange: any = (value: any) => {
    this.setState({
      phoneCallingCode: value,
    })
  }

  handlePhoneNumberChange: any = (value: any) => {
    this.setState({
      phoneNumber: value,
    })
  }

  handlePhoneValidityChange: any = (isPhoneValid: boolean) => {
    this.setState({
      isPhoneValid,
    })
  }

  handlePasswordToggle: any = () => {
    if (!this.state.hasPassword) {
      if (!this.serverData?.hasPassword) {
        // adding password
        this.setState({
          showPasswordWizardModal: true,
          hasPassword: true,
        })
      } else {
        // undoing toggle
        this.setState({
          hasPassword: true,
        })
      }
    } else if (this.state.hasPassword) {
      if (this.serverData?.hasPassword) {
        // remove password
        this.setState({
          hasPassword: false,
        })
      } else {
        // undoing toggle
        this.setState({
          hasPassword: false,
        })
      }
    }
  }

  handleMfaToggle: any = (isMfaEnabled: boolean) => {
    if (!this.state.isMfaEnabled) {
      if (!this.serverData?.isMfaEnabled) {
        // adding mfa
        this.setShowAddPhoneWizardModal(true)
        this.setState({
          isMfaEnabled: true,
        })
      } else {
        // undo
        this.setState({
          isMfaEnabled: true,
        })
      }
    } else if (this.state.isMfaEnabled) {
      if (this.serverData?.isMfaEnabled) {
        this.setState({
          isMfaEnabled: false,
        })
      } else {
        this.setState({
          isMfaEnabled: false,
        })
      }
    }
  }

  handleMfaMethodChange: any = (mfaMethod: MfaMethod) => {
    this.setState({
      mfaMethod,
    })
  }

  handleApiBaseChange: any = (e: any) => {
    this.setState({
      apiBase: e.target.value,
    })
  }

  handleApiKeyChange: any = (e: any) => {
    this.setState({
      apiKey: e.target.value,
    })
  }

  setShowAddPhoneWizardModal: any = (value: boolean) => {
    this.setState({
      showAddPhoneWizardModal: value,
      mfaMethod: 'Phone',
      isPhoneVerified: false,
    })
  }

  setShowPasswordWizardModal: any = (value: boolean) => {
    this.setState({
      showPasswordWizardModal: value,
    })
  }

  submitChanges: any = () => {
    this.setState({
      inFlight: true,
    })
    const input: UpdateSettingsInput = {
      sessionToken: nonMaybe(sessionStore.sessionToken),
      username: this.state.username,
      apiBase: this.state.apiBase,
      apiKey: this.state.apiKey,
    }

    const changingOpenAiKey =
      this.serverData?.hasOpenAiKey &&
      this.state.hasOpenAiKey &&
      this.state.openAiKey // This should only have a value when the password wizard completes.
    if (changingOpenAiKey) {
      input.openAiKey = this.state.openAiKey
    }

    const changingEmail = this.serverData?.email !== this.state.email
    if (changingEmail) {
      input.mfaToken = this.state.mfaToken
      input.email = this.state.email
    }

    const addingMfa = !this.serverData?.isMfaEnabled && this.state.isMfaEnabled
    const changingMfa =
      this.serverData?.isMfaEnabled &&
      this.state.isMfaEnabled &&
      (this.serverData?.phoneCallingCode !== this.state.phoneCallingCode ||
        this.serverData?.phoneNumber !== this.state.phoneNumber)
    const removingMfa =
      this.serverData?.isMfaEnabled && !this.state.isMfaEnabled
    if (addingMfa || changingMfa) {
      input.phoneCallingCode = this.state.phoneCallingCode
      input.phoneNumber = this.state.phoneNumber
      input.isMfaEnabled = this.state.isMfaEnabled
      input.mfaToken = this.state.mfaToken
    } else if (removingMfa) {
      input.phoneCallingCode = null
      input.phoneNumber = null
      input.isMfaEnabled = false
    }

    // If password is not included in the input, then server does not change password in database.
    // If password is included, and set to null, then server removes password from database.
    // If password is included, and set to a string, then server commits it to the database.
    const addingPassword =
      !this.serverData?.hasPassword && this.state.hasPassword
    const changingPassword =
      this.serverData?.hasPassword &&
      this.state.hasPassword &&
      this.state.password // This should only have a value when the password wizard completes.
    const removingPassword =
      this.serverData?.hasPassword && !this.state.hasPassword
    if (addingPassword || changingPassword) {
      input.password = this.state.password
    } else if (removingPassword) {
      input.password = null
    }

    UpdateSettings(input).then((res) => {
      if (res?.user) {
        this.loadUser(res.user)
      }
      this.setState({
        inFlight: false,
      })
    })
  }

  mergeAccount: any = () => {
    this.setState({
      showLoginModal: true,
    })
  }

  deleteAccount: any = () => {}

  renderVerificationListItem: any = (
    isVerified: boolean,
    onResend: () => void,
  ) => {
    return (
      <li style={{ color: isVerified ? Colors.green : Colors.yellow }}>
        <Text style={{ marginRight: 16 }}>
          {isVerified ? 'Verified' : 'Unverified'}
        </Text>
        {!isVerified ? (
          <Link onClick={onResend}>{'Resend Verification'}</Link>
        ) : null}
      </li>
    )
  }

  renderChangeOpenAiKeyWizardModal: any = () => {
    const { showChangeOpenAiKeyWizardModal } = this.state

    const handleComplete = (openAiKey: string) => {
      this.setState({
        openAiKey,
        maskedOpenAiKey: openAiKey.slice(0, 3) + '...' + openAiKey.slice(-4),
        showChangeOpenAiKeyWizardModal: false,
      })
    }

    return (
      <WizardModal open={showChangeOpenAiKeyWizardModal}>
        <ChangeOpenAiKeyWizard
          onCancel={() => {
            this.setState({
              showChangeOpenAiKeyWizardModal: false,
            })
          }}
          onComplete={handleComplete}
        />
      </WizardModal>
    )
  }

  renderAddEmailWizardModal: any = () => {
    const { showAddEmailWizardModal } = this.state

    const handleComplete = (mfaToken: string, email: string) => {
      this.setState({
        mfaToken,
        isEmailVerified: true,
        email,
        showAddEmailWizardModal: false,
      })
    }

    return (
      <WizardModal open={showAddEmailWizardModal}>
        <AddEmailWizard
          onCancel={() => {
            this.setState({
              showAddEmailWizardModal: false,
            })
          }}
          onComplete={handleComplete}
        />
      </WizardModal>
    )
  }

  renderPasswordWizardModal: any = () => {
    const { showPasswordWizardModal } = this.state

    const handleComplete = (password: string) => {
      this.setState({
        password,
      })
      this.setShowPasswordWizardModal(false)
    }

    return (
      <WizardModal open={showPasswordWizardModal}>
        <PasswordWizard
          onCancel={() => {
            this.setShowPasswordWizardModal(false)
            if (!this.serverData?.hasPassword) {
              this.handlePasswordToggle()
            }
          }}
          onComplete={handleComplete}
        />
      </WizardModal>
    )
  }

  renderAddPhoneWizardModal: any = () => {
    const { showAddPhoneWizardModal } = this.state

    const handleComplete = (
      mfaToken: string,
      callingCode: string,
      phoneNumber: string,
    ) => {
      this.setState({
        mfaToken,
        mfaMethod: 'Phone',
        isPhoneVerified: true,
        phoneCallingCode: callingCode,
        phoneNumber: phoneNumber,
      })
      this.setShowAddPhoneWizardModal(false)
    }

    return (
      <WizardModal open={showAddPhoneWizardModal}>
        <AddPhoneWizard
          onCancel={() => {
            this.setShowAddPhoneWizardModal(false)
            if (!this.serverData?.isMfaEnabled) {
              this.handleMfaToggle()
            }
          }}
          onComplete={handleComplete}
        />
      </WizardModal>
    )
  }

  renderLoginModal: any = () => {
    const { showLoginModal } = this.state

    return (
      <WizardModal
        style={{
          overflow: 'scroll',
        }}
        open={showLoginModal}
      >
        <LoginWizard
          onCancel={() => {
            this.setState({
              showLoginModal: false,
            })
          }}
          onComplete={() => {
            this.setState({
              showLoginModal: false,
            })
          }}
        />
      </WizardModal>
    )
  }

  render(): any {
    const {
      username,
      apiBase,
      apiKey,
      openAiKey,
      maskedOpenAiKey,
      email,
      isEmailVerified,
      phoneCallingCode,
      phoneNumber,
      isPhoneVerified,
      isPhoneValid,
      isMfaEnabled,
      mfaMethod,
      hasPassword,
      hasOpenAiKey,
      inFlight,
    } = this.state
    const isChanged = this.isChanged()
    const isValid = this.isValid()
    const isEmailSyncedToOAuth = this.isEmailSyncedToOAuth()

    const isMfaMethodVerified = mfaMethod === 'Email' || mfaMethod === 'Phone'

    const history = getHistory()

    return (
      <Body className={styles.page}>
        <Form className={styles.form}>
          {/*<LineBreak />*/}
          {/*<LineBreak />*/}
          {/*<ProfilePictureField src={null} onSourceChange={null} />*/}
          {/*<LineBreak />*/}
          {/*<LineBreak />*/}
          {/*<TextField*/}
          {/*  label={'Username'}*/}
          {/*  value={username}*/}
          {/*  onInput={this.handleUsernameChange}*/}
          {/*/>*/}
          {/*<LineBreak />*/}
          {/*<LineBreak />*/}
          {/*<FormSection label={'OpenAI API Key'}>*/}
          {/*  <TextField value={maskedOpenAiKey} disabled />*/}
          {/*  <LineBreak />*/}
          {/*  <ButtonSquared*/}
          {/*    className={styles.button}*/}
          {/*    onClick={() => {*/}
          {/*      this.setState({*/}
          {/*        showChangeOpenAiKeyWizardModal: true,*/}
          {/*      })*/}
          {/*    }}*/}
          {/*  >*/}
          {/*    Change*/}
          {/*  </ButtonSquared>*/}
          {/*  {this.renderChangeOpenAiKeyWizardModal()}*/}
          {/*</FormSection>*/}
          {/*<LineBreak />*/}
          {/*<LineBreak />*/}
          {/*<FormSection label={'Email'}>*/}
          {/*  <TextField*/}
          {/*    value={email}*/}
          {/*    onInput={this.handleEmailChange}*/}
          {/*    disabled={isEmailSyncedToOAuth}*/}
          {/*  />*/}
          {/*  <LineBreak />*/}
          {/*  <ButtonSquared*/}
          {/*    className={styles.button}*/}
          {/*    onClick={() => {*/}
          {/*      this.setState({*/}
          {/*        showAddEmailWizardModal: true,*/}
          {/*      })*/}
          {/*    }}*/}
          {/*  >*/}
          {/*    Change*/}
          {/*  </ButtonSquared>*/}
          {/*  {this.renderAddEmailWizardModal()}*/}
          {/*</FormSection>*/}
          {/*<ul>*/}
          {/*  {this.renderVerificationListItem(*/}
          {/*    isEmailVerified,*/}
          {/*    this.resendEmailVerification,*/}
          {/*  )}*/}
          {/*</ul>*/}
          {/*<LineBreak />*/}
          {/*<LineBreak />*/}
          {/*<FormSection label={'Sign In With Password'}>*/}
          {/*  <ToggleField*/}
          {/*    label={hasPassword ? 'Activated' : 'Deactivated'}*/}
          {/*    value={hasPassword}*/}
          {/*    onChange={this.handlePasswordToggle}*/}
          {/*  />*/}
          {/*  {this.serverData?.hasPassword && hasPassword ? (*/}
          {/*    <>*/}
          {/*      <LineBreak />*/}
          {/*      <ButtonSquared*/}
          {/*        className={styles.button}*/}
          {/*        onClick={() => this.setShowPasswordWizardModal(true)}*/}
          {/*      >*/}
          {/*        Change*/}
          {/*      </ButtonSquared>*/}
          {/*    </>*/}
          {/*  ) : null}*/}
          {/*  {this.serverData?.hasPassword && !hasPassword ? (*/}
          {/*    <>*/}
          {/*      <LineBreak />*/}
          {/*      <ul>*/}
          {/*        <li>*/}
          {/*          <Text>*/}
          {/*            {`You will no longer be able to sign in using password.`}*/}
          {/*          </Text>*/}
          {/*        </li>*/}
          {/*      </ul>*/}
          {/*    </>*/}
          {/*  ) : null}*/}
          {/*  {this.renderPasswordWizardModal()}*/}
          {/*</FormSection>*/}
          {/*<LineBreak />*/}
          {/*<LineBreak />*/}
          {/*<FormSection label={'2-Step Verification'}>*/}
          {/*  <ToggleField*/}
          {/*    label={isMfaEnabled ? 'Activated' : 'Deactivated'}*/}
          {/*    value={isMfaEnabled}*/}
          {/*    onChange={this.handleMfaToggle}*/}
          {/*  />*/}
          {/*  {isMfaEnabled &&*/}
          {/*  mfaMethod === 'Phone' &&*/}
          {/*  phoneCallingCode &&*/}
          {/*  phoneNumber ? (*/}
          {/*    <>*/}
          {/*      {this.serverData?.isMfaEnabled ? (*/}
          {/*        <>*/}
          {/*          <LineBreak />*/}
          {/*          <ButtonSquared*/}
          {/*            className={styles.button}*/}
          {/*            onClick={() => this.setShowAddPhoneWizardModal(true)}*/}
          {/*          >*/}
          {/*            Change*/}
          {/*          </ButtonSquared>*/}
          {/*        </>*/}
          {/*      ) : null}*/}
          {/*      <LineBreak />*/}
          {/*      <PhoneField*/}
          {/*        label={'Phone'}*/}
          {/*        callingCode={phoneCallingCode}*/}
          {/*        onCallingCodeChange={this.handlePhoneCallingCodeChange}*/}
          {/*        phoneNumber={phoneNumber}*/}
          {/*        onPhoneNumberChange={this.handlePhoneNumberChange}*/}
          {/*        onValidityChange={this.handlePhoneValidityChange}*/}
          {/*        disabled*/}
          {/*      />*/}
          {/*      <LineBreak />*/}
          {/*      <ul>*/}
          {/*        <li>*/}
          {/*          <Text>*/}
          {/*            {`When using password to sign in, a 6-digit code will be sent to your ${mfaMethod.toLowerCase()}.`}*/}
          {/*          </Text>*/}
          {/*        </li>*/}
          {/*      </ul>*/}
          {/*    </>*/}
          {/*  ) : null}*/}
          {/*  {this.serverData?.isMfaEnabled && !isMfaEnabled ? (*/}
          {/*    <>*/}
          {/*      <LineBreak />*/}
          {/*      <ul>*/}
          {/*        <li>*/}
          {/*          <Text>*/}
          {/*            {`When using password to sign in, a 6-digit code will no longer be required.`}*/}
          {/*          </Text>*/}
          {/*        </li>*/}
          {/*      </ul>*/}
          {/*    </>*/}
          {/*  ) : null}*/}
          {/*  {this.renderAddPhoneWizardModal()}*/}
          {/*</FormSection>*/}
          <LineBreak />
          <LineBreak />
          <TextField
            className={'text-field name-field'}
            label={'API Base URL'}
            value={apiBase}
            onInput={this.handleApiBaseChange}
            onEnterPress={this.submitChanges}
            autoFocus
          />
          <TextField
            className={'text-field name-field'}
            label={'API Key (Optional)'}
            value={apiKey}
            onInput={this.handleApiKeyChange}
            onEnterPress={this.submitChanges}
            autoFocus
          />
          <LineBreak />
          <LineBreak />
          <ButtonSquared
            className={classnames(styles.button, buttonStyles.emphasis)}
            onClick={this.submitChanges}
            disabled={!isChanged || !isValid}
          >
            Save Changes
          </ButtonSquared>
          <LineBreak />
        </Form>
        {/*<FormSection label={'Account Actions'}>*/}
        {/*  <ButtonSquared className={styles.button} onClick={this.mergeAccount}>*/}
        {/*    Merge Account*/}
        {/*  </ButtonSquared>*/}
        {/*  <LineBreak />*/}
        {/*  <ButtonSquared*/}
        {/*    className={classnames(buttonStyles.danger, styles.button)}*/}
        {/*    onClick={this.deleteAccount}*/}
        {/*  >*/}
        {/*    Delete Account*/}
        {/*  </ButtonSquared>*/}
        {/*</FormSection>*/}
        <SpinnerModal open={inFlight} />
        {this.renderLoginModal()}
        {/*<Button className={'button close-settings-button'} onClick={() => {*/}
        {/*  history?.push('/app/settings')*/}
        {/*}}>*/}
        {/*  <PiXBold />*/}
        {/*</Button>*/}
        <CloseButton
          onClick={() => {
            history?.push('/app')
          }}
        />
      </Body>
    )
  }
}

export default Settings

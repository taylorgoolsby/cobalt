// @flow

import React, { Component } from 'react'
import Form from './Form.js'
import TextField from './TextField.js'
import { ButtonSquared, buttonStyles } from './Button.js'
import LineBreak from './LineBreak.js'
import Link from './Link.js'
import Text from './Text.js'
import Config from '../Config.js'
import { css } from 'goober'
import validator from 'validator'
import Divider from './Divider.js'
import VerifyPasswordMutation from '../graphql/mutation/VerifyPasswordMutation.js'
import sessionStore from '../stores/SessionStore.js'
import { showErrorModal } from '../modals/ErrorModal.js'
import WizardModal from '../modals/WizardModal.js'
import MfaWizard from '../wizards/MfaWizard.js'
import useHistory from '../utils/useHistory.js'

const styles = {
  form: css`
    display: flex;
    flex-direction: column;
    align-items: center;

    .${buttonStyles.buttonSquared} {
      /*width: 100%;*/
      margin-top: 5px;
    }
  `,
}

type State = {
  email: string,
  password: string,
  inFlight: boolean,
  showMfaModal: boolean,
  mfaUserId: ?string,
  mfaPhoneCallingCode: ?string,
  mfaPhoneNumber: ?string,
  mfaOnComplete: ?(string) => any,
  mfaOnCancel: ?() => any,
}

type Props = {
  history?: any,
  merging?: boolean,
  onMergeComplete?: () => any,
}

class Auth extends Component<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      email: '',
      password: '',
      inFlight: false,
      showMfaModal: false,
      mfaUserId: null,
      mfaPhoneCallingCode: null,
      mfaPhoneNumber: null,
      mfaOnComplete: null,
      mfaOnCancel: null,
    }
  }

  handleEmailChange: any = (e) => {
    this.setState({
      email: e.target.value,
    })
  }

  handlePasswordChange: any = (e) => {
    this.setState({
      password: e.target.value,
    })
  }

  handleSubmitEmailPassword: any = async () => {
    const { merging, onMergeComplete } = this.props
    if (this.state.inFlight) {
      return
    }
    this.setState({
      inFlight: true,
    })
    const res = await VerifyPasswordMutation({
      email: this.state.email,
      password: this.state.password,
    })
    this.setState({
      inFlight: false,
    })
    if (res?.success) {
      const finalizeTokenExchange = async (
        passwordToken?: ?string,
        mfaToken?: ?string,
      ) => {
        const sessionTokenObtained = await sessionStore.exchangeSessionToken(
          {
            passwordToken,
            mfaToken,
          },
          merging,
        )
        if (sessionTokenObtained) {
          if (merging && onMergeComplete) {
            onMergeComplete()
          } else {
            this.props.history?.push('/app')
          }
        }
      }

      if (!res.isMfaNeeded) {
        await finalizeTokenExchange(res?.passwordToken)
      } else {
        const onComplete = async (mfaToken: string) => {
          const res = await VerifyPasswordMutation({
            email: this.state.email,
            password: this.state.password,
          })
          await finalizeTokenExchange(res?.passwordToken, mfaToken)
          this.setState({
            showMfaModal: false,
          })
        }
        const onCancel = () => {
          this.setState({
            showMfaModal: false,
          })
        }
        this.openMfaWizard(
          res.userId,
          res.mfaPhoneCallingCode,
          res.mfaPhoneNumber,
          onComplete,
          onCancel,
        )
      }
    } else {
      showErrorModal('The combination of email and password was incorrect.')
    }
  }

  handleGoogleSignIn: any = () => {
    if (this.props.merging) {
      // The auth form is being used for account merging.
      window.location.href = `${Config.backendHost}/oauth/google/start?final_path=/app/settings?merging=true`
    } else {
      // The auth form is being used sign in.
      window.location.href = `${Config.backendHost}/oauth/google/start?final_path=/app`
    }
  }

  handleGithubSignIn: any = () => {
    if (this.props.merging) {
      // The auth form is being used for account merging.
      window.location.href = `${Config.backendHost}/oauth/github/start?final_path=/app/settings?merging=true`
    } else {
      // The auth form is being used sign in.
      window.location.href = `${Config.backendHost}/oauth/github/start?final_path=/app`
    }
  }

  openMfaWizard: any = (
    userId: string,
    phoneCallingCode: string,
    phoneNumber: string,
    onComplete: (mfaToken: string) => any,
    onCancel: () => any,
  ) => {
    this.setState({
      mfaUserId: userId,
      mfaPhoneCallingCode: phoneCallingCode,
      mfaPhoneNumber: phoneNumber,
      showMfaModal: true,
      mfaOnComplete: onComplete,
      mfaOnCancel: onCancel,
    })
  }

  renderMfaModal: any = () => {
    const {
      showMfaModal,
      mfaPhoneCallingCode,
      mfaUserId,
      mfaPhoneNumber,
      mfaOnComplete,
      mfaOnCancel,
      email,
      password,
    } = this.state

    if (
      mfaUserId &&
      mfaPhoneCallingCode &&
      mfaPhoneNumber &&
      mfaOnComplete &&
      mfaOnCancel
    ) {
      return (
        <WizardModal open={showMfaModal}>
          <MfaWizard
            phoneCallingCode={mfaPhoneCallingCode}
            phoneNumber={mfaPhoneNumber}
            onCancel={mfaOnCancel}
            onComplete={mfaOnComplete}
            loginUserId={mfaUserId}
            loginEmail={email}
            loginPassword={password}
          />
        </WizardModal>
      )
    }
  }

  render(): any {
    const { merging } = this.props
    const { email, password, inFlight } = this.state

    const canSubmit = validator.isEmail(email) && !!password
    const isDisabled = inFlight || !canSubmit

    return (
      <Form className={styles.form}>
        <LineBreak />
        <Text>{merging ? 'Account Merging' : 'Sign In'}</Text>
        <LineBreak />
        <TextField
          label={'Email'}
          value={email}
          onInput={this.handleEmailChange}
          disabled={inFlight}
        />
        <LineBreak />
        <TextField
          label={'Password'}
          value={password}
          onInput={this.handlePasswordChange}
          onEnterPress={this.handleSubmitEmailPassword}
          type={'password'}
          disabled={inFlight}
        />
        <LineBreak />
        <LineBreak />
        <ButtonSquared
          onClick={this.handleSubmitEmailPassword}
          disabled={isDisabled}
        >
          {'Submit'}
        </ButtonSquared>
        {!merging ? (
          <>
            <Text style={{ margin: '10px 0' }}>{'or'}</Text>
            <Link
              onClick={() => {
                this.props.history?.push('/create')
              }}
            >
              {'Create Account'}
            </Link>
          </>
        ) : null}
        <LineBreak />
        <Divider />
        <LineBreak />
        <LineBreak />
        <ButtonSquared onClick={this.handleGoogleSignIn} disabled={inFlight}>
          {'Google'}
        </ButtonSquared>
        <LineBreak />
        <ButtonSquared onClick={this.handleGithubSignIn} disabled={inFlight}>
          {'Github'}
        </ButtonSquared>
        {this.renderMfaModal()}
      </Form>
    )
  }
}

export default (props: Props): any => {
  const [history] = useHistory()
  return <Auth history={history} {...props} />
}

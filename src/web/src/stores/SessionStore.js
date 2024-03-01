// @flow

import type { GetSessionTokenInput } from '../apis/internal/getSessionToken.js'
import decodeJwt from 'jwt-decode'
import * as qss from 'qss'
import { makeObservable, observable, toJS } from 'mobx'
import { getHistory, makeHistory } from '../utils/history.js'
import { showErrorModal } from '../modals/ErrorModal.js'
import getSessionToken from '../apis/internal/getSessionToken.js'
import MergeAccountsMutation from '../graphql/mutation/MergeAccountsMutation.js'
import { showToastModal } from '../modals/ToastModal.js'
import nonMaybe from 'non-maybe'
import { establishSocket } from '../websocket/socketHandler.js'
import { disconnect } from '../websocket/socketHandler.js'

/*
The SessionStore handles loading the session from localStorage or sessionStorage
and other things like writing to the storage, handling session timeouts, etc.
* */

type Session = {
  userId: string,
}

type CookieSettings = {|
  confirmed?: boolean,
  performance?: boolean,
  functional?: boolean,
  targeting?: boolean,
|}

let browserStore

async function loadBrowserStore() {
  browserStore = (await import('../utils/browserStore.js')).default
}

class SessionStore {
  sessionToken: ?string = null
  session: ?Session = null
  @observable observables: {
    loading: boolean,
    loaded: boolean,
    isLoggedIn: boolean,
    sessionToken?: ?string,
  } = {
    loading: false,
    loaded: false,
    isLoggedIn: false,
  }
  @observable appLoaded: boolean = false
  @observable cookieSettings: ?CookieSettings = null

  constructor() {
    makeObservable(this)
  }

  async load() {
    let history = getHistory()
    if (!history) {
      history = makeHistory()
    }
    await loadBrowserStore()
    sessionStore.loadSessionTokenFromBrowser()
    sessionStore.checkForTokenOnPageLoad()

    if (this.observables.isLoggedIn) {
      if (history?.location?.pathname === '/') {
        history.replace('/app')
      }
    }

    setInterval(() => {
      sessionStore.attemptTimeout()
    }, 1000)

    this.cookieSettings = this.getCookieSettings()

    this.appLoaded = true
  }

  checkForTokenOnPageLoad() {
    const history = getHistory()

    // Final part of some auth flows is to land at a client URL with a token in the URL.
    const search = window.location.search
    if (search) {
      const isMerging = qss.decode(search.slice(1))['merging']
      history?.clearSearch()
      if (isMerging) {
        history?.replace(`${window.location.pathname}?merging=true`)
      }

      const {
        emailToken, // incoming from email link
        // mfaToken, // no page navigation involved in this flow
        // passwordToken, // no page navigation involved in this flow
        oauthToken, // incoming oauth handshake
        ssoToken, // incoming sso handshake
        // refreshToken, // no page navigation involved in this flow
        newUserToken, // incoming from email link
        // operatorToken // no page navigation involved in this flow
      } = qss.decode(search.slice(1))
      this.exchangeSessionToken(
        {
          emailToken,
          // mfaToken,
          // passwordToken,
          oauthToken,
          ssoToken,
          // refreshToken,
          newUserToken,
          // operatorToken
        },
        isMerging,
      )
      // todo: CSRF prevention:
      //  Sometimes, more authentication is required, in which case, getSessionToken will fail asking for more.
      //  After more authentication is obtained, an additional token is obtained.
      //  Sometimes the original token contains additional information, so
      //  both the original token, which failed, and the additional token should be passed into getSessionToken.
      //  This allows getSessionToken to process the original token as it would have normally as if it didn't fail.
      //  For example, when getSessionToken receives a newUserToken, it finalizes account creation.
    }
  }

  loadSessionTokenFromBrowser() {
    try {
      const sessionToken = browserStore.get('sessionToken')
      if (sessionToken) {
        this.storeSessionToken(sessionToken)
        this.attemptTimeout()
        if (this.sessionToken) {
          // If still logged in, the token stored in the browser is old, so attempt a refresh.
          this.refreshSessionToken()
        }
        console.warn('loaded sessionToken from browser')
      }
    } catch (err) {
      console.error(err)
    } finally {
      this.observables.loading = false
      this.observables.loaded = true
    }
  }

  refreshSessionToken() {
    Promise.resolve().then(async () => {
      try {
        if (!this.sessionToken) return
        await this.exchangeSessionToken({ refreshToken: this.sessionToken })
      } catch (err) {
        console.error(err)
      }
    })
  }

  async exchangeSessionToken(
    input: GetSessionTokenInput,
    merging?: boolean,
  ): Promise<boolean> {
    const history = getHistory()
    this.observables.loading = true
    let sessionToken
    try {
      sessionToken = await getSessionToken(input)
      console.log('exchanged sessionToken', sessionToken)
      if (sessionToken) {
        const previousSessionToken = browserStore.get('sessionToken')
        if (merging && previousSessionToken) {
          const res = await MergeAccountsMutation({
            currentSessionToken: sessionToken,
            previousSessionToken,
          })
          history?.clearSearch()
          if (res?.success && res?.finalSessionToken) {
            showToastModal({
              open: true,
              message: 'Accounts Merged',
            })
            this.storeSessionToken(nonMaybe(res.finalSessionToken))
            sessionToken = res.finalSessionToken
          } else if (res?.errorAlreadyMerged) {
            showErrorModal('These accounts have already been merged.')
            sessionToken = previousSessionToken
          }
        } else {
          this.storeSessionToken(sessionToken)
        }
      }
    } catch (err) {
      console.error(err)
      showErrorModal(err.message)
      this.logout()
    } finally {
      this.observables.loading = false
      this.observables.loaded = true
    }
    if (sessionToken) {
      return true
    } else {
      return false
    }
  }

  storeSessionToken(sessionToken: string) {
    try {
      const decoded = decodeJwt(sessionToken)
      this.sessionToken = sessionToken
      this.session = decoded
      this.observables.isLoggedIn = !!sessionToken // causes reactions
      this.observables.sessionToken = sessionToken
      browserStore.set('sessionToken', sessionToken)
      console.warn('new sessionToken set', decoded)
      if (sessionToken) {
        console.log('websocket sessionToken', sessionToken)
        disconnect()
        establishSocket(sessionToken)
      }
    } catch (err) {
      console.error(err)
    }
  }

  logout() {
    const history = getHistory()
    console.warn('logging out')
    history?.push('/')
    this.sessionToken = null
    this.session = null
    this.observables.isLoggedIn = false // causes reactions
    browserStore.clearAll()
    disconnect()
  }

  attemptTimeout() {
    try {
      if (!this.sessionToken) return
      const decoded = decodeJwt(this.sessionToken)
      if (!decoded) {
        return
      }
      const exp = decoded.exp * 1000
      const minutesLeft = (exp - Date.now()) / 1000 / 60
      // console.log("minutesLeft", minutesLeft)
      if (minutesLeft < 0) {
        this.logout()
      }
    } catch (err) {
      console.error(err)
    }
  }

  setCookieSettings(cookieSettings: CookieSettings) {
    try {
      localStorage?.setItem?.('cookieSettings', JSON.stringify(cookieSettings))
      this.cookieSettings = cookieSettings
    } catch (err) {
      console.error(err)
    }
  }

  getCookieSettings(): ?CookieSettings {
    try {
      const raw = localStorage?.getItem?.('cookieSettings')
      if (raw) {
        const cookieSettings = JSON.parse(raw)
        this.cookieSettings = cookieSettings
        return cookieSettings
      }
    } catch (err) {
      console.error(err)
    }
  }
}

const sessionStore: SessionStore = new SessionStore()

// requestAnimationFrame(() => {
//   sessionStore.loadSessionTokenFromBrowser()
//   sessionStore.checkForTokenOnPageLoad()
// })

export default sessionStore

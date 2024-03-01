// @flow

import React, { useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import MarkdownText from '../components/MarkdownText.js'
import Body from '../components/Body.js'
import { css } from 'goober'
import Config from '../Config.js'
import View from '../components/View.js'
import { ButtonSquared } from '../components/Button.js'
import Colors from '../Colors.js'
import Text from '../components/Text.js'
import Auth from '../components/Auth.js'
import EmailPassword from '../components/EmailPassword.js'
import Footer from '../components/Footer.js'
import Logo from '../components/Logo.js'
import Link from '../components/Link.js'
import useHistory from '../utils/useHistory.js'
import reportEvent from '../utils/reportEvent.js'
import OfflineCreateOrStartUser from '../graphql/mutation/OfflineCreateOrStartUserMutation.js'
import sessionStore from '../stores/SessionStore.js'
import CreateAgencyMutation from '../graphql/mutation/CreateAgencyMutation.js'
import nonMaybe from 'non-maybe'

const styles = {
  page: css`
    > *:first-child {
      flex: 1;
    }

    .side-panel {
      align-self: stretch;
      background-color: ${Colors.panelBg};
      min-width: 500px;
      justify-content: center;
      align-items: center;
    }

    strong {
      font-weight: 400;
    }

    .link-home {
      position: fixed;
      top: 9px;
      left: 14px;
      padding: 0;
      background-color: transparent;
    }

    @media (max-width: 600px) {
      padding-top: 69px;

      > *:first-child {
        flex: unset;
      }

      .side-panel {
        min-width: unset;
        padding-bottom: 78px;
        flex: 1;
      }

      .link-home {
        position: absolute;
      }
    }
  `,
  landing: css`
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;

    > div {
      max-width: 630px;
    }
  `,
}

const motd = `
Welcome!

**${Config.siteName}** is a privacy-first digital assistant.

It can help you with a wide range of tasks, such as:

* Journaling.
* Knowledge base management.
* Brainstorming.
* Task management and scheduling.
* Internet search.
* Social media management.

`.trim()

const Landing: any = observer(() => {
  // nextPathname is the pathname when the page is loaded.
  // It does not change on navigation by history.push.

  const [history, pathname] = useHistory()

  const mounted = useRef(false)
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    reportEvent('landing page load', {})
  }, [])

  let sidePanelBody = null
  if (pathname === '/auth') {
    sidePanelBody = (
      <View className={'side-panel'}>
        <Auth />
        <Footer />
      </View>
    )
  } else if (pathname === '/create') {
    sidePanelBody = (
      <View className={'side-panel'}>
        <EmailPassword />
        <Footer />
      </View>
    )
  } else {
    sidePanelBody = (
      <View className={'side-panel'}>
        <Text h1>{'Get Started'}</Text>
        <ButtonSquared
          onClick={async () => {
            reportEvent('get started click', {})

            const res = await OfflineCreateOrStartUser({})
            if (res?.success) {
              const sessionTokenObtained =
                await sessionStore.exchangeSessionToken({
                  passwordToken: res.passwordToken,
                })
              if (sessionTokenObtained) {
                if (res?.userCreated) {
                  await CreateAgencyMutation({
                    sessionToken: nonMaybe(sessionStore.sessionToken),
                    name: 'Default Agency',
                  })
                }

                history?.push('/app')
              }
            }
          }}
        >
          {'Start'}
        </ButtonSquared>
        <Footer />
      </View>
    )
  }

  return (
    <Body className={styles.page}>
      <View className={styles.landing}>
        <MarkdownText>{motd}</MarkdownText>
      </View>
      {sidePanelBody}
      <Link className={'link-home'} href={'/'}>
        <Logo />
      </Link>
    </Body>
  )
})

export default Landing

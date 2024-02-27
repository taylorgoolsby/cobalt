// @flow

import React, { useState } from 'react'
import { css } from 'goober'
import Colors from '../Colors.js'
import View from '../components/View.js'
import Text from '../components/Text.js'
import { ButtonSquared } from '../components/Button.js'
import CookieModal from '../modals/CookieModal.js'
import Link from '../components/Link.js'
import sessionStore from '../stores/SessionStore.js'
import { observer } from 'mobx-react-lite'

const styles = {
  container: css`
    position: fixed;
    bottom: 10px;
    left: 10px;
    background-color: ${Colors.blue};
    max-width: 300px;
    width: 100%;
    border-radius: 4px;
    /*color: rgba(255, 255, 255, 0.8);*/
    color: rgba(0, 0, 0, 0.8);
    padding: 10px 16px 4px 16px;
    font-size: 14px;

    .title {
      font-size: 20px;
      margin-bottom: 10px;
    }

    .description {
      margin-bottom: 20px;
    }

    a {
      background-color: transparent;
      color: white;
      margin: 0;
      padding: 0;
    }

    button {
      white-space: nowrap;
      font-size: 14px;
      width: unset;
      align-self: stretch;
      margin-bottom: 10px;
      background-color: ${Colors.blueDarkSoft};
      /*color: rgba(255, 255, 255, 0.8);*/
      color: rgba(0, 0, 0, 0.8);

      &:hover:not([disabled='']):not([disabled='true']):not(
          [data-small='true']
        ) {
        border: 1px solid rgba(0, 0, 0, 0.5);
      }
    }
  `,
}

const CookieBanner: any = observer((): any => {
  // This banner appears when the user does not have any cookie settings set in localStorage.
  // It tells them if they click Allow All Cookies,
  // then they are agreeing to allow us to store cookies on their device in accordance with our cookie policy.

  const [showModal, setShowModal] = useState(false)

  function openModal() {
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  function handleAllowAllCookies() {
    sessionStore.setCookieSettings({
      confirmed: true,
      performance: true,
      functional: true,
      targeting: true,
    })
  }

  function handleEssentialCookiesOnly() {
    sessionStore.setCookieSettings({
      confirmed: true,
      performance: false,
      functional: false,
      targeting: false,
    })
  }

  if (sessionStore.cookieSettings?.confirmed) {
    return null
  }

  return (
    <View className={styles.container}>
      <Text className="title">{'Your Privacy'}</Text>
      <Text className="description">
        By clicking "Allow all cookies", you agree chatbro.online can store
        cookies on your device and disclose information in accordance with our{' '}
        <Link href={'/cookie'}>Cookie Policy</Link>.
      </Text>
      <View style={{ flex: 1 }} />
      <ButtonSquared onClick={handleAllowAllCookies}>
        {'Allow All Cookies'}
      </ButtonSquared>
      <ButtonSquared onClick={handleEssentialCookiesOnly}>
        {'Essential Cookies Only'}
      </ButtonSquared>
      <ButtonSquared onClick={openModal}>{'Customize Settings'}</ButtonSquared>
      <CookieModal open={showModal} onClose={closeModal} />
    </View>
  )
})

export default CookieBanner

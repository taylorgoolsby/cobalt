// @flow

import type { AbstractComponent } from 'react'
import React, { useState } from 'react'
import { css } from 'goober'
import classnames from 'classnames'
import Dialog from '../components/Dialog.js'
import View from '../components/View.js'
import Text from '../components/Text.js'
import { PiCaretDownBold, PiCaretUpBold } from 'react-icons/pi'
import ToggleInput from '../components/ToggleInput.js'
import Button, { ButtonSquared } from '../components/Button.js'
import Colors from '../Colors.js'
import sessionStore from '../stores/SessionStore.js'
import { observer } from 'mobx-react-lite'

const styles = {
  container: css``,
  contents: css`
    max-width: 500px;
    padding: 10px 0 0 0;
    overflow-y: scroll;

    .preface {
      padding: 0 16px;
      margin-bottom: 10px;
    }

    > *:not(:last-child):not(.preface) {
      border-bottom: 1px solid ${Colors.blackSoftest};
    }

    .action-row {
      flex-direction: row;
      margin: 15px 5px 5px 5px;
      align-self: stretch;
    }

    .cta-button {
      white-space: nowrap;
      font-size: 14px;
      width: unset;
      align-self: stretch;
      background-color: ${Colors.blueDarkSoft};
      color: rgba(0, 0, 0, 0.8);
      margin: 5px;
      border: 1px solid rgba(0, 0, 0, 0);

      &:hover:not([disabled='']):not([disabled='true']):not(
          [data-small='true']
        ) {
        border: 1px solid rgba(0, 0, 0, 0.3);
      }
    }

    .cancel-button {
      background-color: transparent;
    }

    @media (max-width: 420px) {
      font-size: 14px;

      .action-row {
        flex-direction: column;
      }

      .cta-button {
        align-self: stretch;
      }
    }
  `,
  section: css`
    max-height: 1000px;
    overflow: hidden;
    align-self: stretch;
    transition: max-height 150ms cubic-bezier(0.4, 0, 0.2, 1);
    padding: 0 11px 10px 0px;

    .always-visible {
      display: flex;
      flex-direction: row;
      align-items: center;
      align-self: stretch;
      justify-content: space-between;
      height: 52px;

      .wrap {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;

        .expand-button {
          display: flex;
          width: 52px;
          height: 52px;
          justify-content: center;
          align-items: center;
        }
      }
    }

    .description {
      margin-left: 20px;
    }

    &[data-expanded='false'] {
      max-height: 52px;
    }
  `,
}

type ExpandingSectionProps = {
  title: string,
  description: string,
  expanded: boolean,
  onToggleExpasion: () => any,
  enabled: boolean,
  onToggleEnabled: () => any,
  disabled?: boolean,
}

const ExpandingSection = (props: ExpandingSectionProps) => {
  const {
    title,
    description,
    expanded,
    onToggleExpasion,
    enabled,
    onToggleEnabled,
    disabled,
  } = props

  return (
    <View className={styles.section} data-expanded={expanded}>
      <View className="always-visible">
        <View className="wrap">
          <Button className="expand-button" onClick={onToggleExpasion}>
            {expanded ? <PiCaretUpBold /> : <PiCaretDownBold />}
          </Button>
          <Text>{title}</Text>
        </View>
        <ToggleInput
          value={enabled}
          onChange={onToggleEnabled}
          disabled={disabled}
        />
      </View>
      <View className="description">
        <Text>{description.trim()}</Text>
      </View>
    </View>
  )
}

type CookieModalContentsProps = {
  onCancel: () => any,
}

const CookieModalContents = observer((props: CookieModalContentsProps): any => {
  // This cookie modal, when opened, should render the Cookie Settings for the page.
  // These cookie settings should start with a paragraph clearly explaining the types of cookies used and the purpose of cookies.
  // It then gives the user options to enable to disable cookies based on type.
  // These are the types of cookies: Strictly Necessary, Performance, Functional, Targeting
  // Cookie settings are stored in localStorage

  const { onCancel } = props

  const [expandStrict, setExpandStrict] = useState(false)
  const [expandPerformance, setExpandPerformance] = useState(false)
  const [expandFunctional, setExpandFunctional] = useState(false)
  const [expandTargeting, setExpandTargeting] = useState(false)

  const enableStrict = true
  const enablePerformance = !!sessionStore.cookieSettings?.performance
  const enableFunctional = !!sessionStore.cookieSettings?.functional
  const enableTargeting = !!sessionStore.cookieSettings?.targeting

  function togglePerformance() {
    const nextValue = !enablePerformance
    sessionStore.setCookieSettings({
      ...sessionStore.cookieSettings,
      performance: nextValue,
    })
  }

  function toggleFunctional() {
    const nextValue = !enableFunctional
    sessionStore.setCookieSettings({
      ...sessionStore.cookieSettings,
      functional: nextValue,
    })
  }

  function toggleTargeting() {
    const nextValue = !enableTargeting
    sessionStore.setCookieSettings({
      ...sessionStore.cookieSettings,
      targeting: nextValue,
    })
  }

  function handleConfirm() {
    sessionStore.setCookieSettings({
      ...sessionStore.cookieSettings,
      confirmed: true,
    })
  }

  function handleAllowAll() {
    sessionStore.setCookieSettings({
      confirmed: true,
      performance: true,
      functional: true,
      targeting: true,
    })
  }

  return (
    <View className={styles.contents}>
      <Text className="preface">
        When you visit cobalt.online, we may use cookies and similar
        technologies to collect information about your browsing experience and
        preferences. This helps us provide you with a more personalized service
        and improve our website. Here, you can customize your cookie
        preferences.
      </Text>
      <ExpandingSection
        title={'Strictly Necessary Cookies'}
        description={`These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms. You can set your browser to block or alert you about these cookies, but some parts of the site will not then work. These cookies do not store any personally identifiable information.`}
        expanded={expandStrict}
        onToggleExpasion={() => {
          setExpandStrict(!expandStrict)
        }}
        enabled={enableStrict}
        onToggleEnabled={() => {}}
        disabled
      />
      <ExpandingSection
        title={'Performance Cookies'}
        description={`These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous. If you do not allow these cookies we will not know when you have visited our site, and will not be able to monitor its performance.`}
        expanded={expandPerformance}
        onToggleExpasion={() => {
          setExpandPerformance(!expandPerformance)
        }}
        enabled={enablePerformance}
        onToggleEnabled={togglePerformance}
      />
      <ExpandingSection
        title={'Functional Cookies'}
        description={`These cookies enable the website to provide enhanced functionality and personalisation. They may be set by us or by third party providers whose services we have added to our pages. If you do not allow these cookies then some or all of these services may not function properly.`}
        expanded={expandFunctional}
        onToggleExpasion={() => {
          setExpandFunctional(!expandFunctional)
        }}
        enabled={enableFunctional}
        onToggleEnabled={toggleFunctional}
      />
      <ExpandingSection
        title={'Targeting Cookies'}
        description={`These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant adverts on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device. If you do not allow these cookies, you will experience less targeted advertising.`}
        expanded={expandTargeting}
        onToggleExpasion={() => {
          setExpandTargeting(!expandTargeting)
        }}
        enabled={enableTargeting}
        onToggleEnabled={toggleTargeting}
      />
      <View className="action-row">
        <ButtonSquared className="cta-button" onClick={handleConfirm}>
          Confirm Choices
        </ButtonSquared>
        <ButtonSquared className="cta-button" onClick={handleAllowAll}>
          Allow All
        </ButtonSquared>
        <ButtonSquared className="cta-button cancel-button" onClick={onCancel}>
          Cancel
        </ButtonSquared>
      </View>
    </View>
  )
})

type CookieModalProps = {|
  className?: ?string,
  style?: any,
  open: boolean,
  onClose: () => any,
|}

const CookieModal: AbstractComponent<CookieModalProps> = (
  props: CookieModalProps,
) => {
  const { className, style, open, onClose } = props

  return (
    <Dialog
      className={classnames(styles.container, className)}
      open={open}
      style={style}
      onClose={onClose}
      title={'Cookie Settings'}
      useStandardHeader
      showCloseButton
    >
      <CookieModalContents onCancel={onClose} />
    </Dialog>
  )
}

export default CookieModal

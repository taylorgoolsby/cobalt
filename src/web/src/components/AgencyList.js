// @flow

import React, { useEffect, useRef, useState } from 'react'
import { useQuery } from '@apollo/client'
import GetAgencies from '../graphql/GetAgencies.js'
import sessionStore from '../stores/SessionStore.js'
import CreateAgencyMutation from '../graphql/mutation/CreateAgencyMutation.js'
import nonMaybe from 'non-maybe'
import View from './View.js'
import { Button, ButtonSquared, buttonTransition } from './Button.js'
import Link from './Link.js'
import WizardModal from '../modals/WizardModal.js'
import AddAgencyWizard from '../wizards/AddAgencyWizard.js'
import { css } from 'goober'
import Text from './Text.js'
import DeleteAgencyMutation from '../graphql/mutation/DeleteAgencyMutation.js'
import { showConfirmationModal } from '../modals/ConfirmationModal.js'
import {
  PiCaretUpBold,
  PiCaretDownBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiDotsThreeBold,
} from 'react-icons/pi'
import type { Agency } from '../types/Agency.js'
import Colors from '../Colors.js'
import classnames from 'classnames'
import { useLocation, useParams } from 'react-router-dom'
import Logo from './Logo.js'
import mainStore from '../stores/MainStore.js'
import { observer } from 'mobx-react-lite'
import useHistory from '../utils/useHistory.js'

const styles = {
  agencyList: css`
    flex-direction: column;
    height: 100dvh;
    width: 300px;
    max-width: 300px;
    transition: width 150ms cubic-bezier(0.4, 0, 0.2, 1),
      height 150ms cubic-bezier(0.4, 0, 0.2, 1);

    &.hide {
      width: 0;
      padding-right: 0;
      padding-left: 0;
    }

    .toggle-side-panel-button {
      position: absolute;
      top: 50%;
      left: 100%;
      width: 35px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
    }

    > .scroller {
      flex-direction: column;
      align-self: stretch;
      flex: 1;
      width: 300px;
      max-width: 300px;
      padding-top: 0;
      padding-left: 10px;
      padding-right: 10px;
      padding-bottom: 0;
      max-height: calc(100dvh - 52px - 56px);
      overflow-y: scroll;
      background-color: white;

      @media (max-width: 600px) {
        width: unset;
        max-width: unset;
        /*border-bottom: 1px solid ${Colors.blackSoft};*/
      }

      > * {
        align-self: stretch;
        margin-bottom: 10px;

        &:first-child {
          margin-top: 10px;
        }
      }
    }

    @media (max-width: 600px) {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      width: unset;
      max-width: unset;
      z-index: 3;
      overflow-y: hidden;

      &.hide {
        width: unset;
        height: 52px;
        padding-top: 0;
        padding-bottom: 0;
      }

      .toggle-side-panel-button {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
      }
    }
  `,
  addButton: css`
    align-self: stretch;
    background-color: #b6d2ff;
    height: 56px;
    box-sizing: border-box;
    border-right: 1px solid white;
    width: 300px;
    max-width: 300px;

    @media (max-width: 600px) {
      width: unset;
      max-width: unset;
      border-right: none;
    }

    > * {
      align-self: stretch;
      flex: 1;
      flex-direction: row;
      justify-content: flex-end;
      padding: 8px;
    }

    button {
      background-color: #83a9e6;
      color: white;
      border: none;

      &:hover {
        border: 1px solid rgba(0, 0, 0, 0.2) !important;
      }
    }
  `,
  fixedMenu: css`
    z-index: 10;
    position: fixed;
    align-items: center;
    font-size: 12px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid ${Colors.blackSoftest};

    @media (max-width: 600px) {
      right: 10px;
    }

    .menu-row {
      display: flex;
      flex-direction: row;
      align-self: stretch;
      align-items: center;
      justify-content: space-between;
      padding-left: 7px;
      padding-right: 7px;
      height: 26px;
    }

    .menu-row:not(:first-child) {
      border-top: 1px solid ${Colors.blackSoftest};
    }

    .menu-row:hover {
      background-color: ${Colors.black05};
    }

    /*> *:not(:last-child) {
      margin-bottom: 8px;
    }*/

    &[data-show='false'] {
      display: none;
    }
  `,
  header: css`
    align-self: stretch;
    height: 52px;
    background-color: white;
    align-items: center;
    flex-direction: row;
    padding-left: 14px;
    padding-right: 9px;
    justify-content: space-between;
    width: 300px;
    max-width: 300px;

    @media (max-width: 600px) {
      width: unset;
      max-width: unset;
    }

    .menu-button {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
      padding: 6px;
    }
  `,
  item: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background-color: ${Colors.closedCardBg};
    border-radius: 4px;
    padding: 0 16px;
    padding-right: 0;

    &:hover,
    &[data-selected='true'] {
      background-color: rgba(142, 174, 238, 0.4);
      cursor: pointer;
    }

    &:last-child {
      border-bottom: none;
    }

    .agency-name {
    }

    .right-wrap {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .quick-link {
      font-size: 12px;
      margin-right: 6px;
    }

    .menu-button {
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 22px;
      padding: 6px;
    }
  `,
}

type AgencyItemProps = {
  isMobile: boolean,
  agency: Agency,
  onShowMenu: (
    menuLeft: number,
    menuTop: number,
    menuOptions: Array<MenuOption>,
  ) => void,
  postDelete: (deletedAgencyId: number) => void,
  onSelect: () => any,
}

const AgencyItem = (props: AgencyItemProps): any => {
  const { isMobile, agency, onShowMenu, postDelete, onSelect } = props

  const [history] = useHistory()

  const { lookupId } = useParams()

  const ref = useRef(null)
  function setRef(el: any) {
    if (!el) {
      return
    }
    ref.current = el
  }

  function handleShowMenu() {
    if (!ref.current) {
      return
    }
    const bb = ref.current.getBoundingClientRect()
    onShowMenu(bb.left + bb.width - 34, bb.top, [
      {
        label: 'Instruct',
        onClick: (closeMenu) => {
          closeMenu(true)
          history?.push(`/app/agency/${agency.lookupId || ''}/instruct`)
        },
      },
      {
        label: 'Interact',
        onClick: (closeMenu) => {
          closeMenu(true)
          history?.push(`/app/agency/${agency.lookupId || ''}/interact`)
        },
      },
      {
        label: 'Publish',
        onClick: (closeMenu) => {
          closeMenu(true)
          history?.push(`/app/agency/${agency.lookupId || ''}/publish`)
        },
      },
      {
        label: 'Delete',
        onClick: async (closeMenu) => {
          await handleDeleteAgency(agency.agencyId || 0, closeMenu)
        },
      },
    ])
  }

  async function handleDeleteAgency(
    agencyId: number,
    closeMenu: (shouldClose: boolean) => void,
  ) {
    const confirmation = await showConfirmationModal()

    closeMenu(false)

    if (confirmation) {
      const res = await DeleteAgencyMutation({
        sessionToken: nonMaybe(sessionStore.sessionToken),
        agencyId,
      })
      if (res?.success) {
        postDelete(agencyId)
      }
    }
  }

  const selected = lookupId && agency.lookupId === lookupId

  return (
    <View
      ref={setRef}
      className={classnames(styles.item, buttonTransition)}
      onClick={() => {
        history?.push(`/app/agency/${agency.lookupId || ''}/instruct`)
        if (onSelect) {
          onSelect()
        }
      }}
      data-selected={selected}
    >
      <Text className={'agency-name'}>{agency.name}</Text>
      {/*<View className={'right-wrap'}>*/}
      {/*{selected ? (<Link className={'quick-link'} onClick={() => {}}>{'Interact'}</Link>) : null}*/}
      {/*<Button className={'menu-button'} onClick={handleShowMenu}>*/}
      {/*  <PiDotsThreeBold />*/}
      {/*</Button>*/}
      {/*</View>*/}
      <Button className={'menu-button'} onClick={handleShowMenu}>
        <PiDotsThreeBold />
      </Button>
    </View>
  )
}

type HeaderProps = {
  isMobile: boolean,
  onShowMenu: (
    menuLeft: number,
    menuTop: number,
    menuOptions: Array<MenuOption>,
  ) => void,
}

const Header = (props: HeaderProps) => {
  const { isMobile, onShowMenu } = props

  const [history] = useHistory()

  const ref = useRef(null)
  function setRef(el: any) {
    if (!el) {
      return
    }
    ref.current = el
  }

  function handleShowMenu() {
    if (!ref.current) {
      return
    }
    const bb = ref.current.getBoundingClientRect()
    onShowMenu(bb.left + bb.width - 43, bb.top + 9, [
      {
        label: 'Settings',
        onClick: (closeMenu) => {
          closeMenu(true)
          history?.push('/app/settings')
        },
      },
      {
        label: 'Sign Out',
        onClick: (closeMenu) => {
          closeMenu(true)
          sessionStore.logout()
        },
      },
    ])
  }

  return (
    <View ref={setRef} className={styles.header}>
      <Link
        style={{
          padding: 0,
          backgroundColor: 'transparent',
        }}
        href={sessionStore.observables.isLoggedIn ? '/app' : '/'}
      >
        <Logo />
      </Link>
      <Button className={'menu-button'} onClick={handleShowMenu}>
        <PiDotsThreeBold />
      </Button>
    </View>
  )
}

type MenuOption = {
  label: string,
  onClick: (closeMenu: (shouldClose: boolean) => void) => any,
}

type FixedMenuProps = {
  isMobile: boolean,
  left: number,
  top: number,
  open: boolean,
  options: Array<MenuOption>,
  onClose: (shouldClose: boolean) => void,
}

const FixedMenu = (props: FixedMenuProps): any => {
  const { isMobile, left, top, open, options, onClose } = props

  const menuRef = useRef(null)
  useEffect(() => {
    function handleClickOutside(event: any) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <View
      ref={menuRef}
      className={styles.fixedMenu}
      data-show={open}
      style={
        isMobile
          ? { top }
          : {
              top,
              left,
            }
      }
    >
      {options.map((option, i) => {
        return (
          <Button
            key={i}
            className={'menu-row'}
            onClick={() => option.onClick(onClose)}
          >
            {option.label}
          </Button>
        )
      })}
    </View>
  )
}

const AgencyList: any = observer((props: { className?: string }): any => {
  const { className } = props
  const res = useQuery(GetAgencies, {
    variables: {
      sessionToken: sessionStore.sessionToken,
    },
  })
  const agencies: Array<Agency> = res?.data?.viewer?.currentUser?.agencies ?? []

  const [history] = useHistory()

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

  const showSidePanel = mainStore.sidePanelIsExpanded
  const { pathname } = useLocation()
  const isInstruct = pathname.endsWith('/instruct')
  function toggleSideMenu() {
    mainStore.setSidePanelIsExpanded(!showSidePanel)
  }

  function handleSelect() {
    if (isMobile) {
      mainStore.setSidePanelIsExpanded(false)
    }
  }

  function handleCloseOptionMenu(shouldClose: boolean) {
    setShowMenu(false)
    if (isMobile && shouldClose) {
      mainStore.setSidePanelIsExpanded(false)
    }
  }

  const [showAddAgencyWizardModal, setShowAddAgencyWizardModal] =
    useState(false)

  const [showMenu, setShowMenu] = useState(false)
  const [menuLeft, setMenuLeft] = useState(0)
  const [menuTop, setMenuTop] = useState(0)
  const [menuOptions, setMenuOptions] = useState<Array<MenuOption>>([])

  function handleShowMenu(
    menuLeft: number,
    menuTop: number,
    options: Array<MenuOption>,
  ) {
    setShowMenu(true)
    setMenuLeft(menuLeft)
    setMenuTop(menuTop)
    setMenuOptions(options)
  }

  function handleAddAgencyClick() {
    setShowAddAgencyWizardModal(true)
  }

  async function completeAddAgency(name: string) {
    setShowAddAgencyWizardModal(false)
    const res = await CreateAgencyMutation({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      name,
    })
    if (res?.success && res.lookupId) {
      history?.push(`/app/agency/${res.lookupId}/instruct`)
    }
  }

  function handlePostDelete(deletedAgencyId: number) {
    const firstExistingAgency = agencies.find((agency) => {
      return agency.agencyId !== deletedAgencyId
    })
    if (firstExistingAgency) {
      history?.push(
        `/app/agency/${firstExistingAgency.lookupId ?? ''}/instruct`,
      )
    } else if (
      agencies.length === 1 &&
      agencies[0].agencyId === deletedAgencyId
    ) {
      // There is no other agency to navigate to
      history?.push(`/app`)
    }
  }

  return (
    <View
      className={classnames(className, styles.agencyList, {
        hide: !showSidePanel && (!isInstruct || isMobile),
      })}
    >
      <Header onShowMenu={handleShowMenu} isMobile={isMobile} />
      <View className={styles.addButton}>
        <View>
          <ButtonSquared onClick={handleAddAgencyClick}>
            {'Add Agency'}
          </ButtonSquared>
        </View>
      </View>
      <View className={'scroller'}>
        {agencies.map((agency) => (
          <AgencyItem
            key={agency.agencyId}
            isMobile={isMobile}
            agency={agency}
            onShowMenu={handleShowMenu}
            postDelete={handlePostDelete}
            onSelect={handleSelect}
          />
        ))}
      </View>

      <FixedMenu
        isMobile={isMobile}
        top={menuTop}
        left={menuLeft}
        open={showMenu}
        onClose={handleCloseOptionMenu}
        options={menuOptions}
      />

      <WizardModal open={showAddAgencyWizardModal}>
        <AddAgencyWizard
          onCancel={() => {
            setShowAddAgencyWizardModal(false)
          }}
          onComplete={completeAddAgency}
        />
      </WizardModal>

      {!isInstruct || isMobile ? (
        <Button
          style={{
            zIndex: 1,
          }}
          className={'toggle-side-panel-button'}
          onClick={mainStore.closeRightSidePanel ?? toggleSideMenu}
        >
          {isMobile ? (
            mainStore.closeRightSidePanel ? (
              <PiCaretRightBold />
            ) : showSidePanel ? (
              <PiCaretUpBold />
            ) : (
              <PiCaretDownBold />
            )
          ) : showSidePanel ? (
            <PiCaretLeftBold />
          ) : (
            <PiCaretRightBold />
          )}
        </Button>
      ) : null}
    </View>
  )
})

export default AgencyList

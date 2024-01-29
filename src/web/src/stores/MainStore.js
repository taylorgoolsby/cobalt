// @flow

import type { InfoModalProps } from '../modals/InfoModal.js'
import type InfiniteScroller from '../components/InfiniteScroller.js'
import { makeObservable, observable, action, toJS } from 'mobx'
import type { ToastModalProps } from '../modals/ToastModal.js'
import type { BlockType } from '../components/Block.js'
import debounce from 'lodash.debounce'

type Event = {
  type: string,
  callback: (events: Array<Event>) => any,
  event?: any,
}

type QueueEvent = (
  type: string,
  callback: (events: Array<Event>) => any,
  event?: any,
) => any

const handleEvents = debounce((events, setEvents) => {
  if (events.length) {
    // console.log('events', toJS(events).map((e) => (e.type)))
    for (const event of events) {
      event.callback(toJS(events))
    }
    setEvents([])
  }
}, 16)

class MainStore {
  @observable sidePanelIsExpanded: boolean = true
  @observable closeRightSidePanel: ?() => any = null

  @observable scroller: ?InfiniteScroller = null

  @observable draggedBlockType: ?BlockType = null

  @observable showInfoModal: boolean = false
  @observable infoModalProps: ?InfoModalProps = null

  @observable showToastModal: boolean = false
  @observable toastModalProps: ?ToastModalProps = null

  @observable showErrorModal: boolean = false
  @observable errorModalMessage: ?string = null

  @observable showConfirmationModal: boolean = false
  @observable confirmationModalCallback: ?(outcome: boolean) => void = null

  @observable singleInputMessage: ?string = null
  @observable singleInputLabel: ?string = null
  @observable showSingleInputModal: boolean = false
  @observable singleInputCallback: ?(value: ?string) => void = null

  @observable events: Array<Event> = []

  @observable registeredCards: {
    [column: number]: {
      element?: HTMLElement,
      [agentId: number]: {
        element: HTMLElement,
        open: (scrollToMessageId?: ?number) => any,
      },
    },
  } = {}

  // @observable

  constructor() {
    makeObservable(this)
  }

  @action registerColumn(column: number, el: HTMLElement): void {
    if (!this.registeredCards[column]) {
      this.registeredCards[column] = {
        element: el,
      }
    } else {
      this.registeredCards[column].element = el
    }
  }

  @action registerCard(
    column: number,
    agentId: number,
    el: HTMLElement,
    open: (scrollToMessageId?: ?number) => any,
  ): void {
    if (!this.registeredCards[column]) {
      this.registeredCards[column] = {}
    }
    this.registeredCards[column][agentId] = {
      element: el,
      open,
    }
  }

  @action queueEvent: QueueEvent = (type, callback, event) => {
    this.events.push({
      type,
      callback,
      event,
    })
    handleEvents(this.events, (events) => {
      this.events = events
    })
  }

  @action setSidePanelIsExpanded(sidePanelIsExpanded: boolean) {
    this.sidePanelIsExpanded = sidePanelIsExpanded
  }

  @action setCloseRightSidePanel(closeRightSidePanel: ?() => any) {
    this.closeRightSidePanel = closeRightSidePanel
  }

  @action setScroller(scroller: InfiniteScroller) {
    this.scroller = scroller
  }

  @action setDraggedBlockType(value: ?BlockType) {
    this.draggedBlockType = value
  }

  @action setInfoModalProps(props: ?InfoModalProps) {
    this.infoModalProps = props
  }

  @action closeInfoModal() {
    // $FlowFixMe
    this.setInfoModalProps({
      ...this.infoModalProps,
      open: false,
    })
  }

  @action setToastModalProps(props: ?ToastModalProps) {
    this.toastModalProps = props
  }

  @action closeToastModal() {
    // $FlowFixMe
    this.setToastModalProps({
      ...this.toastModalProps,
      open: false,
    })
  }

  @action setShowErrorModal(value: boolean) {
    this.showErrorModal = value
  }

  @action setErrorModalMessage(message: ?string) {
    this.errorModalMessage = message
  }

  @action openConfirmationModal(callback: (outcome: boolean) => void) {
    this.showConfirmationModal = true
    this.confirmationModalCallback = callback
  }

  @action closeConfirmationModal(outcome: boolean) {
    this.showConfirmationModal = false
    if (this.confirmationModalCallback) {
      this.confirmationModalCallback(outcome)
    }
  }

  @action openSingleInputModal(
    message: string,
    inputLabel: string,
    callback: (value: ?string) => void,
  ) {
    this.showSingleInputModal = true
    this.singleInputMessage = message
    this.singleInputLabel = inputLabel
    this.singleInputCallback = callback
  }

  @action closeSingleInputModal(value: ?string) {
    this.showSingleInputModal = false
    if (this.singleInputCallback) {
      this.singleInputCallback(value)
    }
  }
}

const mainStore: MainStore = new MainStore()

export default mainStore

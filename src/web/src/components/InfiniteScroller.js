// @flow

import React, { Component } from 'react'
import { decode, encode } from 'qss'
import throttle from 'lodash.throttle'

type PaginationOrdering = { index: string, direction: string }

export const QUERY_TYPE = {
  REFRESH: 'REFRESH',
  PAGE_LOAD: 'PAGE_LOAD',
  LOAD_MORE: 'LOAD_MORE',
  LOAD_NEW: 'LOAD_NEW',
}

export type QueryType = $Keys<typeof QUERY_TYPE>

export type PaginationArgs = {|
  offset: number,
  limit: number,
  countNewLimit: number,
  orderings: Array<PaginationOrdering>,
  countLoaded: number,
  offsetRelativeTo: ?string,
|}

export type PaginationResult = {
  nodes: Array<any>,
  info: {
    hasMore: boolean,
    hasNew: boolean,
    countNew: number,
    moreOffset: number,
    nextOffsetRelativeTo: string,
  },
}

type InfiniteScrollerInstance = {
  refresh: () => void,
}

export type InfiniteScrollerRenderProps = {
  renderedItems: Array<any>,
  containerRef: (?HTMLElement) => void,
  itemRefs: Array<(?HTMLElement) => void>,
  keys: Array<any>,
  countItems: number,
  containerStyle: { ... },
  itemStyles: Array<{ ... }>,
  // You can decide what your refreshIndicator looks like, but we control opacity, position, top, left, transform, and transition.
  // You can also override the style.
  refreshNewIndicatorStyle: { ... },
  refreshingNew: boolean,
  refreshingMore: boolean,
  hasMoreButtonStyle: { ... },
  hasMore: boolean,
  hasNew: boolean,
  countNew: number,
  onMore: () => void,
  onNew: () => void,
  topSentinel: any,
  bottomSentinel: any,
}

type InfiniteScrollerProps = {
  // ref?: (instance: ?InfiniteScrollerInstance) => void,
  children: (props: InfiniteScrollerRenderProps) => any,
  onQuery: (
    paginationArgs: PaginationArgs,
    queryType: $Keys<typeof QUERY_TYPE>,
  ) => Promise<?PaginationResult>,
  orderings: Array<PaginationOrdering>,
  // set pageSize to a value which you feel confident will fill the page.
  pageSize: number,
  rowGap: number,
  // The number of items per row when no media queries are applied. Default: 1
  maxItemsPerRow?: number,
  // Order matters. Similar to CSS rules. The last media query which window.innerWidth satisfies is applied.
  mediaQueries?: Array<{
    maxWidth: number,
    itemsPerRow: number,
  }>,
  getItemId: (item: any) => string,
  // By default, the infinite scroller will look for query parameters with keys of `offset` and `offsetRelativeTo`.
  // These will be used as defaults when the scroller first loads in order to support starting at a non-zero offset,
  // and returning to the same spot in the scroller when navigating back to the page,
  // and sharing URLs.
  // If you need to customize what the query parameter keys are called, you can do that here.
  queryParamNames?: {
    offset: string,
    offsetRelativeTo: string,
    minHeight: string,
    translateY: string,
  },
  showQueryParameters?: boolean,
  // A callback when refreshingNew state changes.
  // Use this to implement a DIY view for refreshingNew.
  // Otherwise, for a less DIY but more out-of-the-box solution, you can the refreshIndicatorStyle render prop.
  refreshNewCallback?: (refreshingNew: boolean) => void,
  refreshMoreCallback?: (refreshingMore: boolean) => void,
}

type InfiniteScrollerState = {
  isResizing: boolean,
  finishedLoading: boolean,
  refreshingNew: boolean,
  refreshingMore: boolean,
  items: Array<any>,
  renderedItems: Array<any>,
  keys: Array<any>,
  mountedItems: { [string]: HTMLElement },
  minHeight: number,
  translateY: number,
  lastRes: ?PaginationResult,
  offset: number,
  moreOffset: number,
  limit: number,
  offsetRelativeTo: ?string,
}

class InfiniteScroller extends Component<
  InfiniteScrollerProps,
  InfiniteScrollerState,
> {
  topSentinelObserver: IntersectionObserver
  topSentinel: ?HTMLElement
  bottomSentinelObserver: IntersectionObserver
  intersectionObserver: IntersectionObserver
  // intersectionObservedKeys: { [string]: boolean } = {}
  intersectionObservedKeys: Map<HTMLElement, boolean> = new Map()
  keys: Array<string> = []
  removedKeys: Array<string> = []

  container: ?HTMLElement = null

  // Any time an item is mounted, it is added to this object via unique identifier.
  needsRelayout: { [itemId: string]: boolean } = {}
  relayoutHandledCount: number
  mountedItems: { [itemId: string]: HTMLElement } = {}
  mountedItemsCount: number
  resizeNeded: boolean = false

  keyAssignments: { [itemId: string]: string } = {}
  cycledEntriesThisLoop: Map<HTMLElement, boolean> = new Map()

  // The pageSize give is a number for single column pagination.
  // You may provide the `maxItemsPerRow` and `mediaQueries` props to support multiple columns.
  // These values will alter the internal usedPageSize.
  itemsPerRow: number = 0
  usedPageSize: number = 0
  largestHeightInRow: number = 0

  _renderStart: number = 0
  _countRendered: number = 0
  _minHeight: number = 0
  _translateY: number = 0

  prevScrollY: number = 0
  prevDScroll: number = 0
  prevFirstVisibleItemHeight: number = 0
  prevFirstVisibleItemId: string = ''
  firstVisibleRenderedItemIndex: number = -1
  lastVisibleRenderedItemIndex: number = -1
  firstVisibleBB: any = null

  isCycling: boolean = false
  isResizing: boolean = false
  queuedTopIntersection: ?Array<IntersectionObserverEntry>
  queuedBottomIntersection: ?Array<IntersectionObserverEntry>
  queuedItemIntersection: ?Array<IntersectionObserverEntry>
  queuedScroll: ?Event
  queuedResize: ?Event
  postUpdateScrollNeeded: number = 0

  itemsMountedThisMicrotask: Array<any> = []
  isMicrotaskQueued: boolean = false
  lastBatch: Array<any> = []

  loadedWithQueryParameters: boolean = false

  ignoreNextScrollEvent: boolean = false

  originalOverscrollBehavior: ?string = null

  firstScrollAfterFinishedLoading: boolean = false

  queuedJobs: Array<{
    jobType: QueryType,
    onComplete?: () => void,
  }> = []
  inFlightQuery: boolean = false

  resolveWaitForUpdate: ?() => void = null
  onNextMount: ?() => void = null

  constructor(props: InfiniteScrollerProps) {
    super(props)

    this.intersectionObserver = new IntersectionObserver(
      this.queueItemIntersection,
      {
        rootMargin: '-1px 0px -1px 0px',
      },
    )
    this.setInitialState(props)

    this.prevScrollY = window.scrollY
    window.addEventListener('resize', this.queueResize)
    window.addEventListener('scroll', this.queueScroll)
    window.addEventListener('touchstart', this.handleTouchStart)
    window.addEventListener('touchmove', this.handleTouchMove)

    this.pageLoad()
    this.loadNew()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.queueResize)
    window.removeEventListener('scroll', this.queueScroll)
    window.removeEventListener('touchstart', this.handleTouchStart)
    window.removeEventListener('touchmove', this.handleTouchMove)
    // $FlowFixMe
    document.body.parentElement.style.overscrollBehavior =
      this.originalOverscrollBehavior
  }

  componentDidMount(): any {
    this.originalOverscrollBehavior =
      // $FlowFixMe
      document.body.parentElement.style.overscrollBehavior
    // $FlowFixMe
    document.body.parentElement.style.overscrollBehavior = 'none'
  }

  componentWillUpdate() {
    // Before each render, clear out the array so that it the ref/onMount handler can accumalate items
    // only for the upcoming render.
    this.itemsMountedThisMicrotask = []
  }

  componentDidUpdate(
    prevProps: InfiniteScrollerProps,
    prevState: InfiniteScrollerState,
  ): any {
    const { orderings, pageSize } = this.props

    if (orderings !== prevProps.orderings || pageSize !== prevProps.pageSize) {
      this.setInitialState(this.props)
    }
    if (prevProps.showQueryParameters && !this.props.showQueryParameters) {
      window.history.replaceState(null, null, window.location.pathname)
    }

    this.updateUrl(this.state.renderedItems)
    this.cycledEntriesThisLoop = new Map()

    if (this.props.refreshNewCallback) {
      if (prevState.refreshingNew !== this.state.refreshingNew) {
        this.props.refreshNewCallback(this.state.refreshingNew)
      }
    }
    if (this.props.refreshMoreCallback) {
      if (prevState.refreshingMore !== this.state.refreshingMore) {
        this.props.refreshMoreCallback(this.state.refreshingMore)
      }
    }

    if (
      !this.state.finishedLoading &&
      !(this.state.refreshingMore || this.state.refreshingNew)
    ) {
      this.setState({
        finishedLoading: true,
      })
    }

    if (this.postUpdateScrollNeeded) {
      const desiredScrollY =
        window.scrollY + Math.ceil(this.postUpdateScrollNeeded)
      this.performInvariantScroll(desiredScrollY)
      this.postUpdateScrollNeeded = 0
    }

    if (this.resolveWaitForUpdate) {
      this.resolveWaitForUpdate()
    }
  }

  setInitialState: any = (props: InfiniteScrollerProps) => {
    const params = decode(window.location.search.slice(1))
    const paramOffset = params[this.props.queryParamNames?.offset || 'offset']
    const paramOffsetRelativeTo =
      params[this.props.queryParamNames?.offsetRelativeTo || 'offsetRelativeTo']
    const paramMinHeight =
      params[this.props.queryParamNames?.minHeight || 'minHeight']
    const paramTranslateY =
      params[this.props.queryParamNames?.translateY || 'translateY']

    if (this.topSentinelObserver) {
      this.topSentinelObserver.disconnect()
    }
    this.topSentinelObserver = new IntersectionObserver(
      this.queueTopSentinelIntersection,
    )
    if (this.bottomSentinelObserver) {
      this.bottomSentinelObserver.disconnect()
    }
    this.bottomSentinelObserver = new IntersectionObserver(
      this.queueBottomSentinelIntersection,
    )

    this.intersectionObservedKeys = new Map()
    this.cycledEntriesThisLoop = new Map()
    this.keys = []
    this.removedKeys = []
    this.needsRelayout = {}
    this.mountedItems = {}
    this.relayoutHandledCount = 0
    this.mountedItemsCount = 0
    this.itemsPerRow = this.calcItemsPerRow(props)
    this.usedPageSize = this.itemsPerRow * props.pageSize
    this.largestHeightInRow = 0
    this._renderStart = 0
    this._countRendered = this.usedPageSize
    this._minHeight = paramMinHeight || 0
    this._translateY = paramTranslateY || 0
    this.prevScrollY = 0
    this.prevDScroll = 0
    this.prevFirstVisibleItemHeight = 0
    this.prevFirstVisibleItemId = ''
    this.loadedWithQueryParameters = !!paramOffsetRelativeTo
    this.ignoreNextScrollEvent = false
    this.firstScrollAfterFinishedLoading = false

    const existingItems = this?.state?.items ?? []

    if (paramOffsetRelativeTo) {
      window.scrollTo(0, 0)
      const index = existingItems.findIndex((item) => {
        const itemOffsetRelativeTo = this.calcOffsetRelativeToForItem(
          item,
          this.props,
        )
        return itemOffsetRelativeTo === paramOffsetRelativeTo
      })
      if (index !== -1) {
        this._renderStart = index
        // this.updateVisible(this.state.items, this._countRendered, index)
      }
    }

    const nextRenderedItems = existingItems.slice(
      this._renderStart,
      this._renderStart + this._countRendered,
    )
    const keys = this.rebuildKeys(nextRenderedItems, 0)

    const initialState = {
      isResizing: false,
      finishedLoading: false,
      refreshingNew: false,
      refreshingMore: false,
      items: existingItems,
      renderedItems: nextRenderedItems,
      keys,
      mountedItems: {},
      minHeight: this._minHeight,
      translateY: this._translateY,
      lastRes: null,
      offset: paramOffset || 0,
      moreOffset: 0,
      limit: this.usedPageSize,
      offsetRelativeTo: paramOffsetRelativeTo,
    }

    if (!this.state) {
      this.state = initialState
    } else {
      this.setState(initialState)
    }
  }

  updateUrl: any = throttle((nextRenderedItems: Array<any>) => {
    if (!this.props.showQueryParameters) {
      return
    }
    if (!this.firstScrollAfterFinishedLoading) {
      return
    }

    // Find the first element which is visible.
    const firstVisibleItem = this.findFirstVisible(nextRenderedItems)

    if (!firstVisibleItem) {
      return
    }

    const search = {
      ...decode(window.location.search.slice(1)),
      // $FlowFixMe
      // [this.props.queryParamNames?.offset || 'offset']: 0,
      // $FlowFixMe
      [this.props.queryParamNames?.offsetRelativeTo || 'offsetRelativeTo']:
        this.calcOffsetRelativeToForItem(firstVisibleItem, this.props),
      // // $FlowFixMe
      // [this.props.queryParamNames?.minHeight || 'minHeight']: this.state.minHeight,
      // // $FlowFixMe
      // [this.props.queryParamNames?.translateY || 'translateY']: this.state.translateY,
    }
    if (
      !this.loadedWithQueryParameters &&
      this.state.items[0] === firstVisibleItem
    ) {
      delete search[
        this.props.queryParamNames?.offsetRelativeTo || 'offsetRelativeTo'
      ]
      window.history.replaceState(null, null, window.location.pathname)
      return
    }
    const qs = encode(search)
    window.history.replaceState(null, null, `?${qs}`)
  }, 100)

  // These are instance methods designed to be used outside of this component file:
  removeItem: (string) => Promise<void> = async (itemId: string) => {
    const index = this.state.items.findIndex(
      (item) => this.props.getItemId(item) === itemId,
    )
    if (index !== -1) {
      // $FlowFixMe
      const nextItems = this.state.items.toSpliced(index, 1)
      const nextRenderedItems = nextItems.slice(
        this._renderStart,
        this._renderStart + this._countRendered,
      )
      // todo: When an item is removed, the keys need to be updated, but this is a problem because
      //  rebuildKeys can't handle spot deletions.
      //  RebuildKeys will always create an array of keys which is in order, with no mising numbers.
      //  This means that items remount after removeItem.
      //  For most purposes this is okay, especially if no visible flicker is apparent.
      //  However, sometimes, an item has some async properties which take time to load after mounting.
      //  Getting keys to handle spot deletions is relatively involved, and I think it is a better use of
      //  time and effort to assume that for most use cases, items will not have this async loading problem,
      //  no visible flicker will be apparent, and so, reassigning keys is okay.
      this.keyAssignments = {}
      const nextKeys = this.rebuildKeys(nextRenderedItems, 0)
      this.setState({
        items: nextItems,
        renderedItems: nextRenderedItems,
        keys: nextKeys,
      })
      this.setState({
        lastRes: null,
        offset: 0,
        moreOffset: nextItems.length,
        offsetRelativeTo: this.calcOffsetRelativeToForItem(
          nextItems[0],
          this.props,
        ),
      })
      this.resetMinHeightAndTranslateY()
      await this.waitForReactUpdate()
      this.loadMore()
    }
  }
  // /end instance methods

  waitForReactUpdate: any = async () => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        // Sometimes a react update does not happen because there were no state changes.
        resolve()
      }, 100)
      const _resolveWaitForUpdate = () => {
        clearTimeout(timeout)
        resolve()
        this.resolveWaitForUpdate = null
      }
      this.resolveWaitForUpdate = _resolveWaitForUpdate
    })
  }

  findFirstVisible: any = (nextRenderedItems: Array<any>) => {
    if (this.firstVisibleRenderedItemIndex !== -1) {
      return nextRenderedItems[this.firstVisibleRenderedItemIndex]
    }

    let firstVisibleItem
    for (let i = 0; i < nextRenderedItems.length; i++) {
      const itemId = this.props.getItemId(nextRenderedItems[i])
      const element = this.mountedItems[itemId]
      const bb = element?.getBoundingClientRect()
      const isIntersecting = this.calcIntersecting(element)
      if (isIntersecting) {
        firstVisibleItem = nextRenderedItems[i]
        this.prevFirstVisibleItemHeight = bb.height
        this.prevFirstVisibleItemId = this.props.getItemId(firstVisibleItem)
        break
      }
    }
    return firstVisibleItem
  }

  calcOffsetRelativeToForItem: any = (
    item: any,
    props: InfiniteScrollerProps,
  ) => {
    const offsetRelativeToValue = item?.[props.orderings[0].index]
    return JSON.stringify(offsetRelativeToValue)
  }

  calcItemsPerRow: any = (props: InfiniteScrollerProps): number => {
    const mediaQueries: Array<{
      maxWidth: number,
      itemsPerRow: number,
    }> = props.mediaQueries || []

    let largestMediaQuerySatisfied = null
    for (const mediaQuery of mediaQueries) {
      if (mediaQuery.maxWidth >= window.innerWidth) {
        largestMediaQuerySatisfied = mediaQuery
      }
    }

    const maxItemsPerRow =
      largestMediaQuerySatisfied?.itemsPerRow || props.maxItemsPerRow || 1
    return maxItemsPerRow
  }

  _dragStartY: number
  handleTouchStart: any = (e) => {
    this._dragStartY = e.touches[0].pageY
  }

  handleTouchMove: any = (e) => {
    const y = e.touches[0].pageY
    // Activate custom pull-to-refresh effects when at the top of the container
    // and user is scrolling up.
    if (
      // $FlowFixMe
      document.scrollingElement.scrollTop === 0 &&
      y > this._dragStartY &&
      !this.state.refreshingNew
    ) {
      this.loadNew()
    }
  }

  queueTopSentinelIntersection: any = (e: Array<IntersectionObserverEntry>) => {
    if (!this.state.items.length) {
      // Do not simulate button press when scroller first mounts with no items, before the first page load event.
      return
    }
    if (!e[0].isIntersecting) {
      return
    }

    this.queuedTopIntersection = e
    this.forceUpdate()
  }

  queueBottomSentinelIntersection: any = (
    e: Array<IntersectionObserverEntry>,
  ) => {
    if (!this.state.items.length) {
      // Do not simulate button press when scroller first mounts with no items, before the first page load event.
      return
    }
    if (!e[0].isIntersecting) {
      return
    }
    this.queuedBottomIntersection = e
    this.forceUpdate()
  }

  queueItemIntersection: any = (e: Array<IntersectionObserverEntry>) => {
    this.queuedItemIntersection = e
    this.forceUpdate()
  }

  queueScroll: any = (e) => {
    if (this.ignoreNextScrollEvent) {
      this.ignoreNextScrollEvent = false
      return
    }
    this.updateFirstAndLastVisible(this.state.renderedItems)
    if (this.state.finishedLoading) {
      this.firstScrollAfterFinishedLoading = true
      this.updateUrl(this.state.renderedItems)
    }
    // this.updateFirstVisibleBB(this.state.renderedItems)
    const dScroll = window.scrollY - this.prevScrollY
    this.prevScrollY = window.scrollY
    const directionChange = Math.sign(this.prevDScroll) !== Math.sign(dScroll)
    this.prevDScroll = dScroll

    if (directionChange) {
      this.queuedScroll = e
      this.forceUpdate()
    }
  }

  queueResize: any = (e) => {
    // this.itemsPerRow must be updated immediately or else the scroller state will not match the media query state.
    // If the scroller in currently in the middle of cycling, it will stop any cycling behaviors.
    this.handleResize(e)
  }

  handleTopIntersectionEvent: any = (entries) => {
    // Only two events trigger a button press:
    // - Scrolling up to cause top sentinel to appear
    // - Drag down when scrollY === 0

    this.loadNew()
  }

  handleBottomIntersectionEvent: any = (entries) => {
    // this.handleServerResponseMore([])
    this.loadMore()
  }

  handleIntersectionEvent: any = (entries) => {
    // In the end, using intersection observers on items wasn't that useful.
    // It is still useful to trigger a remount cycle, though.
  }

  handleResize: any = async () => {
    // Resizing involves two steps:
    // - Updating itemsPerRow and resetting minHeight, translateY, mountedItems, needsRelayout, and intersection observers.
    // - Updating scrollY

    // The state needs to be updated first, before the next render after resize in order to layout items correctly.
    // The scrollY should then be updated after the first render after resize in order that bounding boxes are up to date.

    const container = this.container
    if (!container) {
      console.error('Missing container ref.')
      return
    }

    // Note that when this resize handler runs, itemsPerRow was still the old value,
    // and since itemsPerRow is used for css grid positioning, this causes a conflict between media queries
    // and the scroller's forced css grid positioning.
    // Forced positioning cannot reliable be disabled because it is possible for a resize to happen during a relayout.
    const prevItemsPerRow = this.itemsPerRow
    this.itemsPerRow = this.calcItemsPerRow(this.props)
    this.usedPageSize = this.itemsPerRow * this.props.pageSize
    this._countRendered = this.usedPageSize

    // Now that itemsPerRow has changed the render slice might not be in the correct position.
    // For example, when itemsPerRow is 1, it's possible for the render slice to assume values which are not
    // possible when itemsPerRow is 3.
    // When itemsPerRow is 3, the render slice can only change by multiples of itemsPerRow.
    // So to fix this, the render slice must be shifted down to the nearest multiple of itemsPerRow.
    let nextRenderStart = this._renderStart
    nextRenderStart =
      Math.floor(nextRenderStart / this.itemsPerRow) * this.itemsPerRow
    const nextRenderedItems = this.state.items.slice(
      nextRenderStart,
      nextRenderStart + this._countRendered,
    )
    const renderStartDiff = nextRenderStart - this._renderStart
    const nextKeys = this.rebuildKeys(nextRenderedItems, renderStartDiff)

    this._renderStart = nextRenderStart
    this.setState({
      renderedItems: nextRenderedItems,
      keys: nextKeys,
    })

    this.resetMinHeightAndTranslateY()

    // isResizing is used to prevent this.firstVisibleRenderedItemIndex from changing on the next remount.
    this.isResizing = true
    await this.waitForReactUpdate()
    this.fixScrollAfterResize(prevItemsPerRow)
    this.isResizing = false

    // handleMounting must be called because there are no render slice changes since setting isResize = false.
    this.handleMounting(this.lastBatch)
  }

  fixScrollAfterResize: any = (prevItemsPerRow: number) => {
    const didScroll = this.snapScrollUpToContainerTop()
    if (didScroll) {
      // Now that scrollY is at container top, in addition, increase scrollY to be at a position
      // approximately close to where it is was relative to the first visible item before resize.
      if (this.firstVisibleRenderedItemIndex !== -1) {
        // Sum the heights of row previous to the first visible.
        let sum = 0
        for (let i = 0; i < this.firstVisibleRenderedItemIndex; i++) {
          const newRow = (i + 1) % this.itemsPerRow === 0
          if (newRow) {
            const item = this.state.renderedItems[i]
            if (!item) {
              continue
            }
            const el = this.mountedItems[this.props.getItemId(item)]
            if (!el) {
              continue
            }
            const bb = el.getBoundingClientRect()
            if (bb.height) {
              sum += bb.height + this.props.rowGap
            }
          }
        }

        const firstItem =
          this.state.renderedItems[this.firstVisibleRenderedItemIndex]
        const itemId = !!firstItem ? this.props.getItemId(firstItem) : null
        const firstVisibleElement = !!itemId ? this.mountedItems[itemId] : null
        if (this.itemsPerRow === prevItemsPerRow && firstVisibleElement) {
          if (this.firstVisibleBB && this.firstVisibleBB.top < 0) {
            // Add the ratio of the visibility from the first visible row.
            const bb = firstVisibleElement.getBoundingClientRect()
            const resizeRatio = bb.height / this.firstVisibleBB.height
            const prevHeightOffScreen = -this.firstVisibleBB.top
            const resizedHeightOffScreen = prevHeightOffScreen * resizeRatio
            sum += resizedHeightOffScreen + this.props.rowGap
          }
        }

        this.performInvariantScroll(window.scrollY + Math.ceil(sum))
      }
    }
  }

  handleScroll: any = (e) => {}

  performInvariantScroll: any = (desiredScrollY: number) => {
    const prevScrollY = window.scrollY
    window.scrollTo(0, desiredScrollY)
    // This scroll operation should keep the scroll direction state invariant
    if (this.prevDScroll > 0) {
      this.forceIntoScrollDownState()
    } else if (this.prevDScroll < 0) {
      this.forceIntoScrollUpState()
    }
    if (prevScrollY !== window.scrollY) {
      this.ignoreNextScrollEvent = true
    }
  }

  forceIntoScrollUpState: any = (): void => {
    this.prevScrollY = window.scrollY + 1
    this.prevDScroll = -1
  }

  forceIntoScrollDownState: any = (): void => {
    this.prevScrollY = window.scrollY - 1
    this.prevDScroll = 1
  }

  resetMinHeightAndTranslateY: any = () => {
    // Reset minHeight to sum of next renderedItems heights.
    this._minHeight = 0
    this._translateY = 0
    this.isCycling = false
    this.intersectionObservedKeys = new Map()
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect()
    }
    this.intersectionObserver = new IntersectionObserver(
      this.queueItemIntersection,
      {
        rootMargin: '-1px 0px -1px 0px',
      },
    )
    this.mountedItems = {}
    this.mountedItemsCount = 0
    this.needsRelayout = {}
    this.setState({
      minHeight: this._minHeight,
      translateY: this._translateY,
    })
  }

  calcIntersecting: any = (
    element: ?HTMLElement,
    ignoreHeightCheck?: boolean,
  ): boolean => {
    const bb = element?.getBoundingClientRect()
    if (!bb) return false
    if (!ignoreHeightCheck && !bb?.height) return false
    const isIntersecting = 1 <= bb.bottom && bb.top <= window.innerHeight - 1
    return isIntersecting
  }

  updateFirstAndLastVisible: any = (nextRenderedItems: Array<void>) => {
    // console.log('before this.firstVisibleRenderedItemIndex', this.firstVisibleRenderedItemIndex)
    this.firstVisibleRenderedItemIndex = nextRenderedItems.findIndex(
      (item, i) => {
        // return this.props.getItemId(item) === this.prevFirstVisibleItemId
        const el = this.mountedItems[this.props.getItemId(item)]
        if (el) {
          const isIntersecting = this.calcIntersecting(el)
          return isIntersecting
        }
        return false
      },
    )
    // console.log('after this.firstVisibleRenderedItemIndex', this.firstVisibleRenderedItemIndex)
    this.lastVisibleRenderedItemIndex =
      // $FlowFixMe
      nextRenderedItems.findLastIndex((item, i) => {
        const el = this.mountedItems[this.props.getItemId(item)]
        if (el) {
          const isIntersecting = this.calcIntersecting(el)
          return isIntersecting
        }
        return false
      })

    // if (this.firstVisibleRenderedItemIndex !== -1) {
    //   if (this.state.refreshingNew && !this.state.finishedLoading) {
    //     // If the user loads the page with an offset (navigating back to scroller or link sharing),
    //     // then if they were to refresh again without scrolling, it should load b
    //     setTimeout(() => {
    //       this.firstVisibleRenderedItemIndex += this.itemsPerRow
    //     })
    //   }
    // }

    // this.offsetFirstVisible(nextRenderedItems)
    this.updateUrl(nextRenderedItems)
    this.updateFirstVisibleBB(nextRenderedItems)
    // console.log('this.firstVisibleRenderedItemIndex', this.firstVisibleRenderedItemIndex)
  }

  offsetFirstVisible: any = (nextRenderedItems: Array<any>) => {
    // Intention here is to try an guess what the user is looking at.
    // If the user is scrolling down, they are probably looking at the next row once the current visible row
    // is sufficiently but partially off screen.
    // If they are scrolling up, they probably want to look at the current visible row.
    // The scroll up event will handle removing the offset.
    if (this.firstVisibleRenderedItemIndex !== -1) {
      const el =
        this.mountedItems[
          this.props.getItemId(
            nextRenderedItems[this.firstVisibleRenderedItemIndex],
          )
        ]
      if (el) {
        const bb = el.getBoundingClientRect()
        if (bb.height) {
          let heightVisible = bb.height + bb.top
          if (bb.top > this.props.rowGap) {
            heightVisible -= Math.min(bb.top, this.props.rowGap)
          }
          const ratio = heightVisible / bb.height

          if (0.7 > ratio && this.prevDScroll > 0) {
            this.firstVisibleRenderedItemIndex += this.itemsPerRow
            if (
              this.firstVisibleRenderedItemIndex >
              nextRenderedItems.length - 1
            ) {
              this.firstVisibleRenderedItemIndex = nextRenderedItems.length - 1
            }
          }
          // if (1.70 > ratio && ratio > 1.40 && this.prevDScroll < 0) {
          //   this.firstVisibleRenderedItemIndex -= this.itemsPerRow
          //   if (this.firstVisibleRenderedItemIndex < 0) {
          //     this.firstVisibleRenderedItemIndex = 0
          //   }
          // }
        }
      }
    }
  }

  updateFirstVisibleBB: any = (nextRenderedItems: Array<any>) => {
    if (this.firstVisibleRenderedItemIndex !== -1) {
      const item = nextRenderedItems[this.firstVisibleRenderedItemIndex]
      if (item) {
        const bb =
          this.mountedItems[this.props.getItemId(item)]?.getBoundingClientRect()
        if (bb) {
          this.firstVisibleBB = {
            top: bb.top,
            left: bb.left,
            right: bb.right,
            bottom: bb.bottom,
            height: bb.height,
            width: bb.width,
          }
        }
      }
    }
  }

  rebuildKeys: any = (
    nextRenderedItems: Array<any>,
    offsetChange: number,
  ): Array<any> => {
    const initialOffset = (parseInt(this.keys[0]) ?? 0) + offsetChange
    this.keys = []
    this.removedKeys = []

    const countNeededKeys =
      (this.props.maxItemsPerRow ?? 1) * this.props.pageSize
    for (let i = 0; i < countNeededKeys; i++) {
      this.keys.push(this.keys.length.toString())
    }

    if (initialOffset > 0) {
      for (let i = 0; i < initialOffset; i++) {
        this.keys.push(this.keys.shift())
      }
    } else {
      for (let i = 0; i < Math.abs(initialOffset); i++) {
        this.keys.unshift(this.keys.pop())
      }
    }
    return [...this.keys]
  }

  snapScrollUpToContainerTop: any = (): boolean => {
    const containerTop =
      (this.container?.getBoundingClientRect()?.top ?? 0) -
      // $FlowFixMe
      document.body.getBoundingClientRect().top
    const desiredScrollY = Math.ceil(containerTop - this.props.rowGap)
    if (containerTop - this.props.rowGap < window.scrollY) {
      // scroll down only when viewport.top is below container.top.
      this.performInvariantScroll(desiredScrollY)
      return true
    }
    return false
  }

  handleContainerMounted: any = (el: ?HTMLElement) => {
    this.container = el
  }

  handleItemMounted: any = (el, key, item) => {
    // This algorithm relies on React to call the ref function for each item after every update.
    // This may seem slow, to iterate over every item rendered after each update.
    // It may seem more efficient to use IntersectionObserver, and only iterate over entries which
    // are reported by the IntersectionObserver,
    // but this does not work when scrolling fast.
    // When scrolling fast, it is possible that the viewport skips over elements,
    // so they will never generate IntersectionEvents.
    // However, skipped items will still call the ref function,
    // so this is why we iterate over all rendered items after every update.
    this.itemsMountedThisMicrotask.push({
      el,
      key,
      item,
    })
    if (!this.isMicrotaskQueued) {
      this.isMicrotaskQueued = true
      // $FlowFixMe
      queueMicrotask(() => {
        const batch = this.itemsMountedThisMicrotask
        this.itemsMountedThisMicrotask = []

        this.lastBatch = batch
        this.handleMounting(batch)

        this.isMicrotaskQueued = false
      })
    }
  }

  handleMounting: any = (batch: Array<any>) => {
    this.verifyBatch(batch)

    // todo: resize handling should happen before mount phase because
    //  we don't want the mount phase to start cycling before resize is handled.

    if (this.onNextMount) {
      this.onNextMount()
      this.onNextMount = null
    }

    if (this.isResizing) {
      // minHeight still needs updates during resize
      this.updateMinHeight(batch)
      return
    }

    this.handleMountPhase(batch)

    if (!this.isCycling) {
      if (this.queuedTopIntersection) {
        this.handleTopIntersectionEvent(this.queuedTopIntersection)
        this.queuedTopIntersection = null
      }
      if (this.queuedBottomIntersection) {
        this.handleBottomIntersectionEvent(this.queuedBottomIntersection)
        this.queuedBottomIntersection = null
      }
      if (this.queuedItemIntersection) {
        this.handleIntersectionEvent(this.queuedItemIntersection)
        this.queuedItemIntersection = null
      }
      if (this.queuedScroll) {
        this.handleScroll(this.queuedScroll)
        this.queuedScroll = null
      }
      // if (this.queuedResize) {
      //   this.handleResize(this.queuedResize)
      //   this.queuedResize = null
      // }
    }
  }

  /*
    When a resize event happens:
      - translateY and minHeight need to be reset to 0 because those values are produced as a sum of the item heights.
      - When the items are mounted in the mount phase, their new heights will be used to recalculate minHeight.
      - If translateY is set to 0, and the renderedItems stays the same, then scrollY must be updated.
        - To make things simple, the scrollY is positioned so that it appears to have snapped to the top of the item
          which is currently intersecting with the viewport top.
        - After each mount phase, there is a state variable which holds the index of the first visible item,
          the item intersecting with the top.
        - During the resize event handler, this state variable is used to sum up the heights of items prior to the first
          visible item. The scrollY is set to the position of the container top plus this sum of heights.
          - Note that during the resize event handler, the current renderedItems bounding boxes have already been updated with the new heights.
      - The resize handler will also put the scroller into a scrolling up state.
      - When the mount phase runs, since it is in a scrolling up state, and translateY is currently 0, it will cycle up,
        causing a negative translateY.
      - Whenever it cycles up to a negeative translateY, after cycling is done, it will correct the translateY
        by shifting it to 0 and moving scrollY by the same amount.

    When a load new event happens:
      - The current renderedItems stays the same for the first render after the event is handled.
      - The scroller is put into a scrolling up state.
      - The first mount phase handler will see that there are new items, and the scrolling up direction,
        so it will cycle up, causing the new rows to appear and be mounted for the first time in a second render.
      - At the time of loading new rows, the scroller is near the top, so scrollY and translateY are close to 0.
        Normally, a cycle up decrements the translateY, but if this is used for these new rows,
        then it would cause translateY to become negative.
        - In the mounting phase, while performing cycles, if the translateY ever becomes negative,
          then shift it back to 0, but also shift the scrollY so that it appears that nothing has moved.

    So resize and load new are similar events.
    They both set translateY to 0 and cycle up to a negative translateY which is corrected by setting it back to 0,
    and shifting the scroll view by the same amount.
    Some differences are:
      - Resize also sets minHeight to 0
      - Resize, before mounting, set the scroll view to snap to the top of the first visible item.
      - Load new, before mounting, does not change translateY. It is already 0, or close to 0, because loading of new
        rows is only possible by scrolling to the top of the list.
        So load new does not change the scrollY before mounting.
  * */
  handleMountPhase: any = (batch: Array<any>) => {
    for (const entry of batch) {
      if (!this.intersectionObservedKeys.has(entry.el)) {
        this.intersectionObserver.observe(entry.el)
      }
    }

    // Remembering the first visible is used for the URL bar, refreshing, and navigating back to the scroller.
    // The first and last visible are also needed on resize, but since this mountPhase does not run on every scroll event,
    // it will not be up to date.
    // However, the first and last need to be calculated before a resize because in the resize handler,
    // the bounding boxes are new.
    // Item intersection events occur when an items appears or disappears from the view.
    // This will trigger a mount phase, and so first and last visible should be up to date.
    this.updateFirstAndLastVisible(this.state.renderedItems)

    // Check batch for any new elements and integrate its height into minHeight.
    // A cycle happens in the previous frame, and then minHeight is updated in the second frame.
    this.updateMinHeight(batch)
    this.updateTranslateYPostLayout(batch)
    this.fixNegativeTranslateY()

    if (this.cycle(batch)) {
      this.fixNegativeTranslateY()
      // When a cycle happens, this mount handler is called a second time with the updated bounding boxes.
      this.isCycling = true
      return
    }

    this.isCycling = false
  }

  verifyBatch: any = (batch: Array<any>) => {
    if (
      batch.length !== this.state.renderedItems.length ||
      batch[0].item !== this.state.renderedItems[0] ||
      batch[batch.length - 1].item !==
        this.state.renderedItems[this.state.renderedItems.length - 1]
    ) {
      console.error('Expected to find all renderedItems to call ref function.')
      debugger // todo
      return
    }

    for (const entry of batch) {
      const bb = entry.el.getBoundingClientRect()
      if (!bb.height) {
        // todo: if height is missing, try again later.
        console.error(
          'Expected element to have a height when initially mounted',
        )
        debugger // todo
        return
      }
    }
  }

  updateMinHeight: any = (batch: Array<any>): boolean => {
    for (const entry of batch) {
      if (!this.mountedItems[this.props.getItemId(entry.item)]) {
        this.mountedItems[this.props.getItemId(entry.item)] = entry.el
        const newRow = this.mountedItemsCount % this.itemsPerRow === 0
        this.mountedItemsCount++
        if (newRow) {
          const height = entry.el.getBoundingClientRect().height
          if (this._minHeight === 0) {
            this._minHeight += height
          } else {
            this._minHeight += height + this.props.rowGap
          }
        }
      } else {
        this.mountedItems[this.props.getItemId(entry.item)] = entry.el
      }
    }
    if (this.state.minHeight !== this._minHeight) {
      this.setState({
        minHeight: this._minHeight,
      })
      return true
    }
    return false
  }

  updateTranslateYPostLayout: any = (batch: Array<any>) => {
    const newRows = []
    let tempRow = []
    for (const entry of batch) {
      const itemId = this.props.getItemId(entry.item)
      if (this.needsRelayout[itemId]) {
        delete this.needsRelayout[itemId]
        tempRow.push(entry)
        const fullRow = tempRow.length === this.itemsPerRow
        if (fullRow) {
          newRows.push(tempRow)
          tempRow = []
        }
      }
    }
    if (tempRow.length) {
      newRows.push(tempRow)
    }

    let nextTranslateY = this._translateY
    for (const row of newRows) {
      let maxHeightInRow = 0
      for (const entry of row) {
        const bb = entry?.el?.getBoundingClientRect()
        if (!maxHeightInRow || bb?.height > maxHeightInRow) {
          maxHeightInRow = bb.height
        }
      }
      nextTranslateY -= maxHeightInRow + this.props.rowGap
    }

    if (this._translateY !== nextTranslateY) {
      this._translateY = nextTranslateY
      this.setState({
        translateY: nextTranslateY,
      })
      return true
    }

    return false
  }

  fixNegativeTranslateY: any = (): boolean => {
    let nextTranslateY = this._translateY
    if (nextTranslateY < 0) {
      // On a load new, new rows don't have a height yet, so in the next render, translateY will be 0,
      // but the height of the scrolling element is not large enough to scroll the full desiredScrollY.
      // To fix this, the page must first render these new elements to give them a height.
      // So this block of code should go near the top of the mount phase.

      // If translateY ever goes negative, then restore it back to 0,
      // and shift the scrollY by the same amount so it looks like nothing moved.

      // scrollY update needs to happen in componentDidUpdate
      // because scrollY updates appear visually before this.state.translateY updates.
      // In order to make both changes happen at the same time, scrollY updating must be postponed
      // until the same event task where translateY is updated.
      this.postUpdateScrollNeeded = -nextTranslateY

      nextTranslateY = 0

      if (this._translateY !== nextTranslateY) {
        this._translateY = nextTranslateY
        this.setState({
          translateY: nextTranslateY,
        })
      }

      return true
    } else {
      return false
    }
  }

  cyclesDownAvailable: any = (): number => {
    // 1.3 - 1.3 % 1
    const indexOfLastRow =
      this.state.items.length -
      1 -
      ((this.state.items.length - 1) % this.itemsPerRow)
    const maxRenderEnd = indexOfLastRow + this.itemsPerRow
    const maxRenderStart = Math.max(0, maxRenderEnd - this._countRendered)
    return maxRenderStart - this._renderStart
  }

  cyclesUpAvailable: any = (): number => {
    return -this._renderStart
  }

  cycle: any = (batch: Array<any>): boolean => {
    let nextTranslateY = this._translateY

    let cyclesAvailable = 0
    if (this.prevDScroll > 0) {
      cyclesAvailable = this.cyclesDownAvailable()
    } else if (this.prevDScroll < 0) {
      cyclesAvailable = this.cyclesUpAvailable()
    }
    if (cyclesAvailable === 0) {
      return false
    }

    let behindStart = -1
    let behindEnd = -1
    if (this.prevDScroll > 0) {
      // scrolling down
      behindStart = 0
      // findLastIndex iterates starting from the end of the array.
      const firstVisibleIndex = batch.findIndex((entry) => {
        const bb = entry.el.getBoundingClientRect()
        const isBehind = bb.bottom < 1
        return !isBehind
      })
      if (firstVisibleIndex === -1) {
        behindEnd = batch.length
      } else {
        behindEnd = firstVisibleIndex
      }
    } else if (this.prevDScroll < 0) {
      // scrolling up
      behindEnd = this._countRendered // include imaginary items for partial rows
      // $FlowFixMe
      const firstVisibleIndex = batch.findLastIndex((entry) => {
        const bb = entry.el.getBoundingClientRect()
        const isBehind = bb.top > window.innerHeight - 1
        return !isBehind
      })
      if (firstVisibleIndex === -1) {
        behindStart = 0
      } else {
        behindStart = firstVisibleIndex + 1
        // Because of partial rows and imaginary items, move behindStart up to the nearest multiple of itemsPerRow.
        behindStart =
          Math.ceil(behindStart / this.itemsPerRow) * this.itemsPerRow
      }
    }

    if (behindStart === -1 || behindEnd === -1) {
      return false
    }

    const behindCount = behindEnd - behindStart
    if (behindCount <= 0) {
      return false
    }

    const cycles = Math.min(Math.abs(cyclesAvailable), behindCount)

    const rowChanges = Math.ceil(cycles / this.itemsPerRow)

    // For each row change, go through each row and find the greatest height.
    let translateYDiff = 0
    if (this.prevDScroll > 0) {
      // scrolling down.
      let batchIndex = 0
      for (let i = 0; i < rowChanges; i++) {
        let maxHeightInRow = 0
        for (let j = 0; j < this.itemsPerRow; j++) {
          const entry = batch[batchIndex]
          batchIndex++
          const bb = entry?.el?.getBoundingClientRect()
          if (!maxHeightInRow || bb?.height > maxHeightInRow) {
            maxHeightInRow = bb.height
          }
        }
        translateYDiff += maxHeightInRow + this.props.rowGap
      }
    } else if (this.prevDScroll < 0) {
      // Scrolling up is a little bit more complicated to handle translateY correctly.
      // When scrolling up, the height of the item to be mounted might be unknown,
      // so at this time, we cannot update translateY, yet.
      // Instead, we will add the items to be mounted to needsRelayout.
      // These will then be rendered with overlapping CSS grid positions
      // so that they do not interrupt the layout of existing items.
      // They will also be rendered with a translateY which includes calc(-100%) so they will visually be rendered in
      // the correct location.
      // Once they mount, and the re-mount handler runs, updateTranslateYPostLayout will run to find all the items
      // which are in needsRelayout to update translateY correctly.
      // After translateY has been fixed and the items are removed from needsRelayout,
      // they will be mounted with a normal translateY and css grid positions.
    }
    nextTranslateY += translateYDiff

    let nextRenderStart = this._renderStart
    if (this.prevDScroll > 0) {
      // scrolling down
      nextRenderStart += rowChanges * this.itemsPerRow
    } else if (this.prevDScroll < 0) {
      // scrolling up
      nextRenderStart -= rowChanges * this.itemsPerRow
      const cycleUpItems = this.state.items.slice(
        nextRenderStart,
        this._renderStart,
      )
      // It should be okay to reset needsRelayout here because the items we are adding to it
      // are going to be part of the render slice in the next mount.
      this.needsRelayout = {}
      for (const item of cycleUpItems) {
        const itemId = this.props.getItemId(item)
        this.needsRelayout[itemId] = true
      }
    }
    if (
      Math.abs(nextRenderStart - this._renderStart) > Math.abs(cyclesAvailable)
    ) {
      nextRenderStart = this._renderStart + cyclesAvailable
    }

    const renderStartDiff = nextRenderStart - this._renderStart

    let changed = false
    if (this._renderStart !== nextRenderStart) {
      this._renderStart = nextRenderStart
      const nextRenderedItems = this.state.items.slice(
        this._renderStart,
        this._renderStart + this._countRendered,
      )
      const nextKeys = this.rebuildKeys(nextRenderedItems, renderStartDiff)
      this.setState({
        renderedItems: nextRenderedItems,
        keys: nextKeys,
      })
      changed = true
    }

    if (this._translateY !== nextTranslateY) {
      this._translateY = nextTranslateY
      this.setState({
        translateY: nextTranslateY,
      })
      changed = true
    }

    return changed
  }

  /*
      The scroller update is broken into parts:
        - Update renderItems slice position
        - Allow this model to be rendered
        - The ref/onMount handler will update translateY and scroll position.

      Cycling still has a dependency on bounding box. Can this be removed?

      Or all cycling could be performed in the onMount handler.
      This would ensure that bounding boxes are always available.

      Events that need cycling:
        - Fall off event
        - Scroll direction change event
        - Load More Response event
        - Load New Response event

      Each of these events produces a desiredCycles value which will be used later in the mounting phase,
      and then reset back to 0 at the end of mounting.

      Value of desiredCycles.
        - Fall off event
          - When scrolling fast some items can be skipped, so fall off events aren't generated for them.
          - On mount, iterate in the direction of travel, and use the BB to find items which are behind the scroll view.
          - Perform cycles for each of these behind items.
        - Scroll direction change event
          - The scroll direction has changed, so a recalculation of which rows are behind the scroll view is needed.
          - This recalculation is performed in the mounting phase.
        - Load More Response event
          - Force the scroll state into a down direction.
          - More rows can be cycled to now, so previously, row which weren't able to be cycled because there was
            nothing to cycle to can now be cycled.
          - This isBehind recalculation is performed in the mounting phase.
        - Load New Response event
          - Force the scroll state into an up direction.
          - This is similar to the load more event with the difference that new rows are loaded in the scrolling up direction.
          - This isBehind recalculation is performed in the mounting phase.

      In order to trigger the mount phase, there needs to be some kind of state update.

      The mounting phase performs cycles in this manner:
        - Loop over all rendered items. They should all have been mounted
          and therefore have a height and bounding box at this time.
        - For each item, using the bounding box and scroll direction, calculate if the item is behind the scroll view.
        - behindItems should be a slice of renderedItems.
          The start index should be either the 0 or last index in renderedItems, depending on scroll direction.
          The count of behindItems should be a multiple of this.itemsPerRow.
          If it not, then throw an error. The height of items in a row in multi-column mode should all be the same.
          If variable heights in a single row were to be supported, then behindItems count should be reduced to the
          nearest multiple of this.itemsPerRow.
        - Using behindItems.length, which is a multiple of this.itemsPerRow,
          move the render slice by behindItems.length.
          Clamp this operation so that the render slice window does not go out of bound with respect to the full items array.
          The clamping makes an exception for a single partial row which may appear as the last row.
          So renderedItems.length should always be equal to items.length, except when there is a partial row,
          and also except when items.length is less than the pageSize.
    * */

  offsetRelativeToEstablished: (any) => boolean = (offsetRelativeTo) => {
    return offsetRelativeTo && offsetRelativeTo !== JSON.stringify(null)
  }

  // Exposed through API:
  pageLoad: any = async () => {
    return new Promise((resolve) => {
      this.queueJob(QUERY_TYPE.PAGE_LOAD, () => {
        resolve()
      })
    })
  }

  loadMore: any = () => {
    return new Promise((resolve) => {
      this.queueJob(QUERY_TYPE.LOAD_MORE, () => {
        resolve()
      })
    })
  }

  loadNew: any = () => {
    return new Promise((resolve) => {
      this.queueJob(QUERY_TYPE.LOAD_NEW, () => {
        resolve()
      })
    })
  }

  refresh: any = async () => {
    return new Promise((resolve) => {
      this.queueJob(QUERY_TYPE.REFRESH, () => {
        resolve()
      })
    })
  }

  // Functions that perform the logic of each Job type:
  handleRequestPageLoad: any = async () => {
    const { orderings } = this.props
    // These are updated after a response is received, and are used for setting up the next queued query.
    const { moreOffset, lastRes, items, offsetRelativeTo } = this.state
    // These are updated when a request is made because the response handler needs it.
    const { offset, limit } = this.state

    if (this.offsetRelativeToEstablished(offsetRelativeTo)) {
      return this.handleRequestLoadMore()
    }

    const requestArgs = {
      offset: 0,
      limit,
      orderings,
      offsetRelativeTo: null,
      countLoaded: items.length,
    }
    const out = await this.sendQuery(requestArgs)
    await this.commit(out)
  }

  handleRequestLoadMore: any = async () => {
    const { orderings } = this.props
    // These are updated after a response is received, and are used for setting up the next queued query.
    const { moreOffset, lastRes, items, offsetRelativeTo } = this.state
    // These are updated when a request is made because the response handler needs it.
    const { offset, limit } = this.state

    if (!this.offsetRelativeToEstablished(offsetRelativeTo)) {
      return this.handleRequestPageLoad()
    }

    const desiredNextMoreOffset =
      Math.floor((items.length + this.usedPageSize) / this.usedPageSize) *
      this.usedPageSize
    const limitToFillCurrentRow = desiredNextMoreOffset - moreOffset
    const requestOffset = moreOffset
    const requestLimit = limitToFillCurrentRow
    this.setState({
      offset: requestOffset,
      limit: requestLimit,
    })
    const requestArgs = {
      offset: requestOffset,
      limit: requestLimit,
      orderings,
      offsetRelativeTo,
      countLoaded: items.length,
    }
    const out = await this.sendQuery(requestArgs)
    await this.commit(out)
  }

  handleRequestLoadNew: any = async () => {
    const { orderings } = this.props
    // These are updated after a response is received, and are used for setting up the next queued query.
    const { moreOffset, lastRes, items, offsetRelativeTo } = this.state
    // These are updated when a request is made because the response handler needs it.
    const { offset, limit } = this.state

    if (!this.offsetRelativeToEstablished(offsetRelativeTo)) {
      return this.handleRequestPageLoad()
    }

    const requestLimit = lastRes?.info?.countNew || this.usedPageSize
    const requestOffset = -requestLimit
    this.setState({
      offset: requestOffset,
      limit: requestLimit,
    })
    const requestArgs = {
      offset: requestOffset,
      limit: requestLimit,
      orderings,
      offsetRelativeTo,
      countLoaded: items.length,
    }
    const out = await this.sendQuery(requestArgs)
    await this.commit(out)
  }

  handleRequestRefresh: any = async () => {
    const { orderings } = this.props
    // These are updated after a response is received, and are used for setting up the next queued query.
    const { moreOffset, lastRes, items, offsetRelativeTo } = this.state
    // These are updated when a request is made because the response handler needs it.
    const { offset, limit } = this.state
    // This sends a preliminary request to get the current countNew,
    // and then it sends another request to get all new rows.

    if (!this.offsetRelativeToEstablished(offsetRelativeTo)) {
      return this.handleRequestPageLoad()
    }

    // If there are already rows on the page,
    // then a refresh means a negative offset query.

    // This first query is to get back a count of how many "new" (backwards pagination) rows there are to get.
    const out = await this.sendQuery({
      offset: 0,
      limit: 1,
      orderings,
      offsetRelativeTo,
      countLoaded: items.length,
    })

    if (out?.res?.info?.hasNew) {
      const newRes = await this.sendQuery({
        offset: -out?.res?.info?.countNew,
        limit: out?.res?.info?.countNew,
        orderings,
        offsetRelativeTo,
        countLoaded: items.length,
      })
      await this.commit(newRes, items)
    }
  }

  // Functions that handle updating the internal model after server response:
  handleServerResponsePageLoad: any = (res: PaginationResult): Array<any> => {
    const newItems = res.nodes
    const nextItems = newItems
    // todo: initial countRendered should be set to the number of items
    //  loaded in during the loading phase.
    //  The loading phase may include multiple requests to the server.
    // nextCountRendered = Math.max(res.nodes.length, this.usedPageSize)
    const desiredNextRenderStart = this._renderStart
    const desiredCycles = desiredNextRenderStart - this._renderStart
    // this.performCycles(nextItems, this._countRendered, desiredCycles)
    this.forceIntoScrollDownState()
    return nextItems
  }

  handleServerResponseMore: any = (res: PaginationResult): Array<any> => {
    const newItems = res.nodes
    const { offset, moreOffset } = this.state
    const diff = moreOffset - offset // diff range: [0, pageSize - 1]
    const newNodes = newItems.slice(diff)
    const nextItems = [...this.state.items, ...newNodes]
    // If the list was scrolled to the bottom, and long enough,
    // then it might be in a state where renderStart has not been able to increment.
    // Now that more rows have loaded, attempt to cycles.
    const desiredNextRenderStart = this._renderStart + this.usedPageSize
    const desiredCycles = desiredNextRenderStart - this._renderStart
    // this.performCycles(nextItems, this._countRendered, desiredCycles)
    this.forceIntoScrollDownState()
    return nextItems
  }

  handleServerResponseNew: any = (res: PaginationResult): Array<any> => {
    const newItems = res.nodes
    // Remove query parameters when new rows are loaded.
    if (!res.info.hasNew) {
      this.loadedWithQueryParameters = false
    }

    if (newItems.length) {
      const nextItems = [...newItems, ...this.state.items]
      const prevRenderStart = newItems.length + this._renderStart

      // To keep the renderedItems array invariant after the server response,
      // the slice start position needs to be updated so that it points to the same item
      // it pointed to before new items were prepended.
      this._renderStart = prevRenderStart

      this.forceIntoScrollUpState()

      // this.putIntoNeedsRelayoutState(
      //   nextItems,
      //   prevRenderStart,
      //   this.itemsPerRow,
      // )
      return nextItems
    } else {
      return [...this.state.items]
    }
  }

  queueJob: any = (jobType: QueryType, onComplete?: () => void) => {
    this.queuedJobs.push({
      jobType,
      onComplete,
    })
    this.attemptJobRun()
  }

  attemptJobRun: any = () => {
    if (!this.inFlightQuery) {
      this.inFlightQuery = true
      const { jobType, onComplete } = this.queuedJobs.shift()
      const p = Promise.resolve().then(async () => {
        try {
          if (jobType === QUERY_TYPE.PAGE_LOAD) {
            await this.handleRequestPageLoad()
          } else if (jobType === QUERY_TYPE.LOAD_MORE) {
            await this.handleRequestLoadMore()
          } else if (jobType === QUERY_TYPE.LOAD_NEW) {
            await this.handleRequestLoadNew()
          } else if (jobType === QUERY_TYPE.REFRESH) {
            await this.handleRequestRefresh()
          }
        } catch (err) {
          console.error(err)
        }
      })
      p.then(() => {
        this.inFlightQuery = false
        if (onComplete) {
          onComplete()
        }
        if (this.queuedJobs.length) {
          this.attemptJobRun()
        }
      })
    }
  }

  sendQuery: any = async (
    args: PaginationArgs,
  ): Promise<{
    args: PaginationArgs,
    type: QueryType,
    res: ?PaginationResult,
  }> => {
    const { onQuery } = this.props

    let queryType
    if (!this.offsetRelativeToEstablished(args.offsetRelativeTo)) {
      queryType = QUERY_TYPE.PAGE_LOAD
    } else if (args.offset < 0) {
      queryType = QUERY_TYPE.LOAD_NEW
    } else {
      queryType = QUERY_TYPE.LOAD_MORE
    }

    const countNewLimit = Math.max(args.limit, this.usedPageSize)

    let res: ?PaginationResult
    try {
      if (queryType === QUERY_TYPE.LOAD_NEW) {
        this.setState({
          refreshingNew: true,
        })
      } else {
        this.setState({
          refreshingMore: true,
        })
      }
      res = await onQuery(
        {
          ...args,
          countNewLimit,
        },
        queryType,
      )
      // await delay(1000)
    } catch (err) {
      console.error(err)
    }
    return {
      args,
      type: queryType,
      res,
    }
  }

  commit: any = async (out: {
    args: PaginationArgs,
    type: QueryType,
    res: ?PaginationResult,
  }) => {
    const { type, res } = out

    if (res) {
      let nextItems = this.state.items
      if (type === QUERY_TYPE.PAGE_LOAD) {
        nextItems = this.handleServerResponsePageLoad(res)
      } else if (type === QUERY_TYPE.LOAD_MORE) {
        nextItems = this.handleServerResponseMore(res)
      } else if (type === QUERY_TYPE.LOAD_NEW) {
        nextItems = this.handleServerResponseNew(res)
      }

      const nextRenderedItems = nextItems.slice(
        this._renderStart,
        this._renderStart + this._countRendered,
      )
      this.setState({
        items: nextItems,
        renderedItems: nextRenderedItems,
        lastRes: res,
        moreOffset: res.info.moreOffset,
        offsetRelativeTo: res.info.nextOffsetRelativeTo,
      })

      await this.waitForReactUpdate()
      requestAnimationFrame(() => {
        // After react updates and page layout is updated:
        this.setState({
          refreshingNew: false,
          refreshingMore: false,
        })
      })
    } else {
      this.setState({
        refreshingNew: false,
        refreshingMore: false,
      })
    }
  }

  render(): any {
    const { children, onQuery, orderings } = this.props
    const {
      renderedItems,
      keys,
      minHeight,
      translateY,
      items,
      lastRes,
      offset,
      moreOffset,
      limit,
      offsetRelativeTo,
    } = this.state

    for (let i = 0; i < renderedItems.length; i++) {
      const item = renderedItems[i]
      const key = keys[i]
      const itemId = this.props.getItemId(item)
      if (this.keyAssignments[itemId]) {
        if (key !== this.keyAssignments[itemId]) {
          console.warn('key mismatch', itemId, this.keyAssignments[itemId], key)
          // debugger
        }
      } else {
        this.keyAssignments[itemId] = key
      }
    }

    if (keys.length < renderedItems.length) {
      throw new Error('keys.length is less than renderedItems.length')
    }

    const topSentinel = (
      <div
        id="top-sentinel"
        ref={(el) => {
          if (el && this.topSentinelObserver) {
            this.topSentinelObserver.observe(el)
            this.topSentinel = el
          }
        }}
      />
    )

    const bottomSentinel = (
      <div
        ref={(el) => {
          if (el && this.bottomSentinelObserver) {
            this.bottomSentinelObserver.observe(el)
          }
        }}
      />
    )

    // The index of the first item the same row as the first item which is already in this.mountedItems.
    let indexFirstMountedRow = renderedItems.findIndex(
      (item) =>
        !!this.mountedItems[this.props.getItemId(item)] &&
        !this.needsRelayout[this.props.getItemId(item)],
    )
    if (indexFirstMountedRow === -1) {
      indexFirstMountedRow = 0
    }
    indexFirstMountedRow =
      Math.floor(indexFirstMountedRow / this.itemsPerRow) * this.itemsPerRow

    return this.props.children({
      // parallel arrays
      renderedItems: renderedItems,
      containerRef: this.handleContainerMounted,
      itemRefs: keys.map((key, i) => {
        return (el) => {
          if (el) {
            const item = renderedItems[i]
            this.handleItemMounted(el, key, item)
          }
        }
      }),
      keys,
      countItems: items.length,
      containerStyle: {
        position: 'relative',
        minHeight,
        borderTop: 0,
      },
      itemStyles: renderedItems.map((item, i) => {
        let style: any = {}
        style.gridRowEnd = 'span 1'
        style.gridColumnEnd = 'span 1'

        const index = i - indexFirstMountedRow

        style.gridRowStart = Math.floor(index / this.itemsPerRow) + 1
        style.gridColumnStart = (i % this.itemsPerRow) + 1
        style.transform = `translateY(${translateY}px)`

        if (this.needsRelayout[this.props.getItemId(item)]) {
          const nReverseRow = Math.floor(index / this.itemsPerRow)
          style.gridRowStart = 1
          style.transform = `translateY(calc(${translateY}px + ${nReverseRow} * (100% + ${this.props.rowGap}px)))`
        }

        if (!this.mountedItems[this.props.getItemId(item)]) {
          // $FlowFixMe
          style.opacity = 0
        }

        return style
      }),
      refreshNewIndicatorStyle: {
        zIndex: 1,
        position: 'fixed',
        top: 0,
        left: '50%',
        opacity: this.state.refreshingNew ? 1 : 0,
        transform: this.state.refreshingNew
          ? `translate(-50%, 100px)`
          : `translate(-50%, 0px)`,
        transition: 'all 300ms cubic-bezier(0,0,0.2,1)',
      },
      refreshingNew: this.state.refreshingNew,
      refreshingMore: this.state.refreshingMore,
      hasMoreButtonStyle: {
        // After resize and load new, there are rows at the top which need relayout.
        // After load new, it might be possible for these rows to overlap with the button,
        // so hide the button.
        opacity: !!Object.keys(this.needsRelayout),
      },
      hasMore: !!lastRes?.info?.hasMore,
      hasNew: !!lastRes?.info?.hasNew,
      countNew: lastRes?.info?.countNew ?? 0,
      onMore: this.loadMore,
      onNew: this.loadNew,
      topSentinel,
      bottomSentinel,
    })
  }
}

export default InfiniteScroller

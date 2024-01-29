// @flow

import type { Agent } from '../types/Agent.js'
import React, { useEffect, useRef, useState } from 'react'
import { css } from 'goober'
import View from '../components/View.js'
import sessionStore from '../stores/SessionStore.js'
import { ButtonSquared } from '../components/Button.js'
import AgentCard from '../components/AgentCard.js'
import Colors from '../Colors.js'
import UpdateAgentMutation from '../graphql/mutation/UpdateAgentMutation.js'
import nonMaybe from 'non-maybe'
import debounce from 'lodash.debounce'
import type { Agency } from '../types/Agency.js'
import FlipMove from 'react-flip-move'
import useDragAndDrop from '../utils/useDragAndDrop.js'
import Config from '../Config.js'
import useServerState from '../utils/useServerState.js'
import useDebouncedEffect from '../utils/useDebouncedEffect.js'
import UpdateAgencyMutation from '../graphql/mutation/UpdateAgencyMutation.js'
import mainStore from '../stores/MainStore.js'
import type { User } from '../types/User.js'
import { apolloCache } from '../apolloClient.js'
import GetAgencyDetails from '../graphql/GetAgencyDetails.js'
import classnames from 'classnames'
import useHistory from '../utils/useHistory.js'

const styles = {
  container: css`
    flex: 1;
    align-self: stretch;
    background-color: ${Colors.panelBg};
  `,
  panel: css`
    flex: 1;
    align-self: stretch;
    flex-direction: row;

    > *:first-child {
      margin-left: 8px;
      margin-right: 4px;
    }

    > *:last-child {
      margin-left: 4px;
      margin-right: 8px;
    }

    @media (max-width: 600px) {
      > *:last-child {
        margin-left: 8px;
        margin-right: 8px;
      }
    }
  `,
  column: css`
    flex: 1;
    align-self: stretch;
    margin-top: 8px;
    margin-bottom: 8px;
    max-height: calc(100dvh - ${Config.headerHeight}px);
    background-color: white;
    box-sizing: border-box;
    border: 1px solid white;
    border-bottom: 0;
    border-radius: 4px;
    overflow: hidden;
  `,
  columnHeader: css`
    align-self: stretch;
    background-color: ${Colors.closedCardBg};
    height: 56px;
    box-sizing: border-box;
    border-radius: 3px;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;

    > * {
      align-self: stretch;
      flex: 1;
      flex-direction: row;
      justify-content: flex-end;
      padding: 8px;
      background-color: rgba(178, 208, 255, 0.82);
      border-radius: 3px;
      border-bottom-right-radius: 4px;
      border-bottom-left-radius: 4px;
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
  scroller: css`
    flex: 1;
    align-self: stretch;
    overflow-x: visible;
    overflow-y: scroll;
    max-height: calc(
      100dvh - ${Config.headerHeight}px - 8px - 8px - 56px - 2px
    );
    margin: 0;

    > *:not(.flip-move-agents) {
      margin: 0 0;
    }

    .flip-move-agents {
      align-self: stretch;
      display: flex;
      flex-direction: column;
    }

    .scroll-item:first-child {
      border-top: 0;

      &:hover {
        border-top: 0;
      }
    }
  `,
}

type AgencyColumnHeaderProps = {
  onAddAgent: () => any,
}

const AgencyColumnHeader = (props: AgencyColumnHeaderProps): any => {
  return (
    <View className={styles.columnHeader}>
      <View>
        <ButtonSquared onClick={props.onAddAgent}>Add Agent</ButtonSquared>
      </View>
    </View>
  )
}

type AgencyColumnProps = {
  column: number,
  agencyId: number,
  agency: Agency,
  agents: Array<Agent>,
  availableModels: Array<string>,
  onAgentsChanged: (agents: Array<Agent>) => any,
}

const AgencyColumn = (props: AgencyColumnProps): any => {
  const { column, agencyId, agency, agents, availableModels, onAgentsChanged } =
    props

  const [history] = useHistory()

  const ref = useRef<any>(null)
  function setRef(el: ?HTMLElement) {
    if (!el) {
      return
    }
    ref.current = el
    mainStore.registerColumn(column, el)
  }

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

  const [showNewCard, setShowNewCard] = useState(false)
  const [newlyCreatedAgentId, setNewlyCreatedAgentId] = useState<?number>(null)

  // All of the following are needed for drag to resort:
  const [isDragging, draggedItem, itemX, itemY, diffX, diffY, handleDragStart] =
    useDragAndDrop()
  const [draggedStyle, setDraggedStyle] = useState<any>(null)
  const [lastHoveredItem, setLastHoveredItem] = useState<?Agent>(null)
  function startDrag(event: any, element: HTMLElement, agent: Agent) {
    if (isMobile) return
    handleDragStart(event, element, agent)
    const rect = element.getBoundingClientRect() || {}
    const width = rect.width
    const height = rect.height
    setDraggedStyle({
      width,
      height,
    })
  }
  function handlePointerEnter(hoveredAgent: Agent) {
    if (!isDragging || !draggedItem) return

    // FlipMove's animation causes extra pointerenter events to fire while the animation is happening.
    // To ignore these, the lastHoveredItem is stored and ignored.
    if (lastHoveredItem && lastHoveredItem.agentId === hoveredAgent.agentId) {
      return
    }

    // Get the array position of the item which the cursor entered,
    // and put the draggedItem in its place.

    const removeDraggedItem = (agent: Agent) =>
      agent.agentId !== draggedItem.agentId

    let indexOfHovered = agents.findIndex(
      (agent: Agent) => agent.agentId === hoveredAgent.agentId,
    )
    const indexOfDragged = agents.findIndex(
      (agent: Agent) => agent.agentId === draggedItem.agentId,
    )
    if (indexOfHovered === indexOfDragged) {
      return
    }
    if (indexOfHovered > indexOfDragged) {
      // The dragged item is being moved down the list.
      indexOfHovered++
    }
    if (indexOfHovered !== -1) {
      setLastHoveredItem(hoveredAgent)
      const newAgents: Array<Agent> = [
        ...agents.slice(0, indexOfHovered).filter(removeDraggedItem),
        draggedItem,
        ...agents.slice(indexOfHovered).filter(removeDraggedItem),
      ]
      onAgentsChanged(newAgents)
    }
  }

  function handleAddAgentClick() {
    setShowNewCard(true)
  }

  function handleCloseNew(agentId: number) {
    setShowNewCard(false)
    setNewlyCreatedAgentId(agentId)
  }

  async function handleAgentUpdate(nextAgent: Agent) {
    const nextAgents = agents.map((agent) => {
      if (nextAgent.agentId === agent.agentId) {
        return nextAgent
      } else {
        return agent
      }
    })
    onAgentsChanged(nextAgents)

    const res = await UpdateAgentMutation({
      sessionToken: nonMaybe(sessionStore.sessionToken),
      agentId: nonMaybe(nextAgent.agentId),
      agencyId: nonMaybe(nextAgent.agencyId),
      name: nonMaybe(nextAgent.name),
      model: nonMaybe(nextAgent.model),
      orderIndex: nonMaybe(nextAgent.orderIndex),
      instructions: nonMaybe(nextAgent.instructions),
    })
    if (res?.success) {
      onAgentsChanged(res?.agency?.agents ?? [])
      if (res?.agency?.lookupId && res?.agency?.lookupId !== agency.lookupId) {
        apolloCache.writeQuery({
          query: GetAgencyDetails,
          variables: {
            sessionToken: sessionStore.sessionToken,
            lookupId: res?.agency?.lookupId,
          },
          data: {
            viewer: {
              ...res?.viewer,
              agency: res?.agency,
            },
          },
        })
        history?.replace(
          window.location.pathname.replace(
            agency.lookupId,
            res?.agency?.lookupId,
          ),
        )
      }
    }
  }

  return (
    <View className={styles.column}>
      <AgencyColumnHeader onAddAgent={handleAddAgentClick} />
      <View ref={setRef} className={styles.scroller} id={`scroller_${column}`}>
        {showNewCard ? (
          <AgentCard
            key={'new'}
            className={'scroll-item'}
            column={column}
            agency={agency}
            agencyId={agencyId}
            availableModels={availableModels}
            onCloseNewAgent={handleCloseNew}
          />
        ) : null}
        <FlipMove
          className={'flip-move-agents'}
          enterAnimation={'none'}
          leaveAnimation={'none'}
          duration={180}
          easing={'ease-out'}
          onFinish={() => {
            // Runs for each item, but necessary because onFinishAll does not always run.
            setLastHoveredItem(null)
          }}
        >
          {agents.map((agent) => {
            return (
              <AgentCard
                key={agent.versionId}
                column={column}
                agency={agency}
                agencyId={agencyId}
                agent={agent}
                initiallyExpanded={agent.agentId === newlyCreatedAgentId}
                availableModels={availableModels}
                onAgentUpdate={debounce(handleAgentUpdate, 380)}
                // For drag:
                isDragging={isDragging}
                isDraggingSelf={
                  isDragging && draggedItem?.agentId === agent.agentId
                }
                onPointerDown={(event: any, element: HTMLElement) =>
                  startDrag(event, element, agent)
                }
                onPointerEnter={(e) => {
                  handlePointerEnter(agent)
                }}
              />
            )
          })}
        </FlipMove>
      </View>
      {isDragging && draggedItem ? (
        <AgentCard
          style={{
            position: 'fixed',
            zIndex: 1,
            // transform: 'translate(-50%, -50%)',
            top: itemY + diffY,
            left: itemX + diffX,
            pointerEvents: 'none',
            opacity: 0.7,
            borderLeft: `1px solid ${Colors.cardBorder}`,
            borderRight: `1px solid ${Colors.cardBorder}`,
            ...draggedStyle,
          }}
          key={draggedItem.versionId}
          column={column}
          agency={agency}
          agencyId={agencyId}
          agent={draggedItem}
          availableModels={availableModels}
        />
      ) : null}
    </View>
  )
}

type AgencyInstructProps = {
  className: string,
  currentUser: User,
  agency: Agency,
}

const AgencyInstruct = (props: AgencyInstructProps): any => {
  const { className, currentUser, agency } = props

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

  const foundAgencyId = agency?.agencyId ?? 0
  const availableModels = currentUser?.gptModels ?? []

  const serverAgents = agency?.agents ?? []

  // There is an issue with useServerState.
  // It only works if the new server value actually changed.
  // If the new server value is still the same, it should still update the local
  // value because this lets us know visually if the server updated correctly.
  // The current implementation uses useEffect's dependencies array to trigger an update.
  // We don't want to set the server value on every rerender, because sometimes a rerender
  // is triggered by things which are not server callbacks.
  // Instead, we can reuse the setter function, manually setting up a server callback to call it with the new
  // server value instead of relying on rerenders.

  const [agents, localAgents, setAgents, setServerAgents] =
    useServerState<Array<Agent>>(serverAgents)

  useDebouncedEffect(
    () => {
      const orderChanged = localAgents.some(
        (agent, i) => agent.agentId !== serverAgents[i].agentId,
      )

      if (orderChanged) {
        UpdateAgencyMutation({
          sessionToken: nonMaybe(sessionStore.sessionToken),
          agencyId: nonMaybe(foundAgencyId),
          agents: localAgents,
        }).then((res) => {
          if (res?.success) {
            if (res?.agency?.agents) {
              setServerAgents(res?.agency?.agents)
            }
          }
        })
      }
    },
    [localAgents],
    Config.debounceTime,
  )

  function handleAgentsUpdated(agents: Array<Agent>) {
    setAgents(agents)
    // // optimistic update has no debounce:
    // apolloCache.writeQuery({
    //   query: GetAgencyDetails,
    //   variables: {
    //     sessionToken: sessionStore.sessionToken,
    //     agencyId: foundAgencyId,
    //   },
    //   data: {
    //     viewer: {
    //       ...res.data?.viewer,
    //       agency: {
    //         ...res.data?.viewer?.agency,
    //         agents,
    //       },
    //     },
    //   },
    // })
  }

  return (
    <View className={classnames(className, styles.container)}>
      <View className={styles.panel}>
        <AgencyColumn
          column={0}
          agencyId={foundAgencyId}
          agency={agency}
          agents={agents}
          availableModels={availableModels}
          onAgentsChanged={handleAgentsUpdated}
        />
        {!isMobile ? (
          <AgencyColumn
            column={1}
            agencyId={foundAgencyId}
            agency={agency}
            agents={agents}
            availableModels={availableModels}
            onAgentsChanged={handleAgentsUpdated}
          />
        ) : null}
      </View>
    </View>
  )
}

export default AgencyInstruct

// @flow

import type { Block } from '../types/Block.js'
import type { AbstractComponent, Node } from 'react'
import type { User } from '../types/User.js'
import React, { forwardRef, useEffect, useRef, useState } from 'react'
import { css } from 'goober'
import View from './View.js'
import Tabs from './Tabs.js'
import Text from './Text.js'
import Colors from '../Colors.js'
import mainStore from '../stores/MainStore.js'
import { BlockEnum } from './Block.js'
import { activeClassTransition, Button, ButtonSquared } from './Button.js'
import Divider from './Divider.js'
import Input from './Input.js'
import type { Instruction } from '../types/Instruction.js'
import { createInstruction } from '../types/Instruction.js'
import {
  PiCaretDownBold,
  PiCaretUpBold,
  PiPlusBold,
  PiTrash,
} from 'react-icons/pi'
import useDragAndDrop from '../utils/useDragAndDrop.js'
import FlipMove from 'react-flip-move'
import { showErrorModal } from '../modals/ErrorModal.js'
import CreateAgentMutation from '../graphql/mutation/CreateAgentMutation.js'
import sessionStore from '../stores/SessionStore.js'
import nonMaybe from 'non-maybe'
import type { Agent } from '../types/Agent.js'
import DropdownMenu from './DropdownMenu.js'
import DeleteAgentMutation from '../graphql/mutation/DeleteAgentMutation.js'
import useServerState from '../utils/useServerState.js'
import type { Agency } from '../types/Agency.js'
import InstructionClause from './InstructionClause.js'
import delay from 'delay'
import classnames from 'classnames'
import { showConfirmationModal } from '../modals/ConfirmationModal.js'
import type { FlatMessage } from '../types/Message.js'
import ChatMessage from './ChatMessage.js'
import { apolloCache } from '../apolloClient.js'
import GetAgencyDetails from '../graphql/GetAgencyDetails.js'
import useHistory from '../utils/useHistory.js'

const styles = {
  container: css`
    align-self: stretch;
  `,
  card: css`
    align-self: stretch;
    z-index: 0;
    background-color: ${Colors.closedCardBg};
    margin-bottom: -1px;
    border-top: 1px solid ${Colors.cardBorder};
    border-bottom: 1px solid ${Colors.cardBorder};

    &[data-expanded='true'] {
      z-index: 1;
      margin-bottom: 0px;
      background-color: white;
      border-bottom: 1px solid ${Colors.blackSoft};
    }

    &:hover[data-expanded='true'] {
      transition: background-color 0ms;
      background-color: ${Colors.agentPanelBg};
    }

    &:hover:not([data-expanded='true']):not([data-is-dragging='true']) {
      z-index: 2;
      background-color: ${Colors.closedCardBgHover};
      border-top: 1px solid ${Colors.cardBorderHover};
      border-bottom: 1px solid ${Colors.cardBorderHover};
    }

    &.opened-recently-fade {
      transition: background-color 2000ms;
    }

    /* Opened is set programatically inside AgentIdBlock */
    &.opened-recently {
      transition: background-color 0ms;
      background-color: ${Colors.yellow};
    }

    &[data-is-dragging='true'] {
      border-top: 1px solid ${Colors.cardBorder};
      border-bottom: 1px solid ${Colors.cardBorder};
    }

    &[data-is-dragging-self='true'] {
      opacity: 0.5;
    }

    &[data-option-menu-open='true'] {
      z-index: 3;
    }
  `,
  utilRow: css`
    align-self: stretch;
    flex-direction: row;
    align-items: center;
    margin-bottom: 10px;

    .manager-badge {
      height: 18px;
      font-size: 12px;
      background-color: ${Colors.closedCardBg};
      border-radius: 4px;
      margin-left: 10px;
      padding: 0px 6px;
    }

    .delete-button {
      width: 18px;
      height: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      border: 1px solid ${Colors.blackSoftest};
      box-sizing: content-box;
      margin-left: 10px;
    }

    .save-button,
    .cancel-button {
      height: 18px;
      font-size: 12px;
      padding: 0 8px;
    }
  `,
  instructionsTab: css`
    align-self: stretch;
    padding: 10px;
    padding-bottom: 0;
    max-height: 300px;
    overflow-y: scroll;

    .flip-move-instructions {
      align-self: stretch;
      display: flex;
      flex-direction: column;
    }

    &[data-is-dragging='true'] {
      user-select: none;
    }
  `,
  instructionItem: css`
    align-self: stretch;
    margin-bottom: 10px;
    border-radius: 4px;
    border: 1px solid ${Colors.agentPanelBg};
    background-color: ${Colors.cardItemBg};
    box-sizing: content-box;
    font-size: 14px;

    .edit-button {
      display: block;
      align-self: stretch;
      padding: 10px 10px;
      padding-right: 40px;
      white-space: pre-wrap;
      line-height: 22px;
      border-radius: 4px;
      cursor: grab;
      user-select: text;
      overflow-wrap: break-word;
    }

    .delete-button {
      position: absolute;
      bottom: 10px;
      right: 10px;
      width: 18px;
      height: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 4px;
      border: 1px solid ${Colors.blackSoftest};
      box-sizing: content-box;
      margin-left: 10px;
    }

    &[data-can-edit='false'],
    &[data-is-for-reference-only='true'] {
      .edit-button {
        cursor: default;
        padding-right: 10px;
      }
    }

    &:hover:not([data-can-edit='false']):not(
        [data-is-for-reference-only='true']
      ) {
      border: 1px solid ${Colors.darkGrey};
    }

    &[data-is-dragging='true'] {
      border: 1px solid ${Colors.agentPanelBg};
    }

    &[data-is-dragging-self='true'] {
      opacity: 0.5;
    }
  `,
  addInstructionButton: css`
    display: flex;
    align-items: center;
    flex-direction: row;
    align-self: stretch;
    background-color: ${Colors.cardItemBg};
    border: 1px solid ${Colors.agentPanelBg};
    border-radius: 4px;
    padding: 10px 11px;
    font-size: 14px;
    margin-bottom: 10px;

    *:first-child {
      margin-right: 12px;
    }

    &:hover {
      border: 1px solid ${Colors.darkGrey};
    }
  `,
  instructionInput: css`
    align-self: stretch;
    margin-bottom: 10px;

    > div {
      align-self: stretch;
      display: block;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      border: 1px solid ${Colors.blackSoftest};
      border-radius: 4px;
    }

    textarea {
      width: 100%;
      min-height: 42px;
      line-height: 22px;
      padding: 10px 10px;
      padding-right: 40px;
      flex: 1;
      box-sizing: border-box;
      border-radius: 4px;
      white-space: pre-wrap;
      overflow-wrap: break-word;
      overflow: hidden;
      font-size: 14px;
    }

    .footer {
      border-radius: 4px;
      flex-direction: row;
      justify-content: flex-end;

      button {
        margin-right: 10px;
        margin-bottom: 10px;
      }
    }
  `,
  messagesTab: css`
    align-self: stretch;
    padding: 0;
    overflow-y: scroll;
    max-height: 300px;
  `,
  agentCardHeader: css`
    flex-direction: row;
    align-self: stretch;
    justify-content: space-between;
    padding: 10px;
    align-items: center;

    .expand-button {
      display: flex;
      justify-content: center;
      align-items: center;
      align-self: stretch;
      width: 42px;

      &[disabled=''],
      &[disabled='true'] {
        opacity: 0.5;
      }
    }
  `,
  input: css`
    border: 1px solid ${Colors.blackSoftest};
    height: 42px;
    padding: 0 10px;
    flex: 1;
    box-sizing: border-box;
    border-radius: 4px;
  `,
  name: css`
    margin: 11px;
  `,
  closeButton: css`
    position: relative;
    width: 42px;
    height: 42px;
    border-radius: 4px;
    font-size: 16px;
    border: 1px solid ${Colors.blackSoftest};
  `,
  agentId: css`
    display: flex;
    flex-direction: row;
    font-size: 12px;
    border: 1px solid ${Colors.blackSoftest};
    border-radius: 4px;
    /*margin-bottom: 10px;*/
    margin-left: 10px;
    position: relative;
    width: 115px;

    .id {
      border-radius: 4px;
      width: 18px;
      height: 18px;
      display: flex;
      justify-content: center;
      align-items: center;
      align-self: center;
      background-color: ${Colors.cardItemBg};

      > span {
      }
    }

    .display {
      display: flex;
      border-radius: 4px;
      flex: 1;
      height: 18px;
      flex-direction: row;
      justify-content: center;

      > span {
        position: relative;
        top: 1px;
        margin-left: 3px;
      }
    }

    &[data-disabled='true'] {
      color: rgba(0, 0, 0, 0.5);

      .display {
        background-color: ${Colors.agentPanelBg};
      }
    }

    .feedback {
      position: absolute;
      inset: -1px;
      background-color: ${Colors.green};
      color: white;
      border-radius: 4px;
      justify-content: center;
      align-self: center;
      flex-direction: row;

      > span {
        position: relative;
        top: 2px;
      }
    }
  `,
  optionsBlock: css`
    flex-direction: column;
    margin-left: 10px;
    margin-bottom: 10px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid ${Colors.blackSoftest};

    .option-row {
      display: flex;
      flex-direction: row;
      min-width: 221px;
      align-self: stretch;
      align-items: center;
      justify-content: space-between;
      padding-left: 7px;
      padding-right: 7px;
      height: 26px;
      user-select: none;
    }

    .option-row:not(:first-child) {
      border-top: 1px solid ${Colors.blackSoftest};
    }

    .dropdown {
      align-self: stretch;
    }

    &[data-bottom-row-menu-open='true'] {
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
    }
  `,
  divider: css`
    align-self: stretch;
    width: 1px;
    background-color: ${Colors.blackSoftest};
  `,
  instructionBuilder: css`
    align-self: stretch;
    min-height: 100px;
    border: 2px dashed ${Colors.blackSoft};
    border-radius: 4px;
    padding: 4px;

    > .area {
      align-self: stretch;
      flex: 1;

      > .placeholder {
        align-self: stretch;
        flex: 1;
        align-items: center;
        justify-content: center;
      }
    }

    > .footer {
      align-self: stretch;

      > .submit-button {
        align-self: flex-end;
      }
    }

    &[data-drag-hover='true'] {
      border-color: ${Colors.black70};
    }
  `,
}

type InstructionBuilderProps = {
  onSubmit: (blocks: Array<Block>) => any,
}

const InstructionBuilder = (props: InstructionBuilderProps): any => {
  const { onSubmit } = props

  const ref = useRef(null)
  const [blocks, setBlocks] = useState<Array<Block>>([])

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [])

  function handlePointerMove(e: any) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    if (isInside && mainStore.draggedBlockType) {
      ref.current.setAttribute('data-drag-hover', 'true')
    } else {
      ref.current.setAttribute('data-drag-hover', 'false')
    }
  }

  function handlePointerUp(e: any) {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const isInside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    if (isInside) {
      dropped()
    }
  }

  function dropped() {
    if (!mainStore.draggedBlockType) return
    const blockType = mainStore.draggedBlockType

    setTimeout(() => {
      // setTimeout is needed because after this function runs, which is trigged by a pointerup event,
      // a pointermove event triggers next with mainStore.draggedBlockType still having a value,
      // so that causes the data-drag-hover to set back to true.
      // By doing a setTimeout, it causes this data-drag-hover=false to run after the pointermove event.
      ref.current?.setAttribute('data-drag-hover', 'false')
    })

    if (blockType === BlockEnum.FROM) {
    } else if (blockType === BlockEnum.TO) {
    } else if (blockType === BlockEnum.FREEFORM) {
    } else {
      console.error('Unknown block type')
    }
  }

  function handleSubmit() {
    onSubmit([])
  }

  return (
    <View
      ref={ref}
      className={styles.instructionBuilder}
      onPointerUp={handlePointerUp}
    >
      <View className="area">
        {!blocks.length ? (
          <View className="placeholder">
            <Text style={{ opacity: 0.7 }}>
              {'Drag and drop instruction blocks here'}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="footer">
        <ButtonSquared
          small
          className="submit-button"
          onClick={handleSubmit}
          disabled={!blocks.length}
        >
          {'Submit'}
        </ButtonSquared>
      </View>
    </View>
  )
}

type InstructionItemProps = {
  isForReferenceOnly: boolean,
  style?: any,
  instruction: Instruction,
  column: ?number,
  onClick?: (element: ?HTMLElement, instruction: Instruction) => any,
  onDelete?: () => any,
  isDragging?: boolean,
  isDraggingSelf?: boolean,
  onPointerDown?: (event: any, element: HTMLElement) => any,
  onPointerEnter?: (e: any) => any,
}

const InstructionItem: any = forwardRef(
  (props: InstructionItemProps, ref: any) => {
    const {
      isForReferenceOnly,
      style,
      instruction,
      column,
      isDragging,
      isDraggingSelf,
      onClick,
      onDelete,
      onPointerDown,
      onPointerEnter,
    } = props

    const internalRef = useRef<?HTMLElement>(null)

    useEffect(() => {
      window.addEventListener('pointerdown', handleDragClick)

      return () => {
        window.removeEventListener('pointerdown', handleDragClick)
      }
    }, [])

    function handleDragClick(e: any) {
      if (!instruction.canEdit) return

      const isClickInside =
        internalRef.current && internalRef.current.contains(e.target)
      if (isClickInside) {
        if (onPointerDown) {
          onPointerDown(e, e.target)
        }
      }
    }

    return (
      <View
        ref={ref}
        style={style}
        className={styles.instructionItem}
        data-can-edit={!!instruction.canEdit}
        data-is-dragging={isDragging}
        data-is-dragging-self={isDraggingSelf}
        data-is-for-reference-only={isForReferenceOnly}
      >
        <View
          ref={internalRef}
          className={classnames(activeClassTransition, 'edit-button')}
          onPointerEnter={(e) => {
            if (!instruction.canEdit) return
            if (onPointerEnter) onPointerEnter(e)
          }}
          onClick={(e) => {
            if (!instruction.canEdit) return
            if (onClick) onClick(internalRef.current, instruction)
          }}
          disabled={isForReferenceOnly}
        >
          <InstructionClause
            clause={instruction?.clause ?? ''}
            column={column}
          />

          {!isForReferenceOnly && instruction.canEdit && onDelete ? (
            <Button
              className={'delete-button'}
              onClick={onDelete}
              onPointerDown={(e) => {
                // This prevents dragging from starting when pointerDown is on the button
                e.stopPropagation()
              }}
            >
              <PiTrash />
            </Button>
          ) : null}
        </View>
      </View>
    )
  },
)

type InstructionInputProps = {
  initialValue?: ?string,
  initialHeight?: ?number,
  onSubmit?: (value: string) => any,
  onCancel?: () => any,
  onBlur: (value: string) => any,
  submitButtonLabel?: string,
}

const InstructionInput: any = forwardRef(
  (props: InstructionInputProps, ref: any) => {
    const {
      initialValue,
      initialHeight,
      onSubmit,
      onCancel,
      onBlur,
      submitButtonLabel,
    } = props

    const internalRef = useRef<?HTMLElement>(null)

    const inputRef = useRef(null)
    const [value, setValue] = useState(initialValue ?? '')

    function handleInput(e: any) {
      setValue(e.target.value)
    }

    function handleSubmit() {
      if (onSubmit) onSubmit(value)
    }

    function handleBlur(events: any) {
      // This will cancel the blur event if the click is inside the component.
      const ownFooterClicked = events.some((event) => {
        return (
          (event.type === 'footer-click' &&
            internalRef.current?.contains(event.event.target)) ||
          (event.type === 'submit-click' &&
            internalRef.current?.contains(event.event.target))
        )
      })

      if (!ownFooterClicked) {
        onBlur(value)
      } else if (ownFooterClicked) {
        inputRef.current?.focus()
      }
    }

    // todo:
    //  Bluring inside with debounce is a problem because
    //  If the blur is outside, then the click event on the outside component is not debounced
    //  as much as the blur event here.

    return (
      <View ref={ref} className={styles.instructionInput}>
        <View ref={internalRef}>
          <Input
            ref={inputRef}
            style={{
              height: initialHeight,
            }}
            multiline
            placeholder={'How should this agent behave?'}
            value={value}
            onInput={handleInput}
            autoFocus
            onBlur={(e) => {
              mainStore.queueEvent('blur', handleBlur, e)
            }}
          />
          <View
            className={'footer'}
            onPointerDown={(e) => {
              mainStore.queueEvent('footer-click', () => {}, e)
            }}
          >
            <ButtonSquared
              small
              secondary
              onPointerDown={(e) => {
                mainStore.queueEvent('submit-click', () => {}, e)
              }}
              onClick={handleSubmit}
              disabled={!value}
            >
              {submitButtonLabel ?? 'Add'}
            </ButtonSquared>
          </View>
        </View>
      </View>
    )
  },
)

type AddInstructionButtonProps = {
  onClick: () => any,
}

const AddInstructionButton = (props: AddInstructionButtonProps): any => {
  const { onClick } = props

  return (
    <Button className={styles.addInstructionButton} onClick={onClick}>
      <PiPlusBold />
      <Text>{'Add an instruction'}</Text>
    </Button>
  )
}

type AgentInstructionsProps = {
  isForReferenceOnly: boolean,
  instructions: Array<Instruction>,
  column: ?number,
  onInstructionAdded: (value: string) => any,
  onInstructionsChanged: (instructions: Array<Instruction>) => any,
  onInstructionRemoved: (instruction: Instruction) => any,
}

const AgentInstructions = (props: AgentInstructionsProps): any => {
  const {
    isForReferenceOnly,
    instructions,
    column,
    onInstructionAdded,
    onInstructionsChanged,
    onInstructionRemoved,
  } = props

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

  const [showInstructionInput, setShowInstructionInput] = useState(false)
  const [edittingItem, setEdittingItem] = useState<?Instruction>(null)
  const [initialHeight, setInitialHeight] = useState<?number>(null)
  const [initialValue, setInitialValue] = useState('')
  const [isDragging, draggedItem, itemX, itemY, diffX, diffY, handleDragStart] =
    useDragAndDrop()
  const [draggedStyle, setDraggedStyle] = useState<any>(null)
  const [lastHoveredItem, setLastHoveredItem] = useState<?Instruction>(null)

  function startDrag(event: any, element: HTMLElement, instruction: any) {
    if (isMobile) return

    handleDragStart(event, element, instruction)

    const rect = element?.getBoundingClientRect() || {}
    const width = rect.width
    const height = rect.height

    setDraggedStyle({
      width,
      height,
    })
  }

  function handleOpenNew() {
    setShowInstructionInput(true)
  }

  function handleCancelNewInstruction() {
    setShowInstructionInput(false)
  }

  function handleSubmitNew(value: string) {
    setShowInstructionInput(false)
    onInstructionAdded(value)
  }

  function handleSubmitEdit(edittingItem: ?Instruction, value: string) {
    // editing existing
    const newInstructions = instructions.map((instruction) => {
      if (instruction.instructionId === edittingItem?.instructionId) {
        return {
          ...instruction,
          clause: value,
        }
      }
      return instruction
    })
    onInstructionsChanged(newInstructions)
    setEdittingItem(null)
  }

  function handleItemClick(element: ?HTMLElement, instruction: Instruction) {
    // -2 for border
    const height = element ? element.getBoundingClientRect().height - 2 : null

    setInitialHeight(height)
    setInitialValue(instruction.clause ?? '')
    setEdittingItem(instruction)
  }

  async function handleDeleteInstruction(instruction: Instruction) {
    if (instructions.length === 1) {
      showErrorModal('There must be at least one instruction.')
      return
    }

    const confirmation = await showConfirmationModal()

    if (confirmation) {
      onInstructionRemoved(instruction)
    }
  }

  function handlePointerEnter(hoveredInstruction: Instruction) {
    if (!isDragging || !draggedItem) return

    // FlipMove's animation causes extra pointerenter events to fire while the animation is happening.
    // To ignore these, the lastHoveredItem is stored and ignored.
    if (
      lastHoveredItem &&
      lastHoveredItem.instructionId === hoveredInstruction.instructionId
    ) {
      return
    }

    // Get the array position of the item which the cursor entered,
    // and put the draggedItem in its place.

    const removeDraggedItem = (instruction: Instruction) =>
      instruction.instructionId !== draggedItem.instructionId

    let indexOfHovered = instructions.findIndex(
      (instruction: Instruction) =>
        instruction.instructionId === hoveredInstruction.instructionId,
    )
    const indexOfDragged = instructions.findIndex(
      (instruction: Instruction) =>
        instruction.instructionId === draggedItem.instructionId,
    )
    if (indexOfHovered === indexOfDragged) {
      return
    }
    if (indexOfHovered > indexOfDragged) {
      // The dragged item is being moved down the list.
      indexOfHovered++
    }
    if (indexOfHovered !== -1) {
      setLastHoveredItem(hoveredInstruction)
      const newInstructions: Array<Instruction> = [
        ...instructions.slice(0, indexOfHovered).filter(removeDraggedItem),
        draggedItem,
        ...instructions.slice(indexOfHovered).filter(removeDraggedItem),
      ]
      onInstructionsChanged(newInstructions)
    }
  }

  return (
    <View className={styles.instructionsTab} data-is-dragging={isDragging}>
      <FlipMove
        className={'flip-move-instructions'}
        enterAnimation={'none'}
        leaveAnimation={'none'}
        duration={180}
        easing={'ease-out'}
        onFinish={() => {
          // Runs for each item, but necessary because onFinishAll does not always run.
          setLastHoveredItem(null)
        }}
      >
        {instructions.map((instruction) => {
          const isEditting =
            edittingItem?.instructionId === instruction.instructionId

          return isEditting ? (
            <InstructionInput
              key={instruction.instructionId}
              submitButtonLabel={'Save'}
              initialValue={initialValue}
              initialHeight={initialHeight}
              onSubmit={handleSubmitEdit}
              onBlur={(value) => {
                handleSubmitEdit(edittingItem, value)
              }}
            />
          ) : (
            <InstructionItem
              key={instruction.instructionId}
              isForReferenceOnly={isForReferenceOnly}
              instruction={instruction}
              column={column}
              isDragging={isDragging}
              isDraggingSelf={
                isDragging &&
                draggedItem?.instructionId === instruction.instructionId
              }
              onPointerDown={(event, element) => {
                if (isForReferenceOnly) return
                startDrag(event, element, instruction)
              }}
              onPointerEnter={() => {
                if (isForReferenceOnly) return
                handlePointerEnter(instruction)
              }}
              onClick={(element: ?HTMLElement, instruction: Instruction) => {
                if (isForReferenceOnly) return
                if (
                  isDragging &&
                  draggedItem?.instructionId === instruction.instructionId
                ) {
                  // click event on the dragged item happens when you let go after re-sort.
                  // We don't want the input to open in this case.
                  return
                }

                mainStore.queueEvent(
                  'edit',
                  () => {
                    handleItemClick(element, instruction)
                  },
                  { target: element },
                )
              }}
              onDelete={() => handleDeleteInstruction(instruction)}
            />
          )
        })}
      </FlipMove>
      {!isForReferenceOnly ? (
        showInstructionInput ? (
          <InstructionInput
            key={'new'}
            onSubmit={handleSubmitNew}
            onBlur={(value) => {
              if (value) {
                handleSubmitNew(value)
              } else {
                handleCancelNewInstruction()
              }
            }}
          />
        ) : (
          <AddInstructionButton
            key={'new'}
            onClick={(e) => {
              mainStore.queueEvent('new', handleOpenNew, e)
            }}
          />
        )
      ) : null}
      {isDragging && draggedItem ? (
        <InstructionItem
          style={{
            position: 'fixed',
            zIndex: 1,
            // transform: 'translate(-50%, -50%)',
            top: itemY + diffY,
            left: itemX + diffX,
            pointerEvents: 'none',
            opacity: 0.7,
            borderColor: Colors.darkGrey,
            ...draggedStyle,
          }}
          key={draggedItem.instructionId}
          instruction={draggedItem}
          column={column}
        />
      ) : null}
    </View>
  )
}

type AgentMessagesProps = {
  initialScrollToMessageId: ?number,
  agency: Agency,
  messages: Array<FlatMessage>,
  currentUser?: ?User,
}

const AgentMessages = (props: AgentMessagesProps): any => {
  const { initialScrollToMessageId, agency, messages, currentUser } = props

  const lastMessage = messages[messages.length - 1]

  const scrollRef = useRef(null)
  const [stickyScrolling, setStickyScrolling] = useState(
    !initialScrollToMessageId,
  )
  useEffect(() => {
    if (!scrollRef.current) return

    function handleScroll(event: any) {
      const scrollElement = scrollRef.current
      const scrollHeight = scrollElement?.scrollHeight ?? 0
      const scrollTop = scrollElement?.scrollTop ?? 0
      const clientHeight = scrollElement?.clientHeight ?? 0
      const scrollBottom = scrollHeight - scrollTop - clientHeight
      const isAtBottom = scrollBottom < 1

      if (isAtBottom) {
        setStickyScrolling(true)
      } else {
        setStickyScrolling(false)
      }
    }

    scrollRef.current.addEventListener('scroll', handleScroll)

    return () => {
      scrollRef.current?.removeEventListener('scroll', handleScroll)
    }
  }, [scrollRef.current])
  useEffect(() => {
    if (!scrollRef.current) return

    if (stickyScrolling) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [stickyScrolling, messages.length, lastMessage?.text])

  return (
    <View ref={scrollRef} className={styles.messagesTab}>
      {messages.map((message) => {
        return (
          <ChatMessage
            key={message.messageId}
            // onMount={handleMessageMounted}
            scrollToOnMount={initialScrollToMessageId === message.messageId}
            message={message}
            agency={agency}
            indicatorColor={Colors.panelBg}
            currentUser={currentUser}
          />
        )
      })}
      {/*{isWriting && (lastMessage?.role !== MessageRole.ASSISTANT) ? (*/}
      {/*  <PlacehoderChatMessage color={Colors.panelBg} />*/}
      {/*) : null}*/}
    </View>
  )
}

type AgentCardHeaderProps = {
  isForReferenceOnly: boolean,
  nameValue: string,
  onNameChange: (e: any) => any,
  onEnterPress?: ?() => any,
  isNew?: boolean,
  expanded: boolean,
  onCollapse: () => any,
}

const AgentCardHeader = (props: AgentCardHeaderProps): any => {
  const {
    isForReferenceOnly,
    nameValue,
    onNameChange,
    onEnterPress,
    isNew,
    expanded,
    onCollapse,
  } = props

  return (
    <View className={styles.agentCardHeader}>
      {expanded ? (
        <Button
          className={'expand-button'}
          onClick={onCollapse}
          disabled={isNew}
        >
          <PiCaretUpBold />
        </Button>
      ) : (
        <View className={'expand-button'}>
          <PiCaretDownBold />
        </View>
      )}
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          height: 42,
          alignItems: 'center',
        }}
      >
        {expanded && !isForReferenceOnly ? (
          <Input
            className={styles.input}
            placeholder={'Agent Name'}
            autoFocus={!nameValue}
            value={nameValue}
            onInput={onNameChange}
            onEnterPress={onEnterPress}
          />
        ) : (
          <Text className={styles.name}>{nameValue}</Text>
        )}
      </View>
    </View>
  )
}

type AgentIdProps = {
  value: number,
  onClick?: () => any,
}

const AgentId = (props: AgentIdProps): any => {
  const { value, onClick } = props

  const [feedbackMessage, setFeedbackMessage] = useState<?string>(null)

  function handleClick(message: string) {
    if (!value) return
    navigator.clipboard.writeText('#' + value)
    setFeedbackMessage(message)
    setTimeout(() => {
      setFeedbackMessage(null)
    }, 2000)
  }

  return (
    <Button
      className={styles.agentId}
      data-disabled={!value}
      onClick={() => {
        if (onClick) onClick()
        handleClick('Agent ID copied')
      }}
      disabled={!value}
    >
      <View className={'id'}>
        <Text>{'ID'}</Text>
      </View>
      <View className={styles.divider} />
      <View className={'display'}>
        <Text>{value}</Text>
      </View>
      {feedbackMessage ? (
        <View className={'feedback'}>
          <Text>{feedbackMessage}</Text>
        </View>
      ) : null}
    </Button>
  )
}

type OptionsBlockProps = {
  availableModels: Array<string>,
  chosenModel: string,
  onChangeModel: (model: string) => any,
  onOptionMenuOpen: () => any,
  onOptionMenuClose: () => any,
}

const OptionsBlock = (props: OptionsBlockProps) => {
  const {
    availableModels,
    chosenModel,
    onChangeModel,
    onOptionMenuOpen,
    onOptionMenuClose,
  } = props

  const [showModelMenu, setShowModelMenu] = useState(false)

  function toggleModelMenu() {
    setTimeout(() => {
      setShowModelMenu(!showModelMenu)
      if (!showModelMenu) {
        onOptionMenuOpen()
      } else {
        onOptionMenuClose()
      }
    })
  }

  function closeModelMenu() {
    setShowModelMenu(false)
  }

  function renderModelMenuItem(item: string): Node {
    return <Text>{item}</Text>
  }

  return (
    <View
      className={styles.optionsBlock}
      data-bottom-row-menu-open={showModelMenu}
    >
      <View className={'option-row'}>
        <Button
          // className={buttonTransition}
          onClick={toggleModelMenu}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'stretch',
            flex: 1,
            justifyContent: 'space-between',
          }}
          disabled={!availableModels?.length}
        >
          <Text>{'Model'}</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ marginRight: 9 }}>{chosenModel}</Text>
            {availableModels?.length ? <PiCaretDownBold /> : null}
          </View>
        </Button>
        <DropdownMenu
          show={showModelMenu}
          onClose={closeModelMenu}
          renderItem={renderModelMenuItem}
          items={availableModels}
          selectedItem={chosenModel}
          onSelect={onChangeModel}
        />
      </View>
    </View>
  )
}

type AgentCardProps = {
  style?: any,
  className?: string,
  agencyId: number,
  agency: Agency,
  messages?: Array<FlatMessage>,
  isForReferenceOnly?: boolean,
  agent?: ?Agent,
  column?: ?number,
  availableModels?: Array<string>,
  onAgentUpdate?: (agent: Agent) => any,
  onCloseNewAgent?: (agentId: number) => any,
  initiallyExpanded?: boolean,
  currentUser?: ?User,

  // For dragging:
  isDragging?: boolean,
  isDraggingSelf?: boolean,
  onPointerDown?: (event: any, element: HTMLElement) => any,
  onPointerEnter?: (e: any) => any,
}

const AgentCard: AbstractComponent<AgentCardProps, any> = forwardRef(
  (props: AgentCardProps, forwardRef: any): any => {
    const {
      style,
      className,
      agencyId,
      agency,
      messages,
      agent,
      isForReferenceOnly,
      column,
      availableModels,
      onAgentUpdate,
      onCloseNewAgent,
      initiallyExpanded,
      currentUser,
      isDragging,
      isDraggingSelf,
      onPointerDown,
      onPointerEnter,
    } = props

    const [history] = useHistory()

    const ref = useRef(null)
    function setRef(el: any) {
      if (!el) {
        return
      }
      if (!agentId) {
        return
      }
      ref.current = el
      if (column || column === 0) {
        mainStore.registerCard(column, agentId, el, handleExpandCard)
      }
    }

    const isNew = !agent
    const agentId = agent?.agentId ?? 0
    const nAgents = agency?.agents?.length ?? 0
    const isManager = !!agent?.isManager

    const [expanded, setExpanded] = useState(isNew || !!initiallyExpanded)
    const [initialTabIndex, setInitialTabIndex] = useState(0)

    const [agentName, localAgentName, setAgentName] = useServerState<string>(
      agent?.name ?? '',
    )

    const [instructions, localInstructions, setInstructions] = useServerState<
      Array<Instruction>,
    >(
      agent?.instructions ?? [
        {
          instructionId: '',
          agentId: 0,
          clause: 'You will receive instructions from the manager.',
          orderIndex: 0,
          canEdit: false,
          isDeleted: false,
          dateUpdated: '',
          dateCreated: '',
        },
      ],
    )
    const [chosenModel, localChosenModel, setChosenModel] =
      useServerState<string>(agent?.model ?? availableModels?.[0] ?? '')

    function handleAgentUpdate(newestData: {|
      name?: string,
      model?: string,
      instructions?: Array<Instruction>,
    |}) {
      if (onAgentUpdate) {
        const nextAgent: Agent = {
          ...agent,
          name: agentName,
          model: chosenModel,
          instructions,
          ...newestData,
        }
        onAgentUpdate(nextAgent)
      }
    }

    // const isInitialMount = useRef(true)
    // useEffect(() => {
    //   if (isInitialMount.current) {
    //     isInitialMount.current = false
    //   } else {
    //     handleAgentUpdate()
    //   }
    // }, [localAgentName, localInstructions, localChosenModel])

    function agentNameChanged(e: any) {
      setAgentName(e.target.value)
      handleAgentUpdate({ name: e.target.value })
    }

    function addInstruction(value: string) {
      console.log('addInstruction')
      const newInstruction = createInstruction(
        agentId,
        value,
        // instructions.length,
      )
      setInstructions([...instructions, newInstruction])
      handleAgentUpdate({ instructions: [...instructions, newInstruction] })
    }

    function instructionsChanged(instructions: Array<Instruction>) {
      setInstructions(instructions)
      handleAgentUpdate({ instructions })
    }

    function instructionRemoved(instruction: Instruction) {
      console.log('addInstruction')
      const nextInstructions = instructions.filter(
        (i) => i.instructionId !== instruction.instructionId,
      )
      setInstructions(nextInstructions)
      handleAgentUpdate({ instructions: nextInstructions })
    }

    const [initialScrollToMessageId, setInitialScrollToMessageId] =
      useState<?number>(null)
    function handleExpandCard(scrollToMessageId?: ?number) {
      if (isDraggingSelf) {
        return
      }

      if (isForReferenceOnly) {
        setInitialTabIndex(1)
        setInitialScrollToMessageId(scrollToMessageId)
        setExpanded(true)
      } else {
        setExpanded(true)
      }
    }

    function handleCollapseCard() {
      setExpanded(false)
    }

    const saveArgs = useRef({
      agencyId,
      chosenModel,
      agentName,
      instructions,
      nAgents,
    })
    useEffect(() => {
      saveArgs.current = {
        agencyId,
        chosenModel,
        agentName,
        instructions,
        nAgents,
      }
    }, [agencyId, chosenModel, agentName, instructions, nAgents])
    async function handleSaveCard() {
      // A delayed function is used here in case the user is clicking on the
      // save button while an input is still focused.
      // This allows the blur event to be handled first.
      await delay(100)
      const { agencyId, chosenModel, agentName, instructions, nAgents } =
        saveArgs.current

      if (!agentName) {
        showErrorModal('Please enter an agent name.')
        return
      }

      // The CreateAgentResolver will add one non-editable instruction.
      // if (!instructions.length) {
      //   showErrorModal('Please provide at least one instruction.')
      //   return
      // }

      const res = await CreateAgentMutation({
        sessionToken: nonMaybe(sessionStore.sessionToken),
        agencyId,
        model: chosenModel,
        name: agentName,
        // Agents are ordered DESC so that new agents can be added to the top
        // without the need to update all the other agents' orderIndex.
        orderIndex: nAgents,
        instructions,
      })

      if (res?.success) {
        setExpanded(false)
        if (onCloseNewAgent) onCloseNewAgent(nonMaybe(res.agentId))
        if (
          res?.agency?.lookupId &&
          res?.agency?.lookupId !== agency.lookupId
        ) {
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

    async function handleDeleteAgent() {
      const agentId = agent?.agentId
      if (!agentId) return

      if (isManager) {
        showErrorModal('There must be one manager for the agency.')
        return
      }

      const confirmation = await showConfirmationModal()

      if (confirmation) {
        const res = await DeleteAgentMutation({
          sessionToken: nonMaybe(sessionStore.sessionToken),
          agentId,
        })
        if (res?.success) {
          if (
            res?.agency?.lookupId &&
            res?.agency?.lookupId !== agency.lookupId
          ) {
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
    }

    const [optionMenuOpen, setOptionMenuOpen] = useState(false)
    function handleOptionMenuOpen() {
      setOptionMenuOpen(true)
    }
    function handleOptionMenuClose() {
      setOptionMenuOpen(false)
    }

    if (!expanded) {
      return (
        <View
          ref={forwardRef}
          className={classnames(className, styles.container)}
          style={style}
        >
          <Button
            ref={setRef}
            className={classnames(styles.card, 'scroll-item')}
            onClick={handleExpandCard}
            data-expanded={expanded}
            data-is-dragging={isDragging}
            data-is-dragging-self={isDraggingSelf}
            onPointerDown={(event) => {
              const childElement = ref.current
              // const element = childElement?.parentNode
              const element = childElement
              if (element && onPointerDown) onPointerDown(event, element)
            }}
            onPointerEnter={onPointerEnter}
          >
            <View style={{ alignSelf: 'stretch' }}>
              <AgentCardHeader
                nameValue={agentName}
                onNameChange={agentNameChanged}
                onEnterPress={handleSaveCard}
                expanded={expanded}
                onCollapse={handleCollapseCard}
                isForReferenceOnly={!!isForReferenceOnly}
              />
            </View>
          </Button>
        </View>
      )
    } else {
      return (
        <View
          ref={forwardRef}
          className={classnames(className, styles.container)}
        >
          <View
            ref={setRef}
            className={classnames(styles.card, 'scroll-item')}
            data-option-menu-open={optionMenuOpen}
            data-expanded={expanded}
            data-is-dragging={isDragging}
            data-is-dragging-self={isDraggingSelf}
          >
            <AgentCardHeader
              nameValue={agentName}
              onNameChange={agentNameChanged}
              onEnterPress={isNew ? handleSaveCard : null}
              expanded={expanded}
              isNew={isNew}
              onCollapse={handleCollapseCard}
              isForReferenceOnly={!!isForReferenceOnly}
            />
            <View className={styles.utilRow}>
              <AgentId value={agent?.referenceId ?? 0} />
              {isManager ? (
                <View className={'manager-badge'}>
                  <Text>Manager</Text>
                </View>
              ) : null}
              {!isForReferenceOnly ? (
                isNew ? (
                  <ButtonSquared
                    className={'cancel-button'}
                    small
                    secondary
                    style={{
                      marginLeft: 10,
                    }}
                    onClick={onCloseNewAgent}
                  >
                    <Text>{'Cancel'}</Text>
                  </ButtonSquared>
                ) : (
                  <Button
                    className={'delete-button'}
                    onClick={handleDeleteAgent}
                  >
                    <PiTrash />
                  </Button>
                )
              ) : null}
              {isNew ? (
                <ButtonSquared
                  className={'save-button'}
                  small
                  primary
                  style={{
                    marginLeft: 10,
                  }}
                  onClick={handleSaveCard}
                >
                  <Text>{'Save'}</Text>
                </ButtonSquared>
              ) : null}
            </View>
            <OptionsBlock
              availableModels={availableModels ?? []}
              chosenModel={chosenModel}
              onChangeModel={(value) => {
                setChosenModel(value)
                handleAgentUpdate({ model: value })
              }}
              onOptionMenuOpen={handleOptionMenuOpen}
              onOptionMenuClose={handleOptionMenuClose}
            />
            <Divider />
            <Tabs
              initialTabIndex={initialTabIndex}
              data={[
                {
                  label: 'Instructions',
                  render: () => (
                    <AgentInstructions
                      instructions={instructions}
                      column={column}
                      onInstructionAdded={addInstruction}
                      onInstructionsChanged={instructionsChanged}
                      onInstructionRemoved={instructionRemoved}
                      isForReferenceOnly={!!isForReferenceOnly}
                    />
                  ),
                },
                {
                  label: 'Messages',
                  render: () => (
                    <AgentMessages
                      initialScrollToMessageId={initialScrollToMessageId}
                      agency={agency}
                      messages={messages ?? []}
                      currentUser={currentUser}
                    />
                  ),
                  disabled: isNew || !isForReferenceOnly,
                },
              ]}
            />
          </View>
        </View>
      )
    }
  },
)

export default AgentCard

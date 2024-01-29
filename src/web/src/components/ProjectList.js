// @flow

import type {
  InfiniteScrollerRenderProps,
  PaginationArgs,
  PaginationResult,
} from './InfiniteScroller.js'
import client from '../apolloClient.js'
import GetProjects from '../graphql/GetProjects.js'
import InfiniteScroller from './InfiniteScroller.js'
import { ButtonSquared } from './Button.js'
import ProjectCard from './ProjectCard.js'
import React from 'react'
import { orderings } from '../dpages/Home.js'
import mainStore from '../stores/MainStore.js'
import { observer } from 'mobx-react-lite'
import { css } from 'goober'
import GetPublicProjects from '../graphql/GetPublicProjects.js'

const styles = {
  paginationButton: css`
    position: relative;
    width: 100%;
    margin: 10px 0;
    z-index: 1;
    background-color: white;
  `,
  projectList: css`
    display: grid;
    grid-template-columns: [col1] 1fr [col2] 1fr [col3] 1fr [end];
    /*grid-template-rows: [row1] auto [row2] auto [row3] auto [end];*/
    /*grid-auto-rows: 1fr 1fr;*/
    column-gap: 10px;
    row-gap: 10px;
    justify-items: stretch;
    align-items: stretch;
    justify-content: stretch;
    align-content: start;

    @media (max-width: 700px) {
      grid-template-columns: [col1] 1fr [col2] 1fr [end];
    }

    @media (max-width: 500px) {
      grid-template-columns: [col1] 1fr [end];
    }
  `,
}

const RefreshIndicator: any = (props) => {
  return (
    <div
      id="refresh"
      style={{
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'red',
        ...props.style,
      }}
    ></div>
  )
}

type ProjectListProps = {
  username?: string,
  sessionToken?: string,
}

const ProjectList: any = observer((props) => {
  const { username, sessionToken } = props

  async function sendQuery(args: PaginationArgs): Promise<?PaginationResult> {
    if (username) {
      const res = await client.query({
        query: GetPublicProjects,
        variables: {
          username,
          ...args,
        },
        fetchPolicy: 'network-only',
      })
      return res?.data?.viewer?.user?.projects
    } else if (sessionToken) {
      const res = await client.query({
        query: GetProjects,
        variables: {
          sessionToken,
          ...args,
        },
        fetchPolicy: 'network-only',
      })
      return res?.data?.viewer?.currentUser?.projects
    }
  }

  function onRef(instance: any) {
    mainStore.setScroller(instance)
  }

  return (
    <InfiniteScroller
      ref={onRef}
      onQuery={sendQuery}
      orderings={orderings}
      pageSize={7}
      rowGap={10}
      maxItemsPerRow={3}
      mediaQueries={[
        {
          maxWidth: 700,
          itemsPerRow: 2,
        },
        {
          maxWidth: 500,
          itemsPerRow: 1,
        },
      ]}
      getItemId={(project) => project.projectId}
      refreshNewCallback={(refreshingNew) => {
        // console.log('refreshingNew', refreshingNew)
      }}
      refreshMoreCallback={(refreshingMore) => {
        // console.log('refreshingMore', refreshingMore)
      }}
      showQueryParameters
    >
      {(props: InfiniteScrollerRenderProps) => {
        return (
          <>
            {!!props.countItems ? (
              <ButtonSquared
                className={styles.paginationButton}
                onClick={props.onNew}
                style={props.hasMoreButtonStyle}
              >
                {props.refreshingNew
                  ? 'Refreshing...'
                  : props.hasNew
                  ? `Show ${props.countNew} New`
                  : 'Refresh'}
              </ButtonSquared>
            ) : null}
            {props.topSentinel}
            <div
              ref={props.containerRef}
              className={styles.projectList}
              style={props.containerStyle}
            >
              {props.renderedItems.map((project, i) => {
                // console.log(project.title, props.keys[i])
                return (
                  <ProjectCard
                    id={props.keys[i]}
                    ref={props.itemRefs[i]}
                    key={props.keys[i]}
                    style={props.itemStyles[i]}
                    project={project}
                  />
                )
              })}
            </div>
            {props.bottomSentinel}
            <ButtonSquared
              className={styles.paginationButton}
              onClick={props.onMore}
            >
              {props.refreshingMore
                ? 'Refreshing...'
                : props.hasMore
                ? 'Show More'
                : 'Refresh'}
            </ButtonSquared>
            {<RefreshIndicator style={props.refreshNewIndicatorStyle} />}
          </>
        )
      }}
    </InfiniteScroller>
  )
})

export default ProjectList

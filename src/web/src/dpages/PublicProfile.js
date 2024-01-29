// @flow

import type { ReactRouterProps } from '../types/ReactRouter.js'
import React, { useState } from 'react'
import { observer } from 'mobx-react-lite'
import Body from '../components/Body.js'
import { css } from 'goober'
import ProjectModal from '../modals/ProjectModal.js'
import ProjectList from '../components/ProjectList.js'
import { useQuery } from '@apollo/client'
import GetPublicUser from '../graphql/GetPublicUser.js'
import Landing from './Landing.js'

const styles = {
  page: css``,
}

type PublicProfileProps = {|
  ...ReactRouterProps,
|}

const PublicProfile: any = observer((props: PublicProfileProps) => {
  const username = props.match.params['username']

  const [showProjectModal, setShowProjectModal] = useState(false)
  const [isCreateMode, setIsCreateMode] = useState(false)
  const res = useQuery(GetPublicUser, {
    variables: {
      username,
    },
  })

  function startProjectCreation() {
    setIsCreateMode(true)
    setShowProjectModal(true)
  }

  function closeProjectModal() {
    setShowProjectModal(false)
  }

  if (res.loading) {
    return null
  }

  if (!res.data?.viewer?.user) {
    return <Landing />
  }

  return (
    <Body className={styles.page}>
      <ProjectList username={username} />
      <ProjectModal
        create={isCreateMode}
        project={null}
        open={showProjectModal}
        onClose={closeProjectModal}
      />
    </Body>
  )
})

export default PublicProfile

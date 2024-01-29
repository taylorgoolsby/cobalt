// @flow

import React from 'react'
import { observer } from 'mobx-react-lite'
import { css } from 'goober'
import { Route, Switch, useParams } from 'react-router-dom'
import Body from '../components/Body.js'
import AgencyInstruct from './AgencyInstruct.js'
import AgencyInteract from './AgencyInteract.js'
import AgencyPublish from './AgencyPublish.js'
import { useQuery } from '@apollo/client'
import View from '../components/View.js'
import Text from '../components/Text.js'
import sessionStore from '../stores/SessionStore.js'
import GetAgency from '../graphql/GetAgency.js'
import GetAgencies from '../graphql/GetAgencies.js'
import GetAgencyDetails from '../graphql/GetAgencyDetails.js'
import GetCurrentUser from '../graphql/GetCurrentUser.js'
import AgencyList from '../components/AgencyList.js'
import Settings from './Settings.js'
import Colors from '../Colors.js'

export const orderings = [
  { index: 'dateCreated', direction: 'desc' },
  { index: 'projectId', direction: 'desc' },
]

const styles = {
  page: css`
    background-color: ${Colors.panelBg};

    .main-panel {
      @media (max-width: 600px) {
        padding-top: 52px;
      }
    }
  `,
}

const AgencySwitch = observer(() => {
  const { lookupId } = useParams()

  const preliminaryRes = useQuery(lookupId ? GetAgency : GetAgencies, {
    variables: {
      sessionToken: sessionStore.sessionToken,
      lookupId,
    },
  })
  const foundLookupId =
    lookupId ||
    preliminaryRes?.data?.viewer?.currentUser?.agencies?.[0]?.lookupId

  const res = useQuery(GetAgencyDetails, {
    variables: {
      sessionToken: sessionStore.sessionToken,
      lookupId: foundLookupId,
    },
    fetchPolicy: 'cache-and-network',
  })
  const agencyExists = !!res.data?.viewer?.agency?.name

  const currentUserRes = useQuery(GetCurrentUser, {
    variables: {
      sessionToken: sessionStore.sessionToken,
    },
  })
  const currentUser = currentUserRes.data?.viewer?.currentUser ?? {}
  const agency = res.data?.viewer?.agency ?? {}

  const isLoading =
    !agencyExists &&
    (preliminaryRes.loading || res.loading || currentUserRes.loading)

  if (isLoading) {
    return (
      <View
        className={'main-panel'}
        style={{
          alignSelf: 'stretch',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.panelBg,
        }}
      >
        <Text>Loading...</Text>
      </View>
    )
  } else if (!lookupId) {
    return (
      <View
        className={'main-panel'}
        style={{
          alignSelf: 'stretch',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.panelBg,
        }}
      ></View>
    )
  } else if (!agencyExists) {
    return (
      <View
        className={'main-panel'}
        style={{
          alignSelf: 'stretch',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: Colors.panelBg,
        }}
      >
        <Text>Agency not found</Text>
      </View>
    )
  }

  return (
    <Switch>
      <Route
        exact
        path={'/app/agency/:lookupId/instruct'}
        render={() => {
          return (
            <AgencyInstruct
              key={'Instruct'}
              className={'main-panel'}
              agency={agency}
              currentUser={currentUser}
            />
          )
        }}
      />
      <Route
        exact
        path={'/app/agency/:lookupId/interact'}
        render={() => {
          return (
            <AgencyInteract
              key={'Interact'}
              className={'main-panel'}
              agency={agency}
              currentUser={currentUser}
            />
          )
        }}
      />
      <Route
        exact
        path={'/app/agency/:lookupId/publish'}
        render={() => {
          return (
            <AgencyPublish
              key={'Publish'}
              className={'main-panel'}
              agency={agency}
              currentUser={currentUser}
            />
          )
        }}
      />
    </Switch>
  )
})

const Home: any = observer(() => {
  return (
    <Body className={styles.page}>
      <AgencyList />
      <Switch>
        <Route exact path={'/app'} component={AgencySwitch} />
        <Route exact path={'/app/settings'} component={Settings} />
        <Route path={'/app/agency/:lookupId'} component={AgencySwitch} />
      </Switch>
    </Body>
  )
})

export default Home

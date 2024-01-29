// @flow

import React, { useEffect } from 'react'
import { Switch, Route } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import { css } from 'goober'
import sessionStore from './stores/SessionStore.js'
import Header from './components/Header.js'
import View from './components/View.js'
import Landing from './dpages/Landing.js'
import Home from './dpages/Home.js'
import Privacy from './dpages/Privacy.js'
import Terms from './dpages/Terms.js'
import Settings from './dpages/Settings.js'
import AuthPage from './dpages/AuthPage.js'
import { useQuery } from '@apollo/client'
import GetCurrentUser from './graphql/GetCurrentUser.js'
import Onboarding from './dpages/Onboarding.js'
import CreateAccountPage from './dpages/CreateAccountPage.js'
import getUrlParams from './utils/getUrlParams.js'
import chatStore from './stores/ChatStore.js'
import Docs from './dpages/Docs.js'

const styles = {
  app: css`
    align-self: stretch;
    /*border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 20px;*/
    min-height: 100dvh;
    max-height: 100dvh;
  `,
  widePage: css`
    width: 720px;
  `,
}

const authenticatedRoute: any = (Component) => {
  return observer((props) => {
    const res = useQuery(GetCurrentUser, {
      variables: {
        sessionToken: sessionStore.sessionToken,
      },
    })

    const { merging } = getUrlParams()
    if (merging) {
      return null
    }

    if (sessionStore.observables.loading) {
      return null
    }
    if (!sessionStore.observables.isLoggedIn) {
      return <Landing />
    }
    if (!sessionStore.observables.loaded) {
      return <Landing />
    }

    if (res.loading) {
      return null
    }
    const currentUser = res.data?.viewer?.currentUser
    const isOnboarded = !!currentUser?.isOnboarded
    if (!!currentUser && !isOnboarded) {
      return <Onboarding />
    }

    return <Component />
  })
}

// Home is an authenticated route, so it can use sessionStore.sessionToken.
// Unauthenticated routes cannot.

export const routes: { [string]: any } = {
  '/auth': Landing,
  '/create': Landing,
  '/terms': Terms,
  '/privacy': Privacy,
  '/docs': Docs,
  '/': authenticatedRoute(Home),
  // '/settings': authenticatedRoute(Home),
  // '/agency/:lookupId/instruct': authenticatedRoute(Home),
  // '/agency/:lookupId/interact': authenticatedRoute(Home),
  // '/agency/:lookupId/publish': authenticatedRoute(Home),
}

const App: any = () => {
  return (
    <View id="app" className={styles.app}>
      <Switch>
        {Object.keys(routes).map((path, i) => {
          return (
            <Route
              key={i}
              exact
              path={path}
              render={(props) => {
                const Component = routes[path]
                return <Component {...props} />
              }}
            />
          )
        })}
        <Route
          path={'/*'}
          render={(props) => {
            const Component = routes['/']
            return <Component {...props} />
          }}
        />
      </Switch>
      {/*<Footer />*/}
    </View>
  )
}

export default App

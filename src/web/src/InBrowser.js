// @flow

// import Bugsnag from '@bugsnag/js'
// import BugsnagPluginReact from '@bugsnag/plugin-react'

// Bugsnag does not use cookies.
// Bugsnag.start({
//   apiKey: process.env.BUGSNAG_KEY,
//   plugins: [new BugsnagPluginReact()],
//   appVersion: '1',
//   // $FlowFixMe
//   releaseStage: process.env.RUNTIME,
//   enabledReleaseStages: ['production', 'staging'],
//   redactedKeys: [/token/, /Token/],
// })

// import posthog from 'posthog-js'
//
// if (process.env.RUNTIME === 'production') {
//   posthog.init(process.env.POSTHOG_KEY, {
//     api_host: 'https://app.posthog.com',
//     autocapture: false,
//   })
// }

import React from 'react'
import { makeHistory } from './utils/history.js'
import { ApolloProvider, useQuery } from '@apollo/client'
import apolloClient from './apolloClient.js'
import { Route, Router, Switch } from 'react-router-dom'
import ModalLayer from './modals/ModalLayer.js'
import { configure } from 'mobx'
import View from './components/View.js'
import GetCurrentUser from './graphql/GetCurrentUser.js'
import sessionStore from './stores/SessionStore.js'
import getUrlParams from './utils/getUrlParams.js'
import Landing from './dpages/Landing.js'
import Onboarding from './dpages/Onboarding.js'
import Home from './dpages/Home.js'
import { observer } from 'mobx-react-lite'
import { css } from 'goober'
// import Terms from './dpages/Terms.js'
// import Docs from './dpages/Docs.js'
// import Privacy from './dpages/Privacy.js'
import Colors from './Colors.js'
// import CookieBanner from './components/CookieBanner.js'
// import Cookie from './dpages/Cookie.js'
// import Script from 'next/script'

configure({
  enforceActions: 'never',
})

const history = makeHistory()
// const ErrorBoundary = Bugsnag.getPlugin('react').createErrorBoundary(React)

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

const Body: any = observer((): any => {
  const res = useQuery(GetCurrentUser, {
    variables: {
      sessionToken: sessionStore.sessionToken,
    },
  })

  const { merging } = getUrlParams()
  if (merging) {
    return (
      <View
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: Colors.panelBg,
        }}
      />
    )
  }

  if (sessionStore.observables.loading) {
    return (
      <View
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: Colors.panelBg,
        }}
      />
    )
  }

  if (!sessionStore.observables.isLoggedIn) {
    return <Landing />
  }
  if (!sessionStore.observables.loaded) {
    return <Landing />
  }

  if (res.loading) {
    return (
      <View
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: Colors.panelBg,
        }}
      />
    )
  }
  const currentUser = res.data?.viewer?.currentUser
  const isOnboarded = !!currentUser?.isOnboarded
  if (!!currentUser && !isOnboarded) {
    return <Onboarding />
  }

  return <Home />
})

export const routes: { [string]: any } = {
  '/': Body,
  // '/auth': Landing,
  // '/create': Landing,
  // '/terms': Terms,
  // '/privacy': Privacy,
  // '/cookie': Cookie,
  // '/docs': Docs,
  // '/app': Body,
}

// InBrowser is responsible for rendering the SPA portion of the app.
// This file should be dynamically imported so as to load browser history
// and other libraries only when a DOM is present (I.E. when running in a browser environment).
const InBrowser: any = observer((): any => {
  return (
    <>
      {/*<ErrorBoundary>*/}
      <ApolloProvider client={apolloClient}>
        <Router history={history}>
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
                  return <Body {...props} />
                }}
              />
            </Switch>
            {/*{sessionStore.appLoaded ? <CookieBanner /> : null}*/}
          </View>
          <ModalLayer />
        </Router>
      </ApolloProvider>
      {/*</ErrorBoundary>*/}
      {/*/!* Google tag (gtag.js) *!/*/}
      {/*{!!sessionStore.cookieSettings?.performance && process.env.GTAG_ID ? (*/}
      {/*  <>*/}
      {/*    <Script*/}
      {/*      strategy="afterInteractive"*/}
      {/*      src={`https://www.googletagmanager.com/gtag/js?id=${process.env.GTAG_ID}`}*/}
      {/*    />*/}
      {/*    <Script strategy="afterInteractive">*/}
      {/*      {`*/}
      {/*        window.dataLayer = window.dataLayer || [];*/}
      {/*        function gtag(){dataLayer.push(arguments);}*/}
      {/*        gtag('js', new Date());*/}
      {/*        gtag('config', '${process.env.GTAG_ID}');*/}
      {/*      `}*/}
      {/*    </Script>*/}
      {/*  </>*/}
      {/*) : null}*/}
    </>
  )
})

export default InBrowser

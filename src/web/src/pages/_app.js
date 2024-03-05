// @flow

import React, {
  Suspense,
  useState,
  useEffect,
  createElement,
  useRef,
} from 'react'
import Head from 'next/head'
import View from '../components/View.js'
import { setup } from 'goober'
import { prefix } from 'goober/prefixer'
import { css } from 'goober'
import { createGlobalStyles } from 'goober/global'
import sessionStore from '../stores/SessionStore.js'

const LazyInBrowser = React.lazy(() => import('../InBrowser.js'))

// goober's needs to know how to render the `styled` nodes.
// So to let it know, we run the `setup` function with the
// `createElement` function and prefixer function.
setup(createElement, prefix)

const GlobalStyles = createGlobalStyles`
  html {
    tab-size: 4;
    background-color: white;
  }

  html, body {
    margin: 0;
  }

  body {
    width: 100vw;
    min-width: 100vw;
    max-width: 100vw;
    height: 100dvh;
    min-height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
    overflow-y: scroll;
    display: flex;
    flex-direction: column;
    background-color: white;
    color: black;
    /*color: rgb(91, 149, 253);*/
    /*color: rgb(170, 170, 251);*/
    font-family: 'Montserrat', sans-serif;
    /*font-family: 'Itim', sans-serif;*/
    /*font-family: 'Maven Pro', sans-serif;*/
    font-size: 16px;
    line-height: 1.6;
  }

  #root {
    display: flex;
    flex-direction: column;
    flex: 1;
    align-self: stretch;
    min-height: 100dvh;
    max-height: 100dvh;
  }

  table {
    font-size: inherit;
  }

  a {
    color: rgb(255, 106, 106);
    background-color: rgba(255, 224, 150, 0.3);
    padding: 0 4px;
    margin: 0 0;
    border-radius: 4px;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  ul {
    margin-top: 0.66666666666666em;
    margin-bottom: 0.6666666666666em;
  }

  li {
    line-height: 1.6;
  }

  li::marker {
    line-height: 1.6;
  }
`

const styles = {
  app: css`
    align-self: stretch;
    min-height: 100dvh;
    max-height: 100dvh;
  `,
  widePage: css`
    width: 720px;
  `,
}

const App = ({ Component, pageProps }: any): any => {
  // We do not want to import CSRApp.js during server-side rendering.
  // This is because CSRApp.js loads libraries which rely on a browser environment.

  // Next.JS will ignore useEffect calls during SSR.
  const [inBrowser, setInBrowser] = useState(false)
  useEffect(() => setInBrowser(true), [])

  const initialized = useRef(false)
  useEffect(() => {
    // load session store as soon as possible.
    if (initialized.current) return
    initialized.current = true
    sessionStore.load()
  }, [])

  if (process.env.RUNTIME === 'development') {
    // This runs during a hot reload.
    // If the sessionStore hot reloads, it's state will be reset.
    // So it must be reloaded.
    if (inBrowser && !sessionStore.appLoaded) {
      sessionStore.load()
    }
  }

  const body = inBrowser ? (
    <Suspense
      fallback={
        <View id="app" className={styles.app}>
          <Component {...pageProps} />
        </View>
      }
    >
      <LazyInBrowser component={Component} pageProps={pageProps} />
    </Suspense>
  ) : (
    <View id="app" className={styles.app}>
      <Component {...pageProps} />
    </View>
  )

  // We use a Suspense here as a simple way of using dynamic imports to import CSRApp.js
  // after useEffect above runs in the browser.
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>cobalt</title>
      </Head>
      <GlobalStyles />
      {body}
    </>
  )
}

export default App

import { GoogleFonts } from 'nextjs-google-fonts/GoogleFonts'
import NextDocument, { Html, Head, Main, NextScript } from 'next/document'
import { extractCss } from 'goober'

export default class Document extends NextDocument {
  static async getInitialProps({ renderPage }) {
    const page = await renderPage()
    const css = extractCss()
    return { ...page, css }
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="UTF-8" />
          <meta property="og:title" content="cobalt" />
          {/*<meta property="og:type" content="website" />*/}
          {/*<meta property="og:url" content="https://cobalt.online" />*/}
          {/*<meta*/}
          {/*  property="og:image"*/}
          {/*  content="https://cobalt-public-assets.s3.us-east-2.amazonaws.com/cobalt.png"*/}
          {/*/>*/}
          {/*<meta property="og:description" content="A UI for multiagent AI" />*/}
          {/*<meta name="twitter:card" content="summary_large_image" />*/}
          {/*<meta name="twitter:site" content="@cobalt" />*/}
          {/*<meta name="twitter:creator" content="@tay2win" />*/}
          {/*<meta name="twitter:title" content="cobalt.online" />*/}
          {/*<meta name="twitter:description" content="A UI for multiagent AI" />*/}
          {/*<meta*/}
          {/*  name="twitter:image"*/}
          {/*  content="https://cobalt-public-assets.s3.us-east-2.amazonaws.com/cobalt.png"*/}
          {/*/>*/}

          {GoogleFonts()}

          <style
            id={'_goober'}
            // And defined it in here
            dangerouslySetInnerHTML={{ __html: ' ' + this.props.css }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

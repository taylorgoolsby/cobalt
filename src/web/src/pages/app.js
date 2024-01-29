import Body from '../components/Body.js'
import { css } from 'goober'
import Colors from '../Colors.js'

const styles = {
  page: css`
    justify-content: center;
    align-items: center;
    background-color: ${Colors.panelBg};
  `,
}

function Page(props) {
  // The SPA portion of the app is rendered under /app
  // This is the pre-rendered page for /app.
  // It is simply a blank page.
  // It will displayed until the Suspense on _app resolves.
  return <Body className={styles.page}>{null}</Body>
}

export default Page

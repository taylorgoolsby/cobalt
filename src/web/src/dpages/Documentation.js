// @flow

import React from 'react'
import Body from '../components/Body.js'
import MarkdownText from '../components/MarkdownText.js'
import { css } from 'goober'

const styles = {
  page: css`
    width: 720px;
  `,
}

const markdown = `

## DOCUMENTATION

### Projects

* You may create multiple projects.
* Keys are namespaced to a project.

### Authentication

Include the \`Authorization\` header in your request.

  \`\`\`
  Authorization: Basic <your auth code>
  \`\`\`

### Get

Send a POST to \`https://data.memc.sh/api/get\` to retrieve data.

  \`\`\`
  {
    "key": "example key"
  }
  \`\`\`
    
* The maximum key size is 1500 bytes.

### Set

Send a JSON POST to \`https://data.memc.sh/api/set\` to store data.

  \`\`\`
  {
    "key": "example key",
    "value: "example value"
  }
  \`\`\`
    
* The maximum value size is 65535 bytes.

### Delete

Send a JSON POST to \`https://data.memc.sh/api/set\` with a \`null\` value to delete data.

  \`\`\`
  {
    "key": "0",
    "value": null
  }
  \`\`\`
    
* By default, records are automatically deleted after 5 minutes.

### Other Notes

* All responses will be \`Content-Type: application/json\`, including most errors. 

`.trim()

const Documentation = (): any => {
  return (
    <Body className={styles.page}>
      <MarkdownText>{markdown}</MarkdownText>
    </Body>
  )
}

export default Documentation

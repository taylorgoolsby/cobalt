// @flow

import React from 'react'
import { css } from 'goober'
import Body from '../components/Body.js'
import MarkdownText from '../components/MarkdownText.js'

const styles = {
  body: css`
    width: 720px;

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
    }

    td {
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  `,
}

/*
|               | Free Tier               | Paid Tier                 |
|---------------|-------------------------|---------------------------|
| Get           | 1,728,000 Calls / Day   | $0.0345 per 100,000 Calls |
| Set           | 1,728,000 Calls / Day   | $0.1042 per 100,000 Calls |
| Delete        | 1,728,000 Calls / Day   | $0.0115 per 100,000 Calls |
| Storage       | 10 MB / Month           | $0.1725 per GB / Month    |

* AWS RDS Storage is $0.115 GB / Month, so we have a 50% markup on storage.

* API Rate is designed around the need to support multiple players in the free tier.
* 1,728,000 Calls / Day at 60 Calls / Second is designed to support a game with 3 players
concurrently online for 8 hours running at 20 ticks per second.

* Tier I is designed to support a game of up to 3 players always online running at 20 TPS.

* A t4g.nano is able to support 86,400,000 req / day at 1000 req / sec.
* Since a t4g.nano is $2.16, a $2.00 instance supports 80,000,000 req / day at 1000 req / sec.
* Firestore charges $2.084 for 2,000,000 sets.
* At $1.00 a month, after taking out the charge for 1GB storage, $0.8275,  33,100,000 req / day, and 400 req / sec.
* After applying a 50% markup, this is, $1.24125, and then adjusting back to $1.00: ~27,648,000 and 320 req /sec.
     * This supports 16 players sustained all day.

* Data out from AWS is $0.11.


|                         | Free Tier Limits        | Subscription Limits       |
|-------------------------|-------------------------|---------------------------|
| Cost                    | $0.00                   | $1.00 per Month           |
| API Calls               | 1,728,000 Calls / Day   | 27,648,000 Calls / Day    |
| API Rate                | 60 Calls / Second       | 320 Calls / Second        |
| Storage                 | 10 MB / Month           | 1 GB / Month              |
| Data Transfer Out       | 10 MB / Month           | 1 GB / Month              |

* */

const markdown = `

## PRICING

|                         | Free Tier Limits        | Subscription Limits       |
|-------------------------|-------------------------|---------------------------|
| Cost                    | $0.00                   | Coming soon...            |
| API Calls               | 1,728,000 Calls / Day   | Coming soon...            |
| API Rate                | 60 Calls / Second       | Coming soon...            |
| Storage                 | 10 MB / Month           | Coming soon...            |
| Data Transfer Out       | 10 MB / Month           | Coming soon...            |

* 1 GB = 1000<sup>3</sup> bytes
* 1 MB = 1000<sup>2</sup> bytes
* Free tier quotas may be adjusted at any time.
* If free tier limits are reached without payment details on file,
services will be stopped until the free tier limits are refreshed.
* Subscriptions limits are counted after the free tier limits have been reached.
* If you have needs beyond what the subscription limits allow, please contact us.

`.trim()

const Pricing = (): any => {
  return (
    <Body className={styles.body}>
      <MarkdownText>{markdown}</MarkdownText>
    </Body>
  )
}

export default Pricing

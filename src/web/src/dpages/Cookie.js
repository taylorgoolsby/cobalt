// @flow

import React, { useEffect } from 'react'
import { css } from 'goober'
import Body from '../components/Body.js'
import MarkdownText from '../components/MarkdownText.js'
import View from '../components/View.js'
import Logo from '../components/Logo.js'
import Link from '../components/Link.js'

const styles = {
  page: css`
    align-self: stretch;
    height: 100%;
    overflow-y: scroll;

    > div {
      max-width: 720px;
      margin: 0 auto;
      width: 100%;
    }

    .link-home {
      position: fixed;
      top: 9px;
      left: 14px;
      padding: 0;
      background-color: transparent;
    }

    @media (max-width: 877px) {
      padding-top: 47px;
      padding-left: 20px;
      padding-right: 20px;

      .link-home {
        position: absolute;
      }
    }

    li::marker {
      color: #d9d9d9;
      font-weight: 700;
    }

    a[id] {
      font-weight: 700;
    }

    strong {
      color: rgb(60, 127, 247);
      font-weight: 700;
    }

    li li {
      list-style-type: lower-alpha;
    }

    li li li {
      list-style-type: lower-roman;
    }
  `,
}

const markdown = `
# COOKIE POLICY

Effective date: 12/6/2023

1. ## [Introduction](#introduction)

   At cobalt.online, we believe in being clear and open about how we collect and use data related to you. This policy provides detailed information about how and when we use cookies. By accessing and using our website and services, you indicate that you understand and agree to this policy.

2. ## [What are Cookies?](#what-are-cookies)

   Cookies are small pieces of data stored on your device (computer or mobile device) when you visit a website. They are widely used to "remember" you and your preferences, either for a single visit (through a "session cookie") or for multiple repeat visits (using a "persistent cookie").

3. ## [Types of Cookies We Use](#types-of-cookies-we-use)

   1. **Strictly Necessary Cookies**: These cookies are essential for you to browse the website and use its features.
   2. **Performance Cookies**: These cookies collect information about how you use our website.
   3. **Functional Cookies**: These cookies allow our website to remember choices you make and provide enhanced features.
   4. **Targeting Cookies**: These cookies are set through our site by our advertising partners.

4. ## [How We Use Cookies](#how-we-use-cookies)

   We use cookies to enhance your browsing experience by:
   
   - Understanding how you use our website
   - Showing you adverts that are relevant to you
   - Providing a secure browsing experience during your use of our website

5. ## [How to Disable Cookies](#how-to-disable-cookies)

   If you decide to disable cookies, you can do so through your web browser settings. Disabling cookies might impact your browsing experience on our website and others, as cookies are a standard part of most modern websites.

   **Note**: The steps might vary slightly depending on the browser version. For the most accurate instructions, check the help section of your specific browser.

   ### Consequences of Disabling Cookies

   Disabling cookies may prevent certain features on our website from functioning correctly. For instance:

   - You may not be able to log in or access certain features that rely on cookies for security.
   - Preferences saved by cookies, like language settings or location, won't be retained.
   - Some pages or interactive features may not load correctly.

   For more detailed instructions on how to manage and disable cookies, you can visit these external resources:

   - [www.aboutcookies.org](www.aboutcookies.org)
   - [www.allaboutcookies.org](www.allaboutcookies.org)

   Remember, disabling cookies is reversible. If you choose to enable cookies again, you can follow the same steps and adjust your browser settings accordingly.
   
6. ## [Changing Your Cookie Preferences](#changing-your-cookie-preferences)

If you wish to change your cookie preferences on cobalt.online, you can do so by deleting the site's local storage data in your browser. This will prompt the cookie settings banner to reappear, allowing you to modify your settings upon reloading the website. Follow these steps to delete the local storage:

1. **Google Chrome**:
   - Click on the three dots in the top right corner and select 'Settings'.
   - Go to 'Privacy and security' and click on 'Third-party cookies'.
   - Find 'See all site data and permissions' and search for 'cobalt.online'.
   - Click on the 'Remove' button next to the site's local storage data.

2. **Mozilla Firefox**:
   - Click on the three lines in the top right corner and select 'Settings'.
   - Go to 'Privacy & Security' and scroll down to 'Cookies and Site Data'.
   - Click on 'Manage Data', find 'cobalt.online', and click 'Remove Selected'.

3. **Safari (Mac)**:
   - Go to 'Safari' in the menu bar and select 'Settings'.
   - Choose the 'Privacy' tab and click on 'Manage Website Data'.
   - Find 'cobalt.online' in the list and click 'Remove'.

4. **Microsoft Edge**:
   - Click on the three dots in the top right corner and select 'Settings'.
   - Choose 'Cookies and site permissions' and then 'Manage and delete cookies and site data'.
   - Click on 'See all cookies and site data'.
   - Search for 'cobalt.online' and delete the local storage data.

**Please Note**: The steps may vary slightly depending on your browser version and any updates. Check your browser's help section for the most accurate instructions.

After deleting the local storage for cobalt.online, reload the website. The cookie settings banner will reappear, allowing you to adjust your cookie preferences as desired.

7. ## [Third-Party Cookies in Use on cobalt.online](#third-party-cookies-in-use-on-cobalt)

   We utilize third-party services for analytics and functionality enhancements on our website. Below is a simplified table detailing the third-party cookies we use:

   | Third-Party Service | Cookie Names                                | Type          |
   |---------------------|---------------------------------------------|---------------|
   | Google Analytics    | _ga                                         | Performance   |
   | PostHog             | ph_                                         | Performance   |

   ### Notes on Third-Party Services

   - **Google Analytics**: This service by Google Inc. helps us analyze website traffic.
   - **PostHog**: PostHog is used for understanding visitor engagement.

   ### Managing Third-Party Cookies

   The management of third-party cookies is governed by the privacy policies of these respective entities.

8. ## [Changes to Our Cookie Policy](#changes-to-our-cookie-policy)

   We may update this Cookie Policy from time to time. We encourage you to periodically review this page for the latest information on our cookie practices.

9. ## [Contact Us](#contact-us)

   If you have any questions about our use of cookies or other technologies, please email us at <Contact/>.
   
`.trim()

const Cookie = (): any => {
  return (
    <View className={styles.page}>
      <View>
        <MarkdownText>{markdown}</MarkdownText>
      </View>
      <Link className={'link-home'} href={'/'}>
        <Logo />
      </Link>
    </View>
  )
}

export default Cookie

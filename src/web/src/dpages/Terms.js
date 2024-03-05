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
## TERMS OF SERVICE

Effective date: 12/6/2023

1. <a id="introduction" href="#introduction">Introduction</a>

  Welcome to **cobalt.online** (“**Company**”, “**we**”, “**our**”, “**us**”)! As you have just clicked our Terms of Service, please pause, grab a cup of coffee and carefully read the following pages. It will take you approximately 20 minutes.
  
  These Terms of Service (“**Terms**”, “**Terms of Service**”) govern your use of our web pages located at [cobalt.online](https://cobalt.online) (“**Service**”) and operated by Taylor Goolsby.
  
  Our Privacy Policy also governs your use of our Services and explains how we collect, safeguard and disclose information that results from your use of our web pages. Please read it here [cobalt.online/privacy](https://cobalt.online/privacy).
  
  Your agreement with us includes these Terms and our Privacy Policy (“**Agreements**”). You acknowledge that you have read and understood Agreements, and agree to be bound of them.
  
  If you do not agree with (or cannot comply with) Agreements, then you may not use our Services, but please let us know by emailing at <Contact/> so we can try to find a solution. These Terms apply to all visitors, users and others who wish to access or use our Services.
  
  Thank you for being responsible.

2. <a id="definitions" href="#definitions">Definitions</a>

  **CUSTOMER APPLICATION** refers to a software program or developer product operated by you which is made available to your End Users. Our Services have the ability to create, deploy, or host Customer Applications. In addition, Customer Applications may integrate with our Services’ APIs.
  
  **END USERS** are individuals who are permitted by you to use your Customer Application.

3. <a id="communications" href="#communications">Communications</a>

  By creating an Account on any of our Services, you agree to subscribe to newsletters, marketing or promotional materials and other information we may send. However, you may opt out of receiving any, or all, of these communications from us by following the unsubscribe link or by emailing at <Contact/>.

4. <a id="purchases" href="#purchases">Purchases</a>

  If you wish to purchase any product or service made available through our Services (“**Purchase**”), you may be asked to supply certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
  
  You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete.
  
  We may employ the use of third party services for the purpose of facilitating payment and the completion of Purchases. By submitting your information, you grant us the right to provide the information to these third parties subject to our Privacy Policy.
  
  We reserve the right to refuse or cancel your order at any time for reasons including but not limited to: product or service availability, errors in the description or price of the product or service, error in your order or other reasons.
  
  We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.

5. <a id="contests-sweepstakes-promotions" href="#contests-sweepstakes-promotions">Contests, Sweepstakes and Promotions</a>

  Any contests, sweepstakes or other promotions (collectively, “**Promotions**”) made available through Services may be governed by rules that are separate from these Terms of Service. If you participate in any Promotions, please review the applicable rules as well as our Privacy Policy. If the rules for a Promotion conflict with these Terms of Service, Promotion rules will apply.

6. <a id="subscriptions" href="#subscriptions">Subscriptions</a>

  Some parts of our Services are billed on a subscription basis (“**Subscription(s)**”). You will be billed in advance on a recurring and periodic basis (“**Billing Cycle**”). Billing cycles are set either on a monthly or annual basis, depending on the type of subscription plan you select when purchasing a Subscription.
  
  At the end of each Billing Cycle, your Subscription will automatically renew under the exact same conditions unless you cancel it or we cancel it. You may cancel your Subscription renewal either through your online account management page or by contacting our customer support team.
  
  A valid payment method, including credit card or PayPal, is required to process the payment for your subscription. You shall provide us with accurate and complete billing information including full name, address, state, zip code, telephone number, and a valid payment method information. By submitting such payment information, you automatically authorize us to charge all Subscription fees incurred through your account to any such payment instruments.
  
  Should automatic billing fail to occur for any reason, we will issue an electronic invoice indicating that you must proceed manually, within a certain deadline date, with the full payment corresponding to the billing period as indicated on the invoice.

7. <a id="free-trial" href="#free-trial">Free Trial</a>

  We may, at our sole discretion, offer a Subscription with a free trial for a limited period of time (“**Free Trial**”).
  
  You may be required to enter your billing information in order to sign up for Free Trial.
  
  If you do enter your billing information when signing up for Free Trial, you will not be charged by us until Free Trial has expired. On the last day of Free Trial period, unless you canceled your Subscription, you will be automatically charged the applicable Subscription fees for the type of Subscription you have selected.
  
  At any time and without notice, we reserve the right to (i) modify Terms of Service of Free Trial offer, or (ii) cancel such Free Trial offer.

8. <a id="fee-changes" href="#fee-changes">Fee Changes</a>

  cobalt.online, in its sole discretion and at any time, may modify Subscription fees for the Subscriptions. Any Subscription fee change will become effective at the end of the then-current Billing Cycle.
  
  We will provide you with a reasonable prior notice of any change in Subscription fees to give you an opportunity to terminate your Subscription before such change becomes effective.
  
  Your continued use of Services after Subscription fee change comes into effect constitutes your agreement to pay the modified Subscription fee amount.

9. <a id="refunds" href="#refunds">Refunds</a>

  Except when required by law, paid Subscription fees are non-refundable.

10. <a id="content" href="#content">Content</a>

  Our Services allow you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material (“**Content**”). You are responsible for Content that you post on or through our Services, including its legality, reliability, and appropriateness.
  
  By posting Content on or through our Services, you represent and warrant that: (i) Content is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the posting of your Content on or through our Services does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity. We reserve the right to terminate the account of anyone found to be infringing on a copyright.
  
  You retain any and all of your rights to any Content you submit, post or display on or through our Services and you are responsible for protecting those rights. We take no responsibility and assume no liability for Content you or any third party posts on or through our Services. However, by posting Content using our Services you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through our Services. You agree that this license includes the right for us to make your Content available to other users of our Services, who may also use your Content subject to these Terms.
  
  cobalt.online has the right but not the obligation to monitor and edit all Content provided by users.
  
  In addition, Content found on or through these Services are the property of cobalt.online or used with permission. You may not distribute, modify, transmit, reuse, download, repost, copy, or use said Content, whether in whole or in part, for commercial purposes or for personal gain, without express advance written permission from us.

11. <a id="prohibited-uses" href="#prohibited-uses">Prohibited Uses</a>

  You may use our Services only for lawful purposes and in accordance with the Terms. You agree not to use our Services:
  
  1. In any way that violates any applicable national or international law or regulation.
  
  2. For the purpose of exploiting, harming, or attempting to exploit or harm minors in any way by exposing them to inappropriate content or otherwise.
  
  3. To transmit, or procure the sending of, any advertising or promotional material, including any “junk mail”, “chain letter,” “spam,” or any other similar solicitation.
  
  4. To impersonate or attempt to impersonate Company, a Company employee, another user, or any other person or entity.
  
  5. In any way that infringes upon the rights of others, or in any way is illegal, threatening, fraudulent, or harmful, or in connection with any unlawful, illegal, fraudulent, or harmful purpose or activity.
  
  6. To engage in any other conduct that restricts or inhibits anyone’s use or enjoyment of our Services, or which, as determined by us, may harm or offend Company or users of our Services or expose them to liability.
  
  Additionally, you agree not to:
  
  1. Use our Services in any manner that could disable, overburden, damage, or impair our Services or interfere with any other party’s use of our Services, including their ability to engage in real time activities through our Services.
  
  2. Use any robot, spider, or other automatic device, process, or means to access our Services for any unauthorized purpose, including monitoring or copying any of the material on our Services, unless you have been permitted to do so in a separate agreement with us, or unless specifically permitted by any individual Service’s robots.txt file or other robot exclusion mechanisms.
  
  3. Use any manual process to monitor or copy any of the material on our Services or for any other unauthorized purpose without our prior written consent.
  
  4. Use any device, software, or routine that interferes with the proper working of our Services.
  
  5. Introduce any viruses, trojan horses, worms, logic bombs, injection attacks, cross-site scripting attacks or other material which is malicious or technologically harmful.
  
  6. Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of our Services, the server on which our Services are stored, or any server, computer, or database connected to our Services.
  
  7. Attack our Services via a denial-of-service attack or a distributed denial-of-service attack.
  
  8. Take any action that may damage or falsify Company rating.
  
  9. Otherwise attempt to interfere with the proper working of our Services.

12. <a id="customer-applications" href="#customer-applications">Customer Applications</a>

  Our Services allow you to create, develop, manage, store, deploy, host, enable, and operate your Customer Applications.
  
  In addition, our Services allow you to create, store, and share source code, settings, nodes, text, graphics, videos, prompts, instructions, or any other precursor information or material involved in the production or recreation of executable or live Customer Applications which your End Users can access (“**Source Material**”).
  
  You are responsible for any Source Material that you create, submit, post, display, store, or share on or through our Services and the Customer Application it produces, including its legality, reliability, and appropriateness.
  
  You retain any and all of your rights to any Source Material you create, submit, post, display, store, or share on or through our Services and you are responsible for protecting those rights. We take no responsibility and assume no liability for your Source Materials and Customer Application you or any third party interacts with on or through our Services.
  
  We are not held responsible and assume no liability for any loss, corruption, or theft of your or your End User’s Source Material, intellectual property, personal information, operational data, or Content. Such events may or may not occur as a fault of our own. Reasons for why such events may occur includes but is not limited to vulnerabilities or bugs in our Services, phishing and social engineering attacks, injection or cross-site scripting attacks, backdoor computing attacks, brute force password attacks, password leaks, computing or storage hardware malfunctions, data transmission errors, prompt attacks, or by user errors such as but not limited to accidentally sharing a project with the wrong person.
  
  Furthermore, our Services generate Content given the Source Material you provide using generative AI. We are not held responsible and assume no liability for any Content generated which is inaccurate, misleading, incorrect or inappropriate. We are not held responsible and assume no liability for any Content generated which violates the privacy rights, publicity rights, copyrights, contract rights or any other rights.
  
  Company has the right but not the obligation to monitor and edit all Source Material and Customer Applications provided by users.
  
  By using or employing our Services to create, develop, manage, store, deploy, host, enable, generate, or operate your Customer Application, you represent and warrant that: (i) The Source Material and Customer Application is yours (you own it) and/or you have the right to use it and the right to grant us the rights and license as provided in these Terms, and (ii) that the Source Material stored on our Services and the Customer Application it produces does not violate the privacy rights, publicity rights, copyrights, contract rights or any other rights of any person or entity. We reserve the right to terminate the account of anyone found to be infringing on a copyright.
  
  
  Additionally, you agree to the following:
  
  1. You must not present yourself as a representative of Company and must not represent that you are operating or collecting any personal information or user content, or otherwise processing data on behalf of Company.
  
  2. You must provide your own Terms of Service and Privacy Policy to the End Users of your Customer Application.

13. <a id="api-usage" href="#api-usage">API Usage</a>

  We may provide the ability to use, integrate, or access our Services through an Application Provider Interface (“**API**”). If you integrate your Customer Application with our API, then you agree not to:
 
  1. Use Services to engage in cryptocurrency mining without prior written consent.
  
  2. Use Services to operate or enable any telecommunications service or in connection with any Customer Application that allows End Users to place calls or to receive calls from any public switched telephone network.
  
  3. Use Services to transmit, store, or process health information subject to United States HIPAA regulations without prior written consent.
  
  4. Employ misleading email or IP addresses, or forged headers or otherwise manipulated identifiers in order to disguise the origin of any content transmitted to or through the Services.
  
  5. Use Services to operate or enable online gambling or betting services without prior written consent.
  
  We reserve the right to terminate the account of anyone found to be infringing on our API Usage Terms.

14. <a id="analytics" href="#analytics">Analytics</a>

  We may use third-party service providers to monitor and analyze the use of our Services.
  
  **Google Analytics**
  <br/>
  Google Analytics is a web analytics service offered by Google that tracks and reports website traffic. Google uses the data collected to track and monitor the use of our Services. This data is shared with other Google services. Google may use the collected data to contextualize and personalize the ads of its own advertising network.
  
  For more information on the privacy practices of Google, please visit the Google Privacy Terms web page: https://policies.google.com/privacy?hl=en
  
  We also encourage you to review the Google's policy for safeguarding your data: https://support.google.com/analytics/answer/6004245.
  
<!--  **Firebase**-->
<!--  <br/>-->
<!--  Firebase is analytics service provided by Google Inc.-->
<!--  -->
<!--  You may opt-out of certain Firebase features through your mobile device settings, such as your device advertising settings or by following the instructions provided by Google in their Privacy Policy: https://policies.google.com/privacy?hl=en-->
<!--  -->
<!--  For more information on what type of information Firebase collects, please visit the Google Privacy Terms web page: https://policies.google.com/privacy?hl=en-->
<!--  -->
<!--  **Fathom Analytics**-->
<!--  <br/>-->
<!--  Fathom Analytics is analytics service provided by Conva Ventures Inc. You can find their Privacy Policy here: https://usefathom.com/privacy/-->
<!--  -->
<!--  **Piwik / Matomo**-->
<!--  <br/>-->
<!--  Piwik or Matomo is a web analytics service. You can visit their Privacy Policy page here: https://matomo.org/privacy-policy-->
<!--  -->
<!--  **Clicky**-->
<!--  <br/>-->
<!--  Clicky is a web analytics service. Read the Privacy Policy for Clicky here: https://clicky.com/terms-->
<!--  -->
<!--  **Cloudflare Analytics**-->
<!--  <br/>-->
<!--  Cloudflare analytics is a web analytics service operated by Cloudflare Inc. Read the Privacy Policy here: https://www.cloudflare.com/privacypolicy/-->
<!--  -->
<!--  **Statcounter**-->
<!--  <br/>-->
<!--  Statcounter is a web traffic analysis tool. You can read the Privacy Policy for Statcounter here: https://statcounter.com/about/legal/-->
<!--  -->
<!--  **Flurry Analytics**-->
<!--  <br/>-->
<!--  Flurry Analytics service is provided by Yahoo! Inc.-->
<!--  -->
<!--  You can opt-out from Flurry Analytics service to prevent Flurry Analytics from using and sharing your information by visiting the Flurry's Opt-out page: https://dev.flurry.com/secure/optOut.do-->
<!--  -->
<!--  For more information on the privacy practices and policies of Yahoo!, please visit their Privacy Policy page: https://legal.yahoo.com/us/en/yahoo/privacy/index.html-->
<!--  -->
<!--  **Mixpanel**-->
<!--  <br/>-->
<!--  Mixpanel is provided by Mixpanel Inc.-->
<!--  -->
<!--  You can prevent Mixpanel from using your information for analytics purposes by opting-out. To opt-out of Mixpanel service, please visit this page: https://mixpanel.com/optout/-->
<!--  -->
<!--  For more information on what type of information Mixpanel collects, please visit the Terms of Use page of Mixpanel: https://mixpanel.com/terms/-->
<!--  -->
<!--  **Unity Analytics**-->
<!--  <br/>-->
<!--  Unity Analytics is provided by Unity Technologies.-->
<!--  -->
<!--  For more information on what type of information Unity Analytics collects, please visit their Privacy Policy page: https://unity3d.com/legal/privacy-policy-->
<!--  -->
<!--  **Azure DevOps**-->
<!--  <br/>-->
<!--  Azure DevOps is a Software as a service (SaaS) platform from Microsoft that provides an end-to-end DevOps toolchain for developing and deploying software.-->
<!--  -->
<!--  You can find Microsoft Privacy Statement here: https://privacy.microsoft.com/en-gb/privacystatement-->
<!--  -->
<!--  **Yodo1**-->
<!--  <br/>-->
<!--  Yodo1 is a service provided by Yodo1, Ltd.-->
<!--  -->
<!--  For more information on what type of information Yodo1 collects, please visit their Privacy Policy page: https://www.yodo1.com/privacy-->
<!--  -->
<!--  **Weblate**-->
<!--  <br/>-->
<!--  For more information on what type of information Weblate collects, please visit their Privacy Policy page: https://weblate.org/en/terms/-->

15. <a id="no-use-by-minors" href="#no-use-by-minors">No Use by Minors</a>

  Our services are intended only for access and use by individuals at least eighteen (18) years old. By accessing or using any of our Services, you warrant and represent that you are at least eighteen (18) years of age and with the full authority, right, and capacity to enter into this agreement and abide by all of the terms and conditions of Terms. If you are not at least eighteen (18) years old, you are prohibited from both the access and usage of our Services.

16. <a id="accounts" href="#accounts">Accounts</a>

  When you create accounts with us, you guarantee that you are above the age of 18, and that the information you provide us is accurate, complete, and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate termination of any of your accounts on our Services.
  
  You are responsible for maintaining the confidentiality of your accounts, passwords, and any third-party API keys you provide, including but not limited to the restriction of access to your computer and/or accounts. You agree not to disclose your password to any third party and you agree to accept responsibility for any and all activities or actions that occur under your accounts and/or passwords, whether your passwords are with our Services or a third-party service. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your accounts.
  
  You may not use as a username the name of another person or entity or that is not lawfully available for use, a name or trademark that is subject to any rights of another person or entity other than you, without appropriate authorization. You may not use as a username any name that is offensive, vulgar or obscene.
  
  Any misuse of your account, including unauthorized sharing of your credentials, can result in immediate suspension or termination of your account. We reserve the right to disable any user account found to be compromised or used in violation of our terms.
  
  In the case of third-party API keys, you are responsible for adhering to the terms of service of the third party. Any misuse of these keys that violates their terms can also result in suspension or termination of your account with us.
  
  We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.

17. <a id="intellectual-property" href="#intellectual-property">Intellectual Property</a>

  Our Services and their respective original content (excluding Content and Source Material provided by users), features and functionality are and will remain the exclusive property of Company and its licensors. Our Services are protected by copyright, trademark, and other laws of the United States. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Company.

18. <a id="copyright-policy" href="#copyright-policy">Copyright Policy</a>

  We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on our Services infringes on the copyright or other intellectual property rights (“**Infringement**”) of any person or entity.
  
  If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied in a way that constitutes copyright infringement, please submit your claim via email to <Contact/>, with the subject line: “Copyright Infringement” and include in your claim a detailed description of the alleged Infringement as detailed below, under “DMCA Notice and Procedure for Copyright Infringement Claims”
  
  You may be held accountable for damages (including costs and attorneys' fees) for misrepresentation or bad-faith claims on the infringement of any Content found on and/or through our Services on your copyright.

19. <a id="dmca" href="#dmca">DMCA Notice and Procedure for Copyright Infringement Claims</a>

  You may submit a notification pursuant to the Digital Millennium Copyright Act (DMCA) by providing our Copyright Agent with the following information in writing (see 17 U.S.C 512(c)(3) for further detail):
  
  1. an electronic or physical signature of the person authorized to act on behalf of the owner of the copyright's interest;
  
  2. a description of the copyrighted work that you claim has been infringed, including the URL (i.e., web page address) of the location where the copyrighted work exists or a copy of the copyrighted work;
  
  3. identification of the URL or other specific location on our Services where the material that you claim is infringing is located;
  
  4. your address, telephone number, and email address;
  
  5. a statement by you that you have a good faith belief that the disputed use is not authorized by the copyright owner, its agent, or the law;
  
  6. a statement by you, made under penalty of perjury, that the above information in your notice is accurate and that you are the copyright owner or authorized to act on the copyright owner's behalf.
  
  You can contact our Copyright Agent via email at <Contact/>

20. <a id="error-reporting-feedback" href="#error-reporting-feedback">Error Reporting and Feedback</a>

  You may provide us either directly at <Contact/> or via third party sites and tools with information and feedback concerning errors, suggestions for improvements, ideas, problems, complaints, and other matters related to our Services (“**Feedback**”). You acknowledge and agree that: (i) you shall not retain, acquire or assert any intellectual property right or other right, title or interest in or to the Feedback; (ii) Company may have development ideas similar to the Feedback; (iii) Feedback does not contain confidential information or proprietary information from you or any third party; and (iv) Company is not under any obligation of confidentiality with respect to the Feedback. In the event the transfer of the ownership to the Feedback is not possible due to applicable mandatory laws, you grant Company and its affiliates an exclusive, transferable, irrevocable, free-of-charge, sub-licensable, unlimited and perpetual right to use (including copy, modify, create derivative works, publish, distribute and commercialize) Feedback in any manner and for any purpose.
  
  The third party sites and tools mentioned above include the following:
  
  **Bugsnag**
  <br/>
  Bugsnag is a platform for monitoring and logging stability of applications provided by Bugsnag Inc. Please read their Privacy Policy here: https://docs.bugsnag.com/legal/privacy-policy/
  
<!--  **ACRA**-->
<!--  <br/>-->
<!--  ACRA or Application Crash Reports for Android is monitoring platform. Please find more information here: https://github.com/ACRA/acra-->
<!--  -->
<!--  **Rollbar**-->
<!--  <br/>-->
<!--  Rollbar is error tracking service provided by Rollbar Inc. Find out more here: https://docs.rollbar.com/docs/privacy-policy-->
<!--  -->
<!--  **Sentry**-->
<!--  <br/>-->
<!--  Sentry is open-source error tracking solution provided by Functional Software Inc. More information is available here: https://sentry.io/privacy/-->
<!--  -->
<!--  **Raygun**-->
<!--  <br/>-->
<!--  Raygun is automated error monitoring software provided by Raygun Limited. Privacy Policy is accessible at https://raygun.com/privacy/-->
<!--  -->
<!--  **Firebase Crashlytics**-->
<!--  <br/>-->
<!--  Firebase Crashlytics is bug reporting service provided by Google Inc.-->
<!--  -->
<!--  You may opt-out of certain Firebase features through your mobile device settings, such as your device advertising settings or by following the instructions provided by Google in their Privacy Policy: https://policies.google.com/privacy?hl=en-->
<!--  -->
<!--  For more information on what type of information Firebase collects, please visit the Google Privacy Terms web page: https://policies.google.com/privacy?hl=en-->

21. <a id="links-to-other-web-sites" href="#links-to-other-web-sites">Links to Other Web Sites</a>

  Our Services may contain links to third party web sites or services that are not owned or controlled by us.
  
  Company has no control over, and assumes no responsibility for the content, privacy policies, or practices of any third party web sites or services. We do not warrant the offerings of any of these entities/individuals or their websites.
  
  YOU ACKNOWLEDGE AND AGREE THAT WE SHALL NOT BE RESPONSIBLE OR LIABLE, DIRECTLY OR INDIRECTLY, FOR ANY DAMAGE OR LOSS CAUSED OR ALLEGED TO BE CAUSED BY OR IN CONNECTION WITH USE OF OR RELIANCE ON ANY SUCH CONTENT, GOODS OR SERVICES AVAILABLE ON OR THROUGH ANY SUCH THIRD PARTY WEB SITES OR SERVICES.
  
  WE STRONGLY ADVISE YOU TO READ THE TERMS OF SERVICE AND PRIVACY POLICIES OF ANY THIRD PARTY WEB SITES OR SERVICES THAT YOU VISIT.

22. <a id="disclaimer-of-warranty" href="#disclaimer-of-warranty">Disclaimer of Warranty</a>

  THESE SERVICES ARE PROVIDED BY COMPANY ON AN “AS IS” AND “AS AVAILABLE” BASIS. COMPANY MAKES NO REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, AS TO THE OPERATION OF THEIR SERVICES, OR THE INFORMATION, CONTENT OR MATERIALS INCLUDED THEREIN. YOU EXPRESSLY AGREE THAT YOUR USE OF THESE SERVICES, THEIR CONTENT, AND ANY SERVICES OR ITEMS OBTAINED FROM US IS AT YOUR SOLE RISK.
  
  NEITHER COMPANY NOR ANY PERSON ASSOCIATED WITH COMPANY MAKES ANY WARRANTY OR REPRESENTATION WITH RESPECT TO THE COMPLETENESS, SECURITY, RELIABILITY, QUALITY, ACCURACY, OR AVAILABILITY OF THE SERVICES. WITHOUT LIMITING THE FOREGOING, NEITHER COMPANY NOR ANYONE ASSOCIATED WITH COMPANY REPRESENTS OR WARRANTS THAT THE SERVICES, THEIR CONTENT, OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES WILL BE ACCURATE, RELIABLE, ERROR-FREE, OR UNINTERRUPTED, THAT DEFECTS WILL BE CORRECTED, THAT THE SERVICES OR THE SERVER THAT MAKES IT AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS OR THAT THE SERVICES OR ANY SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES WILL OTHERWISE MEET YOUR NEEDS OR EXPECTATIONS.
  
  COMPANY HEREBY DISCLAIMS ALL WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY, NON-INFRINGEMENT, AND FITNESS FOR PARTICULAR PURPOSE.
  
  THE FOREGOING DOES NOT AFFECT ANY WARRANTIES WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.

23. <a id="limitation-of-liability" href="#limitation-of-liability">Limitation of Liability</a>

  EXCEPT AS PROHIBITED BY LAW, YOU WILL HOLD US AND OUR OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS HARMLESS FOR ANY INDIRECT, PUNITIVE, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGE, HOWEVER IT ARISES (INCLUDING ATTORNEYS' FEES AND ALL RELATED COSTS AND EXPENSES OF LITIGATION AND ARBITRATION, OR AT TRIAL OR ON APPEAL, IF ANY, WHETHER OR NOT LITIGATION OR ARBITRATION IS INSTITUTED), WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE, OR OTHER TORTIOUS ACTION, OR ARISING OUT OF OR IN CONNECTION WITH THIS AGREEMENT, INCLUDING WITHOUT LIMITATION ANY CLAIM FOR PERSONAL INJURY OR PROPERTY DAMAGE, ARISING FROM THIS AGREEMENT AND ANY VIOLATION BY YOU OF ANY FEDERAL, STATE, OR LOCAL LAWS, STATUTES, RULES, OR REGULATIONS, EVEN IF COMPANY HAS BEEN PREVIOUSLY ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. EXCEPT AS PROHIBITED BY LAW, IF THERE IS LIABILITY FOUND ON THE PART OF COMPANY, IT WILL BE LIMITED TO THE AMOUNT PAID FOR THE PRODUCTS AND/OR SERVICES, AND UNDER NO CIRCUMSTANCES WILL THERE BE CONSEQUENTIAL OR PUNITIVE DAMAGES. SOME STATES DO NOT ALLOW THE EXCLUSION OR LIMITATION OF PUNITIVE, INCIDENTAL OR CONSEQUENTIAL DAMAGES, SO THE PRIOR LIMITATION OR EXCLUSION MAY NOT APPLY TO YOU.

24. <a id="termination" href="#termination">Termination</a>

  We may terminate or suspend your accounts and bar access to our Services immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of Terms.
  
  If you wish to terminate your accounts, you may do so by logging in to your online account management page where you will find a “Close Account” action or similarly named action. An email or phone request to cancel, terminate, or delete any of your accounts shall not result in cancellation. You are still responsible for any outstanding fees associated with your use of our Services. We will attempt to cancel payment Subscriptions after receipt of the cancellation request but it is your responsibility to ensure any active Subscriptions to Company are cancelled. Therefore, we cannot and will not be responsible for unintended payments made via the automatic payment Subscription service. Termination requests are not a refund request.
  
  Your account may generate data which is stored in our servers and is important to the functionality of our Services. Data generated by your account is not deleted after account termination.
  
  All provisions of Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.

25. <a id="governing-law" href="#governing-law">Governing Law</a>

  These Terms shall be governed and construed in accordance with the laws of State of California without regard to its conflict of law provisions.
  
  Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect. These Terms constitute the entire agreement between us regarding our Services and supersede and replace any prior agreements we might have had between us regarding our Services.

26. <a id="changes-to-services" href="#changes-to-services">Changes to Services</a>

  We reserve the right to withdraw or amend our Services, and any service or material we provide via our Services, in our sole discretion without notice. We will not be liable if for any reason all or any part of our Services is unavailable at any time or for any period. From time to time, we may restrict access to some parts of our Services, or the entire of our Services, to users, including registered users.

27. <a id="amendments-to-terms" href="#amendments-to-terms">Amendments to Terms</a>

  We may amend Terms at any time by posting the amended terms on this site. It is your responsibility to review these Terms periodically.
  
  Your continued use of the Platform following the posting of revised Terms means that you accept and agree to the changes. You are expected to check this page frequently so you are aware of any changes, as they are binding on you.
  
  By continuing to access or use our Services after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use our Services.

28. <a id="waiver-severability" href="#waiver-severability">Waiver and Severability</a>

  No waiver by Company of any term or condition set forth in Terms shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of Company to assert a right or provision under Terms shall not constitute a waiver of such right or provision.
  
  If any provision of Terms is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of Terms will continue in full force and effect.

29. <a id="acknowledgement" href="#acknowledgement">Acknowledgement</a>

  BY USING SERVICES PROVIDED BY US, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE AND AGREE TO BE BOUND BY THEM.

30. <a id="contact-us" href="#contact-us">Contact Us</a>

  Please send your feedback, comments, requests for technical support:
  <br/>
  By email: <Contact/>.
  <br/>
<!--  By visiting this page on our website: [cobalt.online/contact](https://cobalt.online/contact).-->
`.trim()

const Terms = (): any => {
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

export default Terms

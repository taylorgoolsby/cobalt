import { loadEnv } from './loadEnv.js'
loadEnv()
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'
import nonMaybe from 'non-maybe'

const { AWS_PROFILE, AWS_REGION } = process.env

const credentialProvider = fromNodeProviderChain({
  //...any input of fromEnv(), fromSSO(), fromTokenFile(), fromIni(),
  // fromProcess(), fromInstanceMetadata(), fromContainerMetadata()
  clientConfig: {
    region: nonMaybe(AWS_REGION),
  },
  profile: AWS_PROFILE,
})

const credentials = await credentialProvider()

if (credentials.accessKeyId) {
  console.log(
    `Loaded AWS credentials with Access Key ID: ${credentials.accessKeyId}`,
  )
} else {
  throw new Error('Unable to load AWS credentials.')
}

export default credentials

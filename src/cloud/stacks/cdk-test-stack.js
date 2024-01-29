import Config from 'common/src/Config.js'
import { Stack, Duration, RemovalPolicy } from 'aws-cdk-lib'
import s3, { EventType } from 'aws-cdk-lib/aws-s3'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as s3n from 'aws-cdk-lib/aws-s3-notifications'
import * as iam from 'aws-cdk-lib/aws-iam'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class CdkTestStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: Config.awsUploadBucketName,
      autoDeleteObjects: Config.isProd ? false : true,
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: [
            Config.isProd ? Config.webHost : 'http://localhost:3000',
          ],
          allowedHeaders: ['*'],
        },
      ],
    })

    const sharpLayer = new lambda.LayerVersion(this, 'SharpLayer', {
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      // compatibleArchitectures: [lambda.Architecture.ARM_64],
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, '../layers/sharp/sharp-layer.zip'),
      ),
      description: 'Sharp is an image manipulation library.',
    })

    const resizeFunction = new lambda.Function(this, 'ResizeFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      // compatibleArchitectures: [lambda.Architecture.ARM_64],
      code: lambda.Code.fromAsset(
        path.resolve(__dirname, '../functions/resize'),
      ),
      handler: 'index.handler',
      layers: [sharpLayer],
      memorySize: 1024,
      timeout: Duration.seconds(5),
      environment: Config.cdkEnvironment,
    })

    const resizeFunctionDestination = new s3n.LambdaDestination(resizeFunction)

    bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      resizeFunctionDestination,
    )

    bucket.addEventNotification(
      EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
      resizeFunctionDestination,
    )

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkTestQueue', {
    //   visibilityTimeout: Duration.seconds(300)
    // });
  }
}

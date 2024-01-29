// @flow

import {
  S3Client,
  GetObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl, S3RequestPresigner } from '@aws-sdk/s3-request-presigner'
import Config from 'common/src/Config.js'
import { HttpRequest } from '@aws-sdk/protocol-http'
import { Hash } from '@aws-sdk/hash-node'
import querystring from 'querystring'
import { createHash, createHmac } from 'crypto'
import util_utf8_1 from '@aws-sdk/util-utf8'
import util_hex_encoding_1 from '@aws-sdk/util-hex-encoding'

const client = new S3Client(Config.awsConfig)

export default class AwsRest {
  static async getSignedCreateMultipartUploadUrl(
    storedName: string,
    size: number,
    type: string,
  ): Promise<string> {
    const input = {
      Bucket: Config.awsUploadBucketName,
      ACL: 'private',
      Key: storedName,
      // ContentLength: size,
      ContentType: type,
      CacheControl: `max-age=${60 * 60 * 24 * 365.25}`, // 1 year since images never change
    }
    const command = new CreateMultipartUploadCommand(input)
    return getSignedUrl(client, command, { expiresIn: 60 * 60 * 24 })
  }

  static async createMultipartUpload(
    storedName: string,
    size: number,
    type: string,
  ): Promise<?string> {
    const input = {
      Bucket: Config.awsUploadBucketName,
      ACL: 'public-read',
      Key: storedName,
      // ContentLength: size,
      ContentType: type,
      CacheControl: 'max-age=86400',
    }
    const command = new CreateMultipartUploadCommand(input)
    const res = await send(command)
    return res?.UploadId
  }

  static async getSignedUploadPartUrl(
    storedName: string,
    partNumber: number,
    uploadId: string,
  ): Promise<string> {
    const input = {
      Bucket: Config.awsUploadBucketName,
      Key: storedName,
      PartNumber: partNumber,
      UploadId: uploadId,
    }
    const command = new UploadPartCommand(input)
    return getSignedUrl(client, command, { expiresIn: 60 * 60 * 24 })
  }

  static async completeMultipartUpload(
    storedName: string,
    parts: Array<{
      ETag: string,
      PartNumber: number,
    }>,
    uploadId: string,
  ): Promise<string> {
    const input = {
      Bucket: Config.awsUploadBucketName,
      Key: storedName,
      MultipartUpload: {
        Parts: parts,
      },
      UploadId: uploadId,
    }
    const command = new CompleteMultipartUploadCommand(input)
    const response = await send(command)
    return response
  }

  static async listObjectsForUser(
    userId: string,
    projectId: string,
    type: 'image' | 'video',
  ): Promise<
    Array<{
      Key: string,
      LastModified: Date,
      ETag: string,
      Size: number,
      StorageClass: string,
    }>,
  > {
    const input = {
      Bucket: Config.awsUploadBucketName,
      Prefix: `${userId}/${projectId}/${type}`,
    }
    const command = new ListObjectsV2Command(input)
    const response = await send(command)
    return response?.Contents ?? []
  }

  static async getSignedDownloadUrl(storedName: string): Promise<string> {
    // const presigner = new S3RequestPresigner({
    //   ...Config.awsConfig,
    //   service: 's3',
    //   sha256: Hash.bind(null, "sha256"), // In Node.js
    // })
    // const request = new HttpRequest({
    //   method: 'GET',
    //   protocol: 'https:',
    //   hostname: `${Config.awsUploadBucketName}.s3.${Config.awsConfig.region}.amazonaws.com`,
    //   path: storedName,
    //   query: {},
    //   headers: {}
    // })
    // const queryStringBasedSigning = await presigner.presign(request, {expiresIn: 60 * 60})

    const input = {
      Bucket: Config.awsUploadBucketName,
      Key: storedName,
    }
    const command = new GetObjectCommand(input)
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: 60 * 60,
    })

    const queryStart = signedUrl.indexOf('?')
    const rootUrl = signedUrl.slice(0, queryStart)
    const qs = signedUrl.slice(queryStart + 1)
    const query = querystring.parse(qs)

    //     const canonicalq = `GET
    // /${storedName}
    // X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=${encodeURIComponent(query['X-Amz-Credential'])}&X-Amz-Date=${query['X-Amz-Date']}&X-Amz-Expires=${query['X-Amz-Expires']}&X-Amz-SignedHeaders=host&x-id=GetObject
    // host:${Config.awsUploadBucketName}.s3.${Config.awsConfig.region}.amazonaws.com
    //
    // host
    // UNSIGNED-PAYLOAD`

    const headerCanonical = `GET
/${storedName}

host:${Config.awsUploadBucketName}.s3.${Config.awsConfig.region}.amazonaws.com
x-amz-date:${query['X-Amz-Date']}
x-amz-expires:${query['X-Amz-Expires']}

host;x-amz-date;x-amz-expires
UNSIGNED-PAYLOAD`

    const hash = createHash('sha256')
    const hexHashCanonical = hash.update(headerCanonical).digest('hex')
    const scope = query['X-Amz-Credential'].split('/').slice(1).join('/')
    const stringToSign = `${query['X-Amz-Algorithm']}
${query['X-Amz-Date']}
${scope}
${hexHashCanonical}`
    const yyyymmdd = scope.split('/')[0]
    const dateKey = createHmac(
      'sha256',
      `AWS4${Config.awsConfig.credentials.secretAccessKey}`,
    )
      .update(yyyymmdd)
      .digest()
    const dateRegionKey = createHmac('sha256', dateKey)
      .update(Config.awsConfig.region)
      .digest()
    const dateRegionServiceKey = createHmac('sha256', dateRegionKey)
      .update('s3')
      .digest()
    const signingKey = createHmac('sha256', dateRegionServiceKey)
      .update('aws4_request')
      .digest()
    const signature = createHmac('sha256', signingKey)
      .update(stringToSign)
      .digest('hex')

    // Replace the signature.
    // The @aws-sdk/s3-request-presigner is used to create a querystring based authentication.
    // This results in a different canonical than header based authentication.
    // The solution here is to calculate a header based canonical and use it to calculate a different signature instead.
    // This is to be used with a client-side <Image/> component which will convert querystring params into header variables.
    query['X-Amz-Signature'] = signature

    if (storedName.includes('/video/')) {
      return signedUrl
    } else {
      return rootUrl + '?' + querystring.stringify(query)
    }
  }
}

async function send(command: any): Promise<any> {
  console.debug(`Sending AWS Command ${command.constructor.name}`)
  const res = await client.send(command)
  return res
}

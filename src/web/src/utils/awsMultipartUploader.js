// @flow

import { postInternal } from './post.js'
import { uploadChunk } from './XHRStreamingUpload.js'
import type { ProgressEvent } from './XHRStreamingUpload.js'

export async function uploadMultipartClient(
  projectId: string,
  file: File,
  onProgress: (progressEvent: ProgressEvent) => void,
): Promise<string> {
  const common = {
    file: {
      name: file.name,
      size: file.size,
      mimetype: file.type,
    },
    lastModified: file.lastModified.toString(),
    projectId,
  }

  const createRes = await postInternal('/createMultiPartUpload', common)
  // const createUrl = createRes?.signedUrl ?? ''
  const storedName = createRes?.storedName ?? ''

  // const createData = await postAWS(createUrl)
  // const uploadId = createData?.match(/<UploadId>(.+)<\/UploadId>/)?.[1]
  const uploadId = createRes?.uploadId
  if (!uploadId) {
    throw new Error('Could not find upload ID.')
  }

  const fileTotal = file.size
  let fileLoaded = 0
  const readStream = file.stream()
  const reader = readStream.getReader()
  let partNumber = 1
  let chunk = new Uint8Array(0)
  let done
  const parts: Array<{ ETag: string, PartNumber: number }> = []
  while (!done) {
    const data = await reader.read()

    if (data.value) {
      chunk = combine(chunk, data.value)
      if (chunk.length >= 5.24288e6) {
        // 5 MiB is AWS minimum part size.
        const part = await uploadPart(
          common,
          storedName,
          uploadId,
          chunk,
          partNumber,
          (progress) => {
            fileLoaded += progress.dLoaded
            onProgress({
              ...progress,
              ratio: fileLoaded / fileTotal,
              loaded: fileLoaded,
              total: fileTotal,
            })
          },
        )
        parts.push(part)
        chunk = new Uint8Array(0)
        partNumber++
      }
    }

    done = data.done
  }

  if (chunk.length) {
    // There is one last part to upload
    const part = await uploadPart(
      common,
      storedName,
      uploadId,
      chunk,
      partNumber,
      (progress) => {
        fileLoaded += progress.dLoaded
        onProgress({
          ...progress,
          ratio: fileLoaded / fileTotal,
          loaded: fileLoaded,
          total: fileTotal,
        })
      },
    )
    parts.push(part)
  }

  const { fileId } = await postInternal('/completeMultipartUpload', {
    ...common,
    storedName,
    parts,
    uploadId,
  })

  return fileId
}

function combine(a1: Uint8Array, a2: Uint8Array): Uint8Array {
  const merged = new Uint8Array(a1.length + a2.length)
  merged.set(a1)
  merged.set(a2, a1.length)
  return merged
}

async function uploadPart(
  common: any,
  storedName: string,
  uploadId: string,
  chunk: Uint8Array,
  partNumber: number,
  onProgress: (event: ProgressEvent) => void,
): Promise<{
  ETag: string,
  PartNumber: number,
}> {
  const uploadRes = await postInternal('/getSignedUploadPartUrl', {
    ...common,
    storedName,
    partNumber,
    uploadId,
  })
  const uploadUrl = uploadRes?.signedUrl ?? ''
  const etag = await putAWS(uploadUrl, chunk, onProgress)
  return {
    ETag: etag,
    PartNumber: partNumber,
  }
}

async function postAWS(
  url: string,
  body?: ?{ [string]: any },
  headers?: ?{ [string]: any },
): Promise<?string> {
  const res = await fetch(url, {
    method: 'POST',
    // $FlowFixMe
    headers: {
      'Content-Type': body ? 'application/json' : null,
      ...headers,
    },
    body: body ? JSON.stringify(body) : null,
  })
  if (res.ok) {
    const text = await res.text()
    return text
  } else {
    console.error('res', res)
  }
}

async function putAWS(
  url: string,
  chunk: Uint8Array,
  onProgress: (event: ProgressEvent) => void,
): Promise<string> {
  const res = await uploadChunk('PUT', url, chunk, onProgress)
  return JSON.parse(res?.headers['etag'] || '')

  // const res = await fetch(url, {
  //   method: 'PUT',
  //   body: chunk,
  // })
  // if (res.ok) {
  //   const etag = res.headers.get('ETag')
  //   if (etag) {
  //     return JSON.parse(etag)
  //   }
  // } else {
  //   console.error('res', res)
  // }
  // throw new Error('Did not receive ETag.')
}

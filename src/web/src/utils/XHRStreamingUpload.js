// @flow

type Method = 'POST' | 'PUT'
type UploadProgressEvent = {}
import parse from 'parse-headers'

export type ProgressEvent = {
  ratio: number,
  loaded: number,
  total: number,
  dLoaded: number,
}
/*

This works by using the File/Blob API's .stream() method to convert a File into a ReadableStream.
Then an XHR connection is opened, and for each chunk read from the ReadableStream,
the chunk is uploaded by sending it through the XHR connection.
Each chunk is is accompanied with a `Content-Range` to specify where in the completed file this chunk is located.
Each time a chunk is succesfully uploaded, an UploadProgressEvent is emitted.
When the ReadableStream emits a `done` signal, then the XHR connection is closed.

This is meant to be used with AWS S3 signed upload URLs.
The initial request to get the signed upload URLs should be sent to a server you own.
In this initial request, the full file size should be specified.
Then, when a file is uploaded to S3, there should be a trigger to a lambda which checks the size of the uploaded file.
If the size does not match the initial request, then you should treat this as an incomplete upload
and delete the partial upload so that you are not charged for S3 storage of incomplete uploads.

* */
export async function uploadFile(
  method: Method,
  url: string,
  file: File,
  onProgress: (event: ProgressEvent) => void,
): Promise<?{ [string]: any }> {
  const uploader = new XHRStreamingUpload(method, url, file, null, onProgress)
  return await uploader.start()
}

export async function uploadChunk(
  method: Method,
  url: string,
  chunk: Uint8Array,
  onProgress: (event: ProgressEvent) => void,
): Promise<?{ [string]: any }> {
  const uploader = new XHRStreamingUpload(method, url, null, chunk, onProgress)
  return await uploader.start()
}

class XHRStreamingUpload {
  method: Method
  url: string
  file: ?File
  chunk: ?Uint8Array
  uploadProgress: (event: ProgressEvent) => void
  prevProgressEvent: ?ProgressEvent
  chunkCursor: number = 0
  xhr: XMLHttpRequest

  constructor(
    method: Method,
    url: string,
    file: ?File,
    chunk: ?Uint8Array,
    uploadProgress: (event: ProgressEvent) => void,
  ) {
    this.method = method
    this.url = url
    this.file = file
    this.chunk = chunk
    this.uploadProgress = uploadProgress
  }

  async start(): any {
    let setResponse
    const response = new Promise((resolve) => {
      setResponse = (res: any) => {
        resolve(res)
      }
    })

    this.openConnection(this.method, this.url, setResponse)

    if (this.file) {
      const readStream = this.file.stream()
      const reader = readStream.getReader()

      let done = false
      while (!done) {
        const data = await reader.read()
        const chunk = data.value
        if (chunk) {
          this.sendChunk(chunk)
        }
        done = data.done
      }
    } else if (this.chunk) {
      this.sendChunk(this.chunk)
    }

    return response
  }

  openConnection(method: Method, url: string, setResponse: any) {
    const xhr = new XMLHttpRequest()
    xhr.upload.addEventListener('progress', this.handleProgress)
    xhr.open(method, url, true)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const headers = parse(xhr.getAllResponseHeaders())
        const text = xhr.response
        const res = { headers, text }
        setResponse(res)
      }
    }
    this.xhr = xhr
  }

  sendChunk(chunk: Uint8Array) {
    const startIndex = this.chunkCursor
    const endIndex = startIndex + chunk.length - 1
    this.chunkCursor += chunk.length
    let contentRange = ''
    if (this.file) {
      contentRange = `bytes ${startIndex}-${endIndex}/${this.file.size}`
      console.log('contentRange', contentRange)
      this.xhr.setRequestHeader('Content-Range', contentRange)
    }
    this.xhr.send(chunk)
  }

  handleProgress = (event: any) => {
    const ratio = event.loaded / event.total
    let dLoaded = event.loaded
    if (this.prevProgressEvent) {
      dLoaded = event.loaded - this.prevProgressEvent.loaded
    }
    const e = {
      ratio,
      loaded: event.loaded,
      total: event.total,
      dLoaded,
    }
    this.uploadProgress(e)
    this.prevProgressEvent = e
  }
}

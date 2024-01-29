// @flow

import type { ComponentType } from 'react'
import React, { forwardRef } from 'react'
import classnames from 'classnames'
import { useEffect, useState } from 'react'
import { decode } from 'qss'

type ImageProps = {
  className?: ?string,
  style?: any,
  src: string,
  // When using signed download urls from AWS, there is a problem of caching images.
  // A signed url contains authentication parameters in the query string of the request,
  // but since the auth params are changing with every newly issued signed download URL,
  // there is a problem of cache busting which prevents the browser from using cache to load images.
  // Instead, using AWS's Authorization Header (AWS Signature Version 4),
  // the authentication parameters in the query string can be removed from the src url and passed as
  // headers instead.
  // This allow signed urls to work with caching.
  isAwsSignedUrl?: ?boolean,
  headers?: ?{ [string]: any },
  onLoad?: () => void,
}

const Image: ComponentType<ImageProps> = forwardRef(
  (props: ImageProps, ref: any): any => {
    const { className, style, src, isAwsSignedUrl, headers, onLoad, ...rest } =
      props

    const [url, setUrl] = useState('')

    useEffect((): any => {
      Promise.resolve()
        .then(async () => {
          if (isAwsSignedUrl || headers) {
            let fetchUrl = src
            let fetchHeaders = headers ?? {}

            if (isAwsSignedUrl) {
              const queryStart = src.indexOf('?')
              fetchUrl = src.slice(0, queryStart)
              const paramString = src.slice(queryStart + 1)
              const params = decode(paramString)
              fetchHeaders = {
                Authorization: `${params['X-Amz-Algorithm']} Credential=${params['X-Amz-Credential']},SignedHeaders=${params['X-Amz-SignedHeaders']};x-amz-date;x-amz-expires,Signature=${params['X-Amz-Signature']}`,
                'X-Amz-Content-Sha256': params['X-Amz-Content-Sha256'],
                'X-Amz-Date': params['X-Amz-Date'],
                'X-Amz-Expires': params['X-Amz-Expires'],
              }
            }

            const res = await fetch(fetchUrl, {
              headers: fetchHeaders,
            })
            const data = await res.blob()
            setUrl(URL.createObjectURL(data))
          } else {
            setUrl(src)
            // todo: implement prefetching when not using signed urls
          }
        })
        .catch((err) => {
          console.error(err)
        })
    }, [src, headers])

    if (!url) {
      return null
    }

    return (
      <img
        ref={ref}
        className={classnames(className)}
        style={style}
        src={url}
        alt=""
        onLoad={onLoad}
        {...(rest: any)}
      />
    )
  },
)

export default Image

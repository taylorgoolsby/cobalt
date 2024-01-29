// @flow

import ID from '../utils/ID.js'
import DataTransferLogInterface from '../schema/DataTransferLog/DataTransferLogInterface.js'

/*
  This file depends on the handleAuthentication middleware running before it.

  This will attach:
    - req.requestId
    - req.socket.connectionId
    - req.socket.prevBytesRead
    - req.socket.prevBytesWritten

  Scenarios:

  Without keep-alive:
  If the server handles the response,
  The finish event is called once.
  The close event is called once.

  With keep-alive:
  Subsequent requests share the same socket.
  The finish event is called once for each response.
  The close event is also called once for each response.

  With or without keep-alive:
  If the client has a timeout waiting for the server to respond,
  it closes the connection.
  The close event is called, but not the finish event.
  Even if keep-alive is used, since there is a timeout, the client
  closes the connection on timeout,
  so subsequent requests after timeout will establish a new connection.
* */

function connectDataTransferLog(app: any) {
  app.use(function (req, res, next) {
    if (!req.socket.connectionId) {
      // keep-alive might reuse a socket.
      req.socket.connectionId = ID.getUnique()
    }
    // Every request gets a unique ID.
    req.requestId = ID.getUnique()

    if (req.socket.prevBytesRead === undefined) {
      req.socket.prevBytesRead = 0
    }

    if (req.socket.prevBytesWritten === undefined) {
      req.socket.prevBytesWritten = 0
    }

    let responseHandled = false
    async function handleResponse() {
      if (responseHandled) return
      responseHandled = true
      const bytesIn = req.socket.bytesRead - req.socket.prevBytesRead
      const bytesOut = req.socket.bytesWritten - req.socket.prevBytesWritten

      if (req.authClientId) {
        await DataTransferLogInterface.insert(
          req.authClientId,
          req.socket.connectionId,
          req.requestId,
          bytesIn,
          bytesOut,
        )
      }

      req.socket.prevBytesRead = req.socket.bytesRead
      req.socket.prevBytesWritten = req.socket.bytesWritten
    }

    res.on('finish', () => {
      handleResponse().catch((err) => {
        console.error(err)
      })
    })

    res.on('close', () => {
      handleResponse().catch((err) => {
        console.error(err)
      })
    })

    next()
  })
}

export default connectDataTransferLog

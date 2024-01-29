// @flow

/*
  This is an implementation of a client-side SSE handler.
  Unlike the native EventSource, this implementation allows:
    - Authorization Header
    - POST method

  Usage:
  const stopSSE = startSSE(
    '/events',
    { userId: '12345' },
    { Authorization: 'Bearer 12345' },
    (data) => {
      console.log('Received data:', data);
      // Update UI here
    },
    () => {
      console.log('SSE connection closed');
    },
    (error) => {
      console.error('SSE error:', error);
    }
  });

  To stop the SSE and prevent reconnection
  stopSSE();
* */
export function startSSE(
  url: string,
  data: { [string]: any },
  headers: { [string]: any },
  onMessage: (data: ?{ [string]: any }) => any,
  onDone: () => any,
  onError: (error: string) => any,
): () => void {
  let stopped = false
  let shouldReconnect = true
  let retryCount = 0

  async function connect() {
    try {
      const response = await fetch(url, {
        method: 'POST',
        // $FlowFixMe
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(data),
      })

      // $FlowFixMe
      const reader = response.body.getReader()

      while (true) {
        if (stopped) break
        const { done, value } = await reader.read()
        if (done) break

        // $FlowFixMe
        const text = new TextDecoder().decode(value)
        const event = text
          .split('\n\n')
          .filter((t) => t !== '')
          .map((item) => item.trim())
        for (const str of event) {
          // Simple parsing for SSE data format
          if (str === 'data: [DONE]') {
            shouldReconnect = false
            stopped = true
            try {
              onDone()
            } catch (err) {
              console.error('Error in onMessage callback:', err)
            }
          } else if (str.startsWith('data:')) {
            // Reset retry count on successful connection
            retryCount = 0
            const message = JSON.parse(str.replace(/^data: /, ''))
            if (message.error) {
              console.error('Error from server:', message.error)
              onError(message.error)
              onDone()
              stopped = true
            } else {
              try {
                onMessage(message)
              } catch (err) {
                console.error('Error in onMessage callback:', err)
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Stream reading error:', e)
      onError(e.message)
      onDone()
    } finally {
      // todo: implement reconnect.
    }
  }

  connect()

  const stop = () => {
    stopped = true
    shouldReconnect = false
  }

  return stop
}

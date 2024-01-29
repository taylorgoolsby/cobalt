// @flow

function parseAxiosError(error: any): any {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    // console.log(error.response.data)
    // console.log(error.response.status)
    // console.log(error.response.headers)
    return error.response.data
  } else if (error.request) {
    // The request was made but no response was received
    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
    // http.ClientRequest in node.js
    // console.error(error.request)
    throw new Error('The request was made but no response was received.')
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error(error.message)
    throw new Error(error.message)
  }
}

export default parseAxiosError

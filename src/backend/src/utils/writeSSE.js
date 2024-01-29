// @flow

export default async function writeSSE(
  res: any,
  message: { [string]: any } | string,
): Promise<void> {
  return new Promise((resolve) => {
    res.write(
      `data: ${
        typeof message === 'string' ? message : JSON.stringify(message)
      }\n\n`,
      'utf8',
      () => {
        resolve()
      },
    )
  })
}

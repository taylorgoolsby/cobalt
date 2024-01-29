// @flow

export default function typeCast(field: any, next: any): any {
  if (field.type === 'STRING' && field.length === 16) {
    const a = field.buffer()
    return a?.toString('hex')?.toUpperCase()
  } else if (field.type === 'JSON') {
    try {
      const parsed = JSON.parse(field.string())
      return parsed
    } catch (err) {
      console.error(err)
      return next()
    }
  } else if (field.type === 'TINY' && field.length === 1) {
    return field.string() === '1'
  } else if (field.type === 'TIMESTAMP') {
    const defaultValue = next()
    return defaultValue?.toISOString()
  } else {
    return next()
  }
}

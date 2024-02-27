// @flow

export default function deleteUndefinedFields<T: { [string]: any }>(
  obj: T,
): Partial<T> {
  // todo: needs to handle nested objects
  if (typeof obj === 'object') {
    const result = {
      ...obj,
    }
    for (const key of Object.keys(result)) {
      if (result[key] === undefined) {
        delete result[key]
      }
    }
    return result
  }
  return obj
}

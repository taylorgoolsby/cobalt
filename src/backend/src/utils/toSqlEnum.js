// @flow

export default function toSqlEnum(obj: { ... }): string {
  return Object.keys(obj)
    .map((a) => JSON.stringify(a))
    .join()
    .replace(/"/g, "'")
}

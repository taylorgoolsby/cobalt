// @flow

const ignoredProperties = ['prototype', 'length', 'name']
export default function getStaticKeys(cl: Class<any>): Array<string> {
  return Object.getOwnPropertyNames(cl).filter(
    (prop) => !ignoredProperties.includes(prop),
  )
}

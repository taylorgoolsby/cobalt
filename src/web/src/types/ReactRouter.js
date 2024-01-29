// @flow

type RRHistory = {
  length: number,
  action: string,
  location: {
    pathname: string,
    search: string,
    hash: string,
  },
}

type RRLocation = {
  pathname: string,
  search: string,
  hash: string,
}

type RRMatch = {
  path: string,
  url: string,
  isExact: boolean,
  params: { [string]: string },
}

export type ReactRouterProps = {|
  history: RRHistory,
  location: RRLocation,
  match: RRMatch,
|}

// @flow

export default class Config {
  // $FlowFixMe
  static backendHost: string = process.env.BACKEND_HOST
  static borderRadius: number = 7
  static verticalMargins: number = 30
  static horizontalMargins: number = 18
  static maxWidth: number = 920
  static fieldWidth: number = 320
  static headerHeight: number = 0
  static debounceTime: number = 380

  static devAssetsBucket: string =
    'https://s3.us-east-2.amazonaws.com/todo-dev-assets'

  static siteName: string = 'cobalt'
}

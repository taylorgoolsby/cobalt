// @flow

type Args = { [string]: any }
export type ApiPayload = { [string]: any }

export type ApiHandler<AuthObject> = (
  any, // req
  any, // res
  Args, // req.params
  Args, // req.body
  AuthObject,
  userId: string,
) => Promise<?ApiPayload>

export type ApiGroup<AuthObject> = {
  [endpoint: string]: {
    method: 'get' | 'post',
    handler: ApiHandler<AuthObject>,
  },
}

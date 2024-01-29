// @flow

type Resolver = (parent: any, args: any, ctx: any) => Promise<any>
export type ResolverDefs = { [string]: { [string]: Resolver } }

function resolver(fn: Resolver): Resolver {
  const wrapped: Resolver = async (parent, args, ctx) => {
    try {
      return await fn(parent, args, ctx)
    } catch (err) {
      console.error(err)
    }
  }
  return wrapped
}

export default resolver

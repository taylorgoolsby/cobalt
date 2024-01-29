// @flow

import paginationDirective from 'graphql-directive-pagination'
export const {
  paginationResolver: pagination,
  paginationDirectiveTransform,
}: any = paginationDirective('pagination', { timezone: 'utc' })

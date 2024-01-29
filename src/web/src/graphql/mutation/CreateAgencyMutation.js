// @flow

import { gql } from '@apollo/client'
import apolloClient from '../../apolloClient.js'
import { showErrorModal } from '../../modals/ErrorModal.js'
import type { User } from '../../types/User.js'
import reportEvent from '../../utils/reportEvent.js'

type CreateAgencyInput = {
  sessionToken: string,
  name: string,
}

type CreateAgencyResponse = {
  success: boolean,
  agencyId: number,
  lookupId: string,
  user: User,
}

const CreateAgencyMutation: any = gql`
  mutation CreateAgency($input: CreateAgencyInput!) {
    createAgency(input: $input) {
      success
      agencyId
      lookupId
      user {
        id
        agencies {
          id
          agencyId
          versionId
          userId
          name
          description
          isPrivate
          isDeleted
          dateUpdated
          dateCreated
        }
      }
    }
  }
`

export default async (
  input: CreateAgencyInput,
): Promise<?CreateAgencyResponse> => {
  try {
    const res = await apolloClient.mutate({
      mutation: CreateAgencyMutation,
      variables: {
        input,
      },
    })

    if (res.data?.createAgency?.success) {
      reportEvent('CreateAgencyMutationSuccess', {})
    }

    return res.data.createAgency
  } catch (err) {
    console.error(err)
    showErrorModal(err.message)
  }
}

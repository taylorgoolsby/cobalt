// @flow

import type { ApiGroup, ApiPayload } from '../apiTypes.js'
import type { SessionToken } from '../../utils/Token.js'
// import type { SessionToken } from '../../utils/Token.js'
// import ID from '../../utils/ID.js'
// import AwsRest from '../AwsRest.js'
// import Config from 'common/src/Config.js'
// import AgencyInterface from '../../schema/Agency/AgencyInterface.js'

const imageTypes = ['image/jpeg', 'image/png', 'image/gif']

const videoTypes = [
  'video/mp4',
  'video/x-msvideo',
  'video/mpeg',
  'video/ogg',
  'video/webm',
]

const ProjectCreationApi: ApiGroup<SessionToken> = {
  // '/startProjectCreation': async (
  //   args: {
  //     title?: ?string,
  //     description?: ?string,
  //     nFiles?: ?number,
  //   },
  //   session: SessionToken,
  // ): Promise<ApiPayload> => {
  //   checkProjectText(args)
  //
  //   if (!args.nFiles) {
  //     throw new Error('Cannot create project with no files to upload.')
  //   }
  //
  //   // The projectId is created now, but not project is created yet.
  //   // A project object is added to the DB once /completeProjectCreation is called.
  //   // Assets will be uploaded in the meantime, and they will be stored in AWS S3
  //   // with a prefix like /{userId}/{projectId}/image/id.png
  //   // If something during the project creation fails, and /completeProjectCreation is not called,
  //   // then since there is no Project object in the DB, there is a worker which will periodically
  //   // go through S3 and find any assets which don't have a matching Project object in the DB to delete them.
  //
  //   const projectId = ID.getUnique()
  //
  //   return {
  //     projectId,
  //   }
  // },
}

function checkProjectText(args: { [string]: any }) {
  const { title, description } = args

  if (!title) {
    throw new Error('Title cannot be blank.')
  }

  if (title.length > 170) {
    throw new Error('The maximum title length is 170.')
  }

  if (typeof description !== 'string') {
    throw new Error('A description should be specified.')
  }

  if (description.length > 2 ** 16 - 1) {
    throw new Error(`The maximum description length is ${2 ** 16 - 1}.`)
  }
}

function checkFile(args: { [string]: any }) {
  const { file, lastModified } = args

  if (!file) {
    throw new Error('Argument `file` is missing.')
  }

  if (typeof file.name !== 'string') {
    throw new Error('File is not in expected format.')
  }

  if (!file.size || typeof file.size !== 'number') {
    throw new Error('File is not in expected format.')
  }

  if (file.size > 10_000_000_000) {
    throw new Error('File size cannot be greater than 10 GB.')
  }

  if (file.name.length > 100) {
    throw new Error('File name is longer than 100 characters.')
  }

  if (
    !file.mimetype ||
    (!imageTypes.includes(file.mimetype) && !videoTypes.includes(file.mimetype))
  ) {
    throw new Error('Unsupported file type.')
  }

  if (
    !lastModified ||
    typeof lastModified !== 'string' ||
    isNaN(parseInt(lastModified))
  ) {
    throw new Error('FormData is missing lastModified.')
  }
}

export default ProjectCreationApi

// @flow

import type { ProgressEvent } from '../../utils/XHRStreamingUpload.js'
import { postInternal } from '../../utils/post.js'
import { uploadMultipartClient } from '../../utils/awsMultipartUploader.js'
import mainStore from '../../stores/MainStore.js'
import Config from '../../Config.js'
import delay from 'delay'
import apolloClient from '../../apolloClient.js'
import GetAdminImages from '../../graphql/GetAdminImages.js'
import sessionStore from '../../stores/SessionStore.js'
import GetAdminVideos from '../../graphql/GetAdminVideos.js'

export type GroupedProgressEvent = {
  overall: ProgressEvent,
  individual: {
    [filename: string]: ProgressEvent,
  },
}

export default class ProjectCreationApi {
  static async createProject(
    title: string,
    description: string,
    files: Array<File>,
    onProgress: (event: GroupedProgressEvent) => void,
  ): Promise<void> {
    const { projectId } = await postInternal('/startProjectCreation', {
      title,
      description,
      nFiles: files.length,
    })

    const allTotal = files.reduce((acc, cur) => acc + cur.size, 0)
    let allLoaded = 0

    const groupedProgressEvent = {
      overall: { ratio: 0, loaded: 0, total: allTotal, dLoaded: 0 },
      individual: {},
    }

    for (const file of files) {
      // $FlowFixMe
      groupedProgressEvent.individual[file.name] = {
        ratio: 0,
        loaded: 0,
        total: file.size,
        dLoaded: 0,
      }
    }

    // Initial progress at zeros.
    onProgress(groupedProgressEvent)

    const uploadedFileIds = []
    for (const file of files) {
      let individualLoaded = 0
      const fileId = await uploadMultipartClient(
        projectId,
        file,
        (progress) => {
          allLoaded += progress.dLoaded
          const overall = {
            dLoaded: progress.dLoaded,
            ratio: allLoaded / allTotal,
            loaded: allLoaded,
            total: allTotal,
          }
          groupedProgressEvent.overall = overall

          individualLoaded += progress.dLoaded
          const individual = {
            dLoaded: progress.dLoaded,
            ratio: individualLoaded / file.size,
            loaded: individualLoaded,
            total: file.size,
          }

          // $FlowFixMe
          groupedProgressEvent.individual[file.name] = individual
          onProgress({ ...groupedProgressEvent })
        },
      )
      uploadedFileIds.push(fileId)
    }

    await postInternal('/completeProjectCreation', {
      title,
      description,
      projectId,
      uploadedFileIds,
    })

    console.debug('Project created successfully.')
  }

  static async deleteProject(projectId: string) {
    await postInternal('/deleteProject', {
      projectId,
    })
    console.debug('Project deleted successfully.')

    const scroller = mainStore.scroller
    if (scroller) {
      scroller.removeItem(projectId)
    }
  }

  static async devSetup() {
    // Create File objects from assets in public S3.
    const files = []

    for (let i = 0; i < 301; i++) {
      const devAssetsRes = await fetch(
        `${Config.devAssetsBucket}/images/${i % 16}.png`,
      )
      const blob = await devAssetsRes.blob()
      console.log('blob', blob)
      files.push(new File([blob], `${i % 16}.png`, { type: blob.type }))
    }

    let start
    for (const file of files) {
      start = Date.now()
      await ProjectCreationApi.createProject(
        file.name,
        '',
        [file],
        (progress) => {
          console.log(progress.overall.ratio)
        },
      )
      const elapsed = Date.now() - start
      await delay(Math.max(0, 1000 - elapsed))
    }

    await refreshProjects()
  }
}

export async function refreshProjects() {
  // Refresh client-side data
  const scroller = mainStore.scroller
  if (scroller) {
    await scroller.refresh()
  }
}

async function refreshImages() {
  // Refresh client-side data
  await apolloClient.query({
    query: GetAdminImages,
    variables: {
      sessionToken: sessionStore.sessionToken,
    },
    fetchPolicy: 'network-only',
  })
}

async function refreshVideos() {
  // Refresh client-side data
  await apolloClient.query({
    query: GetAdminVideos,
    variables: {
      sessionToken: sessionStore.sessionToken,
    },
    fetchPolicy: 'network-only',
  })
}

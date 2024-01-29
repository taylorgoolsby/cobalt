// @flow

export type ProjectAsset = {
  url: string,
  type: string,
  dateCreated: number,
}

export type Project = {
  projectId?: string,
  userId?: string,
  title?: string,
  description?: string,
  isPrivate?: boolean,
  isDeleted?: boolean,
  dateUpdated?: number,
  dateCreated?: number,

  assets?: Array<ProjectAsset>,
}

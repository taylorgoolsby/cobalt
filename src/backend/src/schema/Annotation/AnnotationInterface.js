// @flow

import { sqltag, join } from 'common/sql-template-tag'
import Config from 'common/src/Config.js'
import database from '../../mysql/database.js'
import type { AnnotationSQL } from './AnnotationSchema.js'

export default class AnnotationInterface {
  static async retrieve(
    annotationIds: Array<number>,
  ): Promise<Array<{| text: string, dateCreated: string |}>> {
    if (!annotationIds.length) return []

    const query = sqltag`
      SELECT a.text, m.dateCreated
      FROM ${Config.dbPrefix}_Annotation a
      LEFT JOIN ${Config.dbPrefix}_Message m
      ON a.messageId = m.messageId
      WHERE a.annotationId IN (${join(annotationIds)});
    `
    const rows = await database.query(query)
    return rows
  }

  static async insert(
    annotationId: number,
    messageId: number,
    annotationText: string,
    vector: Array<number>,
  ): Promise<void> {
    const query = sqltag`
      INSERT INTO ${Config.dbPrefix}_Annotation (
        annotationId,
        messageId,
        text,
        embedding
      ) VALUES (
        ${annotationId},
        ${messageId},
        ${annotationText},
        ${JSON.stringify(vector)}
      );
    `

    const res = await database.query(query)

    // const annotationId = res.insertId
    //
    // return annotationId
  }
}

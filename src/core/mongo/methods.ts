import _ from 'radash'
import * as Mongo from 'mongodb'
import * as t from '../types'
import type { Collection } from './collections'
import { MongoDocument } from './types'

export const addItem =
  <TDocument, TModel>({
    db: dbPromise,
    collection,
    toDocument
  }: {
    db: Promise<Mongo.Db>
    collection: Collection
    toDocument: (model: TModel) => TDocument
  }) =>
  async (model: TModel): Promise<TModel> => {
    const record: TDocument = toDocument(model)
    const db = await dbPromise
    await db.collection<TDocument>(collection).insertOne(record as any)
    return model
  }

export const findItem =
  <TModel, TArgs, TDocument extends MongoDocument>({
    db: dbPromise,
    collection,
    toQuery,
    toModel
  }: {
    db: Promise<Mongo.Db>
    collection: Collection
    toQuery: (args: TArgs) => Mongo.Filter<TDocument>
    toModel: (record: TDocument, args?: TArgs) => TModel
  }) =>
  async (args: TArgs): Promise<TModel | null> => {
    const query = toQuery(args)
    const db = await dbPromise
    const record = (await db.collection<TDocument>(collection).findOne(query)) as TDocument
    // const [r] = await migrations.ensureMigrated(db, collection, [record])
    return toModel(record, args)
  }

export const findManyItems =
  <TModel, TArgs, TDocument extends MongoDocument>({
    db: dbPromise,
    collection,
    count = false,
    toQuery,
    toOptions,
    toModel
  }: {
    db: Promise<Mongo.Db>
    collection: Collection
    count?: boolean
    toQuery: (args: TArgs) => Mongo.Filter<TDocument>
    toOptions?: (args: TArgs) => Mongo.FindOptions<Mongo.Document>
    toModel: (record: TDocument) => TModel
  }) =>
  async (args: TArgs): Promise<{
    count: number | undefined
    results: TModel[]
  }> => {
    const db = await dbPromise
    const query = toQuery(args)
    const collect = db.collection<TDocument>(collection)
    const cursor = collect.find(query, toOptions?.(args))
    if (count) {
      const [records, total] = await Promise.all([
        cursor.toArray(),
        cursor.count() as unknown as Promise<number>
      ]) as [TDocument[], number]
      return {
        count: total,
        results: records.map(toModel)
      }
    }
    const records = (await cursor.toArray()) as TDocument[]
    // const rs = await migrations.ensureMigrated(db, collection, records)
    return {
      count: undefined,
      results: records.map(toModel)
    }
  }

export const findAll =
  <TModel, TDocument extends MongoDocument>({
    db: dbPromise,
    collection,
    query,
    toModel
  }: {
    db: Promise<Mongo.Db>
    collection: Collection
    query?: Mongo.Filter<TDocument>
    toModel: (record: TDocument) => TModel
  }) =>
  async (): Promise<TModel[]> => {
    const db = await dbPromise
    const cursor = db.collection<TDocument>(collection).find(query)
    const records = (await cursor.toArray()) as TDocument[]
    // const rs = await migrations.ensureMigrated(db, collection, records)
    return records.map(toModel)
  }

export const queryAll =
  <TModel, TArgs, TDocument extends MongoDocument>({
    db: dbPromise,
    collection,
    toOptions,
    toModel
  }: {
    db: Promise<Mongo.Db>
    collection: Collection
    toOptions?: (args: TArgs) => Mongo.FindOptions<Mongo.Document>
    toModel: (record: TDocument) => TModel
  }) =>
  async (args?: TArgs): Promise<TModel[]> => {
    const db = await dbPromise
    const col = db.collection<TDocument>(collection)
    const cursor = col.find({}, toOptions?.(args))
    const records = (await cursor.toArray()) as TDocument[]
    return records.map(toModel)
  }

export const updateOne =
  <TDocument extends t.MongoDocument, TMatch, TPatch>({
    db: dbPromise,
    collection,
    toQuery,
    toUpdate
  }: {
    db: Promise<Mongo.Db>
    collection: Collection
    toQuery: (match: TMatch) => Mongo.Filter<TDocument>
    toUpdate: (patch: TPatch) => Mongo.UpdateFilter<TDocument>
  }) =>
  async (match: TMatch, patch: TPatch): Promise<void> => {
    const db = await dbPromise
    await db.collection<TDocument>(collection).updateOne(toQuery(match), toUpdate(patch), {})
  }

export const deleteOne =
  <TDocument extends t.MongoDocument, TArgs>({
    db: dbPromise,
    collection,
    toQuery
  }: {
    db: Promise<Mongo.Db>
    collection: Collection
    toQuery: (args: TArgs) => Mongo.Filter<TDocument>
  }) =>
  async (args: TArgs): Promise<void> => {
    const db = await dbPromise
    await db.collection<TDocument>(collection).deleteOne(toQuery(args))
  }

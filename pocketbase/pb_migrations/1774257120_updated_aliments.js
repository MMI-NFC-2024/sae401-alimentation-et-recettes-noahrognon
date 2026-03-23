/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4153184709")

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "select4283840455",
    "maxSelect": 1,
    "name": "validation_status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "pending",
      "approved",
      "rejected"
    ]
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "select2371146282",
    "maxSelect": 1,
    "name": "source_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "scan",
      "admin"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4153184709")

  // remove field
  collection.fields.removeById("select4283840455")

  // remove field
  collection.fields.removeById("select2371146282")

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3354892852")

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "select1602529173",
    "maxSelect": 1,
    "name": "approval_status",
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3354892852")

  // remove field
  collection.fields.removeById("select1602529173")

  return app.save(collection)
})

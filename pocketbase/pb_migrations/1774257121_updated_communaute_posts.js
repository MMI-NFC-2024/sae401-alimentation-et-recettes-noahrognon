/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4269450858")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select2358339750",
    "maxSelect": 1,
    "name": "moderation_status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "visible",
      "hidden"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4269450858")

  // remove field
  collection.fields.removeById("select2358339750")

  return app.save(collection)
})

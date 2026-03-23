/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2144827468")

  // add field
  collection.fields.addAt(4, new Field({
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
  const collection = app.findCollectionByNameOrId("pbc_2144827468")

  // remove field
  collection.fields.removeById("select2358339750")

  return app.save(collection)
})

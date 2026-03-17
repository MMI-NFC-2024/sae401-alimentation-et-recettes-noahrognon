/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4269450858")

  // add field
  collection.fields.addAt(6, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2869346101",
    "hidden": false,
    "id": "relation2301702121",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "recette_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4269450858")

  // remove field
  collection.fields.removeById("relation2301702121")

  return app.save(collection)
})

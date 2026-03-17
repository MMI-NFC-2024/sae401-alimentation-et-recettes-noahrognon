/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2869346101")

  // add field
  collection.fields.addAt(25, new Field({
    "hidden": false,
    "id": "json1602156498",
    "maxSize": 0,
    "name": "ingredients_json",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(26, new Field({
    "hidden": false,
    "id": "json4141225069",
    "maxSize": 0,
    "name": "etapes_json",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  // add field
  collection.fields.addAt(27, new Field({
    "hidden": false,
    "id": "json2763443524",
    "maxSize": 0,
    "name": "avis_json",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2869346101")

  // remove field
  collection.fields.removeById("json1602156498")

  // remove field
  collection.fields.removeById("json4141225069")

  // remove field
  collection.fields.removeById("json2763443524")

  return app.save(collection)
})

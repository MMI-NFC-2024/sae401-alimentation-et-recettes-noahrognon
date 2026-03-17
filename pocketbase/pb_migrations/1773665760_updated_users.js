/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1158672400",
    "max": 0,
    "min": 0,
    "name": "telephone",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2543326873",
    "hidden": false,
    "id": "relation3491127072",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "type_activite_id",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number2310592735",
    "max": null,
    "min": null,
    "name": "seances_par_semaine",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "number365762609",
    "max": null,
    "min": null,
    "name": "onboarding_etape",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "bool751640152",
    "name": "onboarding_complete",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")

  // remove field
  collection.fields.removeById("text1158672400")

  // remove field
  collection.fields.removeById("relation3491127072")

  // remove field
  collection.fields.removeById("number2310592735")

  // remove field
  collection.fields.removeById("number365762609")

  // remove field
  collection.fields.removeById("bool751640152")

  return app.save(collection)
})

/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2869346101")

  // remove field
  collection.fields.removeById("autodate_created")

  // remove field
  collection.fields.removeById("autodate_updated")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "number1157129031",
    "max": null,
    "min": null,
    "name": "temps_cuisson_min",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number4284139260",
    "max": null,
    "min": null,
    "name": "temps_total_min",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(14, new Field({
    "hidden": false,
    "id": "number3366561740",
    "max": null,
    "min": null,
    "name": "fibres_par_portion_g",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "hidden": false,
    "id": "number1943812885",
    "max": null,
    "min": null,
    "name": "note_moyenne",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "hidden": false,
    "id": "number1098113287",
    "max": null,
    "min": null,
    "name": "nombre_avis",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text628409043",
    "max": 0,
    "min": 0,
    "name": "astuce_chef",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(23, new Field({
    "hidden": false,
    "id": "select765853894",
    "maxSelect": 0,
    "name": "niveau_epice",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "doux",
      "moyen",
      "releve"
    ]
  }))

  // add field
  collection.fields.addAt(24, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "url250577066",
    "name": "video_url",
    "onlyDomains": null,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "url"
  }))

  // update field
  collection.fields.addAt(19, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_4153184709",
    "hidden": false,
    "id": "relation4123782611",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "ingrediens",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2869346101")

  // add field
  collection.fields.addAt(17, new Field({
    "hidden": false,
    "id": "autodate_created",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // add field
  collection.fields.addAt(18, new Field({
    "hidden": false,
    "id": "autodate_updated",
    "name": "updated",
    "onCreate": true,
    "onUpdate": true,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // remove field
  collection.fields.removeById("number1157129031")

  // remove field
  collection.fields.removeById("number4284139260")

  // remove field
  collection.fields.removeById("number3366561740")

  // remove field
  collection.fields.removeById("number1943812885")

  // remove field
  collection.fields.removeById("number1098113287")

  // remove field
  collection.fields.removeById("text628409043")

  // remove field
  collection.fields.removeById("select765853894")

  // remove field
  collection.fields.removeById("url250577066")

  // update field
  collection.fields.addAt(16, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_4153184709",
    "hidden": false,
    "id": "relation4123782611",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "ingrediens",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})

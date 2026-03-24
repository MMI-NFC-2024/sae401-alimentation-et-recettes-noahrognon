/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2869346101")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "file347571224",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "photo",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  // update field
  collection.fields.addAt(28, new Field({
    "hidden": false,
    "id": "select4283840455",
    "maxSelect": 0,
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

  // update field
  collection.fields.addAt(29, new Field({
    "hidden": false,
    "id": "select2371146282",
    "maxSelect": 0,
    "name": "source_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "site",
      "assistant",
      "admin"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2869346101")

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "file347571224",
    "maxSelect": 0,
    "maxSize": 0,
    "mimeTypes": null,
    "name": "photo",
    "presentable": false,
    "protected": false,
    "required": true,
    "system": false,
    "thumbs": null,
    "type": "file"
  }))

  // update field
  collection.fields.addAt(28, new Field({
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

  // update field
  collection.fields.addAt(29, new Field({
    "hidden": false,
    "id": "select2371146282",
    "maxSelect": 1,
    "name": "source_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "site",
      "assistant",
      "admin"
    ]
  }))

  return app.save(collection)
})

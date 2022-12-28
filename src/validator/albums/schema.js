const Joi = require('joi');

const AlbumPayloadSchema = Joi.object({
  name: Joi.string().required(),
  year: Joi.number().integer().min(1970).max(2020)
    .required(),
});

module.exports = { AlbumPayloadSchema };
